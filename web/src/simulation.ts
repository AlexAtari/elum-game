import {
  GAME_ROUND_LIMIT,
  LAND_MINIMUM_BID,
  MARKET_PRICES,
  STARTING_HARVESTERS,
  advanceRivalColonies,
  createPlayableInitialGameState,
  type GameState,
  type Resources,
  type RivalColonies,
  type RivalColonyState,
  type RivalId,
} from './game'
import {
  applyAutonomousRivalLandPurchases,
  getAutonomousRivalLandDecision,
} from './rivalAutonomousLand'

export type SimulationParticipantId =
  | 'agima'
  | RivalId

export type SimulationParticipantSnapshot = {
  id: SimulationParticipantId
  name: string
  population: number
  credits: number
  resources: Resources
  harvesters: number
  ownedTiles: number
  wealth: number
}

export type SimulationRoundSnapshot = {
  round: number
  participants: Record<
    SimulationParticipantId,
    SimulationParticipantSnapshot
  >
}

export type SimulationWarning = {
  round: number
  participantId: SimulationParticipantId | 'all'
  kind:
    | 'population-decline'
    | 'food-empty'
    | 'energy-empty'
    | 'land-lock'
    | 'large-wealth-gap'
  message: string
}

export type HeadlessSimulationResult = {
  mode: 'headless-economic-v1'
  roundsPlayed: number
  marketIncluded: false
  history: SimulationRoundSnapshot[]
  warnings: SimulationWarning[]
  finalStandings: SimulationParticipantSnapshot[]
}

export type HeadlessSimulationOptions = {
  rounds?: number
}

type InternalSimulationState = {
  game: GameState
  agima: RivalColonyState
}

const participantIds: SimulationParticipantId[] = [
  'agima',
  'orion',
  'nova',
  'vega',
]

function cloneResources(resources: Resources): Resources {
  return { ...resources }
}

function createAgimaAgent(
  game: GameState,
): RivalColonyState {
  return {
    ...game.rivals.orion,
    id: 'orion',
    name: 'Agima',
    icon: '🧑‍🚀',
    population: game.population,
    credits: game.credits,
    resources: cloneResources(game.resources),
    harvesters: STARTING_HARVESTERS,
    ownedTileIds: [...game.ownedTileIds],
    lastLandPurchaseRound: undefined,
    harvesterAssignments: {},
    inactiveHarvesterIds: [],
  }
}

function createShadowRival(
  agima: RivalColonyState,
  id: Exclude<RivalId, 'orion'>,
): RivalColonyState {
  return {
    ...agima,
    id,
    name: `Simulation ${id}`,
    resources: cloneResources(agima.resources),
    ownedTileIds: [...(agima.ownedTileIds ?? [])],
    harvesterAssignments: {
      ...(agima.harvesterAssignments ?? {}),
    },
    inactiveHarvesterIds: [
      ...(agima.inactiveHarvesterIds ?? []),
    ],
  }
}

function advanceAgima(
  agima: RivalColonyState,
  round: number,
): RivalColonyState {
  const shadowColonies: RivalColonies = {
    orion: {
      ...agima,
      id: 'orion',
      resources: cloneResources(agima.resources),
      ownedTileIds: [...(agima.ownedTileIds ?? [])],
      harvesterAssignments: {
        ...(agima.harvesterAssignments ?? {}),
      },
      inactiveHarvesterIds: [
        ...(agima.inactiveHarvesterIds ?? []),
      ],
    },
    nova: createShadowRival(agima, 'nova'),
    vega: createShadowRival(agima, 'vega'),
  }

  return advanceRivalColonies(
    shadowColonies,
    round,
    null,
  ).orion
}

function applyAgimaLandPurchase(
  state: InternalSimulationState,
): InternalSimulationState {
  const decisionState: GameState = {
    ...state.game,
    rivals: {
      ...state.game.rivals,
      orion: {
        ...state.agima,
        id: 'orion',
        ownedTileIds: [
          ...(state.agima.ownedTileIds ?? []),
        ],
      },
    },
  }
  const decision = getAutonomousRivalLandDecision(
    decisionState,
    'orion',
  )

  if (
    !decision ||
    decision.bid <= 0 ||
    decision.bid > state.agima.credits
  ) {
    return state
  }

  return {
    game: {
      ...state.game,
      ownedTileIds: [
        ...state.game.ownedTileIds,
        decision.tileId,
      ],
    },
    agima: {
      ...state.agima,
      credits:
        state.agima.credits - decision.bid,
      ownedTileIds: [
        ...(state.agima.ownedTileIds ?? []),
        decision.tileId,
      ],
      lastLandPurchaseRound: state.game.round,
    },
  }
}

function getResourceWealth(
  resources: Resources,
): number {
  return (
    resources.food * MARKET_PRICES.food +
    resources.energy * MARKET_PRICES.energy +
    resources.ore * MARKET_PRICES.ore +
    resources.crystals * MARKET_PRICES.crystals
  )
}

export function calculateSimulationWealth(
  colony: Pick<
    SimulationParticipantSnapshot,
    | 'population'
    | 'credits'
    | 'resources'
    | 'harvesters'
    | 'ownedTiles'
  >,
): number {
  return (
    colony.credits +
    getResourceWealth(colony.resources) +
    colony.population * 10 +
    colony.harvesters * 30 +
    colony.ownedTiles * LAND_MINIMUM_BID
  )
}

