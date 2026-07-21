export type ProductionType = 'food' | 'energy' | 'ore'

export type Resources = {
  food: number
  energy: number
  ore: number
  crystals: number
}

export type MarketResource = keyof Resources
export type MarketDirection = 'buy' | 'sell'
export type MarketCounterparty = 'orion' | 'warehouse'

export type ResourceMarketState = {
  referencePrice: number
  warehouseStock: number
  netWarehouseFlow: number
}

export type MarketState = Record<
  MarketResource,
  ResourceMarketState
>

export type GameState = {
  round: number
  population: number
  credits: number
  resources: Resources
  ownedTileIds: string[]
  opponentTileIds: string[]
  pendingLandBid: LandBid | null
  landAuctionTie: LandAuctionTie | null
  harvestersInConstruction: number
  market: MarketState
}

export type LandBid = {
  tileId: string
  amount: number
  rivalBid: number
  tieMinimum?: number
}

export type LandAuctionTie = {
  tileId: string
  tiedBid: number
  minimumBid: number
}

export type LandAuctionResult = {
  tileId: string
  playerBid: number
  rivalBid: number
  outcome: 'won' | 'lost' | 'tie'
}

export type TileOwner = 'hq' | 'player' | 'free'

export type Tile = {
  id: string
  x: number
  y: number
  owner: TileOwner
  food?: number
  energy?: number
  ore?: number
}

export type HarvesterAssignment = {
  production: ProductionType
  pendingProduction?: ProductionType
  retoolingReason?: 'production-change' | 'relocation'
  isNew: boolean
}

export type HarvesterAssignments = Partial<
  Record<string, HarvesterAssignment>
>

export type FreeHarvester = {
  previousProduction?: ProductionType
}

export type SupplyPlan = {
  foodLevel: number
  energyLevel: number
}

export type SupplyPreview = {
  plannedFood: number
  plannedEnergy: number
  consumedFood: number
  consumedEnergyByHq: number
  remainingFood: number
  remainingEnergyBeforeHarvesters: number
  populationChange: number
  hasShortage: boolean
}

export type RoundReport = {
  roundPlayed: number
  produced: Record<ProductionType, number>
  consumedFood: number
  consumedEnergyByHq: number
  consumedEnergyByHarvesters: number
  populationChange: number
  inactiveHarvesterIds: string[]
  completedRetoolingIds: string[]
  pausedRetoolingIds: string[]
  landAuction: LandAuctionResult | null
  completedHarvesters: number
}

export const LAND_MINIMUM_BID = 25
export const HARVESTER_CREDIT_COST = 30
export const HARVESTER_ORE_COST = 3

export const MARKET_PRICES: Record<MarketResource, number> = {
  food: 8,
  energy: 8,
  ore: 15,
  crystals: 40,
}

export const playableMarketResources: MarketResource[] = [
  'food',
  'energy',
]

export const marketResourceTypes: Record<
  MarketResource,
  { label: string; auctionLabel: string; icon: string }
> = {
  food: {
    label: 'Nahrung',
    auctionLabel: 'Nahrungsauktion',
    icon: '🌾',
  },
  energy: {
    label: 'Energie',
    auctionLabel: 'Energieauktion',
    icon: '⚡',
  },
  ore: {
    label: 'Erz',
    auctionLabel: 'Erzauktion',
    icon: '⛏',
  },
  crystals: {
    label: 'Kristalle',
    auctionLabel: 'Kristallauktion',
    icon: '💎',
  },
}

export const MARKET_WAREHOUSE_SPREADS: Record<
  MarketResource,
  number
> = {
  food: 3,
  energy: 3,
  ore: 5,
  crystals: 10,
}

const MARKET_PRICE_LIMITS: Record<
  MarketResource,
  { minimum: number; maximum: number }
> = {
  food: { minimum: 3, maximum: 17 },
  energy: { minimum: 3, maximum: 17 },
  ore: { minimum: 5, maximum: 30 },
  crystals: { minimum: 15, maximum: 80 },
}

export const productionTypes: Record<
  ProductionType,
  { label: string; icon: string }
