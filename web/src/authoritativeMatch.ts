import {
  applyColonyLocalEvent,
  activateGlobalEvent,
  beginLandTieBreak,
  getColonyLocalEvent,
  getMarketTiming,
  getSeededLocalEventDelay,
  isGameFinished,
  LAND_AUCTION_TIMING,
  localEventIds,
  resolveLandTieBreak,
  selectSeededGlobalEvent,
  selectSeededLocalEvent,
  type GameState,
  type LandAuctionPhase,
  type LocalEventId,
  type MarketResource,
  type ResourceMarketPhase,
  type RoundReport,
} from './game'
import {
  applyAutonomousAiLandPurchases,
  createConservativeRoundPlan,
  runMultiplayerRound,
  type ParticipantRoundPlan,
} from './multiplayerRound'
import {
  executeGameCommand,
  parseGameCommand,
  type GameCommand,
  type GameCommandErrorCode,
} from './gameCommands'
import {
  getHumanParticipantIds,
  participantIds,
  type ParticipantId,
} from './match'

export type AuthenticatedSeat = {
  sessionId: string
  participantId: ParticipantId
}

export type SeatConnectionError =
  | 'invalid-session'
  | 'invalid-seat'
  | 'seat-not-human'
  | 'session-already-bound'
  | 'seat-already-connected'

export type SeatConnectionResult =
  | {
      ok: true
      seat: AuthenticatedSeat
    }
  | {
      ok: false
      error: SeatConnectionError
    }

export type AuthoritativeCommandError =
  | GameCommandErrorCode
  | 'unauthenticated-session'
  | 'participant-mismatch'
  | 'participant-ready'
  | 'invalid-round-plan'
  | 'match-finished'
  | 'round-action-active'
  | 'server-controlled-action'

export type AuthoritativePhaseTiming =
  | {
      kind: 'resource-market'
      resource: MarketResource
      phase: Exclude<ResourceMarketPhase, 'finished'>
      deadlineAt: number
    }
  | {
      kind: 'land-auction'
      tileId: string
      phase: Exclude<LandAuctionPhase, 'finished'>
      deadlineAt: number
    }

export type AuthoritativeRoundTiming =
  | {
      status: 'running'
      deadlineAt: number
    }
  | {
      status: 'paused'
      remainingMilliseconds: number
    }

type ScheduledPhaseTiming =
  | Omit<
      Extract<
        AuthoritativePhaseTiming,
        { kind: 'resource-market' }
      >,
      'deadlineAt'
    >
  | Omit<
      Extract<
        AuthoritativePhaseTiming,
        { kind: 'land-auction' }
      >,
      'deadlineAt'
    >

export type AuthoritativeMatchSnapshot = {
  revision: number
  finished: boolean
  state: GameState
  phaseTiming: AuthoritativePhaseTiming | null
  roundTiming: AuthoritativeRoundTiming | null
  lastRoundReport: RoundReport | null
  roundReadiness: {
    round: number
    readyParticipantIds: ParticipantId[]
  }
}

export const AUTHORITATIVE_MATCH_STATE_VERSION = 1 as const

export type PersistedAuthoritativeMatchState = {
  version: typeof AUTHORITATIVE_MATCH_STATE_VERSION
  revision: number
  finished: boolean
  state: GameState
  phaseTiming: AuthoritativePhaseTiming | null
  roundTiming: AuthoritativeRoundTiming | null
  serverCommandSequence: number
  roundPlans: Partial<
    Record<ParticipantId, ParticipantRoundPlan>
  >
  lastRoundReports: Partial<
    Record<ParticipantId, RoundReport>
  >
  localEventSchedules: Array<{
    participantId: ParticipantId
    event: LocalEventId
    round: number
    deadlineAt: number
  }>
}

export type AuthoritativeCommandResult =
  | {
      ok: true
      command: GameCommand
      snapshot: AuthoritativeMatchSnapshot
    }
  | {
      ok: false
      command?: GameCommand
      error: AuthoritativeCommandError
      snapshot: AuthoritativeMatchSnapshot
    }

