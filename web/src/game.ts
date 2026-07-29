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
  | ParticipantId
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

export type ResourceMarketPhase =
  | 'announcement'
  | 'declaration'
  | 'auction'
  | 'finished'

export type ActiveResourceMarket = {
  resource: MarketResource
  roundPlayed: number
  initiatorId: ParticipantId
  phase: ResourceMarketPhase
  roles: Partial<Record<ParticipantId, MarketRole>>
  offers: Partial<Record<ParticipantId, MarketOffer>>
}

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
  crystalDiscoveryRoundByTileId: Record<string, number>
  harvesterAssignments:
    | HarvesterAssignments
    | Partial<Record<string, ProductionType>>
  freeHarvesterPool: FreeHarvester[]
  lastLandPurchaseRound?: number
  lastConsumedEnergyByHq?: number
  lastConsumedEnergyByHarvesters?: number
  inactiveHarvesterIds?: string[]
  lastHarvesterRetoolRound?: number
  lastRetooledHarvesterId?: string
  lastHarvesterRetoolCost?: number
  lastHarvesterBuildDecision?: AgentHarvesterDecision['reason']
}

export type RivalColonyState = ColonyEconomyState & {
  id: RivalId
  name: string
  icon: string
  harvestersInConstruction?: number
  ownedTileIds?: string[]
  crystalDiscoveryRoundByTileId?: Record<string, number>
  harvesterAssignments?: Partial<
    Record<string, ProductionType>
  >
  freeHarvesterPool?: FreeHarvester[]
  lastLandPurchaseRound?: number
  lastConsumedEnergyByHq?: number
  lastConsumedEnergyByHarvesters?: number
  inactiveHarvesterIds?: string[]
  lastHarvesterRetoolRound?: number
  lastRetooledHarvesterId?: string
  lastHarvesterRetoolCost?: number
  lastHarvesterBuildDecision?: AgentHarvesterDecision['reason']
}

export type RivalColonies = Record<RivalId, RivalColonyState>

export type LocalColonyState = Omit<
  ColonyState,
  'id' | 'harvesterAssignments'
> & {
  id: 'agima'
  harvesterAssignments: HarvesterAssignments
}

export type CanonicalRivalColonyState = Omit<
  ColonyState,
  'id' | 'harvesterAssignments'
> & {
  id: RivalId
  harvesterAssignments: Partial<
    Record<string, ProductionType>
  >
}

export type ColoniesState = {
  agima: LocalColonyState
  orion: CanonicalRivalColonyState & { id: 'orion' }
  nova: CanonicalRivalColonyState & { id: 'nova' }
  vega: CanonicalRivalColonyState & { id: 'vega' }
}

export type GameState = {
  match: MatchConfiguration
  round: number
  processedCommandIds?: string[]
  colonies: ColoniesState
  pendingLandBid: LandBid | null
  landAuctionTie: LandAuctionTie | null
  activeResourceMarket: ActiveResourceMarket | null
  initiatedMarketResources: MarketResource[]
  activeGlobalEvent: GlobalEventId | null
  activeLocalEvent: LocalEventId | null
  activeLocalEvents?: Partial<
    Record<ParticipantId, LocalEventId>
  >
  meteorSeed?: number
  meteorSchedule?: number[]
  meteorImpacts?: MeteorImpact[]
  interstellarCrystalPurchases?: number
  market: MarketState
}

export type LandBid = {
  tileId: string
  bids: Partial<Record<ParticipantId, number>>
  reservedCredits: Partial<Record<ParticipantId, number>>
  tieMinimum?: number
  winnerId?: ParticipantId
}

export type LandAuctionTie = {
  tileId: string
  tiedBid: number
  minimumBid: number
  phase: LandAuctionPhase
  openingBids: Partial<Record<ParticipantId, number>>
  initialLeaderId: ParticipantId | null
  liveBids: LandTieBidState
}

export type LandAuctionPhase =
  | 'announcement'
  | 'auction'
  | 'finished'

export type LandTieBidState = {
  bids: Partial<Record<ParticipantId, number>>
  leaderId: ParticipantId | null
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
  completedExplorations: Array<{
    tileId: string
    crystalRating: number
  }>
}

export type LeaderboardEntry = {
  id: 'player' | ParticipantId
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

export type LandAuctionTiming = {
  announcementSeconds: number
  auctionSeconds: number
}

export const LAND_MINIMUM_BID = 25
export const LAND_AUCTION_TIMING: LandAuctionTiming = {
  announcementSeconds: 5,
  auctionSeconds: 10,
}
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

function createSeededEventRoll(
  seed: number,
  round: number,
  channel: number,
) {
  let value =
    (Math.trunc(seed) ^
      Math.imul(round, 0x9e3779b1) ^
      channel) >>>
    0

  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad)
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97)
  value ^= value >>> 15

  return (value >>> 0) / 0x1_0000_0000
}

