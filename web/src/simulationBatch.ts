import { GAME_ROUND_LIMIT } from './game'
import {
  compareSimulationFinalScores,
  runHeadlessEconomicSimulation,
  type SimulationParticipantId,
  type SimulationParticipantSnapshot,
  type SimulationWarning,
} from './simulation'
import type { AgentHarvesterDecision } from './agents'

export type SimulationBatchOptions = {
  games?: number
  rounds?: number
  includeMarket?: boolean
  seedStart?: number
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

export type SimulationBatchResult = {
  games: number
  rounds: number
  includeMarket: boolean
  seedStart: number
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
  const mutableStats = createMutableStats()
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

  return {
    games,
    rounds,
    includeMarket,
    seedStart,
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
  }
}