export type MatchClock = {
  now: () => number
  setTimeout: (
    callback: () => void,
    delayMilliseconds: number,
  ) => unknown
  clearTimeout: (handle: unknown) => void
}

export type AuthoritativeMatchOptions = {
  clock?: MatchClock
  onSubscriberError?: (error: unknown) => void
}

export const MULTIPLAYER_ROUND_DURATION_MILLISECONDS =
  4 * 60 * 1000

type ServerPhaseCommand = Extract<
  GameCommand,
  {
    type:
      | 'advance-resource-market-phase'
      | 'advance-land-auction-phase'
  }
>

type ScheduledPhaseCommand =
  ServerPhaseCommand extends infer Command
    ? Command extends ServerPhaseCommand
      ? Omit<
          Command,
          'version' | 'commandId' | 'expectedRound'
        >
      : never
    : never

type PhaseSchedule = {
  key: string
  durationMilliseconds: number
  timing: ScheduledPhaseTiming
  command: ScheduledPhaseCommand
}

const defaultClock: MatchClock = {
  now: () => Date.now(),
  setTimeout: (callback, delayMilliseconds) =>
    globalThis.setTimeout(callback, delayMilliseconds),
  clearTimeout: (handle) =>
    globalThis.clearTimeout(
      handle as ReturnType<typeof globalThis.setTimeout>,
    ),
}

function copySnapshot(
  revision: number,
  finished: boolean,
  state: GameState,
  phaseTiming: AuthoritativePhaseTiming | null,
  roundTiming: AuthoritativeRoundTiming | null,
  readyParticipantIds: ParticipantId[],
  lastRoundReport: RoundReport | null,
  participantId?: ParticipantId,
): AuthoritativeMatchSnapshot {
  const localEvent = participantId
    ? getColonyLocalEvent(state, participantId)
    : null
  const personalizedState: GameState = {
    ...state,
    activeLocalEvent:
      participantId === 'agima' ? localEvent : null,
    activeLocalEvents:
      participantId && localEvent
        ? { [participantId]: localEvent }
        : {},
  }

  return structuredClone({
    revision,
    finished,
    state: personalizedState,
    phaseTiming,
    roundTiming,
    lastRoundReport,
    roundReadiness: {
      round: state.round,
      readyParticipantIds,
    },
  })
}

function isValidSessionId(
  sessionId: unknown,
): sessionId is string {
  return (
    typeof sessionId === 'string' &&
    sessionId.length > 0 &&
    sessionId.length <= 128
  )
}

function isParticipantId(
  participantId: unknown,
): participantId is ParticipantId {
  return (
    typeof participantId === 'string' &&
    participantIds.includes(participantId as ParticipantId)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0
  )
}

function isNonNegativeFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0
  )
}

function hasOnlyParticipantKeys(value: Record<string, unknown>) {
  return Object.keys(value).every((key) =>
    isParticipantId(key),
  )
}

function isPersistedGameStateShape(
  value: unknown,
): value is GameState {
  if (!isRecord(value)) {
    return false
  }

  const match = value.match
  const colonies = value.colonies

  if (
    !isRecord(match) ||
    match.version !== 1 ||
    !isNonNegativeInteger(match.seed) ||
    !isRecord(match.participants) ||
    !isNonNegativeInteger(value.round) ||
    value.round === 0 ||
    !isRecord(colonies) ||
    !Array.isArray(value.initiatedMarketResources) ||
    !isRecord(value.market)
  ) {
    return false
  }

  const participants = match.participants

  return participantIds.every(
    (participantId) =>
      isRecord(participants[participantId]) &&
      participants[participantId].id === participantId &&
      isRecord(colonies[participantId]) &&
      colonies[participantId].id === participantId,
  )
}