export function selectSeededGlobalEvent(
  round: number,
  seed: number,
): GlobalEventId | null {
  return selectGlobalEvent(
    round,
    createSeededEventRoll(seed, round, 0x47_4c_4f_42),
    createSeededEventRoll(seed, round, 0x45_56_4e_54),
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

export function selectSeededLocalEvent(
  round: number,
  seed: number,
  participantId: ParticipantId,
): LocalEventId | null {
  const participantChannel =
    (participantIds.indexOf(participantId) + 1) * 0x00_10_01_01

  return selectLocalEvent(
    round,
    createSeededEventRoll(
      seed,
      round,
      0x4c_4f_43_41 ^ participantChannel,
    ),
    createSeededEventRoll(
      seed,
      round,
      0x4c_45_56_54 ^ participantChannel,
    ),
  )
}

export function getSeededLocalEventDelay(
  round: number,
  seed: number,
  participantId: ParticipantId,
) {
  const participantChannel =
    (participantIds.indexOf(participantId) + 1) * 0x00_10_01_01
  const delayRoll = createSeededEventRoll(
    seed,
    round,
    0x44_45_4c_41 ^ participantChannel,
  )

  return 2_000 + Math.floor(delayRoll * 4_000)
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
  return applyColonyLocalEvent(currentState, 'agima', event)
}

export function getColonyLocalEvent(
  currentState: GameState,
  participantId: ParticipantId,
) {
  return (
    currentState.activeLocalEvents?.[participantId] ??
    (participantId === 'agima'
      ? currentState.activeLocalEvent
      : null)
  )
}

export function applyColonyLocalEvent(
  currentState: GameState,
  participantId: ParticipantId,
  event: LocalEventId,
): GameState {
  const amount =
    getLocalEventAmount(event, currentState.round) ?? 0
  const stateWithEvent: GameState = {
    ...currentState,
    activeLocalEvent:
      participantId === 'agima'
        ? event
        : currentState.activeLocalEvent,
    activeLocalEvents: {
      ...currentState.activeLocalEvents,
      [participantId]: event,
    },
  }

  return updateColony(stateWithEvent, participantId, (colony) => {
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
  return isColonyMarketInitiationBlocked(
    currentState,
    'agima',
  )
}

export function isColonyMarketInitiationBlocked(
  currentState: GameState,
  participantId: ParticipantId,
): boolean {
  return (
    currentState.activeGlobalEvent === 'trade-blockade' ||
    getColonyLocalEvent(currentState, participantId) ===
      'communications-outage'
  )
}

export function isLandBidBlocked(
  currentState: GameState,
): boolean {
  return isColonyLandBidBlocked(currentState, 'agima')
}

export function isColonyLandBidBlocked(
  currentState: GameState,
  participantId: ParticipantId,
): boolean {
  return (
    currentState.activeGlobalEvent === 'surveying-stop' ||
    getColonyLocalEvent(currentState, participantId) ===
      'land-registry-error'
  )
}

export function isHarvesterBuildBlocked(
  currentState: GameState,
): boolean {
  return isColonyHarvesterBuildBlocked(
    currentState,
    'agima',
  )
}

export function isColonyHarvesterBuildBlocked(
  currentState: GameState,
  participantId: ParticipantId,
): boolean {
  return (
    currentState.activeGlobalEvent ===
      'supply-chain-disruption' ||
    getColonyLocalEvent(currentState, participantId) ===
      'labor-strike'
  )
}

export function isHarvesterRetoolingBlocked(
  currentState: GameState,
): boolean {
  return isColonyHarvesterRetoolingBlocked(
    currentState,
    'agima',
  )
}

export function isColonyHarvesterRetoolingBlocked(
  currentState: GameState,
  participantId: ParticipantId,
): boolean {
  return (
    currentState.activeGlobalEvent === 'ion-fog' ||
    getColonyLocalEvent(currentState, participantId) ===
      'wrong-spare-parts'
  )
}

export function isHarvesterRelocationBlocked(
  currentState: GameState,
): boolean {
  return isColonyHarvesterRelocationBlocked(
    currentState,
    'agima',
  )
}

export function isColonyHarvesterRelocationBlocked(
  currentState: GameState,
  participantId: ParticipantId,
): boolean {
  return (
    !participantIds.includes(participantId) ||
    currentState.activeGlobalEvent === 'ion-fog'
  )
}

function normalizeColonyHarvesterAssignments(
  assignments: ColonyState['harvesterAssignments'],
): HarvesterAssignments {
  return Object.fromEntries(
    Object.entries(assignments).map(([tileId, assignment]) => [
      tileId,
      typeof assignment === 'string'
        ? {
            production: assignment,
            isNew: false,
          }
        : assignment,
    ]),
  )
}

export function selectColonyHarvesterAssignments(
  currentState: GameState,
  participantId: ParticipantId,
) {
  return normalizeColonyHarvesterAssignments(
    currentState.colonies[participantId].harvesterAssignments,
  )
}

function canColonyUseProduction(
  currentState: GameState,
  participantId: ParticipantId,
  tileId: string,
  production: ProductionType,
) {
  const tile = tiles.find((candidate) => candidate.id === tileId)

  if (
    !tile ||
    !selectColonies(currentState)[participantId].ownedTileIds.includes(
      tileId,
    )
  ) {
    return false
  }

  return (
    production !== 'crystals' ||
    (isColonyCrystalDiscovered(
      currentState,
      participantId,
      tileId,
    ) &&
      getEffectiveCrystalRating(
        tileId,
        targetCrystalRatings,
        currentState.meteorImpacts ?? [],
      ) > 0)
  )
}

export function assignColonyHarvester(
  currentState: GameState,
  participantId: ParticipantId,
  tileId: string,
  production: ProductionType,
): GameState {
  const colony = selectColonies(currentState)[participantId]
  const currentHarvesters =
    normalizeColonyHarvesterAssignments(
      colony.harvesterAssignments,
    )
  const currentPool = colony.freeHarvesterPool

  if (
    !canColonyUseProduction(
      currentState,
      participantId,
      tileId,
      production,
    ) ||
    currentPool.length <= 0 ||
    currentHarvesters[tileId]
  ) {
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
      isColonyHarvesterRelocationBlocked(
        currentState,
        participantId,
      ))
  ) {
    return currentState
  }

  return updateColony(currentState, participantId, (currentColony) => ({
    ...currentColony,
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
  }))
}

export function assignPlayerHarvester(
  currentState: GameState,
  tileId: string,
  production: ProductionType,
) {
  return assignColonyHarvester(
    currentState,
    'agima',
    tileId,
    production,
  )
}

export function changeColonyHarvesterProduction(
  currentState: GameState,
  participantId: ParticipantId,
  tileId: string,
  production: ProductionType,
): GameState {
  if (
    isColonyHarvesterRetoolingBlocked(
      currentState,
      participantId,
    ) ||
    !canColonyUseProduction(
      currentState,
      participantId,
      tileId,
      production,
    )
  ) {
    return currentState
  }

  const currentHarvesters =
    normalizeColonyHarvesterAssignments(
      selectColonies(currentState)[participantId]
        .harvesterAssignments,
    )
  const currentAssignment = currentHarvesters[tileId]

  if (!currentAssignment) {
    return currentState
  }

  if (currentAssignment.isNew) {
    return updateColony(currentState, participantId, (colony) => ({
      ...colony,
      harvesterAssignments: {
        ...currentHarvesters,
        [tileId]: {
          production,
          isNew: true,
        },
      },
    }))
  }

  if (currentAssignment.retoolingReason === 'relocation') {
    return updateColony(currentState, participantId, (colony) => ({
      ...colony,
      harvesterAssignments: {
        ...currentHarvesters,
        [tileId]: {
          ...currentAssignment,
          pendingProduction: production,
        },
      },
    }))
  }

  if (production === currentAssignment.production) {
    return updateColony(currentState, participantId, (colony) => ({
      ...colony,
      harvesterAssignments: {
        ...currentHarvesters,
        [tileId]: {
          production: currentAssignment.production,
          isNew: false,
        },
      },
    }))
  }

  return updateColony(currentState, participantId, (colony) => ({
    ...colony,
    harvesterAssignments: {
      ...currentHarvesters,
      [tileId]: {
        ...currentAssignment,
        pendingProduction: production,
        retoolingReason: 'production-change',
      },
    },
  }))
}

export function changePlayerHarvesterProduction(
  currentState: GameState,
  tileId: string,
  production: ProductionType,
) {
  return changeColonyHarvesterProduction(
    currentState,
    'agima',
    tileId,
    production,
  )
}

export function removeColonyHarvester(
  currentState: GameState,
  participantId: ParticipantId,
  tileId: string,
): GameState {
  const colony = selectColonies(currentState)[participantId]
  const currentHarvesters =
    normalizeColonyHarvesterAssignments(
      colony.harvesterAssignments,
    )
  const currentAssignment =
    currentHarvesters[tileId]

  if (
    !currentAssignment ||
    (!currentAssignment.isNew &&
      isColonyHarvesterRelocationBlocked(
        currentState,
        participantId,
      ))
  ) {
    return currentState
  }

  const updatedHarvesters = {
    ...currentHarvesters,
  }
  delete updatedHarvesters[tileId]

  return updateColony(currentState, participantId, (currentColony) => ({
    ...currentColony,
    harvesterAssignments: updatedHarvesters,
    freeHarvesterPool: [
      ...colony.freeHarvesterPool,
      currentAssignment.isNew
        ? {}
        : {
            previousProduction: currentAssignment.production,
          },
    ],
  }))
}

export function removePlayerHarvester(
  currentState: GameState,
  tileId: string,
) {
  return removeColonyHarvester(
    currentState,
    'agima',
    tileId,
  )
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
  return currentState.colonies
}

export function selectLocalColony(currentState: GameState) {
  return currentState.colonies.agima
}

export function selectRivalColonies(
  currentState: GameState,
): RivalColonies {
  const { orion, nova, vega } = currentState.colonies

  return { orion, nova, vega } as RivalColonies
}

export function selectOpponentTileIds(
  currentState: GameState,
) {
  return selectOtherColonyTileIds(currentState, 'agima')
}

export function selectOtherColonyTileIds(
  currentState: GameState,
  participantId: ParticipantId,
) {
  return participantIds
    .filter((candidateId) => candidateId !== participantId)
    .flatMap(
      (candidateId) =>
        currentState.colonies[candidateId].ownedTileIds,
  )
}

export function isColonyLandTargetAdjacent(
  currentState: GameState,
  participantId: ParticipantId,
  tileId: string,
) {
  return currentState.colonies[participantId].ownedTileIds.some(
    (ownedTileId) =>
      areTilesAdjacent(
        targetPlanetMap,
        ownedTileId,
        tileId,
      ),
  )
}

export function isColonyCrystalDiscovered(
  currentState: Pick<GameState, 'round' | 'colonies'>,
  participantId: ParticipantId,
  tileId: string,
) {
  const discoveryRound =
    currentState.colonies[participantId]
      .crystalDiscoveryRoundByTileId[tileId]

  return (
    discoveryRound !== undefined &&
    currentState.round >= discoveryRound
  )
}

export function updateColony(
  currentState: GameState,
  participantId: ParticipantId,
  update: (colony: ColonyState) => ColonyState,
): GameState {
  const currentColony = selectColonies(currentState)[participantId]
  const nextColony = update(currentColony)

  return {
    ...currentState,
    colonies: {
      ...currentState.colonies,
      [participantId]: nextColony,
    },
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
      crystalDiscoveryRoundByTileId: {
        ...currentColony.crystalDiscoveryRoundByTileId,
        [tileId]: currentState.round + 2,
      },
    }),
  )
}

export function createLeaderboardEntries(
  currentState: GameState,
  playerHarvesterCount: number = selectLocalColony(currentState)
    .harvesters,
): LeaderboardEntry[] {
  return createParticipantLeaderboardEntries(
    currentState,
    'agima',
    playerHarvesterCount,
  ).map((entry) =>
    entry.id === 'agima'
      ? {
          ...entry,
          id: 'player',
        }
      : entry,
  )
}

export function createParticipantLeaderboardEntries(
  currentState: GameState,
  activeParticipantId: ParticipantId,
  activeHarvesterCount: number = currentState.colonies[
    activeParticipantId
  ].harvesters,
): LeaderboardEntry[] {
  const crystalReferencePrice =
    currentState.market.crystals.referencePrice
  const colonies = selectColonies(currentState)

  const entries: LeaderboardEntry[] = participantIds.map(
    (participantId) => {
      const colony = colonies[participantId]

      return {
        id: participantId,
        name: colony.name,
        icon: colony.icon,
        population: colony.population,
        credits: colony.credits,
        wealth:
          colony.credits +
          colony.resources.crystals * crystalReferencePrice,
        resources: getResourceTotal(colony.resources),
        harvesters:
          participantId === activeParticipantId
            ? activeHarvesterCount
            : colony.harvesters,
        isPlayer: participantId === activeParticipantId,
      }
    },
  )

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
    const discoveredAssignments = Object.fromEntries(
      Object.entries(rival.harvesterAssignments).filter(
        ([tileId, production]) =>
          production !== 'crystals' ||
          (rival.crystalDiscoveryRoundByTileId?.[tileId] !==
            undefined &&
            roundPlayed >=
              rival.crystalDiscoveryRoundByTileId[tileId]),
      ),
    )

    return calculateRivalAssignedProduction(
      discoveredAssignments,
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

export function advanceRivalColoniesInGame(
  currentState: GameState,
): GameState {
  const advancedRivals = advanceRivalColonies(
    selectRivalColonies(currentState),
    currentState.round,
    currentState.activeGlobalEvent,
    currentState.meteorImpacts,
  )

  return (['orion', 'nova', 'vega'] as const).reduce(
    (state, participantId) => {
      const advancedRival = advancedRivals[participantId]
      const stateWithEconomy = updateColony(
        state,
        participantId,
        (colony) => ({
          ...colony,
          population: advancedRival.population,
          credits: advancedRival.credits,
          resources: advancedRival.resources,
          harvesters: advancedRival.harvesters,
          harvestersInConstruction:
            advancedRival.harvestersInConstruction ?? 0,
          ownedTileIds: advancedRival.ownedTileIds ?? [],
        }),
      )

      return updateColony(
        stateWithEconomy,
        participantId,
        (colony) => ({
          ...colony,
          ...advancedRival,
          harvestersInConstruction:
            advancedRival.harvestersInConstruction ?? 0,
          ownedTileIds: advancedRival.ownedTileIds ?? [],
          harvesterAssignments:
            advancedRival.harvesterAssignments ?? {},
          freeHarvesterPool:
            advancedRival.freeHarvesterPool ?? [],
        }),
      )
    },
    currentState,
  )
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
  const emptyResources = {
    food: 10,
    energy: 10,
    ore: 5,
    crystals: 0,
  }

  return {
    match: createMatchConfiguration({
      seed: browserMatchConfiguration.seed,
    }),
    round: 1,
    processedCommandIds: [],
    colonies: {
      agima: {
        id: 'agima',
        name: 'Kolonie Agima',
        icon: '🧑‍🚀',
        population: 10,
        credits: 100,
        harvesters: 0,
        resources: { ...emptyResources },
        harvestersInConstruction: 0,
        ownedTileIds: [...PLAYER_START_TILE_IDS],
        crystalDiscoveryRoundByTileId: Object.fromEntries(
          PLAYER_START_TILE_IDS.map((tileId) => [tileId, 1]),
        ),
        harvesterAssignments: {},
        freeHarvesterPool: [],
      },
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
        harvestersInConstruction: 0,
        ownedTileIds: [],
        crystalDiscoveryRoundByTileId: {},
        harvesterAssignments: {},
        freeHarvesterPool: [],
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
        harvestersInConstruction: 0,
        ownedTileIds: [],
        crystalDiscoveryRoundByTileId: {},
        harvesterAssignments: {},
        freeHarvesterPool: [],
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
        harvestersInConstruction: 0,
        ownedTileIds: [],
        crystalDiscoveryRoundByTileId: {},
        harvesterAssignments: {},
        freeHarvesterPool: [],
      },
    },
    pendingLandBid: null,
    landAuctionTie: null,
    activeResourceMarket: null,
    initiatedMarketResources: [],
    activeGlobalEvent: null,
    activeLocalEvent: null,
    activeLocalEvents: {},
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
  }
}

export const STARTING_CREDITS = 150
export const STARTING_HARVESTERS = 2
export const STARTING_CRYSTALS = 1

export function createPlayableInitialGameState(
  meteorSeed: number = 1,
): GameState {
  return createPlayableInitialGameStateForMatch(
    createMatchConfiguration({
      seed: browserMatchConfiguration.seed,
    }),
    meteorSeed,
  )
}

export function createPlayableInitialGameStateForMatch(
  match: MatchConfiguration,
  meteorSeed: number = match.seed,
): GameState {
  const state = createInitialGameState()
  const localColony = selectLocalColony(state)
  const sharedResources = {
    ...localColony.resources,
    crystals: STARTING_CRYSTALS,
  }

  return {
    ...state,
    match: structuredClone(match),
    meteorSeed,
    meteorSchedule: createMeteorSchedule(meteorSeed),
    meteorImpacts: [],
    interstellarCrystalPurchases: 0,
    colonies: Object.fromEntries(
      participantIds.map((participantId) => {
        const colony = state.colonies[participantId]

        return [
          participantId,
          {
            ...colony,
            population: localColony.population,
            credits: STARTING_CREDITS,
            resources: { ...sharedResources },
            harvesters: STARTING_HARVESTERS,
            ownedTileIds: [
              ...match.participants[participantId].startTileIds,
            ],
            crystalDiscoveryRoundByTileId:
              Object.fromEntries(
                match.participants[
                  participantId
                ].startTileIds.map((tileId) => [tileId, 1]),
              ),
            harvesterAssignments: {},
            freeHarvesterPool: Array.from(
              { length: STARTING_HARVESTERS },
              () => ({}),
            ),
          },
        ]
      }),
    ) as ColoniesState,
  }
}


export function orderColonyHarvesterBuild(
  currentState: GameState,
  participantId: ParticipantId,
): GameState {
  const creditCost = getHarvesterCreditCost(currentState)
  const colony = selectColonies(currentState)[participantId]

  if (
    isColonyHarvesterBuildBlocked(
      currentState,
      participantId,
    ) ||
    colony.credits < creditCost ||
    colony.resources.ore < HARVESTER_ORE_COST
  ) {
    return currentState
  }

  return updateColony(currentState, participantId, (currentColony) => ({
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

export function orderHarvesterBuild(
  currentState: GameState,
) {
  return orderColonyHarvesterBuild(currentState, 'agima')
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

export function executeColonyWarehouseTrade(
  currentState: GameState,
  participantId: ParticipantId,
  resource: MarketResource,
  direction: MarketDirection,
  price: number,
): GameState {
  const participant = selectColonies(currentState)[participantId]

  if (!Number.isInteger(price) || price <= 0) {
    return currentState
  }

  if (direction === 'buy') {
    if (
      participant.credits < price ||
      currentState.market[resource].warehouseStock <= 0
    ) {
      return currentState
    }

    const stateAfterTrade = updateColony(
      currentState,
      participantId,
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

  if (participant.resources[resource] <= 0) {
    return currentState
  }

  const stateAfterTrade = updateColony(
    currentState,
    participantId,
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

export function executeColonyMarketTrade(
  currentState: GameState,
  participantId: ParticipantId,
  resource: MarketResource,
  direction: MarketDirection,
  price: number,
  counterparty: MarketCounterparty = 'orion',
): GameState {
  const participant = selectColonies(currentState)[participantId]

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
      participant.resources.crystals < 1
    ) {
      return currentState
    }

    const stateAfterTrade = updateColony(
      currentState,
      participantId,
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
    return executeColonyWarehouseTrade(
      currentState,
      participantId,
      resource,
      direction,
      price,
    )
  }

  return direction === 'buy'
    ? executeColonyTrade(
        currentState,
        participantId,
        counterparty,
        resource,
        price,
      )
    : executeColonyTrade(
        currentState,
        counterparty,
        participantId,
        resource,
        price,
      )
}

export function executeActiveMarketTrade(
  currentState: GameState,
  participantId: ParticipantId,
  resource: MarketResource,
  direction: MarketDirection,
  price: number,
  counterparty: MarketCounterparty,
) {
  const activeMarket = currentState.activeResourceMarket
  const role = activeMarket?.roles[participantId]
  const ownOffer = activeMarket?.offers[participantId]

  if (
    !activeMarket ||
    activeMarket.resource !== resource ||
    activeMarket.phase !== 'auction' ||
    role === undefined ||
    role === 'neutral' ||
    !ownOffer?.active ||
    (direction === 'buy' && role !== 'buyer') ||
    (direction === 'sell' && role !== 'seller')
  ) {
    return currentState
  }

  if (counterparty === 'warehouse') {
    const warehousePrices = getWarehousePrices(
      resource,
      currentState.market[resource].referencePrice,
    )
    const expectedPrice =
      direction === 'buy'
        ? warehousePrices.sellPrice
        : warehousePrices.buyPrice

    if (
      price !== expectedPrice ||
      (direction === 'buy' &&
        ownOffer.price < expectedPrice) ||
      (direction === 'sell' &&
        ownOffer.price > expectedPrice)
    ) {
      return currentState
    }
  } else if (counterparty === 'interstellar-buyer') {
    const buyerOffer = getInterstellarCrystalBuyerOffer(
      currentState.round,
      currentState.market.crystals.referencePrice,
      currentState.interstellarCrystalPurchases ?? 0,
    )

    if (
      direction !== 'sell' ||
      resource !== 'crystals' ||
      price !== buyerOffer.offerPrice ||
      ownOffer.price > buyerOffer.offerPrice
    ) {
      return currentState
    }
  } else {
    const counterpartyRole =
      activeMarket.roles[counterparty]
    const counterpartyOffer =
      activeMarket.offers[counterparty]
    const buyerId =
      direction === 'buy' ? participantId : counterparty
    const sellerId =
      direction === 'sell' ? participantId : counterparty
    const buyerOffer = activeMarket.offers[buyerId]
    const sellerOffer = activeMarket.offers[sellerId]

    if (
      counterparty === participantId ||
      counterpartyRole === undefined ||
      counterpartyRole === 'neutral' ||
      !counterpartyOffer?.active ||
      activeMarket.roles[buyerId] !== 'buyer' ||
      activeMarket.roles[sellerId] !== 'seller' ||
      !buyerOffer?.active ||
      !sellerOffer?.active ||
      price !== sellerOffer.price ||
      buyerOffer.price < sellerOffer.price
    ) {
      return currentState
    }
  }

  return executeColonyMarketTrade(
    currentState,
    participantId,
    resource,
    direction,
    price,
    counterparty,
  )
}

export function executeMarketTrade(
  currentState: GameState,
  resource: MarketResource,
  direction: MarketDirection,
  price: number,
  counterparty: MarketCounterparty = 'orion',
) {
  return executeColonyMarketTrade(
    currentState,
    'agima',
    resource,
    direction,
    price,
    counterparty,
  )
}

export function initiateColonyResourceMarket(
  currentState: GameState,
  participantId: ParticipantId,
  resource: MarketResource,
): GameState {
  if (
    isColonyMarketInitiationBlocked(
      currentState,
      participantId,
    ) ||
    currentState.activeResourceMarket !== null ||
    currentState.initiatedMarketResources.includes(resource)
  ) {
    return currentState
  }

  return {
    ...currentState,
    activeResourceMarket: {
      resource,
      roundPlayed: currentState.round,
      initiatorId: participantId,
      phase: 'announcement',
      roles: {},
      offers: {},
    },
    initiatedMarketResources: [
      ...currentState.initiatedMarketResources,
      resource,
    ],
  }
}

export function initiateResourceMarket(
  currentState: GameState,
  resource: MarketResource,
) {
  return initiateColonyResourceMarket(
    currentState,
    'agima',
    resource,
  )
}

export function setColonyMarketRole(
  currentState: GameState,
  participantId: ParticipantId,
  resource: MarketResource,
  role: MarketRole,
) {
  const activeMarket = currentState.activeResourceMarket

  if (
    !activeMarket ||
    activeMarket.resource !== resource ||
    activeMarket.phase !== 'declaration'
  ) {
    return currentState
  }

  const offers = { ...activeMarket.offers }

  if (role === 'neutral') {
    delete offers[participantId]
  }

  return {
    ...currentState,
    activeResourceMarket: {
      ...activeMarket,
      roles: {
        ...activeMarket.roles,
        [participantId]: role,
      },
      offers,
    },
  }
}

export function setColonyMarketOffer(
  currentState: GameState,
  participantId: ParticipantId,
  resource: MarketResource,
  offer: MarketOffer,
) {
  const activeMarket = currentState.activeResourceMarket
  const role = activeMarket?.roles[participantId]
  const warehousePrices = getWarehousePrices(
    resource,
    currentState.market[resource].referencePrice,
  )

  if (
    !activeMarket ||
    activeMarket.resource !== resource ||
    activeMarket.phase !== 'auction' ||
    role === undefined ||
    role === 'neutral' ||
    !Number.isInteger(offer.price) ||
    offer.price < warehousePrices.buyPrice ||
    offer.price > warehousePrices.sellPrice
  ) {
    return currentState
  }

  return {
    ...currentState,
    activeResourceMarket: {
      ...activeMarket,
      offers: {
        ...activeMarket.offers,
        [participantId]: { ...offer },
      },
    },
  }
}

export function advanceColonyResourceMarketPhase(
  currentState: GameState,
  participantId: ParticipantId,
  resource: MarketResource,
  expectedPhase: ResourceMarketPhase,
): GameState {
  const activeMarket = currentState.activeResourceMarket

  if (
    !activeMarket ||
    activeMarket.resource !== resource ||
    activeMarket.initiatorId !== participantId ||
    activeMarket.phase !== expectedPhase ||
    expectedPhase === 'finished'
  ) {
    return currentState
  }

  const nextPhase: ResourceMarketPhase =
    expectedPhase === 'announcement'
      ? 'declaration'
      : expectedPhase === 'declaration'
        ? activeMarket.roles[participantId] === 'buyer' ||
          activeMarket.roles[participantId] === 'seller'
          ? 'auction'
          : 'finished'
        : 'finished'

  return {
    ...currentState,
    activeResourceMarket: {
      ...activeMarket,
      phase: nextPhase,
    },
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
    activeResourceMarket:
      currentState.activeResourceMarket?.resource === resource
        ? null
        : currentState.activeResourceMarket,
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

export function completeColonyResourceMarket(
  currentState: GameState,
  participantId: ParticipantId,
  resource: MarketResource,
) {
  const activeMarket = currentState.activeResourceMarket

  if (
    !activeMarket ||
    activeMarket.resource !== resource ||
    activeMarket.initiatorId !== participantId ||
    activeMarket.phase !== 'finished'
  ) {
    return currentState
  }

  return completeResourceMarket(currentState, resource)
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

export function getLandBidAmount(
  bid: LandBid,
  participantId: ParticipantId,
) {
  return bid.bids[participantId] ?? 0
}

export function placeColonyLandBid(
  currentState: GameState,
  participantId: ParticipantId,
  tileId: string,
  amount: number,
): GameState {
  const tile = tiles.find((candidate) => candidate.id === tileId)
  const colony = selectColonies(currentState)[participantId]
  const pendingBid = currentState.pendingLandBid
  const tie = currentState.landAuctionTie
  const minimumBid =
    tie?.tileId === tileId
      ? tie.minimumBid
      : LAND_MINIMUM_BID

  if (
    isColonyLandBidBlocked(currentState, participantId) ||
    !tile ||
    tile.owner !== 'free' ||
    colony.ownedTileIds.includes(tileId) ||
    selectOtherColonyTileIds(
      currentState,
      participantId,
    ).includes(tileId) ||
    !isColonyLandTargetAdjacent(
      currentState,
      participantId,
      tileId,
    ) ||
    (pendingBid !== null &&
      pendingBid.tileId !== tileId) ||
    pendingBid?.winnerId !== undefined ||
    pendingBid?.bids[participantId] !== undefined ||
    (tie !== null && tie.tileId !== tileId) ||
    !Number.isInteger(amount) ||
    amount < minimumBid ||
    colony.credits < amount
  ) {
    return currentState
  }

  const stateAfterReservation = updateColony(
    currentState,
    participantId,
    (currentColony) => ({
      ...currentColony,
      credits: currentColony.credits - amount,
    }),
  )

  return {
    ...stateAfterReservation,
    pendingLandBid: {
      tileId,
      bids: {
        ...(pendingBid?.bids ?? {}),
        [participantId]: amount,
      },
      reservedCredits: {
        ...(pendingBid?.reservedCredits ?? {}),
        [participantId]: amount,
      },
      tieMinimum: tie?.minimumBid,
    },
    landAuctionTie: null,
  }
}

export function placeLandBid(
  currentState: GameState,
  tileId: string,
  amount: number,
  rivalBidOverride?: number,
): GameState {
  const stateAfterPlayerBid = placeColonyLandBid(
    currentState,
    'agima',
    tileId,
    amount,
  )

  if (stateAfterPlayerBid === currentState) {
    return currentState
  }

  const tile = tiles.find((candidate) => candidate.id === tileId)
  const minimumBid =
    currentState.landAuctionTie?.tileId === tileId
      ? currentState.landAuctionTie.minimumBid
      : LAND_MINIMUM_BID
  const rivalBid =
    rivalBidOverride ??
    (tile ? createRivalBid(tile, minimumBid) : 0)

  return rivalBid >= minimumBid
    ? placeColonyLandBid(
        stateAfterPlayerBid,
        'orion',
        tileId,
        rivalBid,
      )
    : stateAfterPlayerBid
}

export function cancelColonyLandBid(
  currentState: GameState,
  participantId: ParticipantId,
): GameState {
  const bid = currentState.pendingLandBid
  const reservedCredits =
    bid?.reservedCredits[participantId] ?? 0

  if (
    bid === null ||
    bid.bids[participantId] === undefined
  ) {
    return currentState
  }

  const stateAfterRefund = updateColony(
    currentState,
    participantId,
    (colony) => ({
      ...colony,
      credits: colony.credits + reservedCredits,
    }),
  )
  const remainingBids = { ...bid.bids }
  const remainingReservations = {
    ...bid.reservedCredits,
  }
  delete remainingBids[participantId]
  delete remainingReservations[participantId]
  const remainingEntries = Object.entries(remainingBids) as Array<
    [ParticipantId, number]
  >
  const highestRemainingBid = Math.max(
    0,
    ...remainingEntries.map(([, amount]) => amount),
  )
  const remainingLeaders = remainingEntries.filter(
    ([, amount]) => amount === highestRemainingBid,
  )

  return {
    ...stateAfterRefund,
    pendingLandBid:
      remainingEntries.length > 0
        ? {
            ...bid,
            bids: remainingBids,
            reservedCredits: remainingReservations,
          }
        : null,
    landAuctionTie:
      bid.tieMinimum && remainingEntries.length > 0
      ? {
          tileId: bid.tileId,
          tiedBid: bid.tieMinimum - 1,
          minimumBid: bid.tieMinimum,
          phase: 'announcement',
          openingBids: remainingBids,
          initialLeaderId:
            remainingLeaders.length === 1
              ? remainingLeaders[0][0]
              : null,
          liveBids: {
            bids: remainingBids,
            leaderId:
              remainingLeaders.length === 1
                ? remainingLeaders[0][0]
                : null,
          },
        }
      : null,
  }
}

export function cancelLandBid(
  currentState: GameState,
) {
  return cancelColonyLandBid(
    cancelColonyLandBid(currentState, 'agima'),
    'orion',
  )
}

export function beginLandTieBreak(
  currentState: GameState,
): GameState {
  const bid = currentState.pendingLandBid

  if (!bid || bid.winnerId) {
    return currentState
  }

  const bidEntries = Object.entries(bid.bids) as Array<
    [ParticipantId, number]
  >

  if (bidEntries.length < 2) {
    return currentState
  }

  const startingBid = Math.max(
    ...bidEntries.map(([, amount]) => amount),
  )
  const startingLeaders = bidEntries.filter(
    ([, amount]) => amount === startingBid,
  )
  const stateAfterRefund = bidEntries.reduce(
    (state, [participantId]) =>
      updateColony(state, participantId, (colony) => ({
        ...colony,
        credits:
          colony.credits +
          (bid.reservedCredits[participantId] ?? 0),
      })),
    currentState,
  )

  return {
    ...stateAfterRefund,
    pendingLandBid: null,
    landAuctionTie: {
      tileId: bid.tileId,
      tiedBid: startingBid,
      minimumBid: startingBid + 1,
      phase: 'announcement',
      openingBids: { ...bid.bids },
      initialLeaderId:
        startingLeaders.length === 1
          ? startingLeaders[0][0]
          : null,
      liveBids: {
        bids: { ...bid.bids },
        leaderId:
          startingLeaders.length === 1
            ? startingLeaders[0][0]
            : null,
      },
    },
  }
}

export function advanceLandAuctionPhase(
  currentState: GameState,
  participantId: ParticipantId,
  tileId: string,
  expectedPhase: LandAuctionPhase,
): GameState {
  const tie = currentState.landAuctionTie

  if (
    !tie ||
    tie.tileId !== tileId ||
    tie.phase !== expectedPhase ||
    expectedPhase === 'finished' ||
    tie.openingBids[participantId] === undefined
  ) {
    return currentState
  }

  return {
    ...currentState,
    landAuctionTie: {
      ...tie,
      phase:
        expectedPhase === 'announcement'
          ? 'auction'
          : 'finished',
    },
  }
}

export function moveLandAuctionBid(
  currentState: GameState,
  participantId: ParticipantId,
  tileId: string,
  direction: 'raise' | 'lower',
): GameState {
  const tie = currentState.landAuctionTie
  const colony = currentState.colonies[participantId]

  if (
    !tie ||
    tie.tileId !== tileId ||
    tie.phase !== 'auction' ||
    tie.openingBids[participantId] === undefined ||
    !colony
  ) {
    return currentState
  }

  const liveBids =
    direction === 'raise'
      ? raiseLandTieBid(
          tie.liveBids,
          participantId,
          colony.credits,
        )
      : lowerLandTieBid(
          tie.liveBids,
          participantId,
          tie.minimumBid,
        )

  if (liveBids === tie.liveBids) {
    return currentState
  }

  return {
    ...currentState,
    landAuctionTie: {
      ...tie,
      liveBids,
    },
  }
}

export function raiseLandTieBid(
  currentBids: LandTieBidState,
  bidderId: ParticipantId,
  creditLimit: number,
): LandTieBidState {
  const ownBid = currentBids.bids[bidderId] ?? 0
  const opposingBid = Math.max(
    0,
    ...Object.entries(currentBids.bids)
      .filter(
        ([participantId]) => participantId !== bidderId,
      )
      .map(([, amount]) => amount ?? 0),
  )
  const nextBid = Math.max(
    ownBid + 1,
    opposingBid + 1,
  )

  if (nextBid > creditLimit) {
    return currentBids
  }

  return {
    ...currentBids,
    bids: {
      ...currentBids.bids,
      [bidderId]: nextBid,
    },
    leaderId:
      nextBid > opposingBid
        ? bidderId
        : currentBids.leaderId ?? bidderId,
  }
}

export function lowerLandTieBid(
  currentBids: LandTieBidState,
  bidderId: ParticipantId,
  minimumBid: number,
): LandTieBidState {
  const ownBid = currentBids.bids[bidderId] ?? 0

  if (ownBid < minimumBid) {
    return currentBids
  }
  const opposingEntries = (
    Object.entries(currentBids.bids) as Array<
      [ParticipantId, number]
    >
  )
    .filter(([participantId]) => participantId !== bidderId)
    .sort(
      (first, second) =>
        second[1] - first[1] ||
        first[0].localeCompare(second[0]),
    )
  const [highestOpponentId, highestOpponentBid] =
    opposingEntries[0] ?? [null, 0]

  if (ownBid === minimumBid) {
    if (
      currentBids.leaderId === bidderId &&
      highestOpponentId !== null &&
      highestOpponentBid >= minimumBid
    ) {
      return {
        ...currentBids,
        leaderId: highestOpponentId,
      }
    }

    return currentBids
  }

  const nextBid = ownBid - 1
  const leader =
    currentBids.leaderId === bidderId &&
    highestOpponentId !== null &&
    nextBid <= highestOpponentBid
      ? highestOpponentId
      : currentBids.leaderId

  return {
    ...currentBids,
    bids: {
      ...currentBids.bids,
      [bidderId]: nextBid,
    },
    leaderId: leader,
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

  if (bids.leaderId === null) {
    return {
      ...currentState,
      landAuctionTie: null,
    }
  }

  const winnerId = bids.leaderId
  const openingBidderIds = Object.keys(
    tie.openingBids,
  ) as ParticipantId[]
  const finalBidderIds = Object.keys(
    bids.bids,
  ) as ParticipantId[]

  if (
    openingBidderIds.length !== finalBidderIds.length ||
    openingBidderIds.some(
      (participantId) =>
        bids.bids[participantId] === undefined,
    ) ||
    finalBidderIds.some(
      (participantId) =>
        tie.openingBids[participantId] === undefined,
    )
  ) {
    return currentState
  }

  const winningBid = bids.bids[winnerId] ?? 0
  const highestOpposingBid = Math.max(
    0,
    ...Object.entries(bids.bids)
      .filter(
        ([participantId]) => participantId !== winnerId,
      )
      .map(([, amount]) => amount ?? 0),
  )
  const minimumWinningBid =
    tie.initialLeaderId === winnerId
      ? tie.tiedBid
      : tie.minimumBid
  const winner = selectColonies(currentState)[winnerId]

  if (
    winningBid < highestOpposingBid ||
    winningBid < minimumWinningBid ||
    winner.credits < winningBid
  ) {
    return currentState
  }

  const stateAfterPayment = updateColony(
    currentState,
    winnerId,
    (colony) => ({
      ...colony,
      credits: colony.credits - winningBid,
    }),
  )

  return {
    ...stateAfterPayment,
    pendingLandBid: {
      tileId: tie.tileId,
      bids: { ...bids.bids },
      reservedCredits: {
        [winnerId]: winningBid,
      },
      winnerId,
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
  return calculateColonySupplyPreview(
    currentState,
    'agima',
    supplyPlan,
  )
}

export function calculateColonySupplyPreview(
  currentState: GameState,
  participantId: ParticipantId,
  supplyPlan: SupplyPlan,
): SupplyPreview {
  const localColony = currentState.colonies[participantId]
  const populationGroups = Math.ceil(
    localColony.population / 10,
  )

  const plannedFood =
    populationGroups * supplyPlan.foodLevel

  const plannedEnergy =
    populationGroups * supplyPlan.energyLevel

  const consumedFood = Math.min(
    localColony.resources.food,
    plannedFood,
  )

  const consumedEnergyByHq = Math.min(
    localColony.resources.energy,
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
    remainingFood: localColony.resources.food - consumedFood,
    remainingEnergyBeforeHarvesters:
      localColony.resources.energy - consumedEnergyByHq,
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
  const localColony = selectLocalColony(currentState)
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
    localColony.resources.energy - consumedEnergyByHq

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
      const targetProduction =
        assignment.pendingProduction ?? assignment.production
      const canProduceTarget =
        targetProduction !== 'crystals' ||
        isColonyCrystalDiscovered(
          currentState,
          'agima',
          tile.id,
        )

      harvesterTasks.push({
        id: tile.id,
        kind: isRetooling ? 'retooling' : 'production',
        tile,
        production: targetProduction,
        retoolingReason: assignment.retoolingReason,
        rating: !canProduceTarget
          ? 0
          : isRetooling
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
  const landBidEntries = landBid
    ? (Object.entries(landBid.bids) as Array<
        [ParticipantId, number]
      >)
    : []
  const automaticWinnerId =
    landBidEntries.length === 1
      ? landBidEntries[0][0]
      : undefined
  const landWinnerId =
    landBid?.winnerId ?? automaticWinnerId
  const playerLandBid = landBid?.bids.agima ?? 0
  const highestRivalLandBid = Math.max(
    0,
    ...landBidEntries
      .filter(([participantId]) => participantId !== 'agima')
      .map(([, amount]) => amount),
  )
  const landAuction: LandAuctionResult | null = landBid
    ? {
        tileId: landBid.tileId,
        playerBid: playerLandBid,
        rivalBid: highestRivalLandBid,
        outcome:
          landWinnerId === 'agima'
            ? 'won'
            : landWinnerId !== undefined
              ? 'lost'
              : 'tie',
      }
    : null

  const tiedLandAuction = landAuction?.outcome === 'tie'
  const stateAfterLandRefunds = landBidEntries.reduce(
    (state, [participantId]) => {
      if (participantId === landWinnerId) {
        return state
      }

      const reservedCredits =
        landBid?.reservedCredits[participantId] ?? 0

      return reservedCredits > 0
        ? updateColony(state, participantId, (colony) => ({
            ...colony,
            credits: colony.credits + reservedCredits,
          }))
        : state
    },
    currentState,
  )
  const stateAfterRivalRound =
    advanceRivalColoniesInGame(stateAfterLandRefunds)
  let stateAfterLandAuction = stateAfterRivalRound

  if (landBid && landWinnerId) {
    stateAfterLandAuction = addColonyOwnedTile(
      stateAfterLandAuction,
      landWinnerId,
      landBid.tileId,
    )
    if (landWinnerId !== 'agima') {
      stateAfterLandAuction = updateColony(
        stateAfterLandAuction,
        landWinnerId,
        (colony) => ({
          ...colony,
          lastLandPurchaseRound: currentState.round,
        }),
      )
    }
  }

  const coloniesAfterLand = selectColonies(
    stateAfterLandAuction,
  )
  const nextOwnedTileIds = coloniesAfterLand.agima.ownedTileIds
  const nextOpponentTileIds = selectOpponentTileIds(
    stateAfterLandAuction,
  )
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
  const nextRound = Math.min(
    GAME_ROUND_LIMIT,
    currentState.round + 1,
  )
  const nextMeteorImpacts = meteorImpact
    ? [...previousMeteorImpacts, meteorImpact]
    : previousMeteorImpacts
  const completedExplorations = Object.entries(
    coloniesAfterLand.agima.crystalDiscoveryRoundByTileId,
  )
    .filter(([, discoveryRound]) => discoveryRound === nextRound)
    .map(([tileId]) => ({
      tileId,
      crystalRating: getEffectiveCrystalRating(
        tileId,
        targetCrystalRatings,
        nextMeteorImpacts,
      ),
    }))

  const stateWithNextRoundMetadata: GameState = {
    ...stateAfterLandAuction,
    round: nextRound,
    pendingLandBid: null,
    landAuctionTie: tiedLandAuction
      ? {
          tileId: landBid!.tileId,
          tiedBid: Math.max(
            ...landBidEntries.map(([, amount]) => amount),
          ),
          minimumBid:
            Math.max(
              ...landBidEntries.map(([, amount]) => amount),
            ) + 1,
          phase: 'announcement',
          openingBids: { ...landBid!.bids },
          initialLeaderId: (() => {
            const highestBid = Math.max(
              ...landBidEntries.map(([, amount]) => amount),
            )
            const leaders = landBidEntries.filter(
              ([, amount]) => amount === highestBid,
            )
            return leaders.length === 1
              ? leaders[0][0]
              : null
          })(),
          liveBids: {
            bids: { ...landBid!.bids },
            leaderId: (() => {
              const highestBid = Math.max(
                ...landBidEntries.map(([, amount]) => amount),
              )
              const leaders = landBidEntries.filter(
                ([, amount]) => amount === highestBid,
              )
              return leaders.length === 1
                ? leaders[0][0]
                : null
            })(),
          },
        }
      : null,
    activeResourceMarket: null,
    initiatedMarketResources: [],
    activeGlobalEvent: null,
    activeLocalEvent: null,
    activeLocalEvents: {},
    meteorSeed: currentState.meteorSeed,
    meteorSchedule: currentState.meteorSchedule,
    meteorImpacts: nextMeteorImpacts,
    interstellarCrystalPurchases: 0,
    market: currentState.market,
  }
  const nextState = updateColony(
    stateWithNextRoundMetadata,
    'agima',
    (colony) => ({
      ...colony,
      population: Math.max(
        1,
        colony.population + populationChange,
      ),
      harvesters:
        colony.harvesters +
        colony.harvestersInConstruction,
      harvestersInConstruction: 0,
      harvesterAssignments: nextHarvesters,
      freeHarvesterPool: [
        ...localColony.freeHarvesterPool,
        ...Array.from(
          { length: localColony.harvestersInConstruction },
          () => ({}),
        ),
      ],
      resources: {
        food:
          colony.resources.food -
          consumedFood +
          produced.food,
        energy:
          colony.resources.energy -
          consumedEnergyByHq -
          consumedEnergyByHarvesters +
          produced.energy,
        ore: colony.resources.ore + produced.ore,
        crystals:
          colony.resources.crystals +
          produced.crystals,
      },
      ownedTileIds: nextOwnedTileIds,
    }),
  )

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
        localColony.harvestersInConstruction,
      globalEvent: currentState.activeGlobalEvent,
      meteorImpact,
      completedExplorations,
    },
  }
}
