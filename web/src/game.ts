import {
  calculateRivalAssignedProduction,
  
  allocateRivalHarvesterEnergy,
  planRivalHarvesterOperations,
} from './rivalHarvesterOperations'

import {
  createAgentPlan,
  type AgentHarvesterDecision,
} from './agents'
import { getInterstellarCrystalBuyerOffer } from './interstellarCrystalBuyer'
import {
  createMeteorImpact,
  createMeteorSchedule,
  getEffectiveCrystalRating,
  type MeteorImpact,
} from './meteor'
import {
  createMatchConfiguration,
  participantIds,
  type MatchConfiguration,
  type ParticipantId,
} from './match'
import {
  areTilesAdjacent,
  targetCrystalRatings,
  targetPlanetMap,
  targetStartConfiguration,
  type PlanetTile,
} from './planetMap'

export type ProductionType =
  | 'food'
  | 'energy'
  | 'ore'
  | 'crystals'

export type Resources = {
  food: number
  energy: number
  ore: number
  crystals: number
}

export type MarketResource = keyof Resources
export type MarketDirection = 'buy' | 'sell'
export type MarketCounterparty =
  | RivalId
  | 'warehouse'
  | 'interstellar-buyer'
export type MarketRole = 'neutral' | 'buyer' | 'seller'

export type GlobalEventId =
  | 'fertile-season'
  | 'clear-skies'
  | 'rich-ore-vein'
  | 'crystal-rain'
  | 'colonial-grant'
  | 'technological-breakthrough'
  | 'drought'
  | 'solar-storm'
  | 'unstable-mines'
  | 'crystal-disruption'
  | 'trade-blockade'
  | 'surveying-stop'
  | 'supply-chain-disruption'
  | 'ion-fog'
  | 'planetary-quake'

export type LocalEventId =
  | 'food-cache'
  | 'energy-cache'
  | 'ore-cache'
  | 'crystal-fragment'
  | 'credit-grant'
  | 'new-settlers'
  | 'spoiled-food'
  | 'energy-leak'
  | 'ore-theft'
  | 'credit-fraud'
  | 'harvester-breakdown'
  | 'labor-strike'
  | 'communications-outage'
  | 'land-registry-error'
  | 'wrong-spare-parts'

export type MarketOffer = {
  active: boolean
  price: number
}

export type ResourceMarketState = {
  referencePrice: number
  warehouseStock: number
  netWarehouseFlow: number
}

export type MarketState = Record<
  MarketResource,
  ResourceMarketState
>

export type RivalId = 'orion' | 'nova' | 'vega'

export type ColonyEconomyState = {
  population: number
  credits: number
  resources: Resources
  harvesters: number
}

export type ColonyState = ColonyEconomyState & {
  id: ParticipantId
  name: string
  icon: string
  harvestersInConstruction: number
  ownedTileIds: string[]
}

export type ColoniesState = Record<ParticipantId, ColonyState>

export type RivalColonyState = ColonyEconomyState & {
  id: RivalId
  name: string
  icon: string
  harvestersInConstruction?: number
  ownedTileIds?: string[]
  lastLandPurchaseRound?: number
  harvesterAssignments?: Partial<
    Record<string, ProductionType>
  >
  lastConsumedEnergyByHq?: number
  lastConsumedEnergyByHarvesters?: number
  inactiveHarvesterIds?: string[]
  lastHarvesterRetoolRound?: number
  lastRetooledHarvesterId?: string
  lastHarvesterRetoolCost?: number
  lastHarvesterBuildDecision?: AgentHarvesterDecision['reason']
}

export type RivalColonies = Record<RivalId, RivalColonyState>

export type GameState = ColonyEconomyState & {
  match: MatchConfiguration
  round: number
  ownedTileIds: string[]
  opponentTileIds: string[]
  pendingLandBid: LandBid | null
  landAuctionTie: LandAuctionTie | null
  harvestersInConstruction: number
  harvesterAssignments: HarvesterAssignments
  freeHarvesterPool: FreeHarvester[]
  initiatedMarketResources: MarketResource[]
  activeGlobalEvent: GlobalEventId | null
  activeLocalEvent: LocalEventId | null
  meteorSeed?: number
  meteorSchedule?: number[]
  meteorImpacts?: MeteorImpact[]
  interstellarCrystalPurchases?: number
  market: MarketState
  rivals: RivalColonies
}

export type LandBid = {
  tileId: string
  amount: number
  rivalBid: number
  tieMinimum?: number
  reservedCredits?: number
  tieWinner?: LandTieBidder
}

export type LandAuctionTie = {
  tileId: string
  tiedBid: number
  minimumBid: number
  playerOpeningBid: number
  orionOpeningBid: number
  initialLeader: LandTieBidder | null
}

export type LandTieBidder = 'player' | 'orion'

export type LandTieBidState = {
  playerBid: number
  orionBid: number
  leader: LandTieBidder | null
}

export type LandAuctionResult = {
  tileId: string
  playerBid: number
  rivalBid: number
  outcome: 'won' | 'lost' | 'tie'
}

export type TileOwner = 'hq' | 'player' | 'free'

export type Tile = PlanetTile & {
  owner: TileOwner
  food?: number
  energy?: number
  ore?: number
  crystals?: number
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
  globalEvent: GlobalEventId | null
  meteorImpact: MeteorImpact | null
}

export type LeaderboardEntry = {
  id: 'player' | 'orion' | 'nova' | 'vega'
  name: string
  icon: string
  population: number
  credits: number
  wealth: number
  resources: number
  harvesters: number
  isPlayer: boolean
}

export type MarketTiming = {
  introductionSeconds: number
  declarationSeconds: number
  auctionSeconds: number
}

export const LAND_MINIMUM_BID = 25
export const HARVESTER_CREDIT_COST = 30
export const HARVESTER_ORE_COST = 3
export const GLOBAL_EVENT_CHANCE = 0.4
export const LOCAL_EVENT_CHANCE = 0.5
export const GAME_ROUND_LIMIT = 20
export const EVENT_SCALE_INTERVAL = 6

export const globalEventIds: GlobalEventId[] = [
  'fertile-season',
  'clear-skies',
  'rich-ore-vein',
  'crystal-rain',
  'colonial-grant',
  'technological-breakthrough',
  'drought',
  'solar-storm',
  'unstable-mines',
  'crystal-disruption',
  'trade-blockade',
  'surveying-stop',
  'supply-chain-disruption',
  'ion-fog',
  'planetary-quake',
]

export const localEventIds: LocalEventId[] = [
  'food-cache',
  'energy-cache',
  'ore-cache',
  'crystal-fragment',
  'credit-grant',
  'new-settlers',
  'spoiled-food',
  'energy-leak',
  'ore-theft',
  'credit-fraud',
  'harvester-breakdown',
  'labor-strike',
  'communications-outage',
  'land-registry-error',
  'wrong-spare-parts',
]

const globalProductionModifiers: Partial<Record<
  GlobalEventId,
  {
    production: ProductionType
    difference: number
  }