function isPhaseTiming(
  value: unknown,
): value is AuthoritativePhaseTiming | null {
  if (value === null) {
    return true
  }

  if (
    !isRecord(value) ||
    !isNonNegativeFiniteNumber(value.deadlineAt)
  ) {
    return false
  }

  return value.kind === 'resource-market'
    ? typeof value.resource === 'string' &&
        (value.phase === 'announcement' ||
          value.phase === 'declaration' ||
          value.phase === 'auction')
    : value.kind === 'land-auction' &&
        typeof value.tileId === 'string' &&
        value.tileId.length > 0 &&
        (value.phase === 'announcement' ||
          value.phase === 'auction')
}

function isRoundTiming(
  value: unknown,
): value is AuthoritativeRoundTiming | null {
  if (value === null) {
    return true
  }

  if (!isRecord(value)) {
    return false
  }

  return value.status === 'running'
    ? isNonNegativeFiniteNumber(value.deadlineAt)
    : value.status === 'paused' &&
        isNonNegativeFiniteNumber(value.remainingMilliseconds)
}

function isJsonValue(
  value: unknown,
  ancestors = new Set<object>(),
): boolean {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return true
  }

  if (typeof value === 'number') {
    return Number.isFinite(value)
  }

  if (typeof value !== 'object' || ancestors.has(value)) {
    return false
  }

  ancestors.add(value)
  const valid = Array.isArray(value)
    ? value.every((entry) => isJsonValue(entry, ancestors))
    : (Object.getPrototypeOf(value) === Object.prototype ||
        Object.getPrototypeOf(value) === null) &&
      Object.values(value).every((entry) =>
        entry === undefined ||
        isJsonValue(entry, ancestors),
      )
  ancestors.delete(value)
  return valid
}

function clonePersistenceJson<T>(value: T): T {
  if (!isJsonValue(value)) {
    throw new Error(
      'Authoritative match persistence state must be JSON-serializable.',
    )
  }

  return JSON.parse(JSON.stringify(value)) as T
}

export function parsePersistedAuthoritativeMatchState(
  input: unknown,
): PersistedAuthoritativeMatchState | null {
  if (
    !isRecord(input) ||
    input.version !== AUTHORITATIVE_MATCH_STATE_VERSION ||
    !isNonNegativeInteger(input.revision) ||
    typeof input.finished !== 'boolean' ||
    !isPersistedGameStateShape(input.state) ||
    !isPhaseTiming(input.phaseTiming) ||
    !isRoundTiming(input.roundTiming) ||
    !isNonNegativeInteger(input.serverCommandSequence) ||
    !isRecord(input.roundPlans) ||
    !hasOnlyParticipantKeys(input.roundPlans) ||
    !Object.values(input.roundPlans).every(
      (plan) => parseParticipantRoundPlan(plan) !== null,
    ) ||
    !isRecord(input.lastRoundReports) ||
    !hasOnlyParticipantKeys(input.lastRoundReports) ||
    !Object.values(input.lastRoundReports).every(isRecord) ||
    !Array.isArray(input.localEventSchedules)
  ) {
    return null
  }

  const scheduledParticipants = new Set<ParticipantId>()

  for (const schedule of input.localEventSchedules) {
    if (
      !isRecord(schedule) ||
      !isParticipantId(schedule.participantId) ||
      scheduledParticipants.has(schedule.participantId) ||
      !localEventIds.includes(schedule.event as LocalEventId) ||
      !isNonNegativeInteger(schedule.round) ||
      schedule.round === 0 ||
      !isNonNegativeFiniteNumber(schedule.deadlineAt)
    ) {
      return null
    }

    scheduledParticipants.add(schedule.participantId)
  }

  try {
    return clonePersistenceJson(
      input,
    ) as PersistedAuthoritativeMatchState
  } catch {
    return null
  }
}

function isServerControlledCommand(command: GameCommand) {
  return (
    command.type === 'advance-resource-market-phase' ||
    command.type === 'advance-land-auction-phase'
  )
}

