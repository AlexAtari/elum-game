import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useI18n } from '../i18n/I18nContext'
import {
  buildMultiplayerWebSocketUrl,
  createDefaultMultiplayerServerUrl,
  createMultiplayerInviteUrl,
  wakeMultiplayerServer,
  type MultiplayerInvite,
} from '../multiplayerClient'
import type {
  LobbySeatSnapshot,
  LobbySnapshot,
  MultiplayerClientMessage,
  MultiplayerServerError,
  MultiplayerServerMessage,
} from '../multiplayerProtocol'
import type { ParticipantId } from '../match'
import type { AuthoritativeMatchSnapshot } from '../authoritativeMatch'
import IntroSequence from './IntroSequence'
import MultiplayerGameScreen from './MultiplayerGameScreen'
import './MultiplayerLobbyScreen.css'

type MultiplayerLobbyScreenProps = {
  initialInvite: MultiplayerInvite | null
  onBack: () => void
}

type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'

type StoredSession = {
  endpoint: string
  reconnectToken: string
}

type InviteActionStatus = 'idle' | 'copied' | 'shared'
type ServerWakeStatus = 'idle' | 'waking' | 'ready' | 'error'

const participantOrder: ParticipantId[] = [
  'agima',
  'orion',
  'nova',
  'vega',
]

const participantIcons: Record<ParticipantId, string> = {
  agima: '🌱',
  orion: '🛰️',
  nova: '🔭',
  vega: '⚙️',
}

const sessionStorageKey = 'elum.multiplayer.session'

let requestSequence = 0

function createRequestId() {
  requestSequence += 1
  return `browser-${Date.now()}-${requestSequence}`
}

function readStoredSession(): StoredSession | null {
  try {
    const value = window.localStorage.getItem(sessionStorageKey)

    if (!value) {
      return null
    }

    const parsed = JSON.parse(value) as Partial<StoredSession>

    return typeof parsed.endpoint === 'string' &&
      typeof parsed.reconnectToken === 'string'
      ? {
          endpoint: parsed.endpoint,
          reconnectToken: parsed.reconnectToken,
        }
      : null
  } catch {
    return null
  }
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()

  if (!copied) {
    throw new Error('Unable to copy invite link.')
  }
}

function describeSeat(
  seat: LobbySeatSnapshot,
  t: ReturnType<typeof useI18n>['t'],
) {
  if (seat.kind === 'open') {
    return t('multiplayer.seatOpen')
  }

  if (seat.kind === 'ai') {
    return t('multiplayer.seatAi')
  }

  if (!seat.connected) {
    return t('multiplayer.seatDisconnected')
  }

  return seat.ready
    ? t('multiplayer.seatReady')
    : t('multiplayer.seatPlanning')
}

function errorKey(error: MultiplayerServerError) {
  switch (error) {
    case 'lobby-full':
      return 'multiplayer.errorLobbyFull' as const
    case 'lobby-already-started':
      return 'multiplayer.errorAlreadyStarted' as const
    case 'players-not-ready':
      return 'multiplayer.errorPlayersNotReady' as const
    case 'not-host':
      return 'multiplayer.errorNotHost' as const
    case 'match-not-finished':
      return 'multiplayer.errorMatchNotFinished' as const
    case 'match-finished':
      return 'multiplayer.errorMatchFinished' as const
    case 'unknown-session':
      return 'multiplayer.errorUnknownSession' as const
    default:
      return 'multiplayer.errorRequest' as const
  }
}

