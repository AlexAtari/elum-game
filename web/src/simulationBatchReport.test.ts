import { describe, expect, it } from 'vitest'
import {
  runHeadlessSimulationBatch,
  type SimulationBatchParticipantStats,
  type SimulationBatchResult,
} from './simulationBatch'

const environment =
  (
    globalThis as {
      process?: {
        env?: Record<string, string | undefined>
      }
    }
  ).process?.env ?? {}

const showReport =
  environment.ELUM_BATCH_REPORT === '1'

function readRequestedGames(): number {
  const requested = Number(
    environment.ELUM_SIMULATION_GAMES,
  )

  if (!Number.isFinite(requested)) {
    return showReport ? 100 : 8
  }

  return Math.min(
    1000,
    Math.max(1, Math.trunc(requested)),
  )
}

function pad(
  value: string | number,
  width: number,
  align: 'left' | 'right' = 'right',
): string {
  const text = String(value)

  return align === 'left'
    ? text.padEnd(width)
    : text.padStart(width)
}

function formatParticipant(
  participant: SimulationBatchParticipantStats,
): string {
  return [
    pad(participant.name, 18, 'left'),
    pad(
      `${participant.winRate.toFixed(1)} %`,
      8,
    ),
    pad(
      participant.averageRank.toFixed(2),
      7,
    ),
    pad(
      participant.averageWealth.toFixed(1),
      10,
    ),
    pad(
      `${participant.minimumWealth}–${participant.maximumWealth}`,
      11,
    ),
    pad(
      participant.averagePopulation.toFixed(1),
      7,
    ),
    pad(
      participant.averageCredits.toFixed(1),
      9,
    ),
    pad(
      participant.averageWarnings.toFixed(2),
      9,
    ),
  ].join(' ')
}

export function formatSimulationBatchReport(
  result: SimulationBatchResult,
): string {
  const orderedParticipants = Object.values(
    result.participants,
  ).sort(
    (first, second) =>
      second.winRate - first.winRate ||
      first.averageRank - second.averageRank ||
      second.averageWealth -
        first.averageWealth,
  )
  const warningSummary = Object.entries(
    result.warningCounts,
  )
    .map(
      ([kind, count]) =>
        `${kind}: ${count}`,
    )
    .join(' · ')

  return [
    '',
    '=========================================================================',
    ' E.L.U.M. – BALANCING-SERIENSIMULATION',
    '=========================================================================',
    `Partien: ${result.games} · Runden: ${result.rounds} · Seeds: ` +
      `${result.seedStart}–${result.seedStart + result.games - 1}`,
    `Markt einbezogen: ${result.includeMarket ? 'ja' : 'nein'}`,
    `Unterschiedliche Endergebnisse: ${result.uniqueOutcomes}`,
    '',
    'KOLONIEN',
    'Kolonie              Siegquote  Ø Rang Ø Vermögen     Spanne  Ø Bev Ø Credits Ø Warn.',
    '------------------ -------- ------- ---------- ----------- ------- --------- ---------',
    ...orderedParticipants.map(
      formatParticipant,
    ),
    '',
    'MARKT JE PARTIE',
    `Transaktionen: ${result.averages.totalMarketTransactions.toFixed(1)}`,
    `Spielerhandel: ${result.averages.playerTrades.toFixed(1)} ` +
      `(${result.averages.playerTradeShare.toFixed(1)} %)`,
    `HQ-Lager: ${result.averages.warehouseTrades.toFixed(1)}`,
    '',
    'VERSORGUNG',
    `Warnungen je Partie: ${result.averages.warnings.toFixed(2)}`,
    warningSummary,
    '=========================================================================',
    '',
  ].join('\n')
}

describe('Terminalbericht der Seriensimulation', () => {
  it('erstellt eine Auswertung mehrerer Partien', () => {
    const games = readRequestedGames()
    const result = runHeadlessSimulationBatch({
      games,
      seedStart: 1,
    })
    const report =
      formatSimulationBatchReport(result)

    expect(result.games).toBe(games)
    expect(report).toContain(
      'BALANCING-SERIENSIMULATION',
    )
    expect(report).toContain('Siegquote')
    expect(report).toContain('Spielerhandel')
    expect(report).toContain('Agima')
    expect(report).toContain('Orion')
    expect(report).toContain('Nova')
    expect(report).toContain('Vega')

    if (showReport) {
      console.log(report)
    }
  })
})