function isSharedRoundActionActive(state: GameState) {
  return (
    (state.activeResourceMarket !== null &&
      state.activeResourceMarket.phase !== 'finished') ||
    (state.landAuctionTie !== null &&
      state.landAuctionTie.phase !== 'finished')
  )
}

function getLandAuctioneerId(state: GameState) {
  const openingBids = state.landAuctionTie?.openingBids

  return openingBids
    ? participantIds.find(
        (participantId) =>
          openingBids[participantId] !== undefined,
      ) ?? null
    : null
}

function getPhaseSchedule(state: GameState): PhaseSchedule | null {
  const market = state.activeResourceMarket

  if (market && market.phase !== 'finished') {
    const timing = getMarketTiming(market.roundPlayed)
    const durationSeconds =
      market.phase === 'announcement'
        ? timing.introductionSeconds
        : market.phase === 'declaration'
          ? timing.declarationSeconds
          : timing.auctionSeconds

    return {
      key: [
        'resource-market',
        market.roundPlayed,
        market.resource,
        market.phase,
      ].join(':'),
      durationMilliseconds: durationSeconds * 1000,
      timing: {
        kind: 'resource-market',
        resource: market.resource,
        phase: market.phase,
      },
      command: {
        participantId: market.initiatorId,
        type: 'advance-resource-market-phase',
        payload: {
          resource: market.resource,
          expectedPhase: market.phase,
        },
      },
    }
  }

  const landAuction = state.landAuctionTie
  const auctioneerId = getLandAuctioneerId(state)

  if (
    landAuction &&
    landAuction.phase !== 'finished' &&
    auctioneerId
  ) {
    const durationSeconds =
      landAuction.phase === 'announcement'
        ? LAND_AUCTION_TIMING.announcementSeconds
        : LAND_AUCTION_TIMING.auctionSeconds

    return {
      key: [
        'land-auction',
        state.round,
        landAuction.tileId,
        landAuction.phase,
      ].join(':'),
      durationMilliseconds: durationSeconds * 1000,
      timing: {
        kind: 'land-auction',
        tileId: landAuction.tileId,
        phase: landAuction.phase,
      },
      command: {
        participantId: auctioneerId,
        type: 'advance-land-auction-phase',
        payload: {
          tileId: landAuction.tileId,
          expectedPhase: landAuction.phase,
        },
      },
    }
  }

  return null
}

export class AuthoritativeMatch {
  private state: GameState
  private revision = 0
  private finished = false
  private phaseTiming: AuthoritativePhaseTiming | null = null
  private scheduledPhaseKey: string | null = null
  private phaseTimer: unknown = null
  private roundTimer: unknown = null
  private roundTimerRound: number
  private roundDeadlineAt: number | null = null
  private roundRemainingMilliseconds =
    MULTIPLAYER_ROUND_DURATION_MILLISECONDS
  private serverCommandSequence = 0
  private readonly roundPlans = new Map<
    ParticipantId,
    ParticipantRoundPlan
  >()
  private lastRoundReports: Partial<
    Record<ParticipantId, RoundReport>
  > = {}
  private readonly localEventTimers = new Map<
    ParticipantId,
    unknown
  >()
  private readonly localEventSchedules = new Map<
    ParticipantId,
    {
      event: LocalEventId
      round: number
      deadlineAt: number
    }
  >()
  private readonly clock: MatchClock
  private readonly onSubscriberError: (error: unknown) => void
  private readonly sessionSeats = new Map<string, ParticipantId>()
  private readonly seatSessions = new Map<ParticipantId, string>()
  private readonly subscribers = new Set<
    (snapshot: AuthoritativeMatchSnapshot) => void
  >()

  constructor(
    initialState: GameState,
    options: AuthoritativeMatchOptions = {},
  ) {
    this.state = structuredClone(initialState)
    this.roundTimerRound = this.state.round
    this.clock = options.clock ?? defaultClock
    this.onSubscriberError =
      options.onSubscriberError ?? (() => undefined)
    this.synchronizePhaseSchedule()
    this.synchronizeRoundSchedule()
  }

