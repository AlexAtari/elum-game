import {
  applyColonyLocalEvent,
  activateGlobalEvent,
  beginLandTieBreak,
  getColonyLocalEvent,
  getMarketTiming,
  getSeededLocalEventDelay,
  LAND_AUCTION_TIMING,
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
  state: GameState
  phaseTiming: AuthoritativePhaseTiming | null
  lastRoundReport: RoundReport | null
  roundReadiness: {
    round: number
    readyParticipantIds: ParticipantId[]
  }
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
  state: GameState,
  phaseTiming: AuthoritativePhaseTiming | null,
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
    state: personalizedState,
    phaseTiming,
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

function isServerControlledCommand(command: GameCommand) {
  return (
    command.type === 'advance-resource-market-phase' ||
    command.type === 'advance-land-auction-phase'
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
  private phaseTiming: AuthoritativePhaseTiming | null = null
  private scheduledPhaseKey: string | null = null
  private phaseTimer: unknown = null
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
    this.clock = options.clock ?? defaultClock
    this.onSubscriberError =
      options.onSubscriberError ?? (() => undefined)
    this.synchronizePhaseSchedule()
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

    const plan = parseParticipantRoundPlan(input)

    if (!plan) {
      return {
        ok: false,
        error: 'invalid-round-plan',
        snapshot: this.getSnapshot(),
      }
    }

    if (
      (this.state.activeResourceMarket !== null &&
        this.state.activeResourceMarket.phase !== 'finished') ||
      (this.state.landAuctionTie !== null &&
        this.state.landAuctionTie.phase !== 'finished')
    ) {
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
      this.state,
      this.phaseTiming,
      participantIds.filter((participantId) =>
        this.roundPlans.has(participantId),
      ),
      participantId
        ? this.lastRoundReports[participantId] ?? null
        : null,
      participantId,
    )
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
    this.clearLocalEventTimers()

    this.phaseTimer = null
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
    this.publishSnapshot()
  }

  private clearLocalEventTimers() {
    for (const timer of this.localEventTimers.values()) {
      this.clock.clearTimeout(timer)
    }

    this.localEventTimers.clear()
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
    const timer = this.clock.setTimeout(() => {
      this.localEventTimers.delete(participantId)

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

    if (
      (this.state.activeResourceMarket !== null &&
        this.state.activeResourceMarket.phase !== 'finished') ||
      (this.state.landAuctionTie !== null &&
        this.state.landAuctionTie.phase !== 'finished')
    ) {
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
