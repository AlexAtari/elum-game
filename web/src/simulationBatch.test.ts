import { describe, expect, it } from 'vitest'
import { GAME_ROUND_LIMIT } from './game'
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
    expect(result.rounds).toBe(GAME_ROUND_LIMIT)
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
        participant.averageEconomicValue,
      ).toBeGreaterThan(0)
      expect(
        participant.maximumEconomicValue,
      ).toBeGreaterThanOrEqual(
        participant.minimumEconomicValue,
      )
      expect(
        participant.averageSettlementWealth,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.averageRemainingResources,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.averageCrystals,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.averageHarvesters,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.averageOwnedTiles,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.averageMaximumOwnedTileDistance,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.farZoneReachRate,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.farZoneReachRate,
      ).toBeLessThanOrEqual(100)
      expect(
        participant.naturalCrystalVeinReachRate,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.naturalCrystalVeinReachRate,
      ).toBeLessThanOrEqual(100)
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
    expect(
      result.averages.meteorImpacts,
    ).toBeGreaterThanOrEqual(2)
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
