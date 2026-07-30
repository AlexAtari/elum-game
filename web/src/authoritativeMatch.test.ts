import { describe, expect, it } from 'vitest'
import {
  createPlayableInitialGameState,
  getSeededLocalEventDelay,
  selectSeededGlobalEvent,
  selectSeededLocalEvent,
  type GameState,
} from './game'
import {
  AUTHORITATIVE_MATCH_STATE_VERSION,
  createAuthoritativeMatch,
  MULTIPLAYER_ROUND_DURATION_MILLISECONDS,
  parsePersistedAuthoritativeMatchState,
  type MatchClock,
} from './authoritativeMatch'
import type { GameCommand } from './gameCommands'

class FakeClock implements MatchClock {
  private currentTime = 1_000
  private nextTimerId = 0
  private readonly timers = new Map<
    number,
    {
      dueAt: number
      callback: () => void
    }
  >()

  now = () => this.currentTime

  setTimeout = (
    callback: () => void,
    delayMilliseconds: number,
  ) => {
    this.nextTimerId += 1
    this.timers.set(this.nextTimerId, {
      dueAt: this.currentTime + delayMilliseconds,
      callback,
    })
    return this.nextTimerId
  }

  clearTimeout = (handle: unknown) => {
    this.timers.delete(Number(handle))
  }

  advance(milliseconds: number) {
    const targetTime = this.currentTime + milliseconds

    while (true) {
      const nextTimer = [...this.timers.entries()]
        .filter(([, timer]) => timer.dueAt <= targetTime)
        .sort(
          ([firstId, first], [secondId, second]) =>
            first.dueAt - second.dueAt ||
            firstId - secondId,
        )[0]

      if (!nextTimer) {
        break
      }

      const [timerId, timer] = nextTimer
      this.timers.delete(timerId)
      this.currentTime = timer.dueAt
      timer.callback()
    }

    this.currentTime = targetTime
  }
}

function createCommand(
  command: Omit<
    GameCommand,
    'version' | 'commandId' | 'expectedRound'
  >,
  commandId: string,
): GameCommand {
  return {
    ...command,
    version: 1,
    commandId,
    expectedRound: 1,
  } as GameCommand
}

function withRemoteOrion(state: GameState): GameState {
  return {
    ...state,
    match: {
      ...state.match,
      participants: {
        ...state.match.participants,
        orion: {
          ...state.match.participants.orion,
          controller: {
            kind: 'human',
            input: 'remote',
          },
        },
      },
    },
  }
}