function createParticipantSnapshot(
  id: SimulationParticipantId,
  colony: RivalColonyState,
): SimulationParticipantSnapshot {
  const base = {
    id,
    name: id === 'agima' ? 'Agima' : colony.name,
    population: colony.population,
    credits: colony.credits,
    resources: cloneResources(colony.resources),
    harvesters: colony.harvesters,
    ownedTiles: colony.ownedTileIds?.length ?? 0,
  }

  return {
    ...base,
    wealth: calculateSimulationWealth(base),
  }
}

function createRoundSnapshot(
  round: number,
  state: InternalSimulationState,
): SimulationRoundSnapshot {
  return {
    round,
    participants: {
      agima: createParticipantSnapshot(
        'agima',
        state.agima,
      ),
      orion: createParticipantSnapshot(
        'orion',
        state.game.rivals.orion,
      ),
      nova: createParticipantSnapshot(
        'nova',
        state.game.rivals.nova,
      ),
      vega: createParticipantSnapshot(
        'vega',
        state.game.rivals.vega,
      ),
    },
  }
}

function collectRoundWarnings(
  previous: SimulationRoundSnapshot,
  current: SimulationRoundSnapshot,
): SimulationWarning[] {
  const warnings: SimulationWarning[] = []

  for (const id of participantIds) {
    const before = previous.participants[id]
    const after = current.participants[id]

    if (after.population < before.population) {
      warnings.push({
        round: current.round,
        participantId: id,
        kind: 'population-decline',
        message:
          `${after.name}: Bevölkerung sinkt von ` +
          `${before.population} auf ${after.population}.`,
      })
    }

    if (after.resources.food === 0) {
      warnings.push({
        round: current.round,
        participantId: id,
        kind: 'food-empty',
        message: `${after.name}: Nahrung ist vollständig aufgebraucht.`,
      })
    }

    if (after.resources.energy === 0) {
      warnings.push({
        round: current.round,
        participantId: id,
        kind: 'energy-empty',
        message: `${after.name}: Energie ist vollständig aufgebraucht.`,
      })
    }

    if (
      after.ownedTiles < after.harvesters &&
      after.credits < LAND_MINIMUM_BID
    ) {
      warnings.push({
        round: current.round,
        participantId: id,
        kind: 'land-lock',
        message:
          `${after.name}: Nicht alle Harvester können ` +
          'eingesetzt werden und Land ist nicht finanzierbar.',
      })
    }
  }

  const standings = Object.values(
    current.participants,
  ).sort(
    (first, second) =>
      second.wealth - first.wealth,
  )
  const leader = standings[0]
  const last = standings.at(-1)

  if (
    leader &&
    last &&
    last.wealth > 0 &&
    leader.wealth / last.wealth >= 2
  ) {
    warnings.push({
      round: current.round,
      participantId: 'all',
      kind: 'large-wealth-gap',
      message:
        `Große Vermögenslücke: ${leader.name} besitzt ` +
        `mindestens doppelt so viel wie ${last.name}.`,
    })
  }

  return warnings
}

function advanceSimulationRound(
  state: InternalSimulationState,
  round: number,
): InternalSimulationState {
  const gameAtRound: GameState = {
    ...state.game,
    round,
    pendingLandBid: null,
    landAuctionTie: null,
    activeGlobalEvent: null,
    activeLocalEvent: null,
  }
  const withRivalLand =
    applyAutonomousRivalLandPurchases(gameAtRound)
  const withAgimaLand = applyAgimaLandPurchase({
    game: withRivalLand,
    agima: state.agima,
  })
  const nextRivals = advanceRivalColonies(
    withAgimaLand.game.rivals,
    round,
    null,
  )
  const nextAgima = advanceAgima(
    withAgimaLand.agima,
    round,
  )

  return {
    game: {
      ...withAgimaLand.game,
      round: Math.min(
        GAME_ROUND_LIMIT,
        round + 1,
      ),
      population: nextAgima.population,
      credits: nextAgima.credits,
      resources: cloneResources(
        nextAgima.resources,
      ),
      rivals: nextRivals,
    },
    agima: nextAgima,
  }
}

export function runHeadlessEconomicSimulation(
  options: HeadlessSimulationOptions = {},
): HeadlessSimulationResult {
  const roundsPlayed = Math.max(
    1,
    Math.min(
      GAME_ROUND_LIMIT,
      options.rounds ?? GAME_ROUND_LIMIT,
    ),
  )
  const initialGame =
    createPlayableInitialGameState()
  let state: InternalSimulationState = {
    game: initialGame,
    agima: createAgimaAgent(initialGame),
  }
  const history: SimulationRoundSnapshot[] = [
    createRoundSnapshot(0, state),
  ]
  const warnings: SimulationWarning[] = []

  for (
    let round = 1;
    round <= roundsPlayed;
    round += 1
  ) {
    state = advanceSimulationRound(state, round)
    const snapshot = createRoundSnapshot(
      round,
      state,
    )
    warnings.push(
      ...collectRoundWarnings(
        history.at(-1) ?? snapshot,
        snapshot,
      ),
    )
    history.push(snapshot)
  }

  const finalSnapshot =
    history.at(-1) ?? history[0]
  const finalStandings = Object.values(
    finalSnapshot.participants,
  ).sort(
    (first, second) =>
      second.wealth - first.wealth ||
      first.id.localeCompare(second.id),
  )

  return {
    mode: 'headless-economic-v1',
    roundsPlayed,
    marketIncluded: false,
    history,
    warnings,
    finalStandings,
  }
}