>> = {
  'fertile-season': {
    production: 'food',
    difference: 1,
  },
  drought: {
    production: 'food',
    difference: -1,
  },
  'clear-skies': {
    production: 'energy',
    difference: 1,
  },
  'solar-storm': {
    production: 'energy',
    difference: -1,
  },
  'rich-ore-vein': {
    production: 'ore',
    difference: 1,
  },
  'unstable-mines': {
    production: 'ore',
    difference: -1,
  },
}

const globalEventBaseAmounts: Partial<
  Record<GlobalEventId, number>
> = {
  'fertile-season': 1,
  'clear-skies': 1,
  'rich-ore-vein': 1,
  'crystal-rain': 1,
  'colonial-grant': 15,
  'technological-breakthrough': 10,
  drought: 1,
  'solar-storm': 1,
  'unstable-mines': 1,
  'crystal-disruption': 1,
  'planetary-quake': 1,
}

const localEventBaseAmounts: Partial<
  Record<LocalEventId, number>
> = {
  'food-cache': 3,
  'energy-cache': 3,
  'ore-cache': 2,
  'crystal-fragment': 1,
  'credit-grant': 15,
  'new-settlers': 1,
  'spoiled-food': 2,
  'energy-leak': 2,
  'ore-theft': 2,
  'credit-fraud': 10,
  'harvester-breakdown': 1,
}

export function getEventScale(round: number): number {
  return (
    2 **
    Math.floor(
      Math.max(0, round - 1) / EVENT_SCALE_INTERVAL,
    )
  )
}

export function isGameFinished(roundPlayed: number): boolean {
  return roundPlayed >= GAME_ROUND_LIMIT
}

export function getRoundsUntilSupplyShip(round: number): number {
  return Math.max(0, GAME_ROUND_LIMIT - round + 1)
}

export function getGlobalEventAmount(
  event: GlobalEventId,
  round: number,
): number | null {
  const baseAmount = globalEventBaseAmounts[event]

  return baseAmount === undefined
    ? null
    : baseAmount * getEventScale(round)
}

export function getLocalEventAmount(
  event: LocalEventId,
  round: number,
): number | null {
  const baseAmount = localEventBaseAmounts[event]

  return baseAmount === undefined
    ? null
    : baseAmount * getEventScale(round)
}

function selectEvent<T>(
  eventIds: T[],
  chance: number,
  round: number,
  chanceRoll: number,
  selectionRoll: number,
): T | null {
  if (round < 2 || chanceRoll >= chance) {
    return null
  }

  const selectedIndex = Math.min(
    eventIds.length - 1,
    Math.floor(Math.max(0, selectionRoll) * eventIds.length),
  )

  return eventIds[selectedIndex]
}

export function selectGlobalEvent(
  round: number,
  chanceRoll: number = Math.random(),
  selectionRoll: number = Math.random(),
): GlobalEventId | null {
  return selectEvent(
    globalEventIds,
    GLOBAL_EVENT_CHANCE,
    round,
    chanceRoll,
    selectionRoll,
  )
}

export function selectLocalEvent(
  round: number,
  chanceRoll: number = Math.random(),
  selectionRoll: number = Math.random(),
): LocalEventId | null {
  return selectEvent(
    localEventIds,
    LOCAL_EVENT_CHANCE,
    round,
    chanceRoll,
    selectionRoll,
  )
}

export function activateGlobalEvent(
  currentState: GameState,
  event: GlobalEventId | null,
): GameState {
  const amount =
    event === null
      ? null
      : getGlobalEventAmount(event, currentState.round)
  const creditsDifference =
    event === 'colonial-grant' ? amount ?? 0 : 0
  const crystalDifference =
    event === 'crystal-rain'
      ? amount ?? 0
      : event === 'crystal-disruption'
        ? -(amount ?? 0)
        : 0

  const stateWithEvent = {
    ...currentState,
    activeGlobalEvent: event,
  }

  return participantIds.reduce(
    (state, participantId) =>
      updateColony(state, participantId, (colony) => ({
        ...colony,
        credits: colony.credits + creditsDifference,
        resources: {
          ...colony.resources,
          crystals: Math.max(
            0,
            colony.resources.crystals + crystalDifference,
          ),
        },
      })),
    stateWithEvent,
  )
}

export function applyLocalEvent(
  currentState: GameState,
  event: LocalEventId,
): GameState {
  const amount =
    getLocalEventAmount(event, currentState.round) ?? 0
  const stateWithEvent: GameState = {
    ...currentState,
    activeLocalEvent: event,
  }

  return updateColony(stateWithEvent, 'agima', (colony) => {
    const nextColony: ColonyState = {
      ...colony,
      resources: { ...colony.resources },
    }

    switch (event) {
      case 'food-cache':
        nextColony.resources.food += amount
        break
      case 'energy-cache':
        nextColony.resources.energy += amount
        break
      case 'ore-cache':
        nextColony.resources.ore += amount
        break
      case 'crystal-fragment':
        nextColony.resources.crystals += amount
        break
      case 'credit-grant':
        nextColony.credits += amount
        break
      case 'new-settlers':
        nextColony.population += amount
        break
      case 'spoiled-food':
        nextColony.resources.food = Math.max(
          0,
          nextColony.resources.food - amount,
        )
        break
      case 'energy-leak':
        nextColony.resources.energy = Math.max(
          0,
          nextColony.resources.energy - amount,
        )
        break
      case 'ore-theft':
        nextColony.resources.ore = Math.max(
          0,
          nextColony.resources.ore - amount,
        )
        break
      case 'credit-fraud':
        nextColony.credits = Math.max(
          0,
          nextColony.credits - amount,
        )
        break
      case 'harvester-breakdown':
      case 'labor-strike':
      case 'communications-outage':
      case 'land-registry-error':
      case 'wrong-spare-parts':
        break
    }

    return nextColony
  })
}

export function getGlobalProductionModifier(
  event: GlobalEventId | null,
  production: ProductionType,
  round: number = 1,
): number {
  if (!event) {
    return 0
  }

  const modifier = globalProductionModifiers[event]

  return modifier?.production === production
    ? modifier.difference * getEventScale(round)
    : 0
}

export function getHarvesterCreditCost(
  currentState: GameState,
): number {
  if (
    currentState.activeGlobalEvent !==
    'technological-breakthrough'
  ) {
    return HARVESTER_CREDIT_COST
  }

  const discount =
    getGlobalEventAmount(
      'technological-breakthrough',
      currentState.round,
    ) ?? 0

  return Math.max(0, HARVESTER_CREDIT_COST - discount)
}

export function isMarketInitiationBlocked(
  currentState: GameState,
): boolean {
  return (
    currentState.activeGlobalEvent === 'trade-blockade' ||
    currentState.activeLocalEvent === 'communications-outage'
  )
}

export function isLandBidBlocked(
  currentState: GameState,
): boolean {
  return (
    currentState.activeGlobalEvent === 'surveying-stop' ||
    currentState.activeLocalEvent === 'land-registry-error'
  )
}