export default function MultiplayerLobbyScreen({
  initialInvite,
  onBack,
}: MultiplayerLobbyScreenProps) {
  const { t } = useI18n()
  const socketRef = useRef<WebSocket | null>(null)
  const wakeRequestRef = useRef<AbortController | null>(null)
  const endpointRef = useRef('')
  const resumeAttemptRef = useRef(false)
  const displayNameRef = useRef('')
  const [serverUrl, setServerUrl] = useState(() =>
    initialInvite?.serverUrl ??
    createDefaultMultiplayerServerUrl(window.location),
  )
  const [lobbyId, setLobbyId] = useState(
    () => initialInvite?.lobbyId ?? 'mars-alpha',
  )
  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] =
    useState<ConnectionStatus>('idle')
  const [participantId, setParticipantId] =
    useState<ParticipantId | null>(null)
  const [snapshot, setSnapshot] =
    useState<LobbySnapshot | null>(null)
  const [matchSnapshot, setMatchSnapshot] =
    useState<AuthoritativeMatchSnapshot | null>(null)
  const [showMatchIntro, setShowMatchIntro] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteActionStatus, setInviteActionStatus] =
    useState<InviteActionStatus>('idle')
  const [serverWakeStatus, setServerWakeStatus] =
    useState<ServerWakeStatus>('idle')

  const ownSeat = participantId
    ? snapshot?.seats[participantId] ?? null
    : null
  const humanSeats = snapshot
    ? participantOrder
        .map((id) => snapshot.seats[id])
        .filter(
          (
            seat,
          ): seat is Extract<
            LobbySeatSnapshot,
            { kind: 'human' }
          > => seat.kind === 'human',
        )
    : []
  const canStart =
    ownSeat?.kind === 'human' &&
    ownSeat.isHost &&
    humanSeats.length > 0 &&
    humanSeats.every((seat) => seat.connected && seat.ready)
  const endpoint = useMemo(() => {
    try {
      return buildMultiplayerWebSocketUrl(serverUrl, lobbyId)
    } catch {
      return null
    }
  }, [lobbyId, serverUrl])
  const inviteUrl = useMemo(() => {
    if (!endpoint) {
      return null
    }

    try {
      return createMultiplayerInviteUrl(
        window.location.href,
        serverUrl,
        lobbyId,
      )
    } catch {
      return null
    }
  }, [endpoint, lobbyId, serverUrl])

  useEffect(
    () => () => {
      socketRef.current?.close()
      wakeRequestRef.current?.abort()
    },
    [],
  )

  const wakeServer = async () => {
    wakeRequestRef.current?.abort()
    const controller = new AbortController()
    wakeRequestRef.current = controller
    setError(null)
    setServerWakeStatus('waking')
    const timeout = window.setTimeout(() => controller.abort(), 90_000)

    try {
      const ready = await wakeMultiplayerServer(
        serverUrl,
        fetch,
        controller.signal,
      )

      if (wakeRequestRef.current === controller) {
        setServerWakeStatus(ready ? 'ready' : 'error')
      }
    } catch {
      if (wakeRequestRef.current === controller) {
        setServerWakeStatus('error')
      }
    } finally {
      window.clearTimeout(timeout)
      if (wakeRequestRef.current === controller) {
        wakeRequestRef.current = null
      }
    }
  }

  const updateServerUrl = (value: string) => {
    wakeRequestRef.current?.abort()
    wakeRequestRef.current = null
    setServerWakeStatus('idle')
    setServerUrl(value)
  }

  const send = (message: MultiplayerClientMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message))
    }
  }

  const sendJoin = () => {
    send({
      version: 1,
      requestId: createRequestId(),
      type: 'join-lobby',
      payload: {
        displayName: displayNameRef.current,
      },
    })
  }

  const connect = () => {
    if (!endpoint || displayName.trim().length === 0) {
      setError(t('multiplayer.errorConnectionData'))
      return
    }

    socketRef.current?.close()
    setError(null)
    setStatus('connecting')
    setSnapshot(null)
    setMatchSnapshot(null)
    setShowMatchIntro(true)
    displayNameRef.current = displayName.trim()
    endpointRef.current = endpoint
    const socket = new WebSocket(endpoint)
    socketRef.current = socket

    socket.addEventListener('open', () => {
      if (socketRef.current !== socket) {
        return
      }

      setStatus('connected')
      const storedSession = readStoredSession()

      if (
        storedSession?.endpoint === endpoint &&
        storedSession.reconnectToken
      ) {
        resumeAttemptRef.current = true
        send({
          version: 1,
          requestId: createRequestId(),
          type: 'resume-session',
          payload: {
            reconnectToken: storedSession.reconnectToken,
          },
        })
      } else {
        resumeAttemptRef.current = false
        sendJoin()
      }
    })

    socket.addEventListener('message', async (event) => {
      if (socketRef.current !== socket) {
        return
      }

      let message: MultiplayerServerMessage

      try {
        const messageText =
          typeof event.data === 'string'
            ? event.data
            : event.data instanceof Blob
              ? await event.data.text()
              : new TextDecoder().decode(event.data)
        message = JSON.parse(
          messageText,
        ) as MultiplayerServerMessage
      } catch {
        setError(t('multiplayer.errorInvalidResponse'))
        return
      }

      if (message.type === 'session-established') {
        resumeAttemptRef.current = false
        setParticipantId(message.payload.participantId)
        window.localStorage.setItem(
          sessionStorageKey,
          JSON.stringify({
            endpoint: endpointRef.current,
            reconnectToken: message.payload.reconnectToken,
          } satisfies StoredSession),
        )
        return
      }

      if (message.type === 'lobby-snapshot') {
        setSnapshot(message.payload)
        if (message.payload.phase === 'waiting') {
          setMatchSnapshot(null)
          setShowMatchIntro(true)
        }
        return
      }

      if (message.type === 'match-snapshot') {
        setMatchSnapshot(message.payload)
        return
      }

      const serverError =
        message.type === 'request-error'
          ? message.payload.error
          : message.type === 'command-result' &&
              message.payload.ok === false
            ? message.payload.error
            : null

      if (serverError !== null) {

        if (
          serverError === 'unknown-session' &&
          resumeAttemptRef.current
        ) {
          resumeAttemptRef.current = false
          window.localStorage.removeItem(sessionStorageKey)
          sendJoin()
          return
        }

        setError(t(errorKey(serverError)))
      }
    })

    socket.addEventListener('close', () => {
      if (socketRef.current === socket) {
        setStatus('disconnected')
      }
    })
    socket.addEventListener('error', () => {
      if (socketRef.current === socket) {
        setError(t('multiplayer.errorConnection'))
      }
    })
  }

  const toggleReady = () => {
    if (ownSeat?.kind !== 'human') {
      return
    }

    send({
      version: 1,
      requestId: createRequestId(),
      type: 'set-ready',
      payload: { ready: !ownSeat.ready },
    })
  }

  const startMatch = () => {
    send({
      version: 1,
      requestId: createRequestId(),
      type: 'start-match',
      payload: {},
    })
  }

  const restartMatch = () => {
    send({
      version: 1,
      requestId: createRequestId(),
      type: 'restart-match',
      payload: {},
    })
  }

  const shareInvite = async () => {
    if (!inviteUrl) {
      return
    }

    setError(null)

    try {
      if (
        typeof navigator.share === 'function' &&
        navigator.maxTouchPoints > 0
      ) {
        await navigator.share({
          title: 'E.L.U.M.',
          text: t('multiplayer.inviteShareText'),
          url: inviteUrl,
        })
        setInviteActionStatus('shared')
      } else {
        await copyText(inviteUrl)
        setInviteActionStatus('copied')
      }
    } catch (shareError) {
      if (
        shareError instanceof DOMException &&
        shareError.name === 'AbortError'
      ) {
        return
      }

      setError(t('multiplayer.errorInviteShare'))
    }
  }

  const leave = () => {
    socketRef.current?.close()
    socketRef.current = null
    onBack()
  }

  if (matchSnapshot && participantId) {
    if (showMatchIntro) {
      return (
        <IntroSequence
          onComplete={() => setShowMatchIntro(false)}
        />
      )
    }

    return (
      <MultiplayerGameScreen
        participantId={participantId}
        snapshot={matchSnapshot}
        error={error}
        isHost={
          snapshot?.hostParticipantId === participantId
        }
        sendMessage={send}
        onRestart={restartMatch}
        onLeave={leave}
      />
    )
  }

  return (
    <main className="multiplayer-screen">
      <section className="multiplayer-card">
        <header className="multiplayer-header">
          <div>
            <p className="eyebrow">
              {t('multiplayer.eyebrow')}
            </p>
            <h1>{t('multiplayer.title')}</h1>
            <p>{t('multiplayer.description')}</p>
          </div>
          <span
            className={`connection-pill connection-${status}`}
          >
            {t(`multiplayer.status.${status}`)}
          </span>
        </header>

        {status === 'idle' || status === 'disconnected' ? (
          <div className="multiplayer-connect-form">
            {initialInvite ? (
              <p className="multiplayer-invite-loaded">
                {t('multiplayer.inviteLoaded')}
              </p>
            ) : null}
            <label>
              <span>{t('multiplayer.name')}</span>
              <input
                autoComplete="nickname"
                maxLength={24}
                value={displayName}
                onChange={(event) =>
                  setDisplayName(event.target.value)
                }
                placeholder={t('multiplayer.namePlaceholder')}
              />
            </label>
            <label>
              <span>{t('multiplayer.server')}</span>
              <input
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={serverUrl}
                onChange={(event) =>
                  updateServerUrl(event.target.value)
                }
              />
            </label>
            <label>
              <span>{t('multiplayer.lobby')}</span>
              <input
                autoCapitalize="none"
                maxLength={128}
                value={lobbyId}
                onChange={(event) =>
                  setLobbyId(event.target.value)
                }
              />
            </label>
            <div className="multiplayer-connect-actions">
              <button
                className="secondary-button multiplayer-wake-button"
                disabled={serverWakeStatus === 'waking'}
                type="button"
                onClick={() => void wakeServer()}
              >
                {serverWakeStatus === 'waking'
                  ? t('multiplayer.serverWaking')
                  : serverWakeStatus === 'ready'
                    ? t('multiplayer.serverReady')
                    : serverWakeStatus === 'error'
                      ? t('multiplayer.serverWakeRetry')
                      : t('multiplayer.serverWake')}
              </button>
              <button
                className="start-button multiplayer-connect-button"
                type="button"
                onClick={connect}
              >
                {status === 'disconnected'
                  ? t('multiplayer.reconnect')
                  : t('multiplayer.connect')}
              </button>
            </div>
            {serverWakeStatus === 'waking' ? (
              <p className="multiplayer-server-status" role="status">
                {t('multiplayer.serverWakingHint')}
              </p>
            ) : serverWakeStatus === 'ready' ? (
              <p
                className="multiplayer-server-status is-ready"
                role="status"
              >
                {t('multiplayer.serverReadyHint')}
              </p>
            ) : serverWakeStatus === 'error' ? (
              <p
                className="multiplayer-server-status is-error"
                role="alert"
              >
                {t('multiplayer.serverWakeError')}
              </p>
            ) : null}
            <p className="multiplayer-hint">
              {t('multiplayer.localServerHint')}
            </p>
          </div>
        ) : null}

        {snapshot ? (
          <>
            <div className="multiplayer-lobby-meta">
              <div>
                <small>{t('multiplayer.lobby')}</small>
                <strong>{snapshot.lobbyId}</strong>
              </div>
              <div>
                <small>{t('multiplayer.yourColony')}</small>
                <strong>
                  {participantId
                    ? participantId.toUpperCase()
                    : '—'}
                </strong>
              </div>
              <button
                className="secondary-button multiplayer-invite-button"
                type="button"
                onClick={() => void shareInvite()}
              >
                {inviteActionStatus === 'copied'
                  ? t('multiplayer.inviteCopied')
                  : inviteActionStatus === 'shared'
                    ? t('multiplayer.inviteShared')
                    : t('multiplayer.inviteShare')}
              </button>
            </div>

            <div className="multiplayer-seat-grid">
              {participantOrder.map((id) => {
                const seat = snapshot.seats[id]
                const isOwnSeat = participantId === id

                return (
                  <article
                    className={`multiplayer-seat ${
                      isOwnSeat ? 'is-own-seat' : ''
                    }`}
                    key={id}
                  >
                    <span className="multiplayer-seat-icon">
                      {participantIcons[id]}
                    </span>
                    <div>
                      <small>{id.toUpperCase()}</small>
                      <strong>
                        {seat.kind === 'human'
                          ? seat.displayName
                          : seat.kind === 'ai'
                            ? t('multiplayer.computer')
                            : '—'}
                      </strong>
                      <span>{describeSeat(seat, t)}</span>
                    </div>
                    {seat.kind === 'human' && seat.isHost ? (
                      <em>{t('multiplayer.host')}</em>
                    ) : null}
                  </article>
                )
              })}
            </div>

            {snapshot.phase === 'playing' ? (
              <div className="multiplayer-match-started">
                <span>🚀</span>
                <div>
                  <h2>{t('multiplayer.matchStarted')}</h2>
                  <p>
                    {t('multiplayer.matchStartedHint', {
                      round: matchSnapshot?.state.round ?? 1,
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="multiplayer-actions">
                <button
                  className="multiplayer-ready-button"
                  type="button"
                  onClick={toggleReady}
                >
                  {ownSeat?.kind === 'human' && ownSeat.ready
                    ? t('multiplayer.notReady')
                    : t('multiplayer.ready')}
                </button>
                {ownSeat?.kind === 'human' &&
                ownSeat.isHost ? (
                  <button
                    className="start-button"
                    disabled={!canStart}
                    type="button"
                    onClick={startMatch}
                  >
                    {t('multiplayer.startMatch')}
                  </button>
                ) : (
                  <p>{t('multiplayer.waitForHost')}</p>
                )}
              </div>
            )}
          </>
        ) : null}

        {error ? (
          <p className="multiplayer-error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className="secondary-button multiplayer-back-button"
          type="button"
          onClick={leave}
        >
          {t('multiplayer.back')}
        </button>
      </section>
    </main>
  )
}
