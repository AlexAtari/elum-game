import {
  createAuthoritativeMatch,
  parsePersistedAuthoritativeMatchState,
  restoreAuthoritativeMatch,
  type AuthoritativeMatch,
  type AuthoritativeMatchOptions,
  type PersistedAuthoritativeMatchState,
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
  normalizeDisplayName,
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

export const MULTIPLAYER_LOBBY_STATE_VERSION = 1 as const

export type PersistedWaitingLobbyState = {
  version: typeof MULTIPLAYER_LOBBY_STATE_VERSION
  lobbyId: string
  seed: number
  revision: number
  phase: 'waiting'
  humanSeats: Array<{
    participantId: ParticipantId
    displayName: string
    reconnectToken: string
    ready: boolean
    isHost: boolean
  }>
}

export type PersistedPlayingLobbyState = Omit<
  PersistedWaitingLobbyState,
  'phase'
> & {
  phase: 'playing'
  match: PersistedAuthoritativeMatchState
}

export type PersistedMultiplayerLobbyState =
  | PersistedWaitingLobbyState
  | PersistedPlayingLobbyState

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

export type RestoreMultiplayerLobbyOptions = Omit<
  MultiplayerLobbyOptions,
  'lobbyId' | 'seed'
>

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function parsePersistedHumanSeat(
  input: unknown,
  expectedParticipantId: ParticipantId,
  expectedHost: boolean,
) {
  if (
    !isRecord(input) ||
    input.participantId !== expectedParticipantId ||
    typeof input.displayName !== 'string' ||
    normalizeDisplayName(input.displayName) !== input.displayName ||
    typeof input.reconnectToken !== 'string' ||
    input.reconnectToken.length === 0 ||
    input.reconnectToken.length > 128 ||
    typeof input.ready !== 'boolean' ||
    input.isHost !== expectedHost
  ) {
    return null
  }

  return {
    participantId: expectedParticipantId,
    displayName: input.displayName,
    reconnectToken: input.reconnectToken,
    ready: input.ready,
    isHost: expectedHost,
  }
}

export function parsePersistedWaitingLobbyState(
  input: unknown,
): PersistedWaitingLobbyState | null {
  if (
    !isRecord(input) ||
    input.version !== MULTIPLAYER_LOBBY_STATE_VERSION ||
    typeof input.lobbyId !== 'string' ||
    input.lobbyId.length === 0 ||
    input.lobbyId.length > 128 ||
    typeof input.seed !== 'number' ||
    !Number.isFinite(input.seed) ||
    !Number.isInteger(input.seed) ||
    input.seed < 0 ||
    typeof input.revision !== 'number' ||
    !Number.isInteger(input.revision) ||
    input.revision < 0 ||
    input.phase !== 'waiting' ||
    !Array.isArray(input.humanSeats) ||
    input.humanSeats.length > participantIds.length
  ) {
    return null
  }

  const humanSeats = input.humanSeats.map((seat, index) =>
    parsePersistedHumanSeat(
      seat,
      participantIds[index],
      index === 0,
    ),
  )

  if (
    humanSeats.some((seat) => seat === null) ||
    new Set(
      humanSeats.map((seat) => seat?.reconnectToken),
    ).size !== humanSeats.length
  ) {
    return null
  }

  return structuredClone({
    version: MULTIPLAYER_LOBBY_STATE_VERSION,
    lobbyId: input.lobbyId,
    seed: input.seed,
    revision: input.revision,
    phase: 'waiting',
    humanSeats: humanSeats as PersistedWaitingLobbyState['humanSeats'],
  })
}

export function parsePersistedPlayingLobbyState(
  input: unknown,
): PersistedPlayingLobbyState | null {
  if (!isRecord(input) || input.phase !== 'playing') {
    return null
  }

  const lobbyState = parsePersistedWaitingLobbyState({
    ...input,
    phase: 'waiting',
  })
  const match = parsePersistedAuthoritativeMatchState(input.match)

  if (
    !lobbyState ||
    !match ||
    lobbyState.humanSeats.length === 0 ||
    lobbyState.humanSeats.some(({ ready }) => !ready) ||
    match.state.match.seed !== lobbyState.seed
  ) {
    return null
  }

  const humanParticipantIds = new Set(
    lobbyState.humanSeats.map(({ participantId }) => participantId),
  )

  if (
    participantIds.some(
      (participantId) =>
        (match.state.match.participants[participantId].controller
          .kind === 'human') !==
        humanParticipantIds.has(participantId),
    )
  ) {
    return null
  }

  return structuredClone({
    ...lobbyState,
    phase: 'playing',
    match,
  })
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
  private readonly persistenceSubscribers = new Set<
    () => void
  >()

  static restoreWaitingState(
    input: unknown,
    options: RestoreMultiplayerLobbyOptions,
  ) {
    const state = parsePersistedWaitingLobbyState(input)

    if (!state) {
      throw new Error('Invalid persisted waiting lobby state.')
    }

    const lobby = new MultiplayerLobby({
      ...options,
      lobbyId: state.lobbyId,
      seed: state.seed,
    })
    lobby.revision = state.revision
    lobby.restoreHumanSeats(state.humanSeats)

    return lobby
  }

  static restorePlayingState(
    input: unknown,
    options: RestoreMultiplayerLobbyOptions,
  ) {
    const state = parsePersistedPlayingLobbyState(input)

    if (!state) {
      throw new Error('Invalid persisted playing lobby state.')
    }

    const match = restoreAuthoritativeMatch(
      state.match,
      options.matchOptions,
    )

    if (!match) {
      throw new Error('Invalid persisted playing lobby state.')
    }

    const lobby = new MultiplayerLobby({
      ...options,
      lobbyId: state.lobbyId,
      seed: state.seed,
    })
    lobby.revision = state.revision
    lobby.phase = 'playing'
    lobby.restoreHumanSeats(state.humanSeats)
    lobby.match = match
    lobby.subscribeToMatch(match)

    return lobby
  }

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
      case 'restart-match':
        this.restartMatch(connectionId, message)
        return
      case 'game-command':
        this.submitGameCommand(connectionId, message)
        return
      case 'submit-round-plan':
        this.submitRoundPlan(connectionId, message)
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

  subscribePersistenceChanges(subscriber: () => void) {
    this.persistenceSubscribers.add(subscriber)

    return () => {
      this.persistenceSubscribers.delete(subscriber)
    }
  }

  exportWaitingState(): PersistedWaitingLobbyState {
    if (this.phase !== 'waiting' || this.match !== null) {
      throw new Error(
        'Only a waiting lobby can be exported for persistence.',
      )
    }

    return structuredClone({
      version: MULTIPLAYER_LOBBY_STATE_VERSION,
      lobbyId: this.lobbyId,
      seed: this.seed,
      revision: this.revision,
      phase: 'waiting',
      humanSeats: this.exportHumanSeats(),
    } satisfies PersistedWaitingLobbyState)
  }

  exportPersistenceState(): PersistedMultiplayerLobbyState {
    if (this.phase === 'waiting') {
      return this.exportWaitingState()
    }

    if (!this.match) {
      throw new Error(
        'A playing lobby requires an authoritative match.',
      )
    }

    return structuredClone({
      version: MULTIPLAYER_LOBBY_STATE_VERSION,
      lobbyId: this.lobbyId,
      seed: this.seed,
      revision: this.revision,
      phase: 'playing',
      humanSeats: this.exportHumanSeats(),
      match: this.match.exportPersistenceState(),
    } satisfies PersistedPlayingLobbyState)
  }

  dispose() {
    this.unsubscribeMatch?.()
    this.unsubscribeMatch = null
    this.match?.dispose()
    this.match = null
    this.connectionSeats.clear()
    this.tokenSeats.clear()
    this.humanSeats.clear()
    this.persistenceSubscribers.clear()
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
        payload: this.match.getSnapshot(participantId),
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
    this.subscribeToMatch(match)
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

  private restartMatch(
    connectionId: string,
    message: Extract<
      MultiplayerClientMessage,
      { type: 'restart-match' }
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

    if (!this.match) {
      this.emitError(
        connectionId,
        message.requestId,
        'match-not-started',
      )
      return
    }

    if (!seat.isHost) {
      this.emitError(connectionId, message.requestId, 'not-host')
      return
    }

    if (!this.match.getSnapshot().finished) {
      this.emitError(
        connectionId,
        message.requestId,
        'match-not-finished',
      )
      return
    }

    this.unsubscribeMatch?.()
    this.unsubscribeMatch = null
    this.match.dispose()
    this.match = null
    this.phase = 'waiting'

    for (const humanSeat of this.humanSeats.values()) {
      humanSeat.ready = false
    }

    this.revision += 1
    this.broadcastLobbySnapshot()
  }

  private submitRoundPlan(
    connectionId: string,
    message: Extract<
      MultiplayerClientMessage,
      { type: 'submit-round-plan' }
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

    const result = this.match.submitRoundPlan(
      connectionId,
      message.payload,
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

  private exportHumanSeats() {
    return participantIds.flatMap((participantId) => {
      const seat = this.humanSeats.get(participantId)

      return seat
        ? [
            {
              participantId: seat.participantId,
              displayName: seat.displayName,
              reconnectToken: seat.reconnectToken,
              ready: seat.ready,
              isHost: seat.isHost,
            },
          ]
        : []
    })
  }

  private restoreHumanSeats(
    persistedSeats: PersistedWaitingLobbyState['humanSeats'],
  ) {
    for (const persistedSeat of persistedSeats) {
      const seat: LobbyHumanSeat = {
        ...persistedSeat,
        connectionId: null,
      }
      this.humanSeats.set(seat.participantId, seat)
      this.tokenSeats.set(
        seat.reconnectToken,
        seat.participantId,
      )
    }
  }

  private subscribeToMatch(match: AuthoritativeMatch) {
    this.unsubscribeMatch = match.subscribe(() => {
      queueMicrotask(() => {
        if (this.match === match) {
          this.publishPersistenceChange()
        }
      })

      for (const seat of this.humanSeats.values()) {
        if (seat.connectionId === null) {
          continue
        }

        this.send(seat.connectionId, {
          version: 1,
          type: 'match-snapshot',
          payload: match.getSnapshot(seat.participantId),
        })
      }
    })
  }

  private publishPersistenceChange() {
    for (const subscriber of this.persistenceSubscribers) {
      try {
        subscriber()
      } catch (error) {
        this.onEmitError(error)
      }
    }
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

export function restoreMultiplayerLobby(
  input: unknown,
  options: RestoreMultiplayerLobbyOptions,
) {
  return isRecord(input) && input.phase === 'playing'
    ? MultiplayerLobby.restorePlayingState(input, options)
    : MultiplayerLobby.restoreWaitingState(input, options)
}