export function isHarvesterBuildBlocked(
  currentState: GameState,
): boolean {
  return (
    currentState.activeGlobalEvent ===
      'supply-chain-disruption' ||
    currentState.activeLocalEvent === 'labor-strike'
  )
}

export function isHarvesterRetoolingBlocked(
  currentState: GameState,
): boolean {
  return (
    currentState.activeGlobalEvent === 'ion-fog' ||
    currentState.activeLocalEvent === 'wrong-spare-parts'
  )
}

export function isHarvesterRelocationBlocked(
  currentState: GameState,
): boolean {
  return currentState.activeGlobalEvent === 'ion-fog'
}

export function assignPlayerHarvester(
  currentState: GameState,
  tileId: string,
  production: ProductionType,
): GameState {
  const currentHarvesters =
    currentState.harvesterAssignments
  const currentPool = currentState.freeHarvesterPool

  if (currentPool.length <= 0 || currentHarvesters[tileId]) {
    return currentState
  }

  const unusedHarvesterIndex = currentPool.findIndex(
    (harvester) => harvester.previousProduction === undefined,
  )
  const selectedHarvesterIndex =
    unusedHarvesterIndex >= 0 ? unusedHarvesterIndex : 0
  const selectedHarvester = currentPool[selectedHarvesterIndex]

  if (
    !selectedHarvester ||
    (selectedHarvester.previousProduction !== undefined &&
      isHarvesterRelocationBlocked(currentState))
  ) {
    return currentState
  }

  return {
    ...currentState,
    freeHarvesterPool: currentPool.filter(
      (_, index) => index !== selectedHarvesterIndex,
    ),
    harvesterAssignments: {
      ...currentHarvesters,
      [tileId]:
        selectedHarvester.previousProduction === undefined
          ? {
              production,
              isNew: true,
            }
          : {
              production:
                selectedHarvester.previousProduction,
              pendingProduction: production,
              retoolingReason: 'relocation',
              isNew: false,
            },
    },
  }
}

export function changePlayerHarvesterProduction(
  currentState: GameState,
  tileId: string,
  production: ProductionType,
): GameState {
  if (isHarvesterRetoolingBlocked(currentState)) {
    return currentState
  }

  const currentHarvesters =
    currentState.harvesterAssignments
  const currentAssignment = currentHarvesters[tileId]

  if (!currentAssignment) {
    return currentState
  }

  if (currentAssignment.isNew) {
    return {
      ...currentState,
      harvesterAssignments: {
        ...currentHarvesters,
        [tileId]: {
          production,
          isNew: true,
        },
      },
    }
  }

  if (currentAssignment.retoolingReason === 'relocation') {
    return {
      ...currentState,
      harvesterAssignments: {
        ...currentHarvesters,
        [tileId]: {
          ...currentAssignment,
          pendingProduction: production,
        },
      },
    }
  }

  if (production === currentAssignment.production) {
    return {
      ...currentState,
      harvesterAssignments: {
        ...currentHarvesters,
        [tileId]: {
          production: currentAssignment.production,
          isNew: false,
        },
      },
    }
  }

  return {
    ...currentState,
    harvesterAssignments: {
      ...currentHarvesters,
      [tileId]: {
        ...currentAssignment,
        pendingProduction: production,
        retoolingReason: 'production-change',
      },
    },
  }
}

export function removePlayerHarvester(
  currentState: GameState,
  tileId: string,
): GameState {
  const currentAssignment =
    currentState.harvesterAssignments[tileId]

  if (
    !currentAssignment ||
    (!currentAssignment.isNew &&
      isHarvesterRelocationBlocked(currentState))
  ) {
    return currentState
  }

  const updatedHarvesters = {
    ...currentState.harvesterAssignments,
  }
  delete updatedHarvesters[tileId]

  return {
    ...currentState,
    harvesterAssignments: updatedHarvesters,
    freeHarvesterPool: [
      ...currentState.freeHarvesterPool,
      currentAssignment.isNew
        ? {}
        : {
            previousProduction: currentAssignment.production,
          },
    ],
  }
}

export const MARKET_PRICES: Record<MarketResource, number> = {
  food: 8,
  energy: 8,
  ore: 15,
  crystals: 40,
}

export const playableMarketResources: MarketResource[] = [
  'food',
  'energy',
  'ore',
  'crystals',
]

const marketResourceOrder: Record<MarketResource, number> = {
  food: 0,
  energy: 1,
  ore: 2,
  crystals: 3,
}

export function getOrionMarketRole(
  roundPlayed: number,
  resource: MarketResource,
  playerRole: MarketRole,
): MarketRole {
  if (playerRole === 'neutral') {
    return 'neutral'
  }

  const orionSitsOut =
    (roundPlayed + marketResourceOrder[resource]) % 4 === 0

  if (orionSitsOut) {
    return 'neutral'
  }

  return playerRole === 'seller' ? 'buyer' : 'seller'
}

export function getMarketTiming(
  roundPlayed: number,
): MarketTiming {
  if (roundPlayed <= 1) {
    return {
      introductionSeconds: 5,
      declarationSeconds: 5,
      auctionSeconds: 30,
    }
  }

  if (roundPlayed === 2) {
    return {
      introductionSeconds: 4,
      declarationSeconds: 5,
      auctionSeconds: 25,
    }
  }

  return {
    introductionSeconds: 3,
    declarationSeconds: 5,
    auctionSeconds: 20,
  }
}

function getResourceTotal(resources: Resources) {
  return resources.food + resources.energy + resources.ore
}

export function selectColonies(
  currentState: GameState,
): ColoniesState {
  return {
    agima: {
      id: 'agima',
      name: 'Kolonie Agima',
      icon: '🧑‍🚀',
      population: currentState.population,
      credits: currentState.credits,
      resources: currentState.resources,
      harvesters: currentState.harvesters,
      harvestersInConstruction:
        currentState.harvestersInConstruction,
      ownedTileIds: currentState.ownedTileIds,
    },
    orion: {
      ...currentState.rivals.orion,
      harvestersInConstruction:
        currentState.rivals.orion.harvestersInConstruction ?? 0,
      ownedTileIds:
        currentState.rivals.orion.ownedTileIds ?? [],
    },
    nova: {
      ...currentState.rivals.nova,
      harvestersInConstruction:
        currentState.rivals.nova.harvestersInConstruction ?? 0,
      ownedTileIds:
        currentState.rivals.nova.ownedTileIds ?? [],
    },
    vega: {
      ...currentState.rivals.vega,
      harvestersInConstruction:
        currentState.rivals.vega.harvestersInConstruction ?? 0,
      ownedTileIds:
        currentState.rivals.vega.ownedTileIds ?? [],
    },
  }
}

export function selectOpponentTileIds(
  currentState: GameState,
) {
  const colonies = selectColonies(currentState)

  return (['orion', 'nova', 'vega'] as const).flatMap(
    (participantId) => colonies[participantId].ownedTileIds,
  )
}