  connectSeat(input: unknown): SeatConnectionResult {
    if (
      typeof input !== 'object' ||
      input === null ||
      !('sessionId' in input) ||
      !isValidSessionId(input.sessionId)
    ) {
      return {
        ok: false,
        error: 'invalid-session',
      }
    }

    if (
      !('participantId' in input) ||
      !isParticipantId(input.participantId)
    ) {
      return {
        ok: false,
        error: 'invalid-seat',
      }
    }

    const seat: AuthenticatedSeat = {
      sessionId: input.sessionId,
      participantId: input.participantId,
    }
    const participant =
      this.state.match.participants[seat.participantId]

    if (participant.controller.kind !== 'human') {
      return {
        ok: false,
        error: 'seat-not-human',
      }
    }

    const boundParticipant = this.sessionSeats.get(seat.sessionId)

    if (boundParticipant !== undefined) {
      return boundParticipant === seat.participantId
        ? {
            ok: true,
            seat: { ...seat },
          }
        : {
            ok: false,
            error: 'session-already-bound',
          }
    }

    const connectedSession = this.seatSessions.get(
      seat.participantId,
    )

    if (connectedSession !== undefined) {
      return {
        ok: false,
        error: 'seat-already-connected',
      }
    }

    this.sessionSeats.set(seat.sessionId, seat.participantId)
    this.seatSessions.set(seat.participantId, seat.sessionId)

    return {
      ok: true,
      seat: { ...seat },
    }
  }

  disconnectSeat(sessionId: string) {
    const participantId = this.sessionSeats.get(sessionId)

    if (participantId === undefined) {
      return false
    }

    this.sessionSeats.delete(sessionId)
    this.seatSessions.delete(participantId)
    return true
  }

  submitCommand(
    sessionId: string,
    input: unknown,
  ): AuthoritativeCommandResult {
    const participantId = this.sessionSeats.get(sessionId)

    if (participantId === undefined) {
      return {
        ok: false,
        error: 'unauthenticated-session',
        snapshot: this.getSnapshot(),
      }
    }

    if (this.finished) {
      return {
        ok: false,
        error: 'match-finished',
        snapshot: this.getSnapshot(),
      }
    }

    const command = parseGameCommand(input)

    if (!command) {
      return {
        ok: false,
        error: 'invalid-command',
        snapshot: this.getSnapshot(),
      }
    }

    if (command.participantId !== participantId) {
      return {
        ok: false,
        command,
        error: 'participant-mismatch',
        snapshot: this.getSnapshot(),
      }
    }

    if (isServerControlledCommand(command)) {
      return {
        ok: false,
        command,
        error: 'server-controlled-action',
        snapshot: this.getSnapshot(),
      }
    }

    if (this.roundPlans.has(participantId)) {
      return {
        ok: false,
        command,
        error: 'participant-ready',
        snapshot: this.getSnapshot(),
      }
    }

    const result = executeGameCommand(this.state, command)

    if (!result.ok) {
      return {
        ...result,
        snapshot: this.getSnapshot(),
      }
    }

    this.acceptState(result.state)

    return {
      ok: true,
      command,
      snapshot: this.getSnapshot(),
    }
  }

  submitRoundPlan(
    sessionId: string,
    input: unknown,
  ):
    | {
        ok: true
        snapshot: AuthoritativeMatchSnapshot
      }
    | {
        ok: false
        error: AuthoritativeCommandError
        snapshot: AuthoritativeMatchSnapshot
      } {
    const participantId = this.sessionSeats.get(sessionId)

    if (participantId === undefined) {
      return {
        ok: false,
        error: 'unauthenticated-session',
        snapshot: this.getSnapshot(),
      }
    }

    if (this.finished) {
      return {
        ok: false,
        error: 'match-finished',
        snapshot: this.getSnapshot(),
      }
    }

    const plan = parseParticipantRoundPlan(input)

    if (!plan) {
      return {
        ok: false,
        error: 'invalid-round-plan',
        snapshot: this.getSnapshot(),
      }
    }

    if (isSharedRoundActionActive(this.state)) {
      return {
        ok: false,
        error: 'round-action-active',
        snapshot: this.getSnapshot(),
      }
    }

    this.roundPlans.set(participantId, plan)

    if (!this.tryCompleteRound()) {
      this.revision += 1
      this.publishSnapshot()
    }

    return {
      ok: true,
      snapshot: this.getSnapshot(),
    }
  }

