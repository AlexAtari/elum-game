import { GAME_ROUND_LIMIT } from './game'
import {
  compareSimulationFinalScores,
  getSimulationNormalSupplyDemand,
  runHeadlessEconomicSimulation,
  type SimulationParticipantId,
  type SimulationParticipantSnapshot,
  type SimulationProductionModel,
  type SimulationSupplyDemandModel,
  type SimulationWarning,
} from './simulation'
import {
  AGENT_EMERGENCY_RETOOL_CREDIT_RESERVE,
  type AgentHarvesterDecision,
} from './agents'

export type SimulationBatchOptions = {
  games?: number
  rounds?: number
  includeMarket?: boolean
  seedStart?: number
  supplyDemandModel?: SimulationSupplyDemandModel
  productionModel?: SimulationProductionModel
}

export type SimulationBatchParticipantStats = {
  id: SimulationParticipantId
  name: string
  winShare: number
  winRate: number
  averageRank: number
  averageEconomicValue: number
  minimumEconomicValue: number
  maximumEconomicValue: number
  averageSettlementWealth: number
  averageRemainingResources: number
  averagePopulation: number
  averageCredits: number
  averageCrystals: number
  averageHarvesters: number
  averageOwnedTiles: number
  averageMaximumOwnedTileDistance: number
  farZoneReachRate: number
  naturalCrystalVeinReachRate: number
  averageFirstHarvesterExpansionRound: number | null
  averageFirstLandExpansionRound: number | null
  averageFirstFarZoneRound: number | null
  averageFirstNaturalCrystalVeinRound: number | null
  averageWarnings: number
}

export type SimulationBatchWindowParticipantStats = {
  averagePopulation: number
  averageFoodStock: number
  averageEnergyStock: number
  averageFoodProduction: number
  averageEnergyProduction: number
  averageFoodConsumption: number
  averageHqEnergyConsumption: number
  averageHarvesterEnergyConsumption: number
  energyOutageRate: number
  averageIdleHarvesters: number
  marketTransactionsPerGame: number
  supplySignalsPerGame: number
}

export type SimulationInactivityReason =
  | 'no-assigned-harvester'
  | 'energy-shortage'

export type SimulationBatchActivityParticipantStats = {
  averageLandPurchasesPerGame: number
  harvestingRoundRate: number
  harvesterUtilizationRate: number
  allHarvestersPoweredRoundRate: number
  emergencyHarvestRoundRate: number
  averageEmergencyHarvestUnitsPerGame: number
  productiveRoundRate: number
  gamesWithHarvestingPauseStreakRate: number
  averageLongestHarvestingPause: number
  maximumHarvestingPause: number
  marketAuctionParticipationRate: number
  marketSilenceRoundRate: number
  gamesWithMarketSilenceStreakRate: number
  averageLongestMarketSilence: number
  maximumMarketSilence: number
  transactionRoundRate: number
  inactivityRoundRate: number
  gamesWithInactivityStreakRate: number
  averageLongestInactivityStreak: number
  maximumInactivityStreak: number
}

export type SimulationBatchSupplyParticipantStats = {
  normalSupplyRoundRate: number
  basicSupplyRoundRate: number
  noSupplyRoundRate: number
  populationDeclineRoundRate: number
}

export type SimulationPopulationDeclineReason =
  | 'food'
  | 'energy'
  | 'food-and-energy'

export type SimulationFoodDeclineProductionState =
  | 'no-food-harvester'
  | 'food-harvester-inactive'
  | 'food-harvester-active'

export type SimulationMissingFoodHarvesterReason =
  | 'no-assigned-harvester'
  | 'no-food-capable-field'
  | 'insufficient-retool-credits-with-ore'
  | 'insufficient-retool-credits-without-ore'
  | 'planning-constraint'

export type SimulationInactivityStreak = {
  seed: number
  participantId: SimulationParticipantId
  startRound: number
  endRound: number
  length: number
  reason: SimulationInactivityReason
}

export type SimulationBatchResult = {
  games: number
  rounds: number
  includeMarket: boolean
  seedStart: number
  supplyDemandModel: SimulationSupplyDemandModel
  productionModel: SimulationProductionModel
  uniqueOutcomes: number
  participants: Record<
    SimulationParticipantId,
    SimulationBatchParticipantStats
  >
  averages: {
    warnings: number
    totalMarketTransactions: number
    playerTrades: number
    warehouseTrades: number
    interstellarTrades: number
    meteorImpacts: number
    playerTradeShare: number
  }
  warningCounts: Record<
    SimulationWarning['kind'],
    number
  >
  harvesterDecisionCounts: Record<
    AgentHarvesterDecision['reason'],
    number
  >
  harvesterBuildRoundCounts: Record<string, number>
  activity: {
    participants: Record<
      SimulationParticipantId,
      SimulationBatchActivityParticipantStats
    >
    inactivityReasonCounts: Record<
      SimulationInactivityReason,
      number
    >
    harvestingPauseReasonCounts: Record<
      SimulationInactivityReason,
      number
    >
    longestInactivityStreaks: SimulationInactivityStreak[]
  }
  supply: {
    participants: Record<
      SimulationParticipantId,
      SimulationBatchSupplyParticipantStats
    >
    populationDeclineReasonCounts: Record<
      SimulationPopulationDeclineReason,
      number
    >
    foodDeclineProductionStateCounts: Record<
      SimulationFoodDeclineProductionState,
      number
    >
    missingFoodHarvesterReasonCounts: Record<
      SimulationMissingFoodHarvesterReason,
      number
    >
  }
  midgame: {
    roundStart: number
    roundEnd: number
    participants: Record<
      SimulationParticipantId,
      SimulationBatchWindowParticipantStats
    >
  }
}

