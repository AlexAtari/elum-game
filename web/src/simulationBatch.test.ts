import { describe, expect, it } from 'vitest'
import {
  runHeadlessSimulationBatch,
} from './simulationBatch'

describe('Balancing-Seriensimulation', () => {
  it('wertet mehrere vollständige Partien gemeinsam aus', () => {
    const result = runHeadlessSimulationBatch({
      games: 12,
      seedStart: 1,
    })

    expect(result.games).toBe(12)
    expect(result.rounds).toBe(15)
    expect(result.includeMarket).toBe(true)
    expect(
      Object.keys(result.participants).sort(),
    ).toEqual([
      'agima',
      'nova',
      'orion',
      'vega',
    ])
    expect(result.uniqueOutcomes).toBeGreaterThan(1)
  })

  it('verteilt die Sieganteile vollständig', () => {
    const result = runHeadlessSimulationBatch({
      games: 16,
      seedStart: 20,
    })
    const winShare = Object.values(
      result.participants,
    ).reduce(
      (total, participant) =>
        total + participant.winShare,
      0,
    )

    expect(winShare).toBeCloseTo(
      result.games,
      1,
    )
  })

  it('liefert plausible Durchschnittswerte', () => {
    const result = runHeadlessSimulationBatch({
      games: 8,
    })

    for (
      const participant of Object.values(
        result.participants,
      )
    ) {
      expect(
        participant.averageRank,
      ).toBeGreaterThanOrEqual(1)
      expect(
        participant.averageRank,
      ).toBeLessThanOrEqual(4)
      expect(
        participant.averageWealth,
      ).toBeGreaterThan(0)
      expect(
        participant.maximumWealth,
      ).toBeGreaterThanOrEqual(
        participant.minimumWealth,
      )
      expect(
        participant.winRate,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.winRate,
      ).toBeLessThanOrEqual(100)
    }

    expect(
      result.averages.totalMarketTransactions,
    ).toBeGreaterThan(0)
    expect(
      result.averages.playerTrades,
    ).toBeGreaterThan(0)
  })

  it('ist bei gleichen Seeds reproduzierbar', () => {
    const options = {
      games: 10,
      seedStart: 77,
    }

    expect(
      runHeadlessSimulationBatch(options),
    ).toEqual(
      runHeadlessSimulationBatch(options),
    )
  })

  it('erzeugt mit anderen Seed-Bereichen andere Ergebnisse', () => {
    const first = runHeadlessSimulationBatch({
      games: 8,
      seedStart: 1,
    })
    const second = runHeadlessSimulationBatch({
      games: 8,
      seedStart: 101,
    })

    expect(second).not.toEqual(first)
  })
})
