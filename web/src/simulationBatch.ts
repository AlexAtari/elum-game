import { GAME_ROUND_LIMIT } from './game'
import {
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
  averageWealth: number
  minimumWealth: number
  maximumWealth: number
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
  wealthTotal: number
  minimumWealth: number
  maximumWealth: number
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
      wealthTotal: 0,
      minimumWealth: Number.POSITIVE_INFINITY,
      maximumWealth: Number.NEGATIVE_INFINITY,
      populationTotal: 0,
      creditsTotal: 0,
      warningTotal: 0,
    },
    orion: {
      id: 'orion',
      name: 'Orion',
      winShare: 0,
      rankTotal: 0,
      wealthTotal: 0,
      minimumWealth: Number.POSITIVE_INFINITY,
      maximumWealth: Number.NEGATIVE_INFINITY,
      populationTotal: 0,
      creditsTotal: 0,
      warningTotal: 0,
    },
    nova: {
      id: 'nova',
      name: 'Nova',
      winShare: 0,
      rankTotal: 0,
      wealthTotal: 0,
      minimumWealth: Number.POSITIVE_INFINITY,
      maximumWealth: Number.NEGATIVE_INFINITY,
      populationTotal: 0,
      creditsTotal: 0,
      warningTotal: 0,
    },
    vega: {
      id: 'vega',
      name: 'Vega',
      winShare: 0,
      rankTotal: 0,
      wealthTotal: 0,
      minimumWealth: Number.POSITIVE_INFINITY,
      maximumWealth: Number.NEGATIVE_INFINITY,
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
    const highestWealth = Math.max(
      ...result.finalStandings.map(
        (participant) => participant.wealth,
      ),
    )
    const winners = result.finalStandings.filter(
      (participant) =>
        participant.wealth === highestWealth,
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
            entry.wealth > participant.wealth,
        ).length
      const participantWarnings =
        result.warnings.filter(
          (warning) =>
            warning.participantId === participantId,
        ).length
      const stats = mutableStats[participantId]

      stats.name = participant.name
      stats.rankTotal += rank
      stats.wealthTotal += participant.wealth
      stats.minimumWealth = Math.min(
        stats.minimumWealth,
        participant.wealth,
      )
      stats.maximumWealth = Math.max(
        stats.maximumWealth,
        participant.wealth,
      )
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
            `${participant.id}:${participant.wealth}`,
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
          averageWealth: round(
            stats.wealthTotal / games,
          ),
          minimumWealth: stats.minimumWealth,
          maximumWealth: stats.maximumWealth,
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