type MutableWindowParticipantStats = {
  samples: number
  population: number
  foodStock: number
  energyStock: number
  foodProduction: number
  energyProduction: number
  foodConsumption: number
  hqEnergyConsumption: number
  harvesterEnergyConsumption: number
  energyOutageRounds: number
  idleHarvesters: number
  marketTransactions: number
  supplySignals: number
}

type MutableParticipantStats = {
  id: SimulationParticipantId
  name: string
  winShare: number
  rankTotal: number
  economicValueTotal: number
  minimumEconomicValue: number
  maximumEconomicValue: number
  settlementWealthTotal: number
  remainingResourcesTotal: number
  populationTotal: number
  creditsTotal: number
  crystalsTotal: number
  harvestersTotal: number
  ownedTilesTotal: number
  maximumOwnedTileDistanceTotal: number
  farZoneReachCount: number
  naturalCrystalVeinReachCount: number
  firstHarvesterExpansionRoundTotal: number
  firstHarvesterExpansionCount: number
  firstLandExpansionRoundTotal: number
  firstLandExpansionCount: number
  firstFarZoneRoundTotal: number
  firstFarZoneCount: number
  firstNaturalCrystalVeinRoundTotal: number
  firstNaturalCrystalVeinCount: number
  warningTotal: number
}

type MutableActivityParticipantStats = {
  rounds: number
  landPurchases: number
  harvestingRounds: number
  activeHarvesterTotal: number
  assignedHarvesterTotal: number
  allHarvestersPoweredRounds: number
  emergencyHarvestRounds: number
  emergencyHarvestUnits: number
  productiveRounds: number
  gamesWithHarvestingPauseStreak: number
  longestHarvestingPauseTotal: number
  maximumHarvestingPause: number
  marketAuctionEntries: number
  marketAuctionOpportunities: number
  marketSilenceRounds: number
  gamesWithMarketSilenceStreak: number
  longestMarketSilenceTotal: number
  maximumMarketSilence: number
  transactionRounds: number
  inactivityRounds: number
  gamesWithInactivityStreak: number
  longestInactivityStreakTotal: number
  maximumInactivityStreak: number
}

type MutableSupplyParticipantStats = {
  rounds: number
  normalSupplyRounds: number
  basicSupplyRounds: number
  noSupplyRounds: number
  populationDeclineRounds: number
}

const participantIds: SimulationParticipantId[] = [
  'agima',
  'orion',
  'nova',
  'vega',
]

const warningKinds: SimulationWarning['kind'][] = [
  'population-decline',
  'food-empty',
  'energy-empty',
  'land-lock',
  'large-wealth-gap',
]

const harvesterDecisionReasons:
  AgentHarvesterDecision['reason'][] = [
    'affordable',
    'insufficient-credits',
    'insufficient-ore',
    'unsafe-supply',
    'unavailable',
  ]

function clampInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.min(
    maximum,
    Math.max(
      minimum,
      Math.trunc(value ?? fallback),
    ),
  )
}

function round(value: number, digits: number = 2):
  number {
  const factor = 10 ** digits

  return Math.round(value * factor) / factor
}

