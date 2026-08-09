import {
  GAME_ROUND_LIMIT,
  HARVESTER_CREDIT_COST,
  HARVESTER_ORE_COST,
  LAND_MINIMUM_BID,
  MARKET_PRICES,
  STARTING_CRYSTALS,
  STARTING_HARVESTERS,
  advanceRivalColonies,
  createPlayableInitialGameState,
  playableMarketResources,
  selectLocalColony,
  selectRivalColonies,
  tiles,
  type GameState,
  type CanonicalRivalColonyState,
  type MarketResource,
  type ProductionType,
  type Resources,
  type RivalColonies,
  type RivalColonyState,
  type RivalId,
  type Tile,
} from './game'
import {
  createAgentPlan,
  getAgentMarketIntent,
  type AgentHarvesterDecision,
  type AgentMarketIntent,
} from './agents'
import {
  applyAutonomousRivalLandPurchases,
  getAutonomousRivalLandDecision,
} from './rivalAutonomousLand'
import { getInterstellarCrystalBuyerOffer } from './interstellarCrystalBuyer'
import {
  createMeteorImpact,
  type MeteorImpact,
} from './meteor'
import {
  targetCrystalRatings,
  targetPlanetMap,
  targetStartConfiguration,
} from './planetMap'

export type SimulationParticipantId =
  | 'agima'
  | RivalId

export type SimulationSupplyDemandModel =
  | 'grouped'
  | 'smoothed'

export type SimulationProductionModel =
  | 'current'
  | 'boosted'

export type SimulationParticipantSnapshot = {
  id: SimulationParticipantId
  name: string
  population: number
  credits: number
  resources: Resources
  harvesters: number
  ownedTiles: number
  maximumOwnedTileDistance: number
  ownsFarZoneTile: boolean
  ownsNaturalCrystalVein: boolean
  wealth: number
  settlementWealth: number
  remainingResources: number
  harvesterBuildDecision:
    | AgentHarvesterDecision['reason']
    | null
}

