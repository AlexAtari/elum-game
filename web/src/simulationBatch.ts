import { GAME_ROUND_LIMIT } from './game'
import {
  compareSimulationFinalScores,
  runHeadlessEconomicSimulation,
  type SimulationParticipantId,
  type SimulationParticipantSnapshot,
  type SimulationProductionModel,
  type SimulationSupplyDemandModel,
  type SimulationWarning,
} from './simulation'
import type { AgentHarvesterDecision } from './agents'

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
    midgame: {
      roundStart: midgameRoundStart,
      roundEnd: midgameRoundEnd,
      participants: midgameParticipants,
    },
  }
}
