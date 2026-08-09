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
      participant.averageSettlementWealth.toFixed(1),
      10,
    ),
    pad(
      participant.averageRemainingResources.toFixed(1),
      8,
    ),
    pad(
      participant.averageEconomicValue.toFixed(1),
      10,
    ),
    pad(
      `${participant.minimumEconomicValue}–${participant.maximumEconomicValue}`,
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
      participant.averageCrystals.toFixed(1),
      7,
    ),
    pad(
      participant.averageHarvesters.toFixed(1),
      7,
    ),
    pad(
      participant.averageOwnedTiles.toFixed(1),
      7,
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
      second.averageSettlementWealth -
        first.averageSettlementWealth,
  )
  const warningSummary = Object.entries(
    result.warningCounts,
  )
    .map(
      ([kind, count]) =>
        `${kind}: ${count}`,
    )
    .join(' · ')
  const harvesterDecisionSummary = Object.entries(
    result.harvesterDecisionCounts,
  )
    .map(
      ([reason, count]) =>
        `${reason}: ${count}`,
    )
    .join(' · ')
  const harvesterBuildRoundSummary = Object.entries(
    result.harvesterBuildRoundCounts,
  )
    .map(
      ([round, count]) =>
        `R${round}: ${count}`,
    )
    .join(' · ')
  const expansionSummary = Object.values(
    result.participants,
  )
    .map(
      (participant) =>
        `${participant.name}: Harvester R` +
        `${participant.averageFirstHarvesterExpansionRound ?? '–'}, ` +
        `Land R${participant.averageFirstLandExpansionRound ?? '–'}`,
    )
    .join(' · ')
  const explorationSummary = Object.values(
    result.participants,
  )
    .map(
      (participant) =>
        `${participant.name}: Ø Distanz ` +
        `${participant.averageMaximumOwnedTileDistance.toFixed(1)}, ` +
        `Fernzone ${participant.farZoneReachRate.toFixed(1)} % ` +
        `(R${participant.averageFirstFarZoneRound ?? '–'}), ` +
        `Ader ${participant.naturalCrystalVeinReachRate.toFixed(1)} % ` +
        `(R${participant.averageFirstNaturalCrystalVeinRound ?? '–'})`,
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
    `Versorgungsmodell: ${result.supplyDemandModel}`,
    `Unterschiedliche Endergebnisse: ${result.uniqueOutcomes}`,
    'Wertung: Bevölkerung → Abrechnungsvermögen → Restressourcen → Harvester',
    '',
    'KOLONIEN',
    'Kolonie              Siegquote  Ø Rang Ø Abrech. Ø Rest  Ø Ökon.     Spanne  Ø Bev Ø Credits  Ø Kri Ø Harv Ø Land Ø Warn.',
    '------------------ -------- ------- ---------- -------- ---------- ----------- ------- --------- ------- ------- ------- ---------',
    ...orderedParticipants.map(
      formatParticipant,
    ),
    '',
    'MARKT JE PARTIE',
    `Transaktionen: ${result.averages.totalMarketTransactions.toFixed(1)}`,
    `Spielerhandel: ${result.averages.playerTrades.toFixed(1)} ` +
      `(${result.averages.playerTradeShare.toFixed(1)} %)`,
    `HQ-Lager: ${result.averages.warehouseTrades.toFixed(1)}`,
    `Interstellarer Käufer: ${result.averages.interstellarTrades.toFixed(1)}`,
    `Meteoriten: ${result.averages.meteorImpacts.toFixed(1)}`,
    '',
    'VERSORGUNG',
    `Warnungen je Partie: ${result.averages.warnings.toFixed(2)}`,
    warningSummary,
    '',
    'HARVESTERBAU',
    harvesterDecisionSummary,
    `Baurunden: ${harvesterBuildRoundSummary || 'keine'}`,
    `Erste Expansion: ${expansionSummary}`,
    '',
    'FERNZONEN UND KRISTALLADERN',
    explorationSummary,
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
      includeMarket:
        environment.ELUM_SIMULATION_MARKET !== '0',
      supplyDemandModel:
        environment.ELUM_SIMULATION_SUPPLY ===
        'smoothed'
          ? 'smoothed'
          : 'grouped',
    })
    const report =
      formatSimulationBatchReport(result)

    expect(result.games).toBe(games)
    expect(report).toContain(
      'BALANCING-SERIENSIMULATION',
    )
    expect(report).toContain('Siegquote')
    expect(report).toContain('Wertung:')
    expect(report).toContain('Versorgungsmodell:')
    expect(report).toContain('Spielerhandel')
    expect(report).toContain('HARVESTERBAU')
    expect(report).toContain('Baurunden:')
    expect(report).toContain('Erste Expansion:')
    expect(report).toContain(
      'FERNZONEN UND KRISTALLADERN',
    )
    expect(report).toContain('Fernzone')
    expect(report).toContain('Ader')
    expect(report).toContain('Agima')
    expect(report).toContain('Orion')
    expect(report).toContain('Nova')
    expect(report).toContain('Vega')
    expect(
      Object.values(
        result.harvesterDecisionCounts,
      ).reduce((total, count) => total + count, 0),
    ).toBeGreaterThan(0)
    expect(
      result.participants.agima
        .averageFirstHarvesterExpansionRound,
    ).not.toBeNull()

    if (showReport) {
      console.log(report)
    }
  })
})