export function updateColony(
  currentState: GameState,
  participantId: ParticipantId,
  update: (colony: ColonyState) => ColonyState,
): GameState {
  const currentColony = selectColonies(currentState)[participantId]
  const nextColony = update(currentColony)

  if (participantId === 'agima') {
    return {
      ...currentState,
      population: nextColony.population,
      credits: nextColony.credits,
      resources: nextColony.resources,
      harvesters: nextColony.harvesters,
      harvestersInConstruction:
        nextColony.harvestersInConstruction,
      ownedTileIds: nextColony.ownedTileIds,
    }
  }

  const currentRival = currentState.rivals[participantId]
  const nextRivals: RivalColonies = {
    ...currentState.rivals,
    [participantId]: {
      ...currentRival,
      population: nextColony.population,
      credits: nextColony.credits,
      resources: nextColony.resources,
      harvesters: nextColony.harvesters,
      harvestersInConstruction:
        nextColony.harvestersInConstruction,
      ownedTileIds: nextColony.ownedTileIds,
    },
  }

  return {
    ...currentState,
    rivals: nextRivals,
    opponentTileIds: Object.values(nextRivals).flatMap(
      (rival) => rival.ownedTileIds ?? [],
    ),
  }
}

export function addColonyOwnedTile(
  currentState: GameState,
  participantId: ParticipantId,
  tileId: string,
): GameState {
  const colony = selectColonies(currentState)[participantId]

  if (colony.ownedTileIds.includes(tileId)) {
    return currentState
  }

  return updateColony(
    currentState,
    participantId,
    (currentColony) => ({
      ...currentColony,
      ownedTileIds: [...currentColony.ownedTileIds, tileId],
    }),
  )
}

export function createLeaderboardEntries(
  currentState: GameState,
  playerHarvesterCount: number = currentState.harvesters,
): LeaderboardEntry[] {
  const crystalReferencePrice =
    currentState.market.crystals.referencePrice
  const colonies = selectColonies(currentState)
  const playerColony = {
    ...colonies.agima,
    harvesters: playerHarvesterCount,
  }

  const entries: LeaderboardEntry[] = [
    {
      id: 'player',
      name: playerColony.name,
      icon: playerColony.icon,
      population: playerColony.population,
      credits: playerColony.credits,
      wealth:
        playerColony.credits +
        playerColony.resources.crystals *
          crystalReferencePrice,
      resources: getResourceTotal(playerColony.resources),
      harvesters: playerColony.harvesters,
      isPlayer: true,
    },
    ...(['orion', 'nova', 'vega'] as const).map(
      (participantId) => ({
        id: participantId,
        name: colonies[participantId].name,
        icon: colonies[participantId].icon,
        population: colonies[participantId].population,
        credits: colonies[participantId].credits,
        wealth:
          colonies[participantId].credits +
          colonies[participantId].resources.crystals *
            crystalReferencePrice,
        resources: getResourceTotal(
          colonies[participantId].resources,
        ),
        harvesters: colonies[participantId].harvesters,
        isPlayer: false,
      }),
    ),
  ]

  return entries.sort(
    (first, second) =>
      second.population - first.population ||
      second.wealth - first.wealth ||
      second.resources - first.resources ||
      second.harvesters - first.harvesters ||
      first.name.localeCompare(second.name),
  )
}

function getRivalProduction(
  rival: RivalColonyState,
  roundPlayed: number,
  globalEvent: GlobalEventId | null = null,
  meteorImpacts: MeteorImpact[] = [],
): Record<ProductionType, number> {
  if (
    rival.harvesterAssignments &&
    Object.keys(rival.harvesterAssignments).length > 0
  ) {
    return calculateRivalAssignedProduction(
      rival.harvesterAssignments,
      tiles,
      (production) =>
        getGlobalProductionModifier(
          globalEvent,
          production,
          roundPlayed,
        ),
      meteorImpacts,
    )
  }


  const production = {
    food: 0,
    energy: 0,
    ore: 0,
    crystals: 0,
  }
  const productionCycle = createAgentPlan({
    round: roundPlayed,
    colony: rival,
    referencePrices: MARKET_PRICES,
    legalActions: {
      harvesterBuild: {
        creditCost: HARVESTER_CREDIT_COST,
        oreCost: HARVESTER_ORE_COST,
      },
    },
  }).productionPriorities
    .map(({ resource }) => resource)
    .filter(
      (resource): resource is Exclude<
        ProductionType,
        'crystals'
      > => resource !== 'crystals',
    )
  const quakeFailures =
    globalEvent === 'planetary-quake'
      ? getGlobalEventAmount(globalEvent, roundPlayed) ?? 0
      : 0
  const producingHarvesters = Math.max(
    0,
    rival.harvesters - quakeFailures,
  )

  for (let index = 0; index < producingHarvesters; index += 1) {
    const productionType =
      productionCycle[
        (roundPlayed - 1 + index) % productionCycle.length
      ]

    production[productionType] += Math.max(
      0,
      3 +
        getGlobalProductionModifier(
          globalEvent,
          productionType,
          roundPlayed,
        ),
    )
  }

  return production
}

