import { GAME_ROUND_LIMIT } from './game'
import {
  compareSimulationFinalScores,
  runHeadlessEconomicSimulation,
  type SimulationParticipantId,
  type SimulationParticipantSnapshot,
  type SimulationWarning,
} from './simulation'

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
    playerTradeShare: number
  }
  warningCounts: Record<
    SimulationWarning['kind'],
    number
  >
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
  const outcomeSignatures = new Set<string>()
  let warningTotal = 0
  let totalMarketTransactions = 0
  let playerTrades = 0
  let warehouseTrades = 0

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
      stats.warningTotal += participantWarnings
    }

    for (const warning of result.warnings) {
      warningCounts[warning.kind] += 1
    }

    warningTotal += result.warnings.length
    totalMarketTransactions +=
      result.marketSummary.totalTransactions
    playerTrades +=
      result.marketSummary.playerTrades
    warehouseTrades +=
      result.marketSummary.warehouseTrades
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
  }
}
