import { describe, expect, it } from 'vitest'
import {
  runHeadlessEconomicSimulation,
  type HeadlessSimulationResult,
  type SimulationParticipantSnapshot,
  type SimulationWarning,
} from './simulation'

const showReport =
  (
    globalThis as {
      process?: {
        env?: Record<string, string | undefined>
      }
    }
  ).process?.env?.ELUM_SIMULATION_REPORT === '1'

const warningLabels: Record<
  SimulationWarning['kind'],
  string
> = {
  'population-decline': 'Bevölkerungsrückgang',
  'food-empty': 'Nahrung aufgebraucht',
  'energy-empty': 'Energie aufgebraucht',
  'land-lock': 'Grundstücksblockade',
  'large-wealth-gap': 'Große Vermögenslücke',
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

function formatStanding(
  participant: SimulationParticipantSnapshot,
  rank: number,
): string {
  return [
    pad(rank, 4),
    pad(participant.name, 10, 'left'),
    pad(participant.population, 5),
    pad(participant.credits, 8),
    pad(participant.resources.food, 6),
    pad(participant.resources.energy, 7),
    pad(participant.resources.ore, 5),
    pad(participant.resources.crystals, 8),
    pad(participant.harvesters, 5),
    pad(participant.ownedTiles, 5),
    pad(participant.wealth, 9),
  ].join(' ')
}

function formatCheckpoints(
  result: HeadlessSimulationResult,
): string[] {
  const checkpointRounds = new Set([
    0,
    3,
    6,
    9,
    12,
    result.roundsPlayed,
  ])

  return result.history
    .filter((snapshot) =>
      checkpointRounds.has(snapshot.round),
    )
    .map((snapshot) => {
      const ranking = Object.values(
        snapshot.participants,
      )
        .sort(
          (first, second) =>
            second.wealth - first.wealth,
        )
        .map(
          (participant) =>
            `${participant.name} ${participant.wealth}`,
        )
        .join(' · ')

      return `Runde ${pad(snapshot.round, 2)}: ${ranking}`
    })
}

function formatWarnings(
  warnings: SimulationWarning[],
): string[] {
  if (warnings.length === 0) {
    return ['Keine wirtschaftlichen Warnungen erkannt.']
  }

  const counts = new Map<
    SimulationWarning['kind'],
    number
  >()

  for (const warning of warnings) {
    counts.set(
      warning.kind,
      (counts.get(warning.kind) ?? 0) + 1,
    )
  }

  const summary = Array.from(counts.entries())
    .map(
      ([kind, count]) =>
        `${warningLabels[kind]}: ${count}`,
    )
    .join(' · ')

  const details = warnings
    .slice(0, 12)
    .map(
      (warning) =>
        `Runde ${warning.round}: ${warning.message}`,
    )

  if (warnings.length > details.length) {
    details.push(
      `… ${warnings.length - details.length} weitere Warnungen`,
    )
  }

  return [summary, ...details]
}

export function formatSimulationReport(
  result: HeadlessSimulationResult,
): string {
  const lines = [
    '',
    '=============================================================',
    ' E.L.U.M. – INTERNE WIRTSCHAFTSSIMULATION',
    '=============================================================',
    `Runden: ${result.roundsPlayed}`,
    `Markt einbezogen: ${result.marketIncluded ? 'ja' : 'nein'}`,
    '',
    'ENDRANGLISTE',
    'Rang Kolonie      Bev  Credits   Food Energie   Erz Kristall  Harv  Land Vermögen',
    '---- ---------- ----- -------- ------ ------- ----- -------- ----- ----- ---------',
    ...result.finalStandings.map(formatStanding),
    '',
    'VERMÖGENSENTWICKLUNG',
    ...formatCheckpoints(result),
    '',
    `WARNUNGEN (${result.warnings.length})`,
    ...formatWarnings(result.warnings),
    '=============================================================',
    '',
  ]

  return lines.join('\n')
}

describe('Ausführbarer Simulationsbericht', () => {
  it('erstellt einen vollständigen Terminalbericht', () => {
    const result = runHeadlessEconomicSimulation()
    const report = formatSimulationReport(result)

    expect(result.finalStandings).toHaveLength(4)
    expect(report).toContain('ENDRANGLISTE')
    expect(report).toContain('Agima')
    expect(report).toContain('Orion')
    expect(report).toContain('Nova')
    expect(report).toContain('Vega')

    if (showReport) {
      console.log(report)
    }
  })
})