> = {
  food: {
    label: 'Nahrung',
    icon: '🌾',
  },
  energy: {
    label: 'Energie',
    icon: '⚡',
  },
  ore: {
    label: 'Erz',
    icon: '⛏',
  },
}

export const tiles: Tile[] = [
  { id: 'HQ', x: 350, y: 250, owner: 'hq' },

  {
    id: 'A',
    x: 350,
    y: 106,
    owner: 'player',
    food: 4,
    energy: 2,
    ore: 4,
  },
  {
    id: 'B',
    x: 475,
    y: 178,
    owner: 'player',
    food: 3,
    energy: 4,
    ore: 2,
  },
  {
    id: 'C',
    x: 475,
    y: 322,
    owner: 'free',
    food: 2,
    energy: 5,
    ore: 1,
  },
  {
    id: 'D',
    x: 350,
    y: 394,
    owner: 'free',
    food: 1,
    energy: 3,
    ore: 5,
  },
  {
    id: 'E',
    x: 225,
    y: 322,
    owner: 'free',
    food: 5,
    energy: 2,
    ore: 2,
  },
  {
    id: 'F',
    x: 225,
    y: 178,
    owner: 'free',
    food: 2,
    energy: 3,
    ore: 4,
  },
]

export function createInitialGameState(): GameState {
  return {
    round: 1,
    population: 10,
    credits: 100,
    resources: {
      food: 10,
      energy: 10,
      ore: 5,
      crystals: 0,
    },
    ownedTileIds: ['A', 'B'],
    opponentTileIds: [],
    pendingLandBid: null,
    landAuctionTie: null,
    harvestersInConstruction: 0,
    market: {
      food: {
        referencePrice: MARKET_PRICES.food,
        warehouseStock: 20,
        netWarehouseFlow: 0,
      },
      energy: {
        referencePrice: MARKET_PRICES.energy,
        warehouseStock: 20,
        netWarehouseFlow: 0,
      },
      ore: {
        referencePrice: MARKET_PRICES.ore,
        warehouseStock: 20,
        netWarehouseFlow: 0,
      },
      crystals: {
        referencePrice: MARKET_PRICES.crystals,
        warehouseStock: 10,
        netWarehouseFlow: 0,
      },
    },
  }
}

export function orderHarvesterBuild(
  currentState: GameState,
): GameState {
  if (
    currentState.credits < HARVESTER_CREDIT_COST ||
    currentState.resources.ore < HARVESTER_ORE_COST
  ) {
    return currentState
  }

  return {
    ...currentState,
    credits: currentState.credits - HARVESTER_CREDIT_COST,
    resources: {
      ...currentState.resources,
      ore: currentState.resources.ore - HARVESTER_ORE_COST,
    },
    harvestersInConstruction:
      currentState.harvestersInConstruction + 1,
  }
}

export function executeMarketTrade(
  currentState: GameState,
  resource: MarketResource,
  direction: MarketDirection,
  price: number,
  counterparty: MarketCounterparty = 'orion',
): GameState {
  if (!Number.isInteger(price) || price <= 0) {
    return currentState
  }

  if (direction === 'buy') {
    if (
      currentState.credits < price ||
      (counterparty === 'warehouse' &&
        currentState.market[resource].warehouseStock <= 0)
    ) {
      return currentState
    }

    return {
      ...currentState,
      credits: currentState.credits - price,
      resources: {
        ...currentState.resources,
        [resource]: currentState.resources[resource] + 1,
      },
      market:
        counterparty === 'warehouse'
          ? {
              ...currentState.market,
              [resource]: {
                ...currentState.market[resource],
                warehouseStock:
                  currentState.market[resource].warehouseStock - 1,
                netWarehouseFlow:
                  currentState.market[resource].netWarehouseFlow - 1,
              },
            }
          : currentState.market,
    }
  }

  if (currentState.resources[resource] <= 0) {
    return currentState
  }

  return {
    ...currentState,
    credits: currentState.credits + price,
    resources: {
      ...currentState.resources,
      [resource]: currentState.resources[resource] - 1,
    },
    market:
      counterparty === 'warehouse'
        ? {
            ...currentState.market,
            [resource]: {
              ...currentState.market[resource],
              warehouseStock:
                currentState.market[resource].warehouseStock + 1,
              netWarehouseFlow:
                currentState.market[resource].netWarehouseFlow + 1,
            },
          }
        : currentState.market,
  }
}