  getSnapshot(participantId?: ParticipantId) {
    return copySnapshot(
      this.revision,
      this.finished,
      this.state,
      this.phaseTiming,
      this.getRoundTiming(),
      participantIds.filter((participantId) =>
        this.roundPlans.has(participantId),
      ),
      participantId
        ? this.lastRoundReports[participantId] ?? null
        : null,
      participantId,
    )
  }

  exportPersistenceState(): PersistedAuthoritativeMatchState {
    return clonePersistenceJson({
      version: AUTHORITATIVE_MATCH_STATE_VERSION,
      revision: this.revision,
      finished: this.finished,
      state: this.state,
      phaseTiming: this.phaseTiming,
      roundTiming: this.getRoundTiming(),
      serverCommandSequence: this.serverCommandSequence,
      roundPlans: Object.fromEntries(this.roundPlans),
      lastRoundReports: this.lastRoundReports,
      localEventSchedules: participantIds.flatMap(
        (participantId) => {
          const schedule =
            this.localEventSchedules.get(participantId)

          return schedule
            ? [{ participantId, ...schedule }]
            : []
        },
      ),
    })
  }

  subscribe(
    subscriber: (
      snapshot: AuthoritativeMatchSnapshot,
    ) => void,
  ) {
    this.subscribers.add(subscriber)
    this.notifySubscriber(subscriber)

    return () => {
      this.subscribers.delete(subscriber)
    }
  }

  dispose() {
    if (this.phaseTimer !== null) {
      this.clock.clearTimeout(this.phaseTimer)
    }
    if (this.roundTimer !== null) {
      this.clock.clearTimeout(this.roundTimer)
    }
    this.clearLocalEventTimers()

    this.phaseTimer = null
    this.roundTimer = null
    this.roundDeadlineAt = null
    this.scheduledPhaseKey = null
    this.phaseTiming = null
    this.sessionSeats.clear()
    this.seatSessions.clear()
    this.subscribers.clear()
    this.roundPlans.clear()
    this.lastRoundReports = {}
  }

  private acceptState(nextState: GameState) {
    this.state = nextState
    this.revision += 1
    this.synchronizePhaseSchedule()
    this.synchronizeRoundSchedule()
    this.publishSnapshot()
  }

  private clearLocalEventTimers() {
    for (const timer of this.localEventTimers.values()) {
      this.clock.clearTimeout(timer)
    }

    this.localEventTimers.clear()
    this.localEventSchedules.clear()
  }

  private scheduleLocalEvents(state: GameState) {
    for (const participantId of getHumanParticipantIds(
      state.match,
    )) {
      const event = selectSeededLocalEvent(
        state.round,
        state.match.seed,
        participantId,
      )

      if (!event) {
        continue
      }

      this.scheduleLocalEventActivation(
        participantId,
        event,
        state.round,
        getSeededLocalEventDelay(
          state.round,
          state.match.seed,
          participantId,
        ),
      )
    }
  }

  private scheduleLocalEventActivation(
    participantId: ParticipantId,
    event: LocalEventId,
    round: number,
    delayMilliseconds: number,
  ) {
    this.localEventSchedules.set(participantId, {
      event,
      round,
      deadlineAt: this.clock.now() + delayMilliseconds,
    })
    const timer = this.clock.setTimeout(() => {
      this.localEventTimers.delete(participantId)
      this.localEventSchedules.delete(participantId)

      if (this.state.round !== round) {
        return
      }

      if (
        this.state.activeResourceMarket !== null ||
        this.state.landAuctionTie !== null
      ) {
        this.scheduleLocalEventActivation(
          participantId,
          event,
          round,
          250,
        )
        return
      }

      this.acceptState(
        applyColonyLocalEvent(
          this.state,
          participantId,
          event,
        ),
      )
    }, delayMilliseconds)

    this.localEventTimers.set(participantId, timer)
  }