export function advanceRivalColonies(
  rivals: RivalColonies,
  roundPlayed: number,
  globalEvent: GlobalEventId | null = null,
  meteorImpacts: MeteorImpact[] = [],
): RivalColonies {
  return Object.fromEntries(
    Object.entries(rivals).map(([id, rival]) => {
      const rivalHarvesterPlan =
        planRivalHarvesterOperations(
          rival,
          tiles,
          roundPlayed,
          MARKET_PRICES,
          {
            creditCost: HARVESTER_CREDIT_COST,
            oreCost: HARVESTER_ORE_COST,
          },
          meteorImpacts,
        )
      const operatingRival = {
        ...rival,
        credits: Math.max(
          0,
          rival.credits -
            rivalHarvesterPlan.retoolingCost,
        ),
        harvesterAssignments:
          rivalHarvesterPlan.assignments,
        ...(rivalHarvesterPlan.retooledTileId
          ? {
              lastHarvesterRetoolRound:
                roundPlayed,
              lastRetooledHarvesterId:
                rivalHarvesterPlan.retooledTileId,
              lastHarvesterRetoolCost:
                rivalHarvesterPlan.retoolingCost,
            }
          : {
              lastRetooledHarvesterId: undefined,
              lastHarvesterRetoolCost: 0,
            }),
      }
      const populationGroups = Math.ceil(
        operatingRival.population / 10,
      )
      const plannedFood = populationGroups * 2
      const plannedEnergy = populationGroups * 2
      const consumedFood = Math.min(
        operatingRival.resources.food,
        plannedFood,
      )
      const consumedEnergyByHq = Math.min(
        operatingRival.resources.energy,
        plannedEnergy,
      )
      const remainingEnergyAfterHq = Math.max(
        0,
        operatingRival.resources.energy -
          consumedEnergyByHq,
      )
      const rivalEnergyAllocation =
        allocateRivalHarvesterEnergy(
          operatingRival.harvesterAssignments ?? {},
          remainingEnergyAfterHq,
        )
      const productionRival = {
        ...operatingRival,
        harvesterAssignments:
          rivalEnergyAllocation.poweredAssignments,
      }
      const consumedEnergyByHarvesters =
        rivalEnergyAllocation.consumedEnergy
      const production = getRivalProduction(
        productionRival,
        roundPlayed,
        globalEvent,
        meteorImpacts,
      )
      const hasNormalSupply =
        consumedFood === plannedFood &&
        consumedEnergyByHq === plannedEnergy
      const hasNoSupply =
        consumedFood === 0 || consumedEnergyByHq === 0
      const populationChange = hasNormalSupply
        ? 1
        : hasNoSupply
        ? -1
        : 0
      const completedHarvesters =
        operatingRival.harvestersInConstruction ?? 0

      const nextColony: RivalColonyState = {
        ...operatingRival,
        population: Math.max(
          1,
          operatingRival.population + populationChange,
        ),
        harvesters:
          operatingRival.harvesters + completedHarvesters,
        resources: {
          food:
            operatingRival.resources.food -
            consumedFood +
            production.food,
          energy:
            operatingRival.resources.energy -
            consumedEnergyByHq -
            consumedEnergyByHarvesters +
            production.energy,
          ore:
            operatingRival.resources.ore +
            production.ore,
          crystals:
            operatingRival.resources.crystals,
        },
        lastConsumedEnergyByHq:
          consumedEnergyByHq,
        lastConsumedEnergyByHarvesters:
          consumedEnergyByHarvesters,
        inactiveHarvesterIds:
          rivalEnergyAllocation.inactiveHarvesterIds,
        lastHarvesterBuildDecision: undefined,
      }

      if (completedHarvesters > 0) {
        nextColony.harvestersInConstruction = 0
      }

      if (
        roundPlayed < 2 ||
        globalEvent === 'supply-chain-disruption'
      ) {
        return [id, nextColony]
      }

      const harvesterCreditCost =
        globalEvent === 'technological-breakthrough'
          ? Math.max(
              0,
              HARVESTER_CREDIT_COST -
                (getGlobalEventAmount(
                  globalEvent,
                  roundPlayed,
                ) ?? 0),
            )
          : HARVESTER_CREDIT_COST

      const plan = createAgentPlan({
        round: roundPlayed + 1,
        colony: nextColony,
        referencePrices: MARKET_PRICES,
        legalActions: {
          harvesterBuild: {
            creditCost: harvesterCreditCost,
            oreCost: HARVESTER_ORE_COST,
          },
          harvesterEnergyCost: 1,
        },
      })

      if (!plan.harvester.build) {
        return [
          id,
          {
            ...nextColony,
            lastHarvesterBuildDecision:
              plan.harvester.reason,
          },
        ]
      }

      return [
        id,
        {
          ...nextColony,
          credits:
            nextColony.credits - harvesterCreditCost,
          resources: {
            ...nextColony.resources,
            ore:
              nextColony.resources.ore -
              HARVESTER_ORE_COST,
          },
          harvestersInConstruction: 1,
          lastHarvesterBuildDecision:
            plan.harvester.reason,
        },
      ]
    }),
  ) as RivalColonies
}

export function moveMarketOffer(
  role: Exclude<MarketRole, 'neutral'>,
  offer: MarketOffer,
  difference: number,
  minimumPrice: number,
  maximumPrice: number,
  opposingPrice: number,
  buyerCreditLimit: number = maximumPrice,
): MarketOffer {
  const movesIntoMarket =
    role === 'seller' ? difference < 0 : difference > 0

  if (!offer.active) {
    if (
      role === 'buyer' &&
      movesIntoMarket &&
      buyerCreditLimit < minimumPrice
    ) {
      return offer
    }

    return movesIntoMarket
      ? { ...offer, active: true }
      : offer
  }

  const movesBehindWarehouse =
    role === 'seller'
      ? offer.price >= maximumPrice && difference > 0
      : offer.price <= minimumPrice && difference < 0

  if (movesBehindWarehouse) {
    return {
      active: false,
      price:
        role === 'seller' ? maximumPrice : minimumPrice,
    }
  }

  const effectiveMaximumPrice =
    role === 'buyer'
      ? Math.min(
          maximumPrice,
          Math.max(minimumPrice, buyerCreditLimit),
        )
      : maximumPrice
  const nextPrice = Math.min(
    effectiveMaximumPrice,
    Math.max(minimumPrice, offer.price + difference),
  )

  return {
    active: true,
    price:
      role === 'seller'
        ? Math.max(nextPrice, opposingPrice)
        : Math.min(nextPrice, opposingPrice),
  }
}

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
  crystals: {
    label: 'Kristalle',
    icon: '💎',
  },
}

const firstRingRatings: Array<
  Pick<Tile, 'food' | 'energy' | 'ore'>
> = [
  { food: 4, energy: 2, ore: 4 },
  { food: 3, energy: 4, ore: 2 },
  { food: 2, energy: 5, ore: 1 },
  { food: 1, energy: 3, ore: 5 },
  { food: 5, energy: 2, ore: 2 },
  { food: 2, energy: 3, ore: 4 },
]

export const browserMatchConfiguration =
  createMatchConfiguration()

function getStartTileIds(participantId: ParticipantId) {
  return [
    ...browserMatchConfiguration.participants[participantId]
      .startTileIds,
  ]
}

export const PLAYER_START_TILE_IDS = getStartTileIds('agima')

const rivalStartTileIds = {
  orion: getStartTileIds('orion'),
  nova: getStartTileIds('nova'),
  vega: getStartTileIds('vega'),
}

const startRatingsByTileId = new Map(
  Object.values(browserMatchConfiguration.participants).flatMap(
    ({ startTileIds }) => [
      [startTileIds[0], firstRingRatings[0]],
      [startTileIds[1], firstRingRatings[1]],
    ],
  ),
)

function getGeneratedRating(
  tileId: string,
  resourceOffset: number,
) {
  const value = [...tileId].reduce(
    (total, character, index) =>
      total +
      character.charCodeAt(0) *
        (index + 3 + resourceOffset * 5),
    resourceOffset * 17,
  )

  return (value % 5) + 1
}

function createMapTiles(): Tile[] {
  return targetPlanetMap.tiles.map((planetTile) => {
    const preservedRatings =
      startRatingsByTileId.get(planetTile.id)

    return {
      ...planetTile,
      owner:
        planetTile.id === targetPlanetMap.hqTileId
          ? 'hq'
          : PLAYER_START_TILE_IDS.includes(planetTile.id)
            ? 'player'
            : 'free',
      ...(planetTile.id === targetPlanetMap.hqTileId
        ? {}
        : {
            food:
              preservedRatings?.food ??
              getGeneratedRating(planetTile.id, 0),
            energy:
              preservedRatings?.energy ??
              getGeneratedRating(planetTile.id, 1),
            ore:
              preservedRatings?.ore ??
              getGeneratedRating(planetTile.id, 2),
            crystals: targetCrystalRatings[planetTile.id] ?? 0,
          }),
    }
  })
}

export const tiles: Tile[] = createMapTiles()

export function getHexDistanceFromHq(tile: Tile) {
  return tile.distanceFromHq
}