describe('Autoritativer Match-Serverkern', () => {
  it('exportiert private Matchdaten ohne Prozess-Sitzungen oder Timer-Handles', () => {
    const clock = new FakeClock()
    const initialState = withRemoteOrion(
      createPlayableInitialGameState(),
    )
    const match = createAuthoritativeMatch(initialState, {
      clock,
    })
    match.connectSeat({
      sessionId: 'private-agima-session',
      participantId: 'agima',
    })
    match.connectSeat({
      sessionId: 'private-orion-session',
      participantId: 'orion',
    })
    match.submitRoundPlan('private-agima-session', {
      supplyPlan: { foodLevel: 2, energyLevel: 1 },
    })

    const persistedState = match.exportPersistenceState()

    expect(persistedState).toMatchObject({
      version: AUTHORITATIVE_MATCH_STATE_VERSION,
      revision: 1,
      finished: false,
      state: { round: 1 },
      phaseTiming: null,
      roundTiming: {
        status: 'running',
        deadlineAt:
          1_000 + MULTIPLAYER_ROUND_DURATION_MILLISECONDS,
      },
      serverCommandSequence: 0,
      roundPlans: {
        agima: {
          supplyPlan: { foodLevel: 2, energyLevel: 1 },
        },
      },
      lastRoundReports: {},
      localEventSchedules: [],
    })
    expect(JSON.stringify(persistedState)).not.toContain(
      'private-agima-session',
    )
    expect(JSON.stringify(persistedState)).not.toContain(
      'private-orion-session',
    )
    expect(
      parsePersistedAuthoritativeMatchState(persistedState),
    ).toEqual(persistedState)

    persistedState.state.colonies.agima.credits = 0

    expect(
      match.exportPersistenceState().state.colonies.agima.credits,
    ).not.toBe(0)
  })

  it('exportiert private Berichte und geplante lokale Ereignisse', () => {
    const clock = new FakeClock()
    const initialState = withRemoteOrion(
      createPlayableInitialGameState(),
    )
    const match = createAuthoritativeMatch(initialState, {
      clock,
    })
    match.connectSeat({
      sessionId: 'agima-session',
      participantId: 'agima',
    })
    match.connectSeat({
      sessionId: 'orion-session',
      participantId: 'orion',
    })
    match.submitRoundPlan('agima-session', {
      supplyPlan: { foodLevel: 2, energyLevel: 2 },
    })
    match.submitRoundPlan('orion-session', {
      supplyPlan: { foodLevel: 2, energyLevel: 2 },
    })

    const persistedState = match.exportPersistenceState()

    expect(persistedState.state.round).toBe(2)
    expect(persistedState.roundPlans).toEqual({})
    expect(persistedState.lastRoundReports).toMatchObject({
      agima: { roundPlayed: 1 },
      orion: { roundPlayed: 1 },
    })
    expect(persistedState.localEventSchedules).toEqual(
      ['agima', 'orion'].map((participantId) => ({
        participantId,
        event: selectSeededLocalEvent(
          2,
          initialState.match.seed,
          participantId as 'agima' | 'orion',
        ),
        round: 2,
        deadlineAt:
          1_000 +
          getSeededLocalEventDelay(
            2,
            initialState.match.seed,
            participantId as 'agima' | 'orion',
          ),
      })),
    )
  })

  it('weist beschädigte Match-Persistenzhüllen zurück', () => {
    const persistedState = createAuthoritativeMatch(
      createPlayableInitialGameState(),
    ).exportPersistenceState()

    expect(
      parsePersistedAuthoritativeMatchState({
        ...persistedState,
        version: 2,
      }),
    ).toBeNull()
    expect(
      parsePersistedAuthoritativeMatchState({
        ...persistedState,
        revision: -1,
      }),
    ).toBeNull()
    expect(
      parsePersistedAuthoritativeMatchState({
        ...persistedState,
        roundPlans: {
          unknown: {
            supplyPlan: { foodLevel: 2, energyLevel: 2 },
          },
        },
      }),
    ).toBeNull()
    expect(
      parsePersistedAuthoritativeMatchState({
        ...persistedState,
        localEventSchedules: [
          {
            participantId: 'agima',
            event: 'unknown-event',
            round: 1,
            deadlineAt: 2_000,
          },
        ],
      }),
    ).toBeNull()
  })

  it('rechnet nach vier Minuten fehlende Spieler konservativ ab', () => {
    const clock = new FakeClock()
    const baseState = withRemoteOrion(
      createPlayableInitialGameState(),
    )
    const state: GameState = {
      ...baseState,
      colonies: {
        ...baseState.colonies,
        orion: {
          ...baseState.colonies.orion,
          resources: {
            ...baseState.colonies.orion.resources,
            food: 1,
            energy: 1,
          },
        },
      },
    }
    const match = createAuthoritativeMatch(state, { clock })
    match.connectSeat({
      sessionId: 'agima-session',
      participantId: 'agima',
    })
    match.connectSeat({
      sessionId: 'orion-session',
      participantId: 'orion',
    })
    match.submitRoundPlan('agima-session', {
      supplyPlan: { foodLevel: 2, energyLevel: 2 },
    })
    expect(match.disconnectSeat('orion-session')).toBe(true)

    expect(match.getSnapshot()).toMatchObject({
      state: { round: 1 },
      roundTiming: {
        status: 'running',
        deadlineAt:
          1_000 + MULTIPLAYER_ROUND_DURATION_MILLISECONDS,
      },
      roundReadiness: {
        readyParticipantIds: ['agima'],
      },
    })

    clock.advance(
      MULTIPLAYER_ROUND_DURATION_MILLISECONDS - 1,
    )
    expect(match.getSnapshot().state.round).toBe(1)

    clock.advance(1)

    expect(match.getSnapshot()).toMatchObject({
      state: { round: 2 },
      roundTiming: {
        status: 'running',
        deadlineAt:
          1_000 +
          MULTIPLAYER_ROUND_DURATION_MILLISECONDS * 2,
      },
      roundReadiness: {
        readyParticipantIds: [],
      },
    })
    expect(
      match.getSnapshot('orion').lastRoundReport,
    ).toMatchObject({
      roundPlayed: 1,
      consumedFood: 1,
      consumedEnergyByHq: 1,
      populationChange: 0,
    })
    expect(
      match.connectSeat({
        sessionId: 'orion-reconnected',
        participantId: 'orion',
      }),
    ).toMatchObject({
      ok: true,
    })
  })

  it('rechnet erst nach allen menschlichen Rundenplänen genau einmal ab', () => {
    const initialState = withRemoteOrion(
      createPlayableInitialGameState(),
    )
    const match = createAuthoritativeMatch(initialState)
    match.connectSeat({
      sessionId: 'agima-session',
      participantId: 'agima',
    })
    match.connectSeat({
      sessionId: 'orion-session',
      participantId: 'orion',
    })

    const agimaReady = match.submitRoundPlan(
      'agima-session',
      {
        supplyPlan: { foodLevel: 2, energyLevel: 2 },
      },
    )

    expect(agimaReady).toMatchObject({
      ok: true,
      snapshot: {
        revision: 1,
        state: { round: 1 },
        roundReadiness: {
          round: 1,
          readyParticipantIds: ['agima'],
        },
      },
    })
    expect(
      match.submitCommand(
        'agima-session',
        createCommand(
          {
            participantId: 'agima',
            type: 'order-harvester-build',
            payload: {},
          },
          'too-late-after-ready',
        ),
      ),
    ).toMatchObject({
      ok: false,
      error: 'participant-ready',
    })

    const orionPopulation =
      initialState.colonies.orion.population
    const completed = match.submitRoundPlan(
      'orion-session',
      {
        supplyPlan: { foodLevel: 0, energyLevel: 0 },
      },
    )

    expect(completed).toMatchObject({
      ok: true,
      snapshot: {
        revision: 2,
        state: { round: 2 },
        roundReadiness: {
          round: 2,
          readyParticipantIds: [],
        },
      },
    })
    expect(
      completed.snapshot.state.colonies.orion.population,
    ).toBe(orionPopulation - 1)
    expect(completed.snapshot.state.activeGlobalEvent).toBe(
      selectSeededGlobalEvent(
        2,
        initialState.match.seed,
      ),
    )
    expect(match.getSnapshot().lastRoundReport).toBeNull()
    expect(
      match.getSnapshot('agima').lastRoundReport,
    ).toMatchObject({
      roundPlayed: 1,
      populationChange: 1,
    })
    expect(
      match.getSnapshot('orion').lastRoundReport,
    ).toMatchObject({
      roundPlayed: 1,
      populationChange: -1,
    })
  })

  it('validiert Rundenpläne an der authentifizierten Grenze', () => {
    const match = createAuthoritativeMatch(
      createPlayableInitialGameState(),
    )
    match.connectSeat({
      sessionId: 'agima-session',
      participantId: 'agima',
    })

    expect(
      match.submitRoundPlan('unknown-session', {
        supplyPlan: { foodLevel: 2, energyLevel: 2 },
      }),
    ).toMatchObject({
      ok: false,
      error: 'unauthenticated-session',
    })
    expect(
      match.submitRoundPlan('agima-session', {
        supplyPlan: { foodLevel: 4, energyLevel: 2 },
      }),
    ).toMatchObject({
      ok: false,
      error: 'invalid-round-plan',
    })
  })

  it('aktiviert nach der letzten Abrechnung keine neue globale Lage', () => {
    const state: GameState = {
      ...createPlayableInitialGameState(),
      round: 20,
      activeGlobalEvent: null,
    }
    const match = createAuthoritativeMatch(state)
    match.connectSeat({
      sessionId: 'agima-session',
      participantId: 'agima',
    })

    const completed = match.submitRoundPlan(
      'agima-session',
      {
        supplyPlan: { foodLevel: 2, energyLevel: 2 },
      },
    )

    expect(completed.snapshot.state.round).toBe(20)
    expect(completed.snapshot.finished).toBe(true)
    expect(
      completed.snapshot.state.activeGlobalEvent,
    ).toBeNull()
    expect(
      match.submitRoundPlan('agima-session', {
        supplyPlan: { foodLevel: 2, energyLevel: 2 },
      }),
    ).toMatchObject({
      ok: false,
      error: 'match-finished',
    })
    expect(
      match.submitCommand(
        'agima-session',
        createCommand(
          {
            participantId: 'agima',
            type: 'order-harvester-build',
            payload: {},
          },
          'build-after-finish',
        ),
      ),
    ).toMatchObject({
      ok: false,
      error: 'match-finished',
    })
  })

  it('bewahrt Bereitschaft über einen Reconnect hinweg', () => {
    const match = createAuthoritativeMatch(
      withRemoteOrion(createPlayableInitialGameState()),
    )
    match.connectSeat({
      sessionId: 'agima-old',
      participantId: 'agima',
    })
    match.submitRoundPlan('agima-old', {
      supplyPlan: { foodLevel: 2, energyLevel: 2 },
    })

    expect(match.disconnectSeat('agima-old')).toBe(true)
    expect(
      match.connectSeat({
        sessionId: 'agima-new',
        participantId: 'agima',
      }),
    ).toMatchObject({ ok: true })
    expect(match.getSnapshot().roundReadiness).toEqual({
      round: 1,
      readyParticipantIds: ['agima'],
    })
  })

  it('wendet lokale Ereignisse verzögert und nur im privaten Sitz-Snapshot an', () => {
    const clock = new FakeClock()
    const initialState = withRemoteOrion(
      createPlayableInitialGameState(),
    )
    const match = createAuthoritativeMatch(initialState, {
      clock,
    })
    match.connectSeat({
      sessionId: 'agima-session',
      participantId: 'agima',
    })
    match.connectSeat({
      sessionId: 'orion-session',
      participantId: 'orion',
    })
    match.submitRoundPlan('agima-session', {
      supplyPlan: { foodLevel: 2, energyLevel: 2 },
    })
    match.submitRoundPlan('orion-session', {
      supplyPlan: { foodLevel: 2, energyLevel: 2 },
    })

    const agimaEvent = selectSeededLocalEvent(
      2,
      initialState.match.seed,
      'agima',
    )
    const orionEvent = selectSeededLocalEvent(
      2,
      initialState.match.seed,
      'orion',
    )
    const latestDelay = Math.max(
      getSeededLocalEventDelay(
        2,
        initialState.match.seed,
        'agima',
      ),
      getSeededLocalEventDelay(
        2,
        initialState.match.seed,
        'orion',
      ),
    )

    expect(agimaEvent).not.toBeNull()
    expect(orionEvent).not.toBeNull()
    expect(
      match.getSnapshot('agima').state.activeLocalEvents,
    ).toEqual({})

    clock.advance(latestDelay)

    expect(
      match.getSnapshot('agima').state.activeLocalEvents,
    ).toEqual({ agima: agimaEvent })
    expect(
      match.getSnapshot('orion').state.activeLocalEvents,
    ).toEqual({ orion: orionEvent })
    expect(
      match.getSnapshot('orion').state.activeLocalEvent,
    ).toBeNull()
    expect(match.getSnapshot().state.activeLocalEvents).toEqual({})
    expect(match.getSnapshot().state.activeLocalEvent).toBeNull()
  })

  it('verschiebt ein lokales Ereignis während einer Ressourcenauktion', () => {
    const clock = new FakeClock()
    const initialState = createPlayableInitialGameState()
    const match = createAuthoritativeMatch(initialState, {
      clock,
    })
    match.connectSeat({
      sessionId: 'agima-session',
      participantId: 'agima',
    })
    match.submitRoundPlan('agima-session', {
      supplyPlan: { foodLevel: 2, energyLevel: 2 },
    })

    const marketCommand = createCommand(
      {
        participantId: 'agima',
        type: 'initiate-resource-market',
        payload: { resource: 'food' },
      },
      'round-two-market',
    )
    const marketResult = match.submitCommand(
      'agima-session',
      {
        ...marketCommand,
        expectedRound: 2,
      },
    )

    expect(marketResult.ok).toBe(true)

    clock.advance(
      getSeededLocalEventDelay(
        2,
        initialState.match.seed,
        'agima',
      ),
    )

    expect(
      match.getSnapshot('agima').state.activeLocalEvents,
    ).toEqual({})
    expect(
      match.getSnapshot('agima').state.activeResourceMarket,
    ).not.toBeNull()
  })

  it('wartet bei mehreren Grundstücksgeboten auf die Serverauktion', () => {
    const clock = new FakeClock()
    const baseState = withRemoteOrion(
      createPlayableInitialGameState(),
    )
    const tileId = baseState.colonies.agima.ownedTileIds[0]
    const state: GameState = {
      ...baseState,
      pendingLandBid: {
        tileId,
        bids: { agima: 30, orion: 30 },
        reservedCredits: { agima: 30, orion: 30 },
      },
    }
    const match = createAuthoritativeMatch(state, { clock })
    match.connectSeat({
      sessionId: 'agima-session',
      participantId: 'agima',
    })
    match.connectSeat({
      sessionId: 'orion-session',
      participantId: 'orion',
    })
    match.submitRoundPlan('agima-session', {
      supplyPlan: { foodLevel: 2, energyLevel: 2 },
    })
    match.submitRoundPlan('orion-session', {
      supplyPlan: { foodLevel: 2, energyLevel: 2 },
    })

    expect(match.getSnapshot()).toMatchObject({
      state: {
        round: 1,
        pendingLandBid: null,
        landAuctionTie: { phase: 'announcement' },
      },
      roundReadiness: {
        readyParticipantIds: ['agima', 'orion'],
      },
    })

    clock.advance(15_000)

    expect(match.getSnapshot()).toMatchObject({
      state: {
        round: 2,
        landAuctionTie: null,
      },
      roundReadiness: {
        round: 2,
        readyParticipantIds: [],
      },
    })
  })

  it('bindet authentifizierte Sitzungen und verhindert Identitätswechsel', () => {
    const state = withRemoteOrion(
      createPlayableInitialGameState(),
    )
    const subscriberErrors: unknown[] = []
    const match = createAuthoritativeMatch(state, {
      onSubscriberError: (error) => {
        subscriberErrors.push(error)
      },
    })
    const revisions: number[] = []

    match.subscribe(() => {
      throw new Error('disconnected transport')
    })
    match.subscribe((snapshot) => {
      revisions.push(snapshot.revision)
    })

    expect(
      match.connectSeat({
        sessionId: 'agima-session',
        participantId: 'agima',
      }),
    ).toMatchObject({ ok: true })
    expect(
      match.connectSeat({
        sessionId: 'orion-session',
        participantId: 'orion',
      }),
    ).toMatchObject({ ok: true })
    expect(
      match.connectSeat({
        sessionId: 'second-orion-session',
        participantId: 'orion',
      }),
    ).toEqual({
      ok: false,
      error: 'seat-already-connected',
    })
    expect(
      match.connectSeat({
        sessionId: 'orion-session',
        participantId: 'agima',
      }),
    ).toEqual({
      ok: false,
      error: 'session-already-bound',
    })
    expect(
      match.connectSeat({
        sessionId: 'vega-session',
        participantId: 'vega',
      }),
    ).toEqual({
      ok: false,
      error: 'seat-not-human',
    })
    expect(
      match.connectSeat({
        sessionId: 'unknown-seat-session',
        participantId: 'unknown',
      }),
    ).toEqual({
      ok: false,
      error: 'invalid-seat',
    })

    const spoofed = match.submitCommand(
      'agima-session',
      createCommand(
        {
          participantId: 'orion',
          type: 'order-harvester-build',
          payload: {},
        },
        'spoofed-orion-build',
      ),
    )
    const unauthenticated = match.submitCommand(
      'unknown-session',
      createCommand(
        {
          participantId: 'agima',
          type: 'order-harvester-build',
          payload: {},
        },
        'unknown-session-build',
      ),
    )
    const accepted = match.submitCommand(
      'agima-session',
      createCommand(
        {
          participantId: 'agima',
          type: 'order-harvester-build',
          payload: {},
        },
        'authenticated-build',
      ),
    )

    expect(spoofed).toMatchObject({
      ok: false,
      error: 'participant-mismatch',
    })
    expect(unauthenticated).toMatchObject({
      ok: false,
      error: 'unauthenticated-session',
    })
    expect(accepted).toMatchObject({
      ok: true,
      snapshot: {
        revision: 1,
      },
    })
    expect(revisions).toEqual([0, 1])
    expect(subscriberErrors).toHaveLength(2)

    const externalSnapshot = match.getSnapshot()
    externalSnapshot.state.colonies.agima.credits = 0
    expect(
      match.getSnapshot().state.colonies.agima.credits,
    ).not.toBe(0)
  })

  it('steuert Ressourcenmarktphasen nach autoritativen Fristen', () => {
    const clock = new FakeClock()
    const match = createAuthoritativeMatch(
      createPlayableInitialGameState(),
      { clock },
    )
    match.connectSeat({
      sessionId: 'agima-session',
      participantId: 'agima',
    })

    const initiated = match.submitCommand(
      'agima-session',
      createCommand(
        {
          participantId: 'agima',
          type: 'initiate-resource-market',
          payload: { resource: 'food' },
        },
        'market-init',
      ),
    )

    expect(initiated).toMatchObject({
      ok: true,
      snapshot: {
        revision: 1,
        phaseTiming: {
          kind: 'resource-market',
          resource: 'food',
          phase: 'announcement',
          deadlineAt: 6_000,
        },
        roundTiming: {
          status: 'paused',
          remainingMilliseconds:
            MULTIPLAYER_ROUND_DURATION_MILLISECONDS,
        },
      },
    })

    const prematureClientTransition = match.submitCommand(
      'agima-session',
      createCommand(
        {
          participantId: 'agima',
          type: 'advance-resource-market-phase',
          payload: {
            resource: 'food',
            expectedPhase: 'announcement',
          },
        },
        'client-phase-transition',
      ),
    )
    expect(prematureClientTransition).toMatchObject({
      ok: false,
      error: 'server-controlled-action',
    })

    clock.advance(5_000)
    expect(match.getSnapshot()).toMatchObject({
      revision: 2,
      state: {
        activeResourceMarket: {
          phase: 'declaration',
        },
      },
      phaseTiming: {
        phase: 'declaration',
        deadlineAt: 11_000,
      },
    })

    const withRole = match.submitCommand(
      'agima-session',
      createCommand(
        {
          participantId: 'agima',
          type: 'set-market-role',
          payload: {
            resource: 'food',
            role: 'buyer',
          },
        },
        'market-role',
      ),
    )
    expect(withRole.ok).toBe(true)
    expect(withRole.snapshot.phaseTiming?.deadlineAt).toBe(11_000)

    clock.advance(5_000)
    expect(match.getSnapshot()).toMatchObject({
      revision: 4,
      state: {
        activeResourceMarket: {
          phase: 'auction',
        },
      },
      phaseTiming: {
        phase: 'auction',
        deadlineAt: 41_000,
      },
    })

    clock.advance(30_000)
    expect(match.getSnapshot()).toMatchObject({
      revision: 5,
      state: {
        activeResourceMarket: {
          phase: 'finished',
        },
      },
      phaseTiming: null,
      roundTiming: {
        status: 'running',
        deadlineAt:
          41_000 + MULTIPLAYER_ROUND_DURATION_MILLISECONDS,
      },
    })
  })

  it('steuert auch Grundstücksphase und Live-Gebote autoritativ', () => {
    const clock = new FakeClock()
    const initialState = createPlayableInitialGameState()
    const tileId = initialState.colonies.agima.ownedTileIds[0]
    const state: GameState = {
      ...initialState,
      landAuctionTie: {
        tileId,
        tiedBid: 30,
        minimumBid: 31,
        phase: 'announcement',
        openingBids: { agima: 30, orion: 30 },
        initialLeaderId: null,
        liveBids: {
          bids: { agima: 30, orion: 30 },
          leaderId: null,
        },
      },
    }
    const match = createAuthoritativeMatch(state, { clock })
    match.connectSeat({
      sessionId: 'agima-session',
      participantId: 'agima',
    })

    expect(match.getSnapshot().phaseTiming).toEqual({
      kind: 'land-auction',
      tileId,
      phase: 'announcement',
      deadlineAt: 6_000,
    })
    expect(match.getSnapshot().roundTiming).toEqual({
      status: 'paused',
      remainingMilliseconds:
        MULTIPLAYER_ROUND_DURATION_MILLISECONDS,
    })

    clock.advance(5_000)
    expect(
      match.getSnapshot().state.landAuctionTie?.phase,
    ).toBe('auction')

    const raised = match.submitCommand(
      'agima-session',
      createCommand(
        {
          participantId: 'agima',
          type: 'move-land-auction-bid',
          payload: {
            tileId,
            direction: 'raise',
          },
        },
        'live-land-bid',
      ),
    )

    expect(
      raised.snapshot.state.landAuctionTie?.liveBids,
    ).toEqual({
      bids: { agima: 31, orion: 30 },
      leaderId: 'agima',
    })
    expect(raised.snapshot.phaseTiming?.deadlineAt).toBe(16_000)

    clock.advance(10_000)
    expect(match.getSnapshot()).toMatchObject({
      revision: 3,
      state: {
        landAuctionTie: {
          phase: 'finished',
        },
      },
      phaseTiming: null,
    })
  })
})