export type SimulationRoundSnapshot = {
  round: number
  participants: Record<
    SimulationParticipantId,
    SimulationParticipantSnapshot
  >
  marketTransactions: number
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

export type SimulationMarketCounterparty =
  | SimulationParticipantId
  | 'warehouse'
  | 'interstellar-buyer'

export type SimulationMarketTransaction = {
  round: number
  resource: MarketResource
  buyer: SimulationMarketCounterparty
  seller: SimulationMarketCounterparty
  price: number
  quantity: 1
  kind: 'player' | 'warehouse' | 'interstellar'
}

export type SimulationMarketIntentDiagnostic = {
  participantId: SimulationParticipantId
  role: AgentMarketIntent['role']
  quantity: number
  limitPrice: number
  urgency: number
  credits: number
  stock: number
}

export type SimulationMarketDiagnostic = {
  round: number
  resource: MarketResource
  referencePrice: number
  warehouseBuyPrice: number
  warehouseSellPrice: number
  intents: SimulationMarketIntentDiagnostic[]
  buyerCount: number
  sellerCount: number
  compatiblePairs: number
  playerTrades: number
  warehouseTrades: number
  interstellarTrades: number
  interstellarOfferPrice: number | null
  interstellarCapacity: number
  outcome:
    | 'player-trade'
    | 'interstellar-trade'
    | 'warehouse-only'
    | 'no-trade'
  reason:
    | 'matched'
    | 'no-active-intents'
    | 'no-buyers'
    | 'no-sellers'
    | 'price-gap'
    | 'resource-or-credit-limit'
}

export type SimulationMarketSummary = {
  totalTransactions: number
  playerTrades: number
  warehouseTrades: number
  interstellarTrades: number
  volume: Record<MarketResource, number>
  finalPrices: Record<MarketResource, number>
  finalWarehouseStock: Record<MarketResource, number>
}

export type HeadlessSimulationResult = {
  mode: 'headless-economic-v6'
  roundsPlayed: number
  marketIncluded: boolean
  supplyDemandModel: SimulationSupplyDemandModel
  productionModel: SimulationProductionModel
  history: SimulationRoundSnapshot[]
  warnings: SimulationWarning[]
  finalStandings: SimulationParticipantSnapshot[]
  marketTransactions: SimulationMarketTransaction[]
  marketDiagnostics: SimulationMarketDiagnostic[]
  marketSummary: SimulationMarketSummary
  meteorImpacts: MeteorImpact[]
}

export type HeadlessSimulationOptions = {
  rounds?: number
  includeMarket?: boolean
  seed?: number
  initialCrystalStock?: number
  supplyDemandModel?: SimulationSupplyDemandModel
  productionModel?: SimulationProductionModel
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

type SimulationMarketState = {
  prices: Record<MarketResource, number>
  warehouseStock: Record<MarketResource, number>
}

type InternalSimulationState = {
  game: GameState
  agima: RivalColonyState
  seed: number
  supplyDemandModel: SimulationSupplyDemandModel
  productionModel: SimulationProductionModel
  market: SimulationMarketState
  marketTransactions: SimulationMarketTransaction[]
  lastRoundMarketTransactions: SimulationMarketTransaction[]
  marketDiagnostics: SimulationMarketDiagnostic[]
}

const participantIds: SimulationParticipantId[] = [
  'agima',
  'orion',
  'nova',
  'vega',
]

export function getSimulationNormalSupplyDemand(
  population: number,
  model: SimulationSupplyDemandModel = 'grouped',
): number {
  const normalizedPopulation = Math.max(
    1,
    Math.trunc(population),
  )

  return model === 'smoothed'
    ? Math.max(
        2,
        Math.ceil(normalizedPopulation / 5),
      )
    : Math.ceil(normalizedPopulation / 10) * 2
}

function getStateNormalSupplyDemand(
  state: InternalSimulationState,
  population: number,
): number {
  return getSimulationNormalSupplyDemand(
    population,
    state.supplyDemandModel,
  )
}

function getSimulationBasicProductionBonus(
  model: SimulationProductionModel,
  round: number,
): number {
  return model === 'boosted' && round % 2 === 0
    ? 1
    : 0
}

function normalizeSimulationSeed(
  seed: number | undefined,
): number {
  if (!Number.isFinite(seed)) {
    return 1
  }

  return Math.max(
    1,
    Math.abs(Math.trunc(seed ?? 1)),
  )
}

function createSeededRandom(seed: number):
  () => number {
  let state = normalizeSimulationSeed(seed) >>> 0

  return () => {
    state =
      (Math.imul(state, 1664525) + 1013904223) >>>
      0

    return state / 4294967296
  }
}

function shuffleWithSeed<T>(
  values: readonly T[],
  seed: number,
): T[] {
  const result = [...values]
  const random = createSeededRandom(seed)

  for (
    let index = result.length - 1;
    index > 0;
    index -= 1
  ) {
    const swapIndex = Math.floor(
      random() * (index + 1),
    )
    const value = result[index]
    result[index] = result[swapIndex]
    result[swapIndex] = value
  }

  return result
}

type WorkingMarketIntent = {
  participantId: SimulationParticipantId
  intent: AgentMarketIntent
  remaining: number
}

function cloneMarketValues(
  values: Record<MarketResource, number>,
): Record<MarketResource, number> {
  return { ...values }
}

function toCanonicalRival(
  colony: RivalColonyState,
): CanonicalRivalColonyState {
  return {
    ...colony,
    harvestersInConstruction:
      colony.harvestersInConstruction ?? 0,
    ownedTileIds: colony.ownedTileIds ?? [],
    crystalDiscoveryRoundByTileId:
      colony.crystalDiscoveryRoundByTileId ?? {},
    harvesterAssignments:
      colony.harvesterAssignments ?? {},
    freeHarvesterPool: colony.freeHarvesterPool ?? [],
  }
}

function getSimulationColony(
  state: InternalSimulationState,
  participantId: SimulationParticipantId,
): RivalColonyState {
  return participantId === 'agima'
    ? state.agima
    : selectRivalColonies(state.game)[participantId]
}

function updateSimulationColony(
  state: InternalSimulationState,
  participantId: SimulationParticipantId,
  update: (
    colony: RivalColonyState,
  ) => RivalColonyState,
): InternalSimulationState {
  if (participantId === 'agima') {
    const agima = update(state.agima)

    return {
      ...state,
      agima,
      game: {
        ...state.game,
        colonies: {
          ...state.game.colonies,
          agima: {
            ...state.game.colonies.agima,
            population: agima.population,
            credits: agima.credits,
            resources: cloneResources(agima.resources),
          },
        },
      },
    }
  }

  const rival = update(
    selectRivalColonies(state.game)[participantId],
  )

  return {
    ...state,
    game: {
      ...state.game,
      colonies: {
        ...state.game.colonies,
        [participantId]: rival,
      },
    },
  }
}

function createSimulationMarketIntent(
  state: InternalSimulationState,
  participantId: SimulationParticipantId,
  resource: MarketResource,
  round: number,
): AgentMarketIntent {
  const colony = getSimulationColony(
    state,
    participantId,
  )
  const plan = createAgentPlan({
    round,
    colony: {
      id: participantId,
      population: colony.population,
      credits: colony.credits,
      resources: cloneResources(colony.resources),
      harvesters: colony.harvesters,
    },
    referencePrices: cloneMarketValues(
      state.market.prices,
    ),
    legalActions: {
      harvesterBuild: {
        creditCost: HARVESTER_CREDIT_COST,
        oreCost: HARVESTER_ORE_COST,
      },
      harvesterEnergyCost: 1,
      normalSupplyDemand: getStateNormalSupplyDemand(
        state,
        colony.population,
      ),
    },
  })

  return (
    getAgentMarketIntent(plan, resource) ?? {
      resource,
      role: 'neutral',
      quantity: 0,
      limitPrice: state.market.prices[resource],
      urgency: 0,
    }
  )
}

function getMarketParticipantOrder(
  round: number,
  resource: MarketResource,
  seed: number,
): SimulationParticipantId[] {
  const resourceIndex =
    playableMarketResources.indexOf(resource)
  const seededParticipants = shuffleWithSeed(
    participantIds,
    seed +
      Math.max(1, round) * 31 +
      Math.max(0, resourceIndex) * 101,
  )
  const offset =
    (
      Math.max(1, round) -
      1 +
      Math.max(0, resourceIndex) +
      seed
    ) % participantIds.length

  return [
    ...seededParticipants.slice(offset),
    ...seededParticipants.slice(0, offset),
  ]
}

function getPlayerTradePrice(
  referencePrice: number,
  buyerLimit: number,
  sellerLimit: number,
): number {
  return Math.max(
    sellerLimit,
    Math.min(referencePrice, buyerLimit),
  )
}

function executeSimulationMarketTransaction(
  state: InternalSimulationState,
  transaction: SimulationMarketTransaction,
): InternalSimulationState {
  let nextState = state

  if (
    transaction.buyer !== 'warehouse' &&
    transaction.buyer !== 'interstellar-buyer'
  ) {
    nextState = updateSimulationColony(
      nextState,
      transaction.buyer,
      (buyer) => ({
        ...buyer,
        credits: buyer.credits - transaction.price,
        resources: {
          ...buyer.resources,
          [transaction.resource]:
            buyer.resources[transaction.resource] + 1,
        },
      }),
    )
  }

  if (
    transaction.seller !== 'warehouse' &&
    transaction.seller !== 'interstellar-buyer'
  ) {
    nextState = updateSimulationColony(
      nextState,
      transaction.seller,
      (seller) => ({
        ...seller,
        credits: seller.credits + transaction.price,
        resources: {
          ...seller.resources,
          [transaction.resource]:
            seller.resources[transaction.resource] - 1,
        },
      }),
    )
  }

  return {
    ...nextState,
    marketTransactions: [
      ...nextState.marketTransactions,
      transaction,
    ],
    lastRoundMarketTransactions: [
      ...nextState.lastRoundMarketTransactions,
      transaction,
    ],
  }
}

function createSimulationMarketIntents(
  state: InternalSimulationState,
  round: number,
  resource: MarketResource,
): WorkingMarketIntent[] {
  return participantIds.map((participantId) => {
    const intent = createSimulationMarketIntent(
      state,
      participantId,
      resource,
      round,
    )

    return {
      participantId,
      intent,
      remaining: intent.quantity,
    }
  })
}

function createWorkingMarketIntents(
  state: InternalSimulationState,
  round: number,
  resource: MarketResource,
): WorkingMarketIntent[] {
  return createSimulationMarketIntents(
    state,
    round,
    resource,
  ).filter(
    (entry) =>
      entry.intent.role !== 'neutral' &&
      entry.remaining > 0,
  )
}

function clearSimulationResourceMarket(
  state: InternalSimulationState,
  round: number,
  resource: MarketResource,
): InternalSimulationState {
  const referencePrice =
    state.market.prices[resource]
  const spread = Math.max(
    1,
    Math.round(referencePrice * 0.15),
  )
  const warehouseSellPrice =
    referencePrice + spread
  const warehouseBuyPrice = Math.max(
    1,
    referencePrice - spread,
  )
  const allIntents = createSimulationMarketIntents(
    state,
    round,
    resource,
  )
  const diagnosticIntents =
    allIntents.map((entry) => {
      const colony = getSimulationColony(
        state,
        entry.participantId,
      )

      return {
        participantId: entry.participantId,
        role: entry.intent.role,
        quantity: entry.intent.quantity,
        limitPrice: entry.intent.limitPrice,
        urgency: entry.intent.urgency,
        credits: colony.credits,
        stock: colony.resources[resource],
      }
    })
  const order = getMarketParticipantOrder(
    round,
    resource,
    state.seed,
  )
  const orderIndex = new Map(
    order.map((participantId, index) => [
      participantId,
      index,
    ]),
  )
  const intents = createWorkingMarketIntents(
    state,
    round,
    resource,
  )
  const buyers = intents
    .filter(
      (entry) => entry.intent.role === 'buyer',
    )
    .sort(
      (first, second) =>
        second.intent.limitPrice -
          first.intent.limitPrice ||
        second.intent.urgency -
          first.intent.urgency ||
        (orderIndex.get(first.participantId) ?? 0) -
          (orderIndex.get(second.participantId) ?? 0),
    )
  const sellers = intents
    .filter(
      (entry) => entry.intent.role === 'seller',
    )
    .sort(
      (first, second) =>
        first.intent.limitPrice -
          second.intent.limitPrice ||
        second.intent.urgency -
          first.intent.urgency ||
        (orderIndex.get(first.participantId) ?? 0) -
          (orderIndex.get(second.participantId) ?? 0),
    )
  const buyerCount = buyers.length
  const sellerCount = sellers.length
  const compatiblePairs = buyers.reduce(
    (total, buyer) =>
      total +
      sellers.filter(
        (seller) =>
          buyer.intent.limitPrice >=
          seller.intent.limitPrice,
      ).length,
    0,
  )
  const transactionStartIndex =
    state.marketTransactions.length
  let nextState = state

  while (buyers.length > 0 && sellers.length > 0) {
    const buyer = buyers[0]
    const seller = sellers[0]

    if (
      buyer.intent.limitPrice <
      seller.intent.limitPrice
    ) {
      break
    }

    const price = getPlayerTradePrice(
      referencePrice,
      buyer.intent.limitPrice,
      seller.intent.limitPrice,
    )
    const buyerColony = getSimulationColony(
      nextState,
      buyer.participantId,
    )
    const sellerColony = getSimulationColony(
      nextState,
      seller.participantId,
    )

    if (buyerColony.credits < price) {
      buyers.shift()
      continue
    }
    if (
      sellerColony.resources[resource] < 1
    ) {
      sellers.shift()
      continue
    }

    nextState =
      executeSimulationMarketTransaction(
        nextState,
        {
          round,
          resource,
          buyer: buyer.participantId,
          seller: seller.participantId,
          price,
          quantity: 1,
          kind: 'player',
        },
      )
    buyer.remaining -= 1
    seller.remaining -= 1

    if (buyer.remaining <= 0) {
      buyers.shift()
    }
    if (seller.remaining <= 0) {
      sellers.shift()
    }
  }

  let warehouseStock =
    nextState.market.warehouseStock[resource]
  let warehouseNetFlow = 0
  const interstellarOffer =
    resource === 'crystals'
      ? getInterstellarCrystalBuyerOffer(
          round,
          referencePrice,
          0,
        )
      : null
  let interstellarRemainingCapacity =
    interstellarOffer?.remainingCapacity ?? 0

  if (
    interstellarOffer &&
    interstellarOffer.offerPrice >= warehouseBuyPrice
  ) {
    for (const seller of sellers) {
      while (
        seller.remaining > 0 &&
        interstellarRemainingCapacity > 0 &&
        seller.intent.limitPrice <=
          interstellarOffer.offerPrice
      ) {
        const sellerColony = getSimulationColony(
          nextState,
          seller.participantId,
        )
        if (sellerColony.resources.crystals < 1) {
          break
        }

        nextState =
          executeSimulationMarketTransaction(
            nextState,
            {
              round,
              resource,
              buyer: 'interstellar-buyer',
              seller: seller.participantId,
              price: interstellarOffer.offerPrice,
              quantity: 1,
              kind: 'interstellar',
            },
          )
        seller.remaining -= 1
        interstellarRemainingCapacity -= 1
      }
    }
  }

  for (const buyer of buyers) {
    while (
      buyer.remaining > 0 &&
      warehouseStock > 0 &&
      buyer.intent.limitPrice >=
        warehouseSellPrice
    ) {
      const buyerColony = getSimulationColony(
        nextState,
        buyer.participantId,
      )
      if (
        buyerColony.credits <
        warehouseSellPrice
      ) {
        break
      }

      nextState =
        executeSimulationMarketTransaction(
          nextState,
          {
            round,
            resource,
            buyer: buyer.participantId,
            seller: 'warehouse',
            price: warehouseSellPrice,
            quantity: 1,
            kind: 'warehouse',
          },
        )
      buyer.remaining -= 1
      warehouseStock -= 1
      warehouseNetFlow -= 1
    }
  }

  for (const seller of sellers) {
    while (
      seller.remaining > 0 &&
      seller.intent.limitPrice <=
        warehouseBuyPrice
    ) {
      const sellerColony = getSimulationColony(
        nextState,
        seller.participantId,
      )
      if (
        sellerColony.resources[resource] < 1
      ) {
        break
      }

      nextState =
        executeSimulationMarketTransaction(
          nextState,
          {
            round,
            resource,
            buyer: 'warehouse',
            seller: seller.participantId,
            price: warehouseBuyPrice,
            quantity: 1,
            kind: 'warehouse',
          },
        )
      seller.remaining -= 1
      warehouseStock += 1
      warehouseNetFlow += 1
    }
  }

  const priceDifference =
    warehouseNetFlow > 0
      ? -1
      : warehouseNetFlow < 0
      ? 1
      : 0
  const maximumPrice =
    MARKET_PRICES[resource] * 2

  const resourceTransactions =
    nextState.marketTransactions.slice(
      transactionStartIndex,
    )
  const playerTrades =
    resourceTransactions.filter(
      (transaction) =>
        transaction.kind === 'player',
    ).length
  const warehouseTrades =
    resourceTransactions.filter(
      (transaction) =>
        transaction.kind === 'warehouse',
    ).length
  const interstellarTrades =
    resourceTransactions.filter(
      (transaction) =>
        transaction.kind === 'interstellar',
    ).length
  const reason =
    playerTrades > 0 || interstellarTrades > 0
      ? 'matched'
      : buyerCount === 0 &&
        sellerCount === 0
      ? 'no-active-intents'
      : buyerCount === 0
      ? 'no-buyers'
      : sellerCount === 0
      ? 'no-sellers'
      : compatiblePairs === 0
      ? 'price-gap'
      : 'resource-or-credit-limit'
  const outcome =
    playerTrades > 0
      ? 'player-trade'
      : interstellarTrades > 0
      ? 'interstellar-trade'
      : warehouseTrades > 0
      ? 'warehouse-only'
      : 'no-trade'

  return {
    ...nextState,
    market: {
      prices: {
        ...nextState.market.prices,
        [resource]: Math.max(
          1,
          Math.min(
            maximumPrice,
            referencePrice + priceDifference,
          ),
        ),
      },
      warehouseStock: {
        ...nextState.market.warehouseStock,
        [resource]: warehouseStock,
      },
    },
    marketDiagnostics: [
      ...nextState.marketDiagnostics,
      {
        round,
        resource,
        referencePrice,
        warehouseBuyPrice,
        warehouseSellPrice,
        intents: diagnosticIntents,
        buyerCount,
        sellerCount,
        compatiblePairs,
        playerTrades,
        warehouseTrades,
        interstellarTrades,
        interstellarOfferPrice:
          interstellarOffer?.offerPrice ?? null,
        interstellarCapacity:
          interstellarOffer?.capacity ?? 0,
        outcome,
        reason,
      },
    ],
  }
}

function runSimulationMarketPhase(
  state: InternalSimulationState,
  round: number,
): InternalSimulationState {
  return playableMarketResources.reduce<InternalSimulationState>(
    (marketState, resource) =>
      clearSimulationResourceMarket(
        marketState,
        round,
        resource,
      ),
    {
      ...state,
      lastRoundMarketTransactions: [],
    },
  )
}

function createSimulationMarketSummary(
  state: InternalSimulationState,
): SimulationMarketSummary {
  const volume = Object.fromEntries(
    playableMarketResources.map((resource) => [
      resource,
      state.marketTransactions.filter(
        (transaction) =>
          transaction.resource === resource,
      ).length,
    ]),
  ) as Record<MarketResource, number>
  const playerTrades =
    state.marketTransactions.filter(
      (transaction) =>
        transaction.kind === 'player',
    ).length
  const interstellarTrades =
    state.marketTransactions.filter(
      (transaction) =>
        transaction.kind === 'interstellar',
    ).length
  const warehouseTrades =
    state.marketTransactions.filter(
      (transaction) =>
        transaction.kind === 'warehouse',
    ).length

  return {
    totalTransactions:
      state.marketTransactions.length,
    playerTrades,
    warehouseTrades,
    interstellarTrades,
    volume,
    finalPrices: cloneMarketValues(
      state.market.prices,
    ),
    finalWarehouseStock: cloneMarketValues(
      state.market.warehouseStock,
    ),
  }
}

function cloneResources(resources: Resources): Resources {
  return { ...resources }
}

function getTileDistance(tile: Tile): number {
  return tile.distanceFromHq
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

export function createBalancedSimulationStartingLand(
  seed: number = 1,
): Record<
  SimulationParticipantId,
  SimulationStartingLand
> {
  const candidateTiles = tiles.filter(
    (tile) =>
      tile.id !== 'HQ' &&
      getTileDistance(tile) <= 3 &&
      (targetCrystalRatings[tile.id] ?? 0) === 0,
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

  const normalizedSeed =
    normalizeSimulationSeed(seed)
  const candidateSolutionCount = Math.min(
    12,
    solutions.length,
  )
  const selected =
    solutions[
      normalizedSeed %
        Math.max(1, candidateSolutionCount)
    ]
  if (!selected) {
    throw new Error(
      'Keine vier gleichwertigen Startfeldpaare gefunden.',
    )
  }

  const participantOrder = shuffleWithSeed(
    participantIds,
    normalizedSeed * 17,
  )

  return Object.fromEntries(
    participantOrder.map((participantId, index) => [
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
    crystalDiscoveryRoundByTileId: Object.fromEntries(
      startingLand.tileIds.map((tileId) => [tileId, 1]),
    ),
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
      ...selectRivalColonies(game).orion,
      id: 'orion',
      name: 'Agima',
      icon: '🧑‍🚀',
      population: selectLocalColony(game).population,
      credits: selectLocalColony(game).credits,
      resources: cloneResources(
        selectLocalColony(game).resources,
      ),
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
  meteorImpacts: MeteorImpact[] = [],
  supplyDemandModel: SimulationSupplyDemandModel = 'grouped',
  productionModel: SimulationProductionModel = 'current',
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
    meteorImpacts,
    {
      normalSupplyDemand: (population) =>
        getSimulationNormalSupplyDemand(
          population,
          supplyDemandModel,
        ),
      basicProductionBonus:
        getSimulationBasicProductionBonus(
          productionModel,
          round,
        ),
    },
  ).orion
}

function applySimulationMeteorImpact(
  state: InternalSimulationState,
  round: number,
): InternalSimulationState {
  if (
    !(state.game.meteorSchedule ?? []).includes(round)
  ) {
    return state
  }

  const previousImpacts =
    state.game.meteorImpacts ?? []
  const soldTileIds = [
    ...(state.agima.ownedTileIds ?? []),
    ...Object.values(selectRivalColonies(state.game)).flatMap(
      (rival) => rival.ownedTileIds ?? [],
    ),
  ]
  const impact = createMeteorImpact(
    targetPlanetMap,
    targetStartConfiguration,
    targetCrystalRatings,
    soldTileIds,
    previousImpacts,
    round,
    state.seed,
  )

  if (!impact) {
    return state
  }

  return {
    ...state,
    game: {
      ...state.game,
      meteorImpacts: [...previousImpacts, impact],
    },
  }
}

function applyAgimaLandPurchase(
  state: InternalSimulationState,
): InternalSimulationState {
  const decisionState: GameState = {
    ...state.game,
    colonies: {
      ...state.game.colonies,
      orion: {
        ...toCanonicalRival(state.agima),
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
    getStateNormalSupplyDemand(
      state,
      state.agima.population,
    ),
  )

  if (
    !decision ||
    decision.bid <= 0 ||
    decision.bid > state.agima.credits
  ) {
    return state
  }

  return {
    ...state,
    game: {
      ...state.game,
      colonies: {
        ...state.game.colonies,
        agima: {
          ...state.game.colonies.agima,
          ownedTileIds: [
            ...state.game.colonies.agima.ownedTileIds,
            decision.tileId,
          ],
          crystalDiscoveryRoundByTileId: {
            ...state.game.colonies.agima
              .crystalDiscoveryRoundByTileId,
            [decision.tileId]: state.game.round + 2,
          },
        },
      },
    },
    agima: {
      ...state.agima,
      credits:
        state.agima.credits - decision.bid,
      ownedTileIds: [
        ...(state.agima.ownedTileIds ?? []),
        decision.tileId,
      ],
      crystalDiscoveryRoundByTileId: {
        ...(state.agima.crystalDiscoveryRoundByTileId ?? {}),
        [decision.tileId]: state.game.round + 2,
      },
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
  crystalReferencePrice: number,
): SimulationParticipantSnapshot {
  const ownedTileIds = new Set(
    colony.ownedTileIds ?? [],
  )
  const ownedMapTiles = tiles.filter((tile) =>
    ownedTileIds.has(tile.id),
  )
  const base = {
    id,
    name: id === 'agima' ? 'Agima' : colony.name,
    population: colony.population,
    credits: colony.credits,
    resources: cloneResources(colony.resources),
    harvesters: colony.harvesters,
    ownedTiles: ownedTileIds.size,
    maximumOwnedTileDistance: Math.max(
      0,
      ...ownedMapTiles.map(
        (tile) => tile.distanceFromHq,
      ),
    ),
    ownsFarZoneTile: ownedMapTiles.some(
      (tile) => tile.distanceFromHq >= 5,
    ),
    ownsNaturalCrystalVein: ownedMapTiles.some(
      (tile) =>
        (targetCrystalRatings[tile.id] ?? 0) > 0,
    ),
  }

  return {
    ...base,
    wealth: calculateSimulationWealth(base),
    settlementWealth:
      colony.credits +
      colony.resources.crystals * crystalReferencePrice,
    remainingResources:
      colony.resources.food +
      colony.resources.energy +
      colony.resources.ore,
    harvesterBuildDecision:
      colony.lastHarvesterBuildDecision ?? null,
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
        state.market.prices.crystals,
      ),
      orion: createParticipantSnapshot(
        'orion',
        selectRivalColonies(state.game).orion,
        state.market.prices.crystals,
      ),
      nova: createParticipantSnapshot(
        'nova',
        selectRivalColonies(state.game).nova,
        state.market.prices.crystals,
      ),
      vega: createParticipantSnapshot(
        'vega',
        selectRivalColonies(state.game).vega,
        state.market.prices.crystals,
      ),
    },
    marketTransactions:
      state.lastRoundMarketTransactions.length,
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

function createInitialSimulationState(
  seed: number,
  initialCrystalStock: number = STARTING_CRYSTALS,
  supplyDemandModel: SimulationSupplyDemandModel = 'grouped',
  productionModel: SimulationProductionModel = 'current',
): InternalSimulationState {
  const baseGame =
    createPlayableInitialGameState(seed)
  const startingLand =
    createBalancedSimulationStartingLand(seed)
  const normalizedInitialCrystalStock =
    Number.isFinite(initialCrystalStock)
      ? Math.max(
          0,
          Math.min(
            100,
            Math.trunc(initialCrystalStock),
          ),
        )
      : 0
  const withInitialCrystals = (
    colony: RivalColonyState,
  ): RivalColonyState => ({
    ...colony,
    resources: {
      ...colony.resources,
      crystals: normalizedInitialCrystalStock,
    },
  })
  const rivals: RivalColonies = {
    orion: applyStartingLand(
      withInitialCrystals(
        selectRivalColonies(baseGame).orion,
      ),
      startingLand.orion,
    ),
    nova: applyStartingLand(
      withInitialCrystals(
        selectRivalColonies(baseGame).nova,
      ),
      startingLand.nova,
    ),
    vega: applyStartingLand(
      withInitialCrystals(
        selectRivalColonies(baseGame).vega,
      ),
      startingLand.vega,
    ),
  }
  const game: GameState = {
    ...baseGame,
    colonies: {
      ...baseGame.colonies,
      agima: {
        ...baseGame.colonies.agima,
        ownedTileIds: [...startingLand.agima.tileIds],
      },
      orion: {
        ...toCanonicalRival(rivals.orion),
        id: 'orion',
      },
      nova: {
        ...toCanonicalRival(rivals.nova),
        id: 'nova',
      },
      vega: {
        ...toCanonicalRival(rivals.vega),
        id: 'vega',
      },
    },
  }

  const market: SimulationMarketState = {
    prices: Object.fromEntries(
      playableMarketResources.map((resource) => [
        resource,
        game.market[resource].referencePrice,
      ]),
    ) as Record<MarketResource, number>,
    warehouseStock: Object.fromEntries(
      playableMarketResources.map((resource) => [
        resource,
        game.market[resource].warehouseStock,
      ]),
    ) as Record<MarketResource, number>,
  }

  return {
    game,
    agima: withInitialCrystals(
      createAgimaAgent(
        game,
        startingLand.agima,
      ),
    ),
    seed,
    supplyDemandModel,
    productionModel,
    market,
    marketTransactions: [],
    lastRoundMarketTransactions: [],
    marketDiagnostics: [],
  }
}

function advanceSimulationRound(
  state: InternalSimulationState,
  round: number,
  includeMarket: boolean,
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
    applyAutonomousRivalLandPurchases(
      gameAtRound,
      (population) =>
        getStateNormalSupplyDemand(state, population),
    )
  const withAgimaLand = applyAgimaLandPurchase({
    ...state,
    game: withRivalLand,
    agima: state.agima,
  })
  const withMarket = includeMarket
    ? runSimulationMarketPhase(
        withAgimaLand,
        round,
      )
    : {
        ...withAgimaLand,
        lastRoundMarketTransactions: [],
      }
  const nextRivals = advanceRivalColonies(
    selectRivalColonies(withMarket.game),
    round,
    null,
    withMarket.game.meteorImpacts,
    {
      normalSupplyDemand: (population) =>
        getStateNormalSupplyDemand(
          withMarket,
          population,
        ),
      basicProductionBonus:
        getSimulationBasicProductionBonus(
          withMarket.productionModel,
          round,
        ),
    },
  )
  const nextAgima = advanceAgima(
    withMarket.agima,
    round,
    withMarket.game.meteorImpacts,
    withMarket.supplyDemandModel,
    withMarket.productionModel,
  )

  return applySimulationMeteorImpact({
    ...withMarket,
    game: {
      ...withMarket.game,
      round: Math.min(
        GAME_ROUND_LIMIT,
        round + 1,
      ),
      colonies: {
        ...withMarket.game.colonies,
        agima: {
          ...withMarket.game.colonies.agima,
          population: nextAgima.population,
          credits: nextAgima.credits,
          resources: cloneResources(nextAgima.resources),
        },
        orion: {
          ...toCanonicalRival(nextRivals.orion),
          id: 'orion',
        },
        nova: {
          ...toCanonicalRival(nextRivals.nova),
          id: 'nova',
        },
        vega: {
          ...toCanonicalRival(nextRivals.vega),
          id: 'vega',
        },
      },
    },
    agima: nextAgima,
  }, round)
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
  const includeMarket =
    options.includeMarket ?? true
  const seed = normalizeSimulationSeed(
    options.seed,
  )
  const supplyDemandModel =
    options.supplyDemandModel ?? 'grouped'
  const productionModel =
    options.productionModel ?? 'current'
  let state = createInitialSimulationState(
    seed,
    options.initialCrystalStock ?? STARTING_CRYSTALS,
    supplyDemandModel,
    productionModel,
  )
  const history: SimulationRoundSnapshot[] = [
    createRoundSnapshot(0, state),
  ]
  const warnings: SimulationWarning[] = []

  for (
    let round = 1;
    round <= roundsPlayed;
    round += 1
  ) {
    state = advanceSimulationRound(
      state,
      round,
      includeMarket,
    )
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
      compareSimulationFinalScores(first, second) ||
      first.id.localeCompare(second.id),
  )

  return {
    mode: 'headless-economic-v6',
    roundsPlayed,
    marketIncluded: includeMarket,
    supplyDemandModel,
    productionModel,
    history,
    warnings,
    finalStandings,
    marketTransactions:
      state.marketTransactions,
    marketDiagnostics:
      state.marketDiagnostics,
    marketSummary:
      createSimulationMarketSummary(state),
    meteorImpacts: [...(state.game.meteorImpacts ?? [])],
  }
}

export function compareSimulationFinalScores(
  first: SimulationParticipantSnapshot,
  second: SimulationParticipantSnapshot,
): number {
  return (
    second.population - first.population ||
    second.settlementWealth - first.settlementWealth ||
    second.remainingResources - first.remainingResources ||
    second.harvesters - first.harvesters
  )
}