export function getWarehousePrices(
  resource: MarketResource,
  referencePrice: number,
) {
  const spread = MARKET_WAREHOUSE_SPREADS[resource]

  return {
    buyPrice: Math.max(1, referencePrice - spread),
    sellPrice: referencePrice + spread,
  }
}

export function getNextMarketResource(
  currentResource: MarketResource,
): MarketResource | null {
  const currentIndex =
    playableMarketResources.indexOf(currentResource)

  return playableMarketResources[currentIndex + 1] ?? null
}

export function completeResourceMarket(
  currentState: GameState,
  resource: MarketResource,
): GameState {
  const resourceMarket = currentState.market[resource]
  const flow = resourceMarket.netWarehouseFlow
  const priceChange = Math.min(
    3,
    Math.ceil(Math.abs(flow) / 3),
  )
  const direction = flow > 0 ? -1 : flow < 0 ? 1 : 0
  const limits = MARKET_PRICE_LIMITS[resource]
  const nextReferencePrice = Math.min(
    limits.maximum,
    Math.max(
      limits.minimum,
      resourceMarket.referencePrice + direction * priceChange,
    ),
  )

  return {
    ...currentState,
    market: {
      ...currentState.market,
      [resource]: {
        ...resourceMarket,
        referencePrice: nextReferencePrice,
        netWarehouseFlow: 0,
      },
    },
  }
}

function createRivalBid(tile: Tile, minimumBid: number) {
  const highestRating = Math.max(
    tile.food ?? 0,
    tile.energy ?? 0,
    tile.ore ?? 0,
  )
  const lowerBound = Math.max(
    minimumBid - 1,
    20 + highestRating * 2,
  )

  return lowerBound + Math.floor(Math.random() * 11)
}

export function placeLandBid(
  currentState: GameState,
  tileId: string,
  amount: number,
  rivalBidOverride?: number,
): GameState {
  const tile = tiles.find((candidate) => candidate.id === tileId)
  const tie = currentState.landAuctionTie
  const minimumBid =
    tie?.tileId === tileId
      ? tie.minimumBid
      : LAND_MINIMUM_BID

  if (
    !tile ||
    tile.owner !== 'free' ||
    currentState.ownedTileIds.includes(tileId) ||
    currentState.opponentTileIds.includes(tileId) ||
    currentState.pendingLandBid !== null ||
    (tie !== null && tie.tileId !== tileId) ||
    !Number.isInteger(amount) ||
    amount < minimumBid ||
    currentState.credits < amount
  ) {
    return currentState
  }

  return {
    ...currentState,
    credits: currentState.credits - amount,
    pendingLandBid: {
      tileId,
      amount,
      rivalBid:
        rivalBidOverride ?? createRivalBid(tile, minimumBid),
      tieMinimum: tie?.minimumBid,
    },
    landAuctionTie: null,
  }
}

export function cancelLandBid(
  currentState: GameState,
): GameState {
  const bid = currentState.pendingLandBid

  if (bid === null) {
    return currentState
  }

  return {
    ...currentState,
    credits: currentState.credits + bid.amount,
    pendingLandBid: null,
    landAuctionTie: bid.tieMinimum
      ? {
          tileId: bid.tileId,
          tiedBid: bid.tieMinimum - 1,
          minimumBid: bid.tieMinimum,
        }
      : null,
  }
}

export function beginLandTieBreak(
  currentState: GameState,
): GameState {
  const bid = currentState.pendingLandBid

  if (!bid || bid.amount !== bid.rivalBid) {
    return currentState
  }

  return {
    ...currentState,
    credits: currentState.credits + bid.amount,
    pendingLandBid: null,
    landAuctionTie: {
      tileId: bid.tileId,
      tiedBid: bid.amount,
      minimumBid: bid.amount + 1,
    },
  }
}

function getRating(tile: Tile, production: ProductionType) {
  return tile[production] ?? 0
}