  private synchronizePhaseSchedule() {
    const schedule = getPhaseSchedule(this.state)

    if (schedule?.key === this.scheduledPhaseKey) {
      return
    }

    if (this.phaseTimer !== null) {
      this.clock.clearTimeout(this.phaseTimer)
    }

    this.phaseTimer = null
    this.scheduledPhaseKey = schedule?.key ?? null
    this.phaseTiming = schedule
      ? {
          ...schedule.timing,
          deadlineAt:
            this.clock.now() + schedule.durationMilliseconds,
        }
      : null

    if (!schedule) {
      return
    }

    this.phaseTimer = this.clock.setTimeout(() => {
      this.advanceScheduledPhase(schedule)
    }, schedule.durationMilliseconds)
  }

  private getRoundTiming(): AuthoritativeRoundTiming | null {
    if (
      this.finished ||
      getHumanParticipantIds(this.state.match).every(
        (participantId) => this.roundPlans.has(participantId),
      )
    ) {
      return null
    }

    if (this.roundDeadlineAt !== null) {
      return {
        status: 'running',
        deadlineAt: this.roundDeadlineAt,
      }
    }

    return isSharedRoundActionActive(this.state)
      ? {
          status: 'paused',
          remainingMilliseconds:
            this.roundRemainingMilliseconds,
        }
      : null
  }

  private synchronizeRoundSchedule() {
    if (this.state.round !== this.roundTimerRound) {
      if (this.roundTimer !== null) {
        this.clock.clearTimeout(this.roundTimer)
      }

      this.roundTimer = null
      this.roundTimerRound = this.state.round
      this.roundDeadlineAt = null
      this.roundRemainingMilliseconds =
        MULTIPLAYER_ROUND_DURATION_MILLISECONDS
    }

    const allHumanParticipantsReady =
      getHumanParticipantIds(this.state.match).every(
        (participantId) => this.roundPlans.has(participantId),
      )

    if (this.finished || allHumanParticipantsReady) {
      if (this.roundTimer !== null) {
        this.clock.clearTimeout(this.roundTimer)
      }

      this.roundTimer = null
      this.roundDeadlineAt = null
      return
    }

    if (isSharedRoundActionActive(this.state)) {
      if (this.roundDeadlineAt !== null) {
        this.roundRemainingMilliseconds = Math.max(
          0,
          this.roundDeadlineAt - this.clock.now(),
        )
      }

      if (this.roundTimer !== null) {
        this.clock.clearTimeout(this.roundTimer)
      }

      this.roundTimer = null
      this.roundDeadlineAt = null
      return
    }

    if (this.roundTimer !== null) {
      return
    }

    this.roundDeadlineAt =
      this.clock.now() + this.roundRemainingMilliseconds
    const scheduledRound = this.state.round
    this.roundTimer = this.clock.setTimeout(() => {
      this.expireRoundSchedule(scheduledRound)
    }, this.roundRemainingMilliseconds)
  }

  private expireRoundSchedule(scheduledRound: number) {
    if (
      this.finished ||
      this.state.round !== scheduledRound ||
      isSharedRoundActionActive(this.state)
    ) {
      return
    }

    this.roundTimer = null
    this.roundDeadlineAt = null
    this.roundRemainingMilliseconds = 0

    for (const participantId of getHumanParticipantIds(
      this.state.match,
    )) {
      if (!this.roundPlans.has(participantId)) {
        this.roundPlans.set(
          participantId,
          createConservativeRoundPlan(
            this.state,
            participantId,
          ),
        )
      }
    }

    if (!this.tryCompleteRound()) {
      this.revision += 1
      this.synchronizeRoundSchedule()
      this.publishSnapshot()
    }
  }