export function createInitialGameState(): GameState {
  return {
    match: createMatchConfiguration({
      seed: browserMatchConfiguration.seed,
    }),
    round: 1,
    population: 10,
    credits: 100,
    harvesters: 0,
    resources: {
      food: 10,
      energy: 10,
      ore: 5,
      crystals: 0,
    },
    ownedTileIds: [...PLAYER_START_TILE_IDS],
    opponentTileIds: [],
    pendingLandBid: null,
    landAuctionTie: null,
    harvestersInConstruction: 0,
    harvesterAssignments: {},
    freeHarvesterPool: [],
    initiatedMarketResources: [],
    activeGlobalEvent: null,
    activeLocalEvent: null,
    meteorSeed: 1,
    meteorSchedule: createMeteorSchedule(1),
    meteorImpacts: [],
    interstellarCrystalPurchases: 0,
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
    rivals: {
      orion: {
        id: 'orion',
        name: 'Konsortium Orion',
        icon: '🤖',
        population: 10,
        credits: 96,
        resources: {
          food: 8,
          energy: 8,
          ore: 6,
          crystals: 0,
        },
        harvesters: 2,
      },
      nova: {
        id: 'nova',
        name: 'Kolonie Nova',
        icon: '👩‍🚀',
        population: 9,
        credits: 112,
        resources: {
          food: 9,
          energy: 8,
          ore: 7,
          crystals: 0,
        },
        harvesters: 2,
      },
      vega: {
        id: 'vega',
        name: 'Kolonie Vega',
        icon: '🧑‍🚀',
        population: 11,
        credits: 84,
        resources: {
          food: 6,
          energy: 7,
          ore: 7,
          crystals: 0,
        },
        harvesters: 3,
      },
    },
  }
}

export const STARTING_CREDITS = 150
export const STARTING_HARVESTERS = 2
export const STARTING_CRYSTALS = 1

export function createPlayableInitialGameState(
  meteorSeed: number = 1,
): GameState {
  const state = createInitialGameState()
  const sharedResources = {
    ...state.resources,
    crystals: STARTING_CRYSTALS,
  }

  return {
    ...state,
    meteorSeed,
    meteorSchedule: createMeteorSchedule(meteorSeed),
    meteorImpacts: [],
    interstellarCrystalPurchases: 0,
    credits: STARTING_CREDITS,
    harvesters: STARTING_HARVESTERS,
    harvesterAssignments: {},
    freeHarvesterPool: Array.from(
      { length: STARTING_HARVESTERS },
      () => ({}),
    ),
    resources: { ...sharedResources },
    opponentTileIds: Object.values(rivalStartTileIds).flat(),
    rivals: Object.fromEntries(
      Object.entries(state.rivals).map(
        ([id, rival]) => [
          id,
          {
            ...rival,
            population: state.population,
            credits: STARTING_CREDITS,
            resources: { ...sharedResources },
            harvesters: STARTING_HARVESTERS,
            ownedTileIds: [
              ...rivalStartTileIds[id as RivalId],
            ],
          },
        ],
      ),
    ) as RivalColonies,
  }
}


export function orderHarvesterBuild(
  currentState: GameState,
): GameState {
  const creditCost = getHarvesterCreditCost(currentState)
  const colony = selectColonies(currentState).agima

  if (
    isHarvesterBuildBlocked(currentState) ||
    colony.credits < creditCost ||
    colony.resources.ore < HARVESTER_ORE_COST
  ) {
    return currentState
  }

  return updateColony(currentState, 'agima', (currentColony) => ({
    ...currentColony,
    credits: currentColony.credits - creditCost,
    resources: {
      ...currentColony.resources,
      ore: currentColony.resources.ore - HARVESTER_ORE_COST,
    },
    harvestersInConstruction:
      currentColony.harvestersInConstruction + 1,
  }))
}

export function executeColonyTrade(
  currentState: GameState,
  buyerId: ParticipantId,
  sellerId: ParticipantId,
  resource: MarketResource,
  price: number,
): GameState {
  if (
    buyerId === sellerId ||
    !Number.isInteger(price) ||
    price <= 0
  ) {
    return currentState
  }

  const colonies = selectColonies(currentState)
  const buyer = colonies[buyerId]
  const seller = colonies[sellerId]

  if (
    buyer.credits < price ||
    seller.resources[resource] < 1
  ) {
    return currentState
  }

  const stateAfterBuyer = updateColony(
    currentState,
    buyerId,
    (colony) => ({
      ...colony,
      credits: colony.credits - price,
      resources: {
        ...colony.resources,
        [resource]: colony.resources[resource] + 1,
      },
    }),
  )

  return updateColony(
    stateAfterBuyer,
    sellerId,
    (colony) => ({
      ...colony,
      credits: colony.credits + price,
      resources: {
        ...colony.resources,
        [resource]: colony.resources[resource] - 1,
      },
    }),
  )
}

function executeWarehouseTrade(
  currentState: GameState,
  resource: MarketResource,
  direction: MarketDirection,
  price: number,
): GameState {
  if (!Number.isInteger(price) || price <= 0) {
    return currentState
  }

  if (direction === 'buy') {
    if (
      currentState.credits < price ||
      currentState.market[resource].warehouseStock <= 0
    ) {
      return currentState
    }

    const stateAfterTrade = updateColony(
      currentState,
      'agima',
      (colony) => ({
        ...colony,
        credits: colony.credits - price,
        resources: {
          ...colony.resources,
          [resource]: colony.resources[resource] + 1,
        },
      }),
    )

    return {
      ...stateAfterTrade,
      market: {
        ...stateAfterTrade.market,
        [resource]: {
          ...stateAfterTrade.market[resource],
          warehouseStock:
            stateAfterTrade.market[resource].warehouseStock - 1,
          netWarehouseFlow:
            stateAfterTrade.market[resource].netWarehouseFlow - 1,
        },
      },
    }
  }

  if (currentState.resources[resource] <= 0) {
    return currentState
  }

  const stateAfterTrade = updateColony(
    currentState,
    'agima',
    (colony) => ({
      ...colony,
      credits: colony.credits + price,
      resources: {
        ...colony.resources,
        [resource]: colony.resources[resource] - 1,
      },
    }),
  )

  return {
    ...stateAfterTrade,
    market: {
      ...stateAfterTrade.market,
      [resource]: {
        ...stateAfterTrade.market[resource],
        warehouseStock:
          stateAfterTrade.market[resource].warehouseStock + 1,
        netWarehouseFlow:
          stateAfterTrade.market[resource].netWarehouseFlow + 1,
      },
    },
  }
}

