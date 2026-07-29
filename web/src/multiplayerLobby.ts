import {
  createAuthoritativeMatch,
  type AuthoritativeMatch,
  type AuthoritativeMatchOptions,
} from './authoritativeMatch'
import { createPlayableInitialGameStateForMatch } from './game'
import {
  createMatchConfiguration,
  participantIds,
  type AiProfile,
  type ParticipantController,
  type ParticipantId,
} from './match'
import {
  parseMultiplayerClientMessage,
  type LobbySeatSnapshot,
  type LobbySnapshot,
  type MultiplayerClientMessage,
  type MultiplayerServerError,
  type MultiplayerServerMessage,
} from './multiplayerProtocol'

type LobbyHumanSeat = {
  participantId: ParticipantId
  displayName: string
  reconnectToken: string
  connectionId: string | null
  ready: boolean
  isHost: boolean
}

export type MultiplayerLobbyOptions = {
  lobbyId: string
  seed?: number
  emit: (
    connectionId: string,
    message: MultiplayerServerMessage,
  ) => void
  createReconnectToken?: () => string
  matchOptions?: AuthoritativeMatchOptions
  onEmitError?: (error: unknown) => void
}

const aiProfiles: Record<ParticipantId, AiProfile> = {
  agima: 'balanced',
  orion: 'balanced',
  nova: 'expansion',
  vega: 'industry',
}

function defaultReconnectToken() {
  const token = globalThis.crypto?.randomUUID()

  if (!token) {
    throw new Error(
      'A cryptographically secure reconnect token factory is required.',
    )
  }

  return token
}

function requestIdFromUnknown(input: unknown) {
  return typeof input === 'object' &&
    input !== null &&
    'requestId' in input &&
    typeof input.requestId === 'string' &&
    input.requestId.length > 0 &&
    input.requestId.length <= 128
    ? input.requestId
    : null
}

export class MultiplayerLobby {
  private revision = 0
  private phase: LobbySnapshot['phase'] = 'waiting'
  private readonly humanSeats = new Map<
    ParticipantId,
    LobbyHumanSeat
  >()
  private readonly connectionSeats = new Map<
    string,
    ParticipantId
  >()
  private readonly tokenSeats = new Map<string, ParticipantId>()
  private readonly lobbyId: string
  private readonly seed: number
  private readonly emitTransport: MultiplayerLobbyOptions['emit']
  private readonly onEmitError: (error: unknown) => void
  private readonly createReconnectToken: () => string
  private readonly matchOptions: AuthoritativeMatchOptions
  private match: AuthoritativeMatch | null = null
  private unsubscribeMatch: (() => void) | null = null

  constructor(options: MultiplayerLobbyOptions) {
    if (
      options.lobbyId.length === 0 ||
      options.lobbyId.length > 128
    ) {
      throw new Error('Invalid lobby id.')
    }

    this.lobbyId = options.lobbyId
    this.seed =
      options.seed !== undefined &&
      Number.isFinite(options.seed)
        ? Math.abs(Math.trunc(options.seed))
        : 1
    this.emitTransport = options.emit
    this.onEmitError = options.onEmitError ?? (() => undefined)
    this.createReconnectToken =
      options.createReconnectToken ?? defaultReconnectToken
    this.matchOptions = options.matchOptions ?? {}
  }

  handleMessage(connectionId: string, input: unknown) {
    const message = parseMultiplayerClientMessage(input)

    if (!message) {
      this.emitError(
        connectionId,
        requestIdFromUnknown(input),
        'invalid-message',
      )
      return
    }

    switch (message.type) {
      case 'join-lobby':
        this.joinLobby(connectionId, message)
        return
      case 'resume-session':
        this.resumeSession(connectionId, message)
        return
      case 'set-ready':
        this.setReady(connectionId, message)
        return
      case 'start-match':
        this.startMatch(connectionId, message)
        return
      case 'game-command':
        this.submitGameCommand(connectionId, message)
    }
  }

  disconnect(connectionId: string) {
    const participantId = this.connectionSeats.get(connectionId)

    if (!participantId) {
      return false
    }

    const seat = this.humanSeats.get(participantId)
    this.connectionSeats.delete(connectionId)
    this.match?.disconnectSeat(connectionId)

    if (seat) {
      seat.connectionId = null
      this.revision += 1
      this.broadcastLobbySnapshot()
    }

    return true
  }

  getSnapshot() {
    const seats = Object.fromEntries(
      participantIds.map((participantId) => [
        participantId,
        this.createSeatSnapshot(participantId),
      ]),
    ) as Record<ParticipantId, LobbySeatSnapshot>
    const hostParticipantId =
      participantIds.find(
        (participantId) =>
          this.humanSeats.get(participantId)?.isHost,
      ) ?? null

    return structuredClone({
      lobbyId: this.lobbyId,
      revision: this.revision,
      phase: this.phase,
      hostParticipantId,
      seats,
    } satisfies LobbySnapshot)
  }