function getDistanceFromHq(tile: Tile) {
  const hq = tiles.find((candidate) => candidate.owner === 'hq')

  if (!hq) {
    return 0
  }

  return Math.hypot(tile.x - hq.x, tile.y - hq.y)
}

const deactivationPriority: Record<ProductionType, number> = {
  ore: 1,
  energy: 2,
  food: 3,
}

export function calculateSupplyPreview(
  currentState: GameState,
  supplyPlan: SupplyPlan,
): SupplyPreview {
  const populationGroups = Math.ceil(
    currentState.population / 10,
  )

  const plannedFood =
    populationGroups * supplyPlan.foodLevel

  const plannedEnergy =
    populationGroups * supplyPlan.energyLevel

  const consumedFood = Math.min(
    currentState.resources.food,
    plannedFood,
  )

  const consumedEnergyByHq = Math.min(
    currentState.resources.energy,
    plannedEnergy,
  )

  const actualFoodLevel = Math.floor(
    consumedFood / populationGroups,
  )

  const actualEnergyLevel = Math.floor(
    consumedEnergyByHq / populationGroups,
  )

  const effectiveSupplyLevel = Math.min(
    actualFoodLevel,
    actualEnergyLevel,
  )

  let populationChange = 0

  if (effectiveSupplyLevel >= 3) {
    populationChange = 2
  } else if (effectiveSupplyLevel >= 2) {
    populationChange = 1
  } else if (effectiveSupplyLevel === 0) {
    populationChange = -1
  }

  return {
    plannedFood,
    plannedEnergy,
    consumedFood,
    consumedEnergyByHq,
    remainingFood: currentState.resources.food - consumedFood,
    remainingEnergyBeforeHarvesters:
      currentState.resources.energy - consumedEnergyByHq,
    populationChange,
    hasShortage:
      consumedFood < plannedFood ||
      consumedEnergyByHq < plannedEnergy,
  }
}