function createMutableStats():
  Record<
    SimulationParticipantId,
    MutableParticipantStats
  > {
  return {
    agima: {
      id: 'agima',
      name: 'Agima',
      winShare: 0,
      rankTotal: 0,
      economicValueTotal: 0,
      minimumEconomicValue: Number.POSITIVE_INFINITY,
      maximumEconomicValue: Number.NEGATIVE_INFINITY,
      settlementWealthTotal: 0,
      remainingResourcesTotal: 0,
      populationTotal: 0,
      creditsTotal: 0,
      crystalsTotal: 0,
      harvestersTotal: 0,
      ownedTilesTotal: 0,
      maximumOwnedTileDistanceTotal: 0,
      farZoneReachCount: 0,
      naturalCrystalVeinReachCount: 0,
      firstHarvesterExpansionRoundTotal: 0,
      firstHarvesterExpansionCount: 0,
      firstLandExpansionRoundTotal: 0,
      firstLandExpansionCount: 0,
      firstFarZoneRoundTotal: 0,
      firstFarZoneCount: 0,
      firstNaturalCrystalVeinRoundTotal: 0,
      firstNaturalCrystalVeinCount: 0,
      warningTotal: 0,
    },
    orion: {
      id: 'orion',
      name: 'Orion',
      winShare: 0,
      rankTotal: 0,
      economicValueTotal: 0,
      minimumEconomicValue: Number.POSITIVE_INFINITY,
      maximumEconomicValue: Number.NEGATIVE_INFINITY,
      settlementWealthTotal: 0,
      remainingResourcesTotal: 0,
      populationTotal: 0,
      creditsTotal: 0,
      crystalsTotal: 0,
      harvestersTotal: 0,
      ownedTilesTotal: 0,
      maximumOwnedTileDistanceTotal: 0,
      farZoneReachCount: 0,
      naturalCrystalVeinReachCount: 0,
      firstHarvesterExpansionRoundTotal: 0,
      firstHarvesterExpansionCount: 0,
      firstLandExpansionRoundTotal: 0,
      firstLandExpansionCount: 0,
      firstFarZoneRoundTotal: 0,
      firstFarZoneCount: 0,
      firstNaturalCrystalVeinRoundTotal: 0,
      firstNaturalCrystalVeinCount: 0,
      warningTotal: 0,
    },
    nova: {
      id: 'nova',
      name: 'Nova',
      winShare: 0,
      rankTotal: 0,
      economicValueTotal: 0,
      minimumEconomicValue: Number.POSITIVE_INFINITY,
      maximumEconomicValue: Number.NEGATIVE_INFINITY,
      settlementWealthTotal: 0,
      remainingResourcesTotal: 0,
      populationTotal: 0,
      creditsTotal: 0,
      crystalsTotal: 0,
      harvestersTotal: 0,
      ownedTilesTotal: 0,
      maximumOwnedTileDistanceTotal: 0,
      farZoneReachCount: 0,
      naturalCrystalVeinReachCount: 0,
      firstHarvesterExpansionRoundTotal: 0,
      firstHarvesterExpansionCount: 0,
      firstLandExpansionRoundTotal: 0,
      firstLandExpansionCount: 0,
      firstFarZoneRoundTotal: 0,
      firstFarZoneCount: 0,
      firstNaturalCrystalVeinRoundTotal: 0,
      firstNaturalCrystalVeinCount: 0,
      warningTotal: 0,
    },
    vega: {
      id: 'vega',
      name: 'Vega',
      winShare: 0,
      rankTotal: 0,
      economicValueTotal: 0,
      minimumEconomicValue: Number.POSITIVE_INFINITY,
      maximumEconomicValue: Number.NEGATIVE_INFINITY,
      settlementWealthTotal: 0,
      remainingResourcesTotal: 0,
      populationTotal: 0,
      creditsTotal: 0,
      crystalsTotal: 0,
      harvestersTotal: 0,
      ownedTilesTotal: 0,
      maximumOwnedTileDistanceTotal: 0,
      farZoneReachCount: 0,
      naturalCrystalVeinReachCount: 0,
      firstHarvesterExpansionRoundTotal: 0,
      firstHarvesterExpansionCount: 0,
      firstLandExpansionRoundTotal: 0,
      firstLandExpansionCount: 0,
      firstFarZoneRoundTotal: 0,
      firstFarZoneCount: 0,
      firstNaturalCrystalVeinRoundTotal: 0,
      firstNaturalCrystalVeinCount: 0,
      warningTotal: 0,
    },
  }
}

function createMutableWindowStats(): Record<
  SimulationParticipantId,
  MutableWindowParticipantStats
> {
  return Object.fromEntries(
    participantIds.map((participantId) => [
      participantId,
      {
        samples: 0,
        population: 0,
        foodStock: 0,
        energyStock: 0,
        foodProduction: 0,
        energyProduction: 0,
        foodConsumption: 0,
        hqEnergyConsumption: 0,
        harvesterEnergyConsumption: 0,
        energyOutageRounds: 0,
        idleHarvesters: 0,
        marketTransactions: 0,
        supplySignals: 0,
      },
    ]),
  ) as Record<
    SimulationParticipantId,
    MutableWindowParticipantStats
  >
}

function createMutableActivityStats(): Record<
  SimulationParticipantId,
  MutableActivityParticipantStats
> {
  return Object.fromEntries(
    participantIds.map((participantId) => [
      participantId,
      {
        rounds: 0,
        landPurchases: 0,
        harvestingRounds: 0,
        activeHarvesterTotal: 0,
        assignedHarvesterTotal: 0,
        allHarvestersPoweredRounds: 0,
        emergencyHarvestRounds: 0,
        emergencyHarvestUnits: 0,
        productiveRounds: 0,
        gamesWithHarvestingPauseStreak: 0,
        longestHarvestingPauseTotal: 0,
        maximumHarvestingPause: 0,
        marketAuctionEntries: 0,
        marketAuctionOpportunities: 0,
        marketSilenceRounds: 0,
        gamesWithMarketSilenceStreak: 0,
        longestMarketSilenceTotal: 0,
        maximumMarketSilence: 0,
        transactionRounds: 0,
        inactivityRounds: 0,
        gamesWithInactivityStreak: 0,
        longestInactivityStreakTotal: 0,
        maximumInactivityStreak: 0,
      },
    ]),
  ) as Record<
    SimulationParticipantId,
    MutableActivityParticipantStats
  >
}

function createMutableSupplyStats(): Record<
  SimulationParticipantId,
  MutableSupplyParticipantStats
> {
  return Object.fromEntries(
    participantIds.map((participantId) => [
      participantId,
      {
        rounds: 0,
        normalSupplyRounds: 0,
        basicSupplyRounds: 0,
        noSupplyRounds: 0,
        populationDeclineRounds: 0,
      },
    ]),
  ) as Record<
    SimulationParticipantId,
    MutableSupplyParticipantStats
  >
}

function getInactivityReason(
  assignedHarvesters: number,
): SimulationInactivityReason {
  if (assignedHarvesters === 0) {
    return 'no-assigned-harvester'
  }

  return 'energy-shortage'
}