  getMatchSnapshot() {
    return this.match?.getSnapshot() ?? null
  }

  dispose() {
    this.unsubscribeMatch?.()
    this.unsubscribeMatch = null
    this.match?.dispose()
    this.match = null
    this.connectionSeats.clear()
    this.tokenSeats.clear()
    this.humanSeats.clear()
  }

  private joinLobby(
    connectionId: string,
    message: Extract<
      MultiplayerClientMessage,
      { type: 'join-lobby' }
    >,
  ) {
    if (this.connectionSeats.has(connectionId)) {
      this.emitError(
        connectionId,
        message.requestId,
        'connection-already-bound',
      )
      return
    }

    if (this.phase !== 'waiting') {
      this.emitError(
        connectionId,
        message.requestId,
        'lobby-already-started',
      )
      return
    }

    const participantId = participantIds.find(
      (candidateId) => !this.humanSeats.has(candidateId),
    )

    if (!participantId) {
      this.emitError(
        connectionId,
        message.requestId,
        'lobby-full',
      )
      return
    }

    const reconnectToken = this.createUniqueReconnectToken()
    const seat: LobbyHumanSeat = {
      participantId,
      displayName: message.payload.displayName,
      reconnectToken,
      connectionId,
      ready: false,
      isHost: this.humanSeats.size === 0,
    }

    this.humanSeats.set(participantId, seat)
    this.connectionSeats.set(connectionId, participantId)
    this.tokenSeats.set(reconnectToken, participantId)
    this.revision += 1
    this.emitSessionEstablished(connectionId, seat)
    this.broadcastLobbySnapshot()
  }

  private resumeSession(
    connectionId: string,
    message: Extract<
      MultiplayerClientMessage,
      { type: 'resume-session' }
    >,
  ) {
    if (this.connectionSeats.has(connectionId)) {
      this.emitError(
        connectionId,
        message.requestId,
        'connection-already-bound',
      )
      return
    }

    const participantId = this.tokenSeats.get(
      message.payload.reconnectToken,
    )
    const seat = participantId
      ? this.humanSeats.get(participantId)
      : null

    if (!participantId || !seat) {
      this.emitError(
        connectionId,
        message.requestId,
        'unknown-session',
      )
      return
    }

    if (seat.connectionId !== null) {
      this.emitError(
        connectionId,
        message.requestId,
        'seat-connection-failed',
      )
      return
    }

    if (this.match) {
      const connection = this.match.connectSeat({
        sessionId: connectionId,
        participantId,
      })

      if (!connection.ok) {
        this.emitError(
          connectionId,
          message.requestId,
          'seat-connection-failed',
        )
        return
      }
    }

    seat.connectionId = connectionId
    this.connectionSeats.set(connectionId, participantId)
    this.revision += 1
    this.emitSessionEstablished(connectionId, seat)
    this.broadcastLobbySnapshot()

    if (this.match) {
      this.send(connectionId, {
        version: 1,
        type: 'match-snapshot',
        payload: this.match.getSnapshot(),
      })
    }
  }

  private setReady(
    connectionId: string,
    message: Extract<
      MultiplayerClientMessage,
      { type: 'set-ready' }
    >,
  ) {
    const seat = this.getConnectedSeat(connectionId)

    if (!seat) {
      this.emitError(
        connectionId,
        message.requestId,
        'not-in-lobby',
      )
      return
    }

    if (this.phase !== 'waiting') {
      this.emitError(
        connectionId,
        message.requestId,
        'lobby-already-started',
      )
      return
    }

    if (seat.ready === message.payload.ready) {
      return
    }

    seat.ready = message.payload.ready
    this.revision += 1
    this.broadcastLobbySnapshot()
  }

