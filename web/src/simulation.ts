import {
  GAME_ROUND_LIMIT,
  LAND_MINIMUM_BID,
  MARKET_PRICES,
  STARTING_HARVESTERS,
  advanceRivalColonies,
  createPlayableInitialGameState,
  tiles,
  type GameState,
  type ProductionType,
  type Resources,
  type RivalColonies,
  type RivalColonyState,
  type RivalId,
  type Tile,
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
  mode: 'headless-economic-v2'
  roundsPlayed: number
  marketIncluded: false
  history: SimulationRoundSnapshot[]
  warnings: SimulationWarning[]
  finalStandings: SimulationParticipantSnapshot[]
}

export type HeadlessSimulationOptions = {
  rounds?: number
}

export type SimulationStartingLand = {
  tileIds: [string, string]
  assignments: Record<string, ProductionType>
  foodYield: number
  energyYield: number
  orePotential: number
  distanceScore: number
}

type StartingLandCandidate = SimulationStartingLand

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

function getTileDistance(tile: Tile): number {
  return Math.max(
    Math.abs(tile.q),
    Math.abs(tile.r),
    Math.abs(tile.q + tile.r),
  )
}

function createStartingLandCandidate(
  first: Tile,
  second: Tile,
): StartingLandCandidate {
  const orientations = [
    {
      foodTile: first,
      energyTile: second,
    },
    {
      foodTile: second,
      energyTile: first,
    },
  ].sort((left, right) => {
    const leftFood = left.foodTile.food ?? 0
    const leftEnergy = left.energyTile.energy ?? 0
    const rightFood = right.foodTile.food ?? 0
    const rightEnergy = right.energyTile.energy ?? 0

    return (
      rightFood + rightEnergy -
        (leftFood + leftEnergy) ||
      Math.min(rightFood, rightEnergy) -
        Math.min(leftFood, leftEnergy) ||
      left.foodTile.id.localeCompare(
        right.foodTile.id,
      ) ||
      left.energyTile.id.localeCompare(
        right.energyTile.id,
      )
    )
  })

  const selected = orientations[0]
  const foodYield = selected.foodTile.food ?? 0
  const energyYield =
    selected.energyTile.energy ?? 0

  return {
    tileIds: [
      selected.foodTile.id,
      selected.energyTile.id,
    ],
    assignments: {
      [selected.foodTile.id]: 'food',
      [selected.energyTile.id]: 'energy',
    },
    foodYield,
    energyYield,
    orePotential:
      (first.ore ?? 0) + (second.ore ?? 0),
    distanceScore:
      getTileDistance(first) +
      getTileDistance(second),
  }
}

function findDisjointStartingLand(
  candidates: StartingLandCandidate[],
  requiredCount: number,
  startIndex: number = 0,
  selected: StartingLandCandidate[] = [],
  usedTileIds: Set<string> = new Set(),
): StartingLandCandidate[] | null {
  if (selected.length === requiredCount) {
    return selected
  }

  for (
    let index = startIndex;
    index < candidates.length;
    index += 1
  ) {
    const candidate = candidates[index]
    if (
      candidate.tileIds.some((tileId) =>
        usedTileIds.has(tileId),
      )
    ) {
      continue
    }

    const nextUsedTileIds = new Set(
      usedTileIds,
    )
    for (const tileId of candidate.tileIds) {
      nextUsedTileIds.add(tileId)
    }

    const result = findDisjointStartingLand(
      candidates,
      requiredCount,
      index + 1,
      [...selected, candidate],
      nextUsedTileIds,
    )
    if (result) {
      return result
    }
  }

  return null
}