export function runHeadlessSimulationBatch(
  options: SimulationBatchOptions = {},
): SimulationBatchResult {
  const games = clampInteger(
    options.games,
    100,
    1,
    1000,
  )
  const rounds = clampInteger(
    options.rounds,
    GAME_ROUND_LIMIT,
    1,
    GAME_ROUND_LIMIT,
  )
  const seedStart = clampInteger(
    options.seedStart,
    1,
    1,
    Number.MAX_SAFE_INTEGER - games,
  )
  const includeMarket =
    options.includeMarket ?? true
  const supplyDemandModel =
    options.supplyDemandModel ?? 'grouped'
  const productionModel =
    options.productionModel ?? 'current'
  const mutableStats = createMutableStats()
  const mutableMidgameStats =
    createMutableWindowStats()
  const mutableActivityStats =
    createMutableActivityStats()
  const mutableSupplyStats = createMutableSupplyStats()
  const midgameRoundStart = Math.min(5, rounds)
  const midgameRoundEnd = Math.min(12, rounds)
  const warningCounts = Object.fromEntries(
    warningKinds.map((kind) => [kind, 0]),
  ) as Record<SimulationWarning['kind'], number>
  const harvesterDecisionCounts = Object.fromEntries(
    harvesterDecisionReasons.map((reason) => [
      reason,
      0,
    ]),
  ) as Record<
    AgentHarvesterDecision['reason'],
    number
  >
  const harvesterBuildRoundCounts: Record<string, number> = {}
  const inactivityReasonCounts: Record<
    SimulationInactivityReason,
    number
  > = {
    'no-assigned-harvester': 0,
    'energy-shortage': 0,
  }
  const harvestingPauseReasonCounts = {
    'no-assigned-harvester': 0,
    'energy-shortage': 0,
  }
  const inactivityStreaks: SimulationInactivityStreak[] = []
  const populationDeclineReasonCounts: Record<
    SimulationPopulationDeclineReason,
    number
  > = {
    food: 0,
    energy: 0,
    'food-and-energy': 0,
  }
  const foodDeclineProductionStateCounts: Record<
    SimulationFoodDeclineProductionState,
    number
  > = {
    'no-food-harvester': 0,
    'food-harvester-inactive': 0,
    'food-harvester-active': 0,
  }
  const missingFoodHarvesterReasonCounts: Record<
    SimulationMissingFoodHarvesterReason,
    number
  > = {
    'no-assigned-harvester': 0,
    'no-food-capable-field': 0,
    'insufficient-retool-credits-with-ore': 0,
    'insufficient-retool-credits-without-ore': 0,
    'planning-constraint': 0,
  }
  const outcomeSignatures = new Set<string>()
  let warningTotal = 0
  let totalMarketTransactions = 0
  let playerTrades = 0
  let warehouseTrades = 0
  let interstellarTrades = 0
  let meteorImpacts = 0

  for (
    let gameIndex = 0;
    gameIndex < games;
    gameIndex += 1
  ) {
    const seed = seedStart + gameIndex
    const result = runHeadlessEconomicSimulation({
      rounds,
      includeMarket,
      seed,
      supplyDemandModel,
      productionModel,
    })
    const finalParticipants = Object.fromEntries(
      result.finalStandings.map(
        (participant) => [
          participant.id,
          participant,
        ],
      ),
    ) as Record<
      SimulationParticipantId,
      SimulationParticipantSnapshot
    >
    const leadingParticipant = result.finalStandings[0]
    const winners = result.finalStandings.filter(
      (participant) =>
        leadingParticipant !== undefined &&
        compareSimulationFinalScores(
          participant,
          leadingParticipant,
        ) === 0,
    )
    const sharedWin = 1 / winners.length

    for (const winner of winners) {
      mutableStats[winner.id].winShare += sharedWin
    }

    for (const participantId of participantIds) {
      const participant =
        finalParticipants[participantId]
      const rank =
        1 +
        result.finalStandings.filter(
          (entry) =>
            compareSimulationFinalScores(
              entry,
              participant,
            ) < 0,
        ).length
      const participantWarnings =
        result.warnings.filter(
          (warning) =>
            warning.participantId === participantId,
        ).length
      const stats = mutableStats[participantId]

      stats.name = participant.name
      stats.rankTotal += rank
      stats.economicValueTotal += participant.wealth
      stats.minimumEconomicValue = Math.min(
        stats.minimumEconomicValue,
        participant.wealth,
      )
      stats.maximumEconomicValue = Math.max(
        stats.maximumEconomicValue,
        participant.wealth,
      )
      stats.settlementWealthTotal +=
        participant.settlementWealth
      stats.remainingResourcesTotal +=
        participant.remainingResources
      stats.populationTotal +=
        participant.population
      stats.creditsTotal += participant.credits
      stats.crystalsTotal +=
        participant.resources.crystals
      stats.harvestersTotal += participant.harvesters
      stats.ownedTilesTotal += participant.ownedTiles
      stats.maximumOwnedTileDistanceTotal +=
        participant.maximumOwnedTileDistance
      if (participant.ownsFarZoneTile) {
        stats.farZoneReachCount += 1
      }
      if (participant.ownsNaturalCrystalVein) {
        stats.naturalCrystalVeinReachCount += 1
      }
      const firstHarvesterExpansion =
        result.history.find(
          (snapshot) =>
            snapshot.participants[participantId]
              .harvesters > 2,
        )
      const firstLandExpansion =
        result.history.find(
          (snapshot) =>
            snapshot.participants[participantId]
              .ownedTiles > 2,
        )
      const firstFarZone = result.history.find(
        (snapshot) =>
          snapshot.participants[participantId]
            .ownsFarZoneTile,
      )
      const firstNaturalCrystalVein =
        result.history.find(
          (snapshot) =>
            snapshot.participants[participantId]
              .ownsNaturalCrystalVein,
        )
      if (firstHarvesterExpansion) {
        stats.firstHarvesterExpansionRoundTotal +=
          firstHarvesterExpansion.round
        stats.firstHarvesterExpansionCount += 1
      }
      if (firstLandExpansion) {
        stats.firstLandExpansionRoundTotal +=
          firstLandExpansion.round
        stats.firstLandExpansionCount += 1
      }
      if (firstFarZone) {
        stats.firstFarZoneRoundTotal +=
          firstFarZone.round
        stats.firstFarZoneCount += 1
      }
      if (firstNaturalCrystalVein) {
        stats.firstNaturalCrystalVeinRoundTotal +=
          firstNaturalCrystalVein.round
        stats.firstNaturalCrystalVeinCount += 1
      }
      stats.warningTotal += participantWarnings
    }

    for (const warning of result.warnings) {
      warningCounts[warning.kind] += 1
      if (
        warning.round >= midgameRoundStart &&
        warning.round <= midgameRoundEnd &&
        warning.participantId !== 'all' &&
        (warning.kind === 'population-decline' ||
          warning.kind === 'food-empty' ||
          warning.kind === 'energy-empty')
      ) {
        mutableMidgameStats[
          warning.participantId
        ].supplySignals += 1
      }
    }
    for (
      let round = midgameRoundStart;
      round <= midgameRoundEnd;
      round += 1
    ) {
      const before = result.history[round - 1]
      const current = result.history[round]
      if (!before || !current) {
        continue
      }

      for (const participantId of participantIds) {
        const previousParticipant =
          before.participants[participantId]
        const participant =
          current.participants[participantId]
        const transactions =
          result.marketTransactions.filter(
            (transaction) =>
              transaction.round === round &&
              (transaction.buyer === participantId ||
                transaction.seller === participantId),
          )
        const marketDelta = (
          resource: 'food' | 'energy',
        ): number =>
          transactions.reduce((total, transaction) => {
            if (transaction.resource !== resource) {
              return total
            }
            if (transaction.buyer === participantId) {
              return total + transaction.quantity
            }
            return total - transaction.quantity
          }, 0)
        const stats =
          mutableMidgameStats[participantId]

        stats.samples += 1
        stats.population += participant.population
        stats.foodStock += participant.resources.food
        stats.energyStock += participant.resources.energy
        stats.foodConsumption += participant.consumedFood
        stats.hqEnergyConsumption +=
          participant.consumedEnergyByHq
        stats.harvesterEnergyConsumption +=
          participant.consumedEnergyByHarvesters
        stats.foodProduction += Math.max(
          0,
          participant.resources.food -
            previousParticipant.resources.food -
            marketDelta('food') +
            participant.consumedFood,
        )
        stats.energyProduction += Math.max(
          0,
          participant.resources.energy -
            previousParticipant.resources.energy -
            marketDelta('energy') +
            participant.consumedEnergyByHq +
            participant.consumedEnergyByHarvesters,
        )
        stats.energyOutageRounds +=
          participant.inactiveHarvesters > 0 ? 1 : 0
        stats.idleHarvesters += participant.idleHarvesters
        stats.marketTransactions += transactions.length
      }
    }
    for (const snapshot of result.history.slice(1)) {
      for (const participant of Object.values(
        snapshot.participants,
      )) {
        if (participant.harvesterBuildDecision) {
          harvesterDecisionCounts[
            participant.harvesterBuildDecision
          ] += 1
          if (
            participant.harvesterBuildDecision ===
            'affordable'
          ) {
            const roundKey = String(snapshot.round)
            harvesterBuildRoundCounts[roundKey] =
              (harvesterBuildRoundCounts[roundKey] ?? 0) +
              1
          }
        }
      }
    }
    for (const participantId of participantIds) {
      const stats = mutableActivityStats[participantId]
      let activeStreak:
        | Omit<SimulationInactivityStreak, 'endRound' | 'length'>
        | null = null
      let longestGameStreak = 0
      let harvestingPause = 0
      let longestHarvestingPause = 0
      let marketSilence = 0
      let longestMarketSilence = 0

      const finishStreak = (endRound: number): void => {
        if (!activeStreak) {
          return
        }
        const streak: SimulationInactivityStreak = {
          ...activeStreak,
          endRound,
          length: endRound - activeStreak.startRound + 1,
        }
        longestGameStreak = Math.max(
          longestGameStreak,
          streak.length,
        )
        if (streak.length >= 2) {
          inactivityStreaks.push(streak)
        }
        activeStreak = null
      }

      for (const snapshot of result.history.slice(1)) {
        const participant =
          snapshot.participants[participantId]
        const activity = snapshot.activity[participantId]
        const inactive =
          activity.activeHarvesters === 0 &&
          activity.emergencyHarvested === 0 &&
          activity.marketAuctionEntries === 0 &&
          !activity.boughtLand

        stats.rounds += 1
        stats.landPurchases += activity.boughtLand ? 1 : 0
        stats.harvestingRounds +=
          activity.activeHarvesters > 0 ? 1 : 0
        stats.activeHarvesterTotal +=
          activity.activeHarvesters
        stats.assignedHarvesterTotal +=
          participant.assignedHarvesters
        stats.allHarvestersPoweredRounds +=
          participant.assignedHarvesters > 0 &&
          activity.activeHarvesters ===
            participant.assignedHarvesters
            ? 1
            : 0
        stats.emergencyHarvestRounds +=
          activity.emergencyHarvested > 0 ? 1 : 0
        stats.emergencyHarvestUnits +=
          activity.emergencyHarvested
        stats.productiveRounds +=
          activity.activeHarvesters > 0 ||
          activity.emergencyHarvested > 0
            ? 1
            : 0
        stats.marketAuctionEntries +=
          activity.marketAuctionEntries
        stats.marketAuctionOpportunities +=
          activity.marketAuctionOpportunities
        const marketSilent =
          activity.marketAuctionOpportunities > 0 &&
          activity.marketAuctionEntries === 0
        stats.marketSilenceRounds += marketSilent ? 1 : 0
        stats.transactionRounds +=
          activity.marketTransactions > 0 ? 1 : 0
        stats.inactivityRounds += inactive ? 1 : 0

        if (activity.activeHarvesters === 0) {
          harvestingPause += 1
          const reason =
            participant.assignedHarvesters === 0
              ? 'no-assigned-harvester'
              : 'energy-shortage'
          harvestingPauseReasonCounts[reason] += 1
        } else {
          longestHarvestingPause = Math.max(
            longestHarvestingPause,
            harvestingPause,
          )
          harvestingPause = 0
        }
        if (marketSilent) {
          marketSilence += 1
        } else {
          longestMarketSilence = Math.max(
            longestMarketSilence,
            marketSilence,
          )
          marketSilence = 0
        }

        if (!inactive) {
          finishStreak(snapshot.round - 1)
          continue
        }

        const reason = getInactivityReason(
          participant.assignedHarvesters,
        )
        inactivityReasonCounts[reason] += 1
        if (!activeStreak) {
          activeStreak = {
            seed,
            participantId,
            startRound: snapshot.round,
            reason,
          }
        }
      }
      finishStreak(rounds)
      longestHarvestingPause = Math.max(
        longestHarvestingPause,
        harvestingPause,
      )
      longestMarketSilence = Math.max(
        longestMarketSilence,
        marketSilence,
      )
      stats.longestHarvestingPauseTotal +=
        longestHarvestingPause
      stats.maximumHarvestingPause = Math.max(
        stats.maximumHarvestingPause,
        longestHarvestingPause,
      )
      if (longestHarvestingPause >= 2) {
        stats.gamesWithHarvestingPauseStreak += 1
      }
      stats.longestMarketSilenceTotal +=
        longestMarketSilence
      stats.maximumMarketSilence = Math.max(
        stats.maximumMarketSilence,
        longestMarketSilence,
      )
      if (longestMarketSilence >= 2) {
        stats.gamesWithMarketSilenceStreak += 1
      }
      stats.longestInactivityStreakTotal +=
        longestGameStreak
      stats.maximumInactivityStreak = Math.max(
        stats.maximumInactivityStreak,
        longestGameStreak,
      )
      if (longestGameStreak >= 2) {
        stats.gamesWithInactivityStreak += 1
      }
    }
    for (
      let roundNumber = 1;
      roundNumber < result.history.length;
      roundNumber += 1
    ) {
      const previous = result.history[roundNumber - 1]
      const current = result.history[roundNumber]

      for (const participantId of participantIds) {
        const before = previous.participants[participantId]
        const participant = current.participants[participantId]
        const stats = mutableSupplyStats[participantId]
        const populationGroups = Math.max(
          1,
          Math.ceil(before.population / 10),
        )
        const normalSupplyDemand =
          getSimulationNormalSupplyDemand(
            before.population,
            supplyDemandModel,
          )
        const hasNormalSupply =
          participant.consumedFood >= normalSupplyDemand &&
          participant.consumedEnergyByHq >=
            normalSupplyDemand
        const hasBasicSupply =
          participant.consumedFood >= populationGroups &&
          participant.consumedEnergyByHq >= populationGroups

        stats.rounds += 1
        stats.normalSupplyRounds += hasNormalSupply ? 1 : 0
        stats.basicSupplyRounds +=
          !hasNormalSupply && hasBasicSupply ? 1 : 0
        stats.noSupplyRounds += hasBasicSupply ? 0 : 1

        if (participant.population >= before.population) {
          continue
        }

        stats.populationDeclineRounds += 1
        const constraint =
          current.activity[participantId]
            .basicSupplyConstraint
        const reason: SimulationPopulationDeclineReason =
          constraint === 'none'
            ? participant.consumedFood === 0
              ? 'food'
              : 'energy'
            : constraint
        populationDeclineReasonCounts[reason] += 1
        if (reason === 'food') {
          const productionState: SimulationFoodDeclineProductionState =
            participant.foodHarvesters === 0
              ? 'no-food-harvester'
              : participant.inactiveFoodHarvesters >=
                participant.foodHarvesters
              ? 'food-harvester-inactive'
              : 'food-harvester-active'

          foodDeclineProductionStateCounts[
            productionState
          ] += 1
          if (productionState === 'no-food-harvester') {
            const missingReason: SimulationMissingFoodHarvesterReason =
              participant.assignedHarvesters === 0
                ? 'no-assigned-harvester'
                : participant.foodCapableOwnedTiles === 0
                ? 'no-food-capable-field'
                : participant.credits <
                  AGENT_EMERGENCY_RETOOL_CREDIT_RESERVE
                ? participant.resources.ore > 0
                  ? 'insufficient-retool-credits-with-ore'
                  : 'insufficient-retool-credits-without-ore'
                : 'planning-constraint'

            missingFoodHarvesterReasonCounts[
              missingReason
            ] += 1
          }
        }
      }
    }

    warningTotal += result.warnings.length
    totalMarketTransactions +=
      result.marketSummary.totalTransactions
    playerTrades +=
      result.marketSummary.playerTrades
    warehouseTrades +=
      result.marketSummary.warehouseTrades
    interstellarTrades +=
      result.marketSummary.interstellarTrades
    meteorImpacts += result.meteorImpacts.length
    outcomeSignatures.add(
      result.finalStandings
        .map(
          (participant) =>
            `${participant.id}:${participant.population}:` +
            `${participant.settlementWealth}:` +
            `${participant.remainingResources}:` +
            `${participant.harvesters}`,
        )
        .join('|'),
    )
  }

  const participants = Object.fromEntries(
    participantIds.map((participantId) => {
      const stats = mutableStats[participantId]

      return [
        participantId,
        {
          id: participantId,
          name: stats.name,
          winShare: round(stats.winShare),
          winRate: round(
            (stats.winShare / games) * 100,
          ),
          averageRank: round(
            stats.rankTotal / games,
          ),
          averageEconomicValue: round(
            stats.economicValueTotal / games,
          ),
          minimumEconomicValue:
            stats.minimumEconomicValue,
          maximumEconomicValue:
            stats.maximumEconomicValue,
          averageSettlementWealth: round(
            stats.settlementWealthTotal / games,
          ),
          averageRemainingResources: round(
            stats.remainingResourcesTotal / games,
          ),
          averagePopulation: round(
            stats.populationTotal / games,
          ),
          averageCredits: round(
            stats.creditsTotal / games,
          ),
          averageCrystals: round(
            stats.crystalsTotal / games,
          ),
          averageHarvesters: round(
            stats.harvestersTotal / games,
          ),
          averageOwnedTiles: round(
            stats.ownedTilesTotal / games,
          ),
          averageMaximumOwnedTileDistance: round(
            stats.maximumOwnedTileDistanceTotal / games,
          ),
          farZoneReachRate: round(
            (stats.farZoneReachCount / games) * 100,
          ),
          naturalCrystalVeinReachRate: round(
            (stats.naturalCrystalVeinReachCount / games) *
              100,
          ),
          averageFirstHarvesterExpansionRound:
            stats.firstHarvesterExpansionCount > 0
              ? round(
                  stats.firstHarvesterExpansionRoundTotal /
                    stats.firstHarvesterExpansionCount,
                )
              : null,
          averageFirstLandExpansionRound:
            stats.firstLandExpansionCount > 0
              ? round(
                  stats.firstLandExpansionRoundTotal /
                    stats.firstLandExpansionCount,
                )
              : null,
          averageFirstFarZoneRound:
            stats.firstFarZoneCount > 0
              ? round(
                  stats.firstFarZoneRoundTotal /
                    stats.firstFarZoneCount,
                )
              : null,
          averageFirstNaturalCrystalVeinRound:
            stats.firstNaturalCrystalVeinCount > 0
              ? round(
                  stats.firstNaturalCrystalVeinRoundTotal /
                    stats.firstNaturalCrystalVeinCount,
                )
              : null,
          averageWarnings: round(
            stats.warningTotal / games,
          ),
        },
      ]
    }),
  ) as Record<
    SimulationParticipantId,
    SimulationBatchParticipantStats
  >
  const midgameParticipants = Object.fromEntries(
    participantIds.map((participantId) => {
      const stats =
        mutableMidgameStats[participantId]
      const samples = Math.max(1, stats.samples)

      return [
        participantId,
        {
          averagePopulation: round(
            stats.population / samples,
          ),
          averageFoodStock: round(
            stats.foodStock / samples,
          ),
          averageEnergyStock: round(
            stats.energyStock / samples,
          ),
          averageFoodProduction: round(
            stats.foodProduction / samples,
          ),
          averageEnergyProduction: round(
            stats.energyProduction / samples,
          ),
          averageFoodConsumption: round(
            stats.foodConsumption / samples,
          ),
          averageHqEnergyConsumption: round(
            stats.hqEnergyConsumption / samples,
          ),
          averageHarvesterEnergyConsumption: round(
            stats.harvesterEnergyConsumption / samples,
          ),
          energyOutageRate: round(
            (stats.energyOutageRounds / samples) * 100,
          ),
          averageIdleHarvesters: round(
            stats.idleHarvesters / samples,
          ),
          marketTransactionsPerGame: round(
            stats.marketTransactions / games,
          ),
          supplySignalsPerGame: round(
            stats.supplySignals / games,
          ),
        },
      ]
    }),
  ) as Record<
    SimulationParticipantId,
    SimulationBatchWindowParticipantStats
  >
  const activityParticipants = Object.fromEntries(
    participantIds.map((participantId) => {
      const stats = mutableActivityStats[participantId]
      const sampledRounds = Math.max(1, stats.rounds)

      return [
        participantId,
        {
          averageLandPurchasesPerGame: round(
            stats.landPurchases / games,
          ),
          harvestingRoundRate: round(
            (stats.harvestingRounds / sampledRounds) * 100,
          ),
          harvesterUtilizationRate:
            stats.assignedHarvesterTotal > 0
              ? round(
                  (stats.activeHarvesterTotal /
                    stats.assignedHarvesterTotal) *
                    100,
                )
              : 0,
          allHarvestersPoweredRoundRate: round(
            (stats.allHarvestersPoweredRounds /
              sampledRounds) *
              100,
          ),
          emergencyHarvestRoundRate: round(
            (stats.emergencyHarvestRounds / sampledRounds) *
              100,
          ),
          averageEmergencyHarvestUnitsPerGame: round(
            stats.emergencyHarvestUnits / games,
          ),
          productiveRoundRate: round(
            (stats.productiveRounds / sampledRounds) * 100,
          ),
          gamesWithHarvestingPauseStreakRate: round(
            (stats.gamesWithHarvestingPauseStreak /
              games) *
              100,
          ),
          averageLongestHarvestingPause: round(
            stats.longestHarvestingPauseTotal / games,
          ),
          maximumHarvestingPause:
            stats.maximumHarvestingPause,
          marketAuctionParticipationRate:
            stats.marketAuctionOpportunities > 0
              ? round(
                  (stats.marketAuctionEntries /
                    stats.marketAuctionOpportunities) *
                    100,
                )
              : 0,
          marketSilenceRoundRate: round(
            (stats.marketSilenceRounds / sampledRounds) *
              100,
          ),
          gamesWithMarketSilenceStreakRate: round(
            (stats.gamesWithMarketSilenceStreak /
              games) *
              100,
          ),
          averageLongestMarketSilence: round(
            stats.longestMarketSilenceTotal / games,
          ),
          maximumMarketSilence:
            stats.maximumMarketSilence,
          transactionRoundRate: round(
            (stats.transactionRounds / sampledRounds) * 100,
          ),
          inactivityRoundRate: round(
            (stats.inactivityRounds / sampledRounds) * 100,
          ),
          gamesWithInactivityStreakRate: round(
            (stats.gamesWithInactivityStreak / games) * 100,
          ),
          averageLongestInactivityStreak: round(
            stats.longestInactivityStreakTotal / games,
          ),
          maximumInactivityStreak:
            stats.maximumInactivityStreak,
        },
      ]
    }),
  ) as Record<
    SimulationParticipantId,
    SimulationBatchActivityParticipantStats
  >
  const supplyParticipants = Object.fromEntries(
    participantIds.map((participantId) => {
      const stats = mutableSupplyStats[participantId]
      const sampledRounds = Math.max(1, stats.rounds)

      return [
        participantId,
        {
          normalSupplyRoundRate: round(
            (stats.normalSupplyRounds / sampledRounds) * 100,
          ),
          basicSupplyRoundRate: round(
            (stats.basicSupplyRounds / sampledRounds) * 100,
          ),
          noSupplyRoundRate: round(
            (stats.noSupplyRounds / sampledRounds) * 100,
          ),
          populationDeclineRoundRate: round(
            (stats.populationDeclineRounds / sampledRounds) * 100,
          ),
        },
      ]
    }),
  ) as Record<
    SimulationParticipantId,
    SimulationBatchSupplyParticipantStats
  >

  return {
    games,
    rounds,
    includeMarket,
    seedStart,
    supplyDemandModel,
    productionModel,
    uniqueOutcomes: outcomeSignatures.size,
    participants,
    averages: {
      warnings: round(warningTotal / games),
      totalMarketTransactions: round(
        totalMarketTransactions / games,
      ),
      playerTrades: round(
        playerTrades / games,
      ),
      warehouseTrades: round(
        warehouseTrades / games,
      ),
      interstellarTrades: round(
        interstellarTrades / games,
      ),
      meteorImpacts: round(
        meteorImpacts / games,
      ),
      playerTradeShare:
        totalMarketTransactions > 0
          ? round(
              (playerTrades /
                totalMarketTransactions) *
                100,
            )
          : 0,
    },
    warningCounts,
    harvesterDecisionCounts,
    harvesterBuildRoundCounts,
    activity: {
      participants: activityParticipants,
      inactivityReasonCounts,
      harvestingPauseReasonCounts,
      longestInactivityStreaks: inactivityStreaks
        .sort(
          (first, second) =>
            second.length - first.length ||
            first.seed - second.seed ||
            first.participantId.localeCompare(
              second.participantId,
            ),
        )
        .slice(0, 8),
    },
    supply: {
      participants: supplyParticipants,
      populationDeclineReasonCounts,
      foodDeclineProductionStateCounts,
      missingFoodHarvesterReasonCounts,
    },
    midgame: {
      roundStart: midgameRoundStart,
      roundEnd: midgameRoundEnd,
      participants: midgameParticipants,
    },
  }
}