  private startMatch(
    connectionId: string,
    message: Extract<
      MultiplayerClientMessage,
      { type: 'start-match' }
    >,
  ) {
    const seat = this.getConnectedSeat(connectionId)

    if (!seat) {
      this.emitError(
        connectionId,
        message.requestId,
        'not-in-lobby',
      )
      return
    }

    if (this.phase !== 'waiting') {
      this.emitError(
        connectionId,
        message.requestId,
        'lobby-already-started',
      )
      return
    }

    if (!seat.isHost) {
      this.emitError(connectionId, message.requestId, 'not-host')
      return
    }

    if (
      [...this.humanSeats.values()].some(
        (humanSeat) =>
          !humanSeat.ready || humanSeat.connectionId === null,
      )
    ) {
      this.emitError(
        connectionId,
        message.requestId,
        'players-not-ready',
      )
      return
    }

    const controllers = Object.fromEntries(
      participantIds.map((participantId) => [
        participantId,
        this.createParticipantController(participantId),
      ]),
    ) as Record<ParticipantId, ParticipantController>
    const configuration = createMatchConfiguration({
      seed: this.seed,
      controllers,
    })
    const initialState = createPlayableInitialGameStateForMatch(
      configuration,
      this.seed,
    )
    const match = createAuthoritativeMatch(
      initialState,
      this.matchOptions,
    )

    for (const humanSeat of this.humanSeats.values()) {
      const connection = match.connectSeat({
        sessionId: humanSeat.connectionId!,
        participantId: humanSeat.participantId,
      })

      if (!connection.ok) {
        match.dispose()
        this.emitError(
          connectionId,
          message.requestId,
          'seat-connection-failed',
        )
        return
      }
    }

    this.match = match
    this.phase = 'playing'
    this.revision += 1
    this.broadcastLobbySnapshot()
    this.unsubscribeMatch = match.subscribe((snapshot) => {
      this.broadcast({
        version: 1,
        type: 'match-snapshot',
        payload: snapshot,
      })
    })
  }

  private submitGameCommand(
    connectionId: string,
    message: Extract<
      MultiplayerClientMessage,
      { type: 'game-command' }
    >,
  ) {
    if (!this.match) {
      this.emitError(
        connectionId,
        message.requestId,
        'match-not-started',
      )
      return
    }

    const result = this.match.submitCommand(
      connectionId,
      message.payload.command,
    )

    this.send(connectionId, {
      version: 1,
      type: 'command-result',
      requestId: message.requestId,
      payload: result.ok
        ? {
            ok: true,
            revision: result.snapshot.revision,
          }
        : {
            ok: false,
            error: result.error,
            revision: result.snapshot.revision,
          },
    })
  }

  private createParticipantController(
    participantId: ParticipantId,
  ): ParticipantController {
    return this.humanSeats.has(participantId)
      ? {
          kind: 'human',
          input: 'remote',
        }
      : {
          kind: 'ai',
          profile: aiProfiles[participantId],
        }
  }

  private createSeatSnapshot(
    participantId: ParticipantId,
  ): LobbySeatSnapshot {
    const humanSeat = this.humanSeats.get(participantId)

    if (humanSeat) {
      return {
        kind: 'human',
        participantId,
        displayName: humanSeat.displayName,
        connected: humanSeat.connectionId !== null,
        ready: humanSeat.ready,
        isHost: humanSeat.isHost,
      }
    }

    return this.phase === 'playing'
      ? {
          kind: 'ai',
          participantId,
        }
      : {
          kind: 'open',
          participantId,
        }
  }

  private getConnectedSeat(connectionId: string) {
    const participantId = this.connectionSeats.get(connectionId)

    return participantId
      ? this.humanSeats.get(participantId) ?? null
      : null
  }

  private createUniqueReconnectToken() {
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const reconnectToken = this.createReconnectToken()

      if (
        reconnectToken.length > 0 &&
        reconnectToken.length <= 128 &&
        !this.tokenSeats.has(reconnectToken)
      ) {
        return reconnectToken
      }
    }

    throw new Error('Unable to create a unique reconnect token.')
  }

  private emitSessionEstablished(
    connectionId: string,
    seat: LobbyHumanSeat,
  ) {
    this.send(connectionId, {
      version: 1,
      type: 'session-established',
      payload: {
        participantId: seat.participantId,
        reconnectToken: seat.reconnectToken,
      },
    })
  }

  private broadcastLobbySnapshot() {
    this.broadcast({
      version: 1,
      type: 'lobby-snapshot',
      payload: this.getSnapshot(),
    })
  }

  private broadcast(message: MultiplayerServerMessage) {
    for (const seat of this.humanSeats.values()) {
      if (seat.connectionId !== null) {
        this.send(seat.connectionId, message)
      }
    }
  }

  private emitError(
    connectionId: string,
    requestId: string | null,
    error: MultiplayerServerError,
  ) {
    this.send(connectionId, {
      version: 1,
      type: 'request-error',
      requestId,
      payload: { error },
    })
  }

  private send(
    connectionId: string,
    message: MultiplayerServerMessage,
  ) {
    try {
      this.emitTransport(connectionId, structuredClone(message))
    } catch (error) {
      this.onEmitError(error)
    }
  }
}

export function createMultiplayerLobby(
  options: MultiplayerLobbyOptions,
) {
  return new MultiplayerLobby(options)
}