export function executeMarketTrade(
  currentState: GameState,
  resource: MarketResource,
  direction: MarketDirection,
  price: number,
  counterparty: MarketCounterparty = 'orion',
): GameState {
  if (counterparty === 'interstellar-buyer') {
    const buyerOffer = getInterstellarCrystalBuyerOffer(
      currentState.round,
      currentState.market.crystals.referencePrice,
      currentState.interstellarCrystalPurchases ?? 0,
    )

    if (
      resource !== 'crystals' ||
      direction !== 'sell' ||
      !Number.isInteger(price) ||
      price <= 0 ||
      price > buyerOffer.offerPrice ||
      !buyerOffer.isAvailable ||
      currentState.resources.crystals < 1
    ) {
      return currentState
    }

    const stateAfterTrade = updateColony(
      currentState,
      'agima',
      (colony) => ({
        ...colony,
        credits: colony.credits + price,
        resources: {
          ...colony.resources,
          crystals: colony.resources.crystals - 1,
        },
      }),
    )

    return {
      ...stateAfterTrade,
      interstellarCrystalPurchases:
        (currentState.interstellarCrystalPurchases ?? 0) + 1,
    }
  }

  if (counterparty === 'warehouse') {
    return executeWarehouseTrade(
      currentState,
      resource,
      direction,
      price,
    )
  }

  return direction === 'buy'
    ? executeColonyTrade(
        currentState,
        'agima',
        counterparty,
        resource,
        price,
      )
    : executeColonyTrade(
        currentState,
        counterparty,
        'agima',
        resource,
        price,
      )
}