export function createBalancedSimulationStartingLand():
  Record<
    SimulationParticipantId,
    SimulationStartingLand
  > {
  const candidateTiles = tiles.filter(
    (tile) =>
      tile.id !== 'HQ' &&
      getTileDistance(tile) <= 3,
  )
  const groups = new Map<
    string,
    StartingLandCandidate[]
  >()

  for (
    let firstIndex = 0;
    firstIndex < candidateTiles.length;
    firstIndex += 1
  ) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < candidateTiles.length;
      secondIndex += 1
    ) {
      const candidate =
        createStartingLandCandidate(
          candidateTiles[firstIndex],
          candidateTiles[secondIndex],
        )
      const signature = [
        candidate.foodYield,
        candidate.energyYield,
        candidate.orePotential,
      ].join(':')

      groups.set(
        signature,
        [
          ...(groups.get(signature) ?? []),
          candidate,
        ],
      )
    }
  }

  const solutions: StartingLandCandidate[][] = []

  for (const candidates of groups.values()) {
    const orderedCandidates = [...candidates].sort(
      (first, second) =>
        first.tileIds.join(':').localeCompare(
          second.tileIds.join(':'),
        ),
    )
    const solution = findDisjointStartingLand(
      orderedCandidates,
      participantIds.length,
    )

    if (solution) {
      solutions.push(solution)
    }
  }

  solutions.sort((first, second) => {
    const firstExample = first[0]
    const secondExample = second[0]
    const firstMinimumYield = Math.min(
      firstExample.foodYield,
      firstExample.energyYield,
    )
    const secondMinimumYield = Math.min(
      secondExample.foodYield,
      secondExample.energyYield,
    )
    const firstDistance = first.reduce(
      (total, land) =>
        total + land.distanceScore,
      0,
    )
    const secondDistance = second.reduce(
      (total, land) =>
        total + land.distanceScore,
      0,
    )

    return (
      secondMinimumYield - firstMinimumYield ||
      secondExample.foodYield +
        secondExample.energyYield -
        (firstExample.foodYield +
          firstExample.energyYield) ||
      secondExample.orePotential -
        firstExample.orePotential ||
      firstDistance - secondDistance ||
      first
        .flatMap((land) => land.tileIds)
        .join(':')
        .localeCompare(
          second
            .flatMap((land) => land.tileIds)
            .join(':'),
        )
    )
  })

  const selected = solutions[0]
  if (!selected) {
    throw new Error(
      'Keine vier gleichwertigen Startfeldpaare gefunden.',
    )
  }

  return Object.fromEntries(
    participantIds.map((participantId, index) => [
      participantId,
      selected[index],
    ]),
  ) as Record<
    SimulationParticipantId,
    SimulationStartingLand
  >
}

function applyStartingLand(
  colony: RivalColonyState,
  startingLand: SimulationStartingLand,
): RivalColonyState {
  return {
    ...colony,
    ownedTileIds: [...startingLand.tileIds],
    lastLandPurchaseRound: 0,
    harvesterAssignments: {
      ...startingLand.assignments,
    },
    inactiveHarvesterIds: [],
  }
}

function createAgimaAgent(
  game: GameState,
  startingLand: SimulationStartingLand,
): RivalColonyState {
  return applyStartingLand(
    {
      ...game.rivals.orion,
      id: 'orion',
      name: 'Agima',
      icon: '🧑‍🚀',
      population: game.population,
      credits: game.credits,
      resources: cloneResources(game.resources),
      harvesters: STARTING_HARVESTERS,
    },
    startingLand,
  )
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

function createInitialSimulationState():
  InternalSimulationState {
  const baseGame =
    createPlayableInitialGameState()
  const startingLand =
    createBalancedSimulationStartingLand()
  const rivals: RivalColonies = {
    orion: applyStartingLand(
      baseGame.rivals.orion,
      startingLand.orion,
    ),
    nova: applyStartingLand(
      baseGame.rivals.nova,
      startingLand.nova,
    ),
    vega: applyStartingLand(
      baseGame.rivals.vega,
      startingLand.vega,
    ),
  }
  const game: GameState = {
    ...baseGame,
    ownedTileIds: [
      ...startingLand.agima.tileIds,
    ],
    opponentTileIds: [
      ...startingLand.orion.tileIds,
      ...startingLand.nova.tileIds,
      ...startingLand.vega.tileIds,
    ],
    rivals,
  }

  return {
    game,
    agima: createAgimaAgent(
      game,
      startingLand.agima,
    ),
  }
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
  let state = createInitialSimulationState()
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
    mode: 'headless-economic-v2',
    roundsPlayed,
    marketIncluded: false,
    history,
    warnings,
    finalStandings,
  }
}