export function runRound(
  currentState: GameState,
  harvesters: HarvesterAssignments,
  supplyPlan: SupplyPlan,
): {
  nextState: GameState
  nextHarvesters: HarvesterAssignments
  report: RoundReport
} {
  const supplyPreview = calculateSupplyPreview(
    currentState,
    supplyPlan,
  )

  const {
    consumedFood,
    consumedEnergyByHq,
    populationChange,
  } = supplyPreview

  const energyAfterHq =
    currentState.resources.energy - consumedEnergyByHq

  const harvesterTasks: Array<{
    id: string
    kind: 'production' | 'retooling'
    tile?: Tile
    production: ProductionType
    retoolingReason?: HarvesterAssignment['retoolingReason']
    rating: number
    distance: number
    randomOrder: number
  }> = []

  for (const [tileId, assignment] of Object.entries(
    harvesters,
  ) as Array<[string, HarvesterAssignment]>) {
    const tile = tiles.find((candidate) => candidate.id === tileId)

    if (tile) {
      const isRetooling =
        assignment.pendingProduction !== undefined

      harvesterTasks.push({
        id: tile.id,
        kind: isRetooling ? 'retooling' : 'production',
        tile,
        production:
          assignment.pendingProduction ?? assignment.production,
        retoolingReason: assignment.retoolingReason,
        rating: isRetooling
          ? assignment.retoolingReason === 'production-change'
            ? Math.ceil(
                getRating(
                  tile,
                  assignment.pendingProduction!,
                ) / 2,
              )
            : 0
          : getRating(tile, assignment.production),
        distance: getDistanceFromHq(tile),
        randomOrder: Math.random(),
      })
    }
  }

  const availableHarvesterEnergy = Math.max(0, energyAfterHq)

  const amountToDeactivate = Math.max(
    0,
    harvesterTasks.length - availableHarvesterEnergy,
  )

  const deactivationOrder = [...harvesterTasks].sort(
    (first, second) => {
      const ratingDifference = first.rating - second.rating

      if (ratingDifference !== 0) {
        return ratingDifference
      }

      const resourceDifference =
        deactivationPriority[first.production] -
        deactivationPriority[second.production]

      if (resourceDifference !== 0) {
        return resourceDifference
      }

      const distanceDifference = second.distance - first.distance

      if (distanceDifference !== 0) {
        return distanceDifference
      }

      return first.randomOrder - second.randomOrder
    },
  )

  const inactiveTaskIds = deactivationOrder
    .slice(0, amountToDeactivate)
    .map((task) => task.id)

  const inactiveTaskSet = new Set(inactiveTaskIds)

  const activeTasks = harvesterTasks.filter(
    (task) => !inactiveTaskSet.has(task.id),
  )

  const activeProductionTasks = activeTasks.filter(
    (task) =>
      task.tile &&
      (task.kind === 'production' ||
        task.retoolingReason === 'production-change'),
  )

  const completedRetoolingIds = activeTasks
    .filter((task) => task.kind === 'retooling')
    .map((task) => task.id)

  const completedRetoolingSet = new Set(completedRetoolingIds)

  const pausedRetoolingIds = harvesterTasks
    .filter(
      (task) =>
        task.kind === 'retooling' && inactiveTaskSet.has(task.id),
    )
    .map((task) => task.id)

  const produced: Record<ProductionType, number> = {
    food: 0,
    energy: 0,
    ore: 0,
  }

  for (const task of activeProductionTasks) {
    produced[task.production] += task.rating
  }

  const consumedEnergyByHarvesters = activeTasks.length

  const nextHarvesters: HarvesterAssignments = {}

  for (const [tileId, assignment] of Object.entries(
    harvesters,
  ) as Array<[string, HarvesterAssignment]>) {
    if (
      assignment.pendingProduction &&
      completedRetoolingSet.has(tileId)
    ) {
      nextHarvesters[tileId] = {
        production: assignment.pendingProduction,
        isNew: false,
      }
    } else {
      nextHarvesters[tileId] = {
        ...assignment,
        isNew: false,
      }
    }
  }

  const inactiveHarvesterIds = harvesterTasks
    .filter(
      (task) =>
        task.kind === 'production' && inactiveTaskSet.has(task.id),
    )
    .map((task) => task.id)

  const landBid = currentState.pendingLandBid
  const landAuction: LandAuctionResult | null = landBid
    ? {
        tileId: landBid.tileId,
        playerBid: landBid.amount,
        rivalBid: landBid.rivalBid,
        outcome:
          landBid.amount > landBid.rivalBid
            ? 'won'
            : landBid.amount < landBid.rivalBid
              ? 'lost'
              : 'tie',
      }
    : null

  const playerWonLand = landAuction?.outcome === 'won'
  const rivalWonLand = landAuction?.outcome === 'lost'
  const tiedLandAuction = landAuction?.outcome === 'tie'

  const nextState: GameState = {
    round: currentState.round + 1,
    population: Math.max(
      1,
      currentState.population + populationChange,
    ),
    credits:
      currentState.credits +
      (landBid && !playerWonLand ? landBid.amount : 0),
    resources: {
      food:
        currentState.resources.food -
        consumedFood +
        produced.food,
      energy:
        currentState.resources.energy -
        consumedEnergyByHq -
        consumedEnergyByHarvesters +
        produced.energy,
      ore: currentState.resources.ore + produced.ore,
      crystals: currentState.resources.crystals,
    },
    ownedTileIds: playerWonLand
      ? [
          ...currentState.ownedTileIds,
          landBid!.tileId,
        ]
      : currentState.ownedTileIds,
    opponentTileIds: rivalWonLand
      ? [...currentState.opponentTileIds, landBid!.tileId]
      : currentState.opponentTileIds,
    pendingLandBid: null,
    landAuctionTie: tiedLandAuction
      ? {
          tileId: landBid!.tileId,
          tiedBid: landBid!.amount,
          minimumBid: landBid!.amount + 1,
        }
      : null,
    harvestersInConstruction: 0,
    market: currentState.market,
  }

  return {
    nextState,
    nextHarvesters,
    report: {
      roundPlayed: currentState.round,
      produced,
      consumedFood,
      consumedEnergyByHq,
      consumedEnergyByHarvesters,
      populationChange,
      inactiveHarvesterIds,
      completedRetoolingIds,
      pausedRetoolingIds,
      landAuction,
      completedHarvesters:
        currentState.harvestersInConstruction,
    },
  }
}