  private advanceScheduledPhase(schedule: PhaseSchedule) {
    if (this.scheduledPhaseKey !== schedule.key) {
      return
    }

    let commandId: string

    do {
      this.serverCommandSequence += 1
      commandId = `server-phase-${this.serverCommandSequence}`
    } while (
      (this.state.processedCommandIds ?? []).includes(commandId)
    )

    const command: GameCommand = {
      ...schedule.command,
      version: 1,
      commandId,
      expectedRound: this.state.round,
    } as GameCommand
    const result = executeGameCommand(this.state, command)

    if (!result.ok) {
      this.scheduledPhaseKey = null
      this.phaseTimer = null
      this.phaseTiming = null
      this.publishSnapshot()
      return
    }

    this.phaseTimer = null
    this.acceptState(result.state)

    if (result.state.landAuctionTie?.phase === 'finished') {
      this.tryCompleteRound()
    }
  }

  private tryCompleteRound() {
    const humanParticipantIds = getHumanParticipantIds(
      this.state.match,
    )

    if (
      humanParticipantIds.some(
        (participantId) => !this.roundPlans.has(participantId),
      )
    ) {
      return false
    }

    if (isSharedRoundActionActive(this.state)) {
      return false
    }

    if (this.state.landAuctionTie?.phase === 'finished') {
      const tie = this.state.landAuctionTie
      this.state = resolveLandTieBreak(
        this.state,
        tie.liveBids,
      )
    }

    this.state = applyAutonomousAiLandPurchases(this.state)

    const pendingBidCount = Object.keys(
      this.state.pendingLandBid?.bids ?? {},
    ).length

    if (
      pendingBidCount >= 2 &&
      !this.state.pendingLandBid?.winnerId
    ) {
      this.acceptState(beginLandTieBreak(this.state))
      return true
    }

    const result = runMultiplayerRound(
      this.state,
      Object.fromEntries(this.roundPlans),
    )
    const nextRoundStarted =
      result.nextState.round > this.state.round
    const nextState = nextRoundStarted
      ? activateGlobalEvent(
          result.nextState,
          selectSeededGlobalEvent(
            result.nextState.round,
            result.nextState.match.seed,
          ),
        )
      : result.nextState

    this.lastRoundReports = result.reports
    this.roundPlans.clear()
    this.clearLocalEventTimers()
    this.finished = Object.values(result.reports).some(
      (report) => isGameFinished(report.roundPlayed),
    )
    this.acceptState(nextState)

    if (nextRoundStarted) {
      this.scheduleLocalEvents(nextState)
    }

    return true
  }

  private publishSnapshot() {
    for (const subscriber of this.subscribers) {
      this.notifySubscriber(subscriber)
    }
  }

  private notifySubscriber(
    subscriber: (
      snapshot: AuthoritativeMatchSnapshot,
    ) => void,
  ) {
    try {
      subscriber(this.getSnapshot())
    } catch (error) {
      this.onSubscriberError(error)
    }
  }
}

function parseParticipantRoundPlan(
  input: unknown,
): ParticipantRoundPlan | null {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('supplyPlan' in input) ||
    typeof input.supplyPlan !== 'object' ||
    input.supplyPlan === null ||
    !('foodLevel' in input.supplyPlan) ||
    !('energyLevel' in input.supplyPlan)
  ) {
    return null
  }

  const { foodLevel, energyLevel } = input.supplyPlan
  const isLevel = (value: unknown): value is number =>
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 3

  return isLevel(foodLevel) && isLevel(energyLevel)
    ? {
        supplyPlan: {
          foodLevel,
          energyLevel,
        },
      }
    : null
}

export function createAuthoritativeMatch(
  initialState: GameState,
  options: AuthoritativeMatchOptions = {},
) {
  return new AuthoritativeMatch(initialState, options)
}