export function initiateResourceMarket(
  currentState: GameState,
  resource: MarketResource,
): GameState {
  if (
    isMarketInitiationBlocked(currentState) ||
    currentState.initiatedMarketResources.includes(resource)
  ) {
    return currentState
  }

  return {
    ...currentState,
    initiatedMarketResources: [
      ...currentState.initiatedMarketResources,
      resource,
    ],
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

export function completeRoundAfterMarket(
  currentState: GameState,
  finalMarketResource: MarketResource,
  harvesters: HarvesterAssignments,
  supplyPlan: SupplyPlan,
) {
  const stateAfterMarket = completeResourceMarket(
    currentState,
    finalMarketResource,
  )

  return runRound(stateAfterMarket, harvesters, supplyPlan)
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
  const colony = selectColonies(currentState).agima
  const tie = currentState.landAuctionTie
  const minimumBid =
    tie?.tileId === tileId
      ? tie.minimumBid
      : LAND_MINIMUM_BID

  if (
    isLandBidBlocked(currentState) ||
    !tile ||
    tile.owner !== 'free' ||
    colony.ownedTileIds.includes(tileId) ||
    currentState.opponentTileIds.includes(tileId) ||
    !colony.ownedTileIds.some((ownedTileId) =>
      areTilesAdjacent(
        targetPlanetMap,
        ownedTileId,
        tileId,
      ),
    ) ||
    currentState.pendingLandBid !== null ||
    (tie !== null && tie.tileId !== tileId) ||
    !Number.isInteger(amount) ||
    amount < minimumBid ||
    colony.credits < amount
  ) {
    return currentState
  }

  const stateAfterReservation = updateColony(
    currentState,
    'agima',
    (currentColony) => ({
      ...currentColony,
      credits: currentColony.credits - amount,
    }),
  )

  return {
    ...stateAfterReservation,
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

  const stateAfterRefund = updateColony(
    currentState,
    'agima',
    (colony) => ({
      ...colony,
      credits:
        colony.credits +
        (bid.reservedCredits ?? bid.amount),
    }),
  )

  return {
    ...stateAfterRefund,
    pendingLandBid: null,
    landAuctionTie: bid.tieMinimum
      ? {
          tileId: bid.tileId,
          tiedBid: bid.tieMinimum - 1,
          minimumBid: bid.tieMinimum,
          playerOpeningBid: bid.amount,
          orionOpeningBid: bid.rivalBid,
          initialLeader:
            bid.amount > bid.rivalBid
              ? 'player'
              : bid.amount < bid.rivalBid
                ? 'orion'
                : null,
        }
      : null,
  }
}

export function beginLandTieBreak(
  currentState: GameState,
): GameState {
  const bid = currentState.pendingLandBid

  if (!bid || bid.tieWinner) {
    return currentState
  }

  const startingBid = Math.max(
    bid.amount,
    bid.rivalBid,
  )
  const initialLeader: LandTieBidder | null =
    bid.amount > bid.rivalBid
      ? 'player'
      : bid.amount < bid.rivalBid
        ? 'orion'
        : null

  const stateAfterRefund = updateColony(
    currentState,
    'agima',
    (colony) => ({
      ...colony,
      credits:
        colony.credits +
        (bid.reservedCredits ?? bid.amount),
    }),
  )

  return {
    ...stateAfterRefund,
    pendingLandBid: null,
    landAuctionTie: {
      tileId: bid.tileId,
      tiedBid: startingBid,
      minimumBid: startingBid + 1,
      playerOpeningBid: bid.amount,
      orionOpeningBid: bid.rivalBid,
      initialLeader,
    },
  }
}

export function raiseLandTieBid(
  currentBids: LandTieBidState,
  bidder: LandTieBidder,
  creditLimit: number,
): LandTieBidState {
  const ownBid =
    bidder === 'player'
      ? currentBids.playerBid
      : currentBids.orionBid
  const opposingBid =
    bidder === 'player'
      ? currentBids.orionBid
      : currentBids.playerBid
  const nextBid = Math.max(
    ownBid + 1,
    opposingBid + 1,
  )

  if (nextBid > creditLimit) {
    return currentBids
  }

  return {
    ...currentBids,
    playerBid:
      bidder === 'player' ? nextBid : currentBids.playerBid,
    orionBid:
      bidder === 'orion' ? nextBid : currentBids.orionBid,
    leader:
      nextBid > opposingBid
        ? bidder
        : currentBids.leader ?? bidder,
  }
}

export function lowerLandTieBid(
  currentBids: LandTieBidState,
  bidder: LandTieBidder,
  minimumBid: number,
): LandTieBidState {
  const ownBid =
    bidder === 'player'
      ? currentBids.playerBid
      : currentBids.orionBid

  if (ownBid < minimumBid) {
    return currentBids
  }
  const opposingBid =
    bidder === 'player'
      ? currentBids.orionBid
      : currentBids.playerBid
  const opposingBidder: LandTieBidder =
    bidder === 'player' ? 'orion' : 'player'

  if (ownBid === minimumBid) {
    if (
      currentBids.leader === bidder &&
      opposingBid >= minimumBid
    ) {
      return {
        ...currentBids,
        leader: opposingBidder,
      }
    }

    return currentBids
  }

  const nextBid = ownBid - 1
  const leader =
    currentBids.leader === bidder && nextBid <= opposingBid
      ? opposingBidder
      : currentBids.leader

  return {
    ...currentBids,
    playerBid:
      bidder === 'player' ? nextBid : currentBids.playerBid,
    orionBid:
      bidder === 'orion' ? nextBid : currentBids.orionBid,
    leader,
  }
}

export function resolveLandTieBreak(
  currentState: GameState,
  bids: LandTieBidState,
): GameState {
  const tie = currentState.landAuctionTie

  if (!tie) {
    return currentState
  }

  if (bids.leader === null) {
    return {
      ...currentState,
      landAuctionTie: null,
    }
  }

  const playerMinimumWinningBid =
    tie.initialLeader === 'player'
      ? tie.tiedBid
      : tie.minimumBid
  const orionMinimumWinningBid =
    tie.initialLeader === 'orion'
      ? tie.tiedBid
      : tie.minimumBid

  if (
    bids.leader === 'player' &&
    (bids.playerBid < bids.orionBid ||
      bids.playerBid < playerMinimumWinningBid ||
      currentState.credits < bids.playerBid)
  ) {
    return currentState
  }

  if (
    bids.leader === 'orion' &&
    (bids.orionBid < bids.playerBid ||
      bids.orionBid < orionMinimumWinningBid)
  ) {
    return currentState
  }

  const playerWon = bids.leader === 'player'
  const stateAfterPayment = playerWon
    ? updateColony(currentState, 'agima', (colony) => ({
        ...colony,
        credits: colony.credits - bids.playerBid,
      }))
    : currentState

  return {
    ...stateAfterPayment,
    pendingLandBid: {
      tileId: tie.tileId,
      amount: bids.playerBid,
      rivalBid: bids.orionBid,
      reservedCredits: playerWon ? bids.playerBid : 0,
      tieWinner: bids.leader,
    },
    landAuctionTie: null,
  }
}

function getRating(
  tile: Tile,
  production: ProductionType,
  meteorImpacts: MeteorImpact[] = [],
) {
  if (production === 'crystals') {
    return getEffectiveCrystalRating(
      tile.id,
      targetCrystalRatings,
      meteorImpacts,
    )
  }

  return tile[production] ?? 0
}

function getDistanceFromHq(tile: Tile) {
  return getHexDistanceFromHq(tile)
}

const deactivationPriority: Record<ProductionType, number> = {
  crystals: 0,
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
                  currentState.meteorImpacts,
                ) / 2,
              )
            : 0
          : getRating(
              tile,
              assignment.production,
              currentState.meteorImpacts,
            ),
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

  const energyInactiveTaskIds = deactivationOrder
    .slice(0, amountToDeactivate)
    .map((task) => task.id)
  const energyInactiveTaskSet = new Set(energyInactiveTaskIds)
  const globalFailures =
    currentState.activeGlobalEvent === 'planetary-quake'
      ? getGlobalEventAmount(
          currentState.activeGlobalEvent,
          currentState.round,
        ) ?? 0
      : 0
  const localFailures =
    currentState.activeLocalEvent === 'harvester-breakdown'
      ? getLocalEventAmount(
          currentState.activeLocalEvent,
          currentState.round,
        ) ?? 0
      : 0
  const forcedInactiveTaskIds = harvesterTasks
    .filter((task) => !energyInactiveTaskSet.has(task.id))
    .sort((first, second) => first.randomOrder - second.randomOrder)
    .slice(0, globalFailures + localFailures)
    .map((task) => task.id)
  const inactiveTaskIds = [
    ...energyInactiveTaskIds,
    ...forcedInactiveTaskIds,
  ]

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
    crystals: 0,
  }

  for (const task of activeProductionTasks) {
    produced[task.production] += Math.max(
      0,
      task.rating +
        getGlobalProductionModifier(
          currentState.activeGlobalEvent,
          task.production,
          currentState.round,
        ),
    )
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
          landBid.tieWinner === 'player'
            ? 'won'
            : landBid.tieWinner === 'orion'
              ? 'lost'
              : 'tie',
      }
    : null

  const playerWonLand = landAuction?.outcome === 'won'
  const rivalWonLand = landAuction?.outcome === 'lost'
  const tiedLandAuction = landAuction?.outcome === 'tie'
  const advancedRivals = advanceRivalColonies(
    currentState.rivals,
    currentState.round,
    currentState.activeGlobalEvent,
    currentState.meteorImpacts,
  )
  const rivalsAfterLandAuction = rivalWonLand
    ? {
        ...advancedRivals,
        orion: {
          ...advancedRivals.orion,
          credits: Math.max(
            0,
            advancedRivals.orion.credits - landBid!.rivalBid,
          ),
          ownedTileIds: [
            ...(advancedRivals.orion.ownedTileIds ?? []),
            landBid!.tileId,
          ],
          lastLandPurchaseRound: currentState.round,
        },
      }
    : advancedRivals
  const nextOwnedTileIds = playerWonLand
    ? [...currentState.ownedTileIds, landBid!.tileId]
    : currentState.ownedTileIds
  const nextOpponentTileIds = rivalWonLand
    ? [...currentState.opponentTileIds, landBid!.tileId]
    : currentState.opponentTileIds
  const previousMeteorImpacts =
    currentState.meteorImpacts ?? []
  const meteorImpact = (
    currentState.meteorSchedule ?? []
  ).includes(currentState.round)
    ? createMeteorImpact(
        targetPlanetMap,
        targetStartConfiguration,
        targetCrystalRatings,
        [...nextOwnedTileIds, ...nextOpponentTileIds],
        previousMeteorImpacts,
        currentState.round,
        currentState.meteorSeed ?? 1,
      )
    : null

  const nextState: GameState = {
    match: currentState.match,
    round: Math.min(
      GAME_ROUND_LIMIT,
      currentState.round + 1,
    ),
    population: Math.max(
      1,
      currentState.population + populationChange,
    ),
    credits:
      currentState.credits +
      (landBid && !playerWonLand
        ? (landBid.reservedCredits ?? landBid.amount)
        : 0),
    harvesters:
      currentState.harvesters +
      currentState.harvestersInConstruction,
    harvesterAssignments: nextHarvesters,
    freeHarvesterPool: [
      ...currentState.freeHarvesterPool,
      ...Array.from(
        { length: currentState.harvestersInConstruction },
        () => ({}),
      ),
    ],
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
      crystals:
        currentState.resources.crystals +
        produced.crystals,
    },
    ownedTileIds: nextOwnedTileIds,
    opponentTileIds: nextOpponentTileIds,
    pendingLandBid: null,
    landAuctionTie: tiedLandAuction
      ? {
          tileId: landBid!.tileId,
          tiedBid: Math.max(
            landBid!.amount,
            landBid!.rivalBid,
          ),
          minimumBid:
            Math.max(
              landBid!.amount,
              landBid!.rivalBid,
            ) + 1,
          playerOpeningBid: landBid!.amount,
          orionOpeningBid: landBid!.rivalBid,
          initialLeader:
            landBid!.amount > landBid!.rivalBid
              ? 'player'
              : landBid!.amount < landBid!.rivalBid
                ? 'orion'
                : null,
        }
      : null,
    harvestersInConstruction: 0,
    initiatedMarketResources: [],
    activeGlobalEvent: null,
    activeLocalEvent: null,
    meteorSeed: currentState.meteorSeed,
    meteorSchedule: currentState.meteorSchedule,
    meteorImpacts: meteorImpact
      ? [...previousMeteorImpacts, meteorImpact]
      : previousMeteorImpacts,
    interstellarCrystalPurchases: 0,
    market: currentState.market,
    rivals: rivalsAfterLandAuction,
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
      globalEvent: currentState.activeGlobalEvent,
      meteorImpact,
    },
  }
}
