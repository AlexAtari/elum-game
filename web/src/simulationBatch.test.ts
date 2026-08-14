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
    expect(result.midgame.roundStart).toBe(5)
    expect(result.midgame.roundEnd).toBe(12)
    for (const participant of Object.values(
      result.midgame.participants,
    )) {
      expect(
        participant.averageFoodProduction,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.averageEnergyProduction,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.energyOutageRate,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.energyOutageRate,
      ).toBeLessThanOrEqual(100)
      expect(
        participant.averageIdleHarvesters,
      ).toBeGreaterThanOrEqual(0)
    }
    for (const participant of Object.values(
      result.activity.participants,
    )) {
      expect(
        participant.averageLandPurchasesPerGame,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.harvestingRoundRate,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.harvestingRoundRate,
      ).toBeLessThanOrEqual(100)
      expect(
        participant.harvesterUtilizationRate,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.harvesterUtilizationRate,
      ).toBeLessThanOrEqual(100)
      expect(
        participant.allHarvestersPoweredRoundRate,
      ).toBeLessThanOrEqual(100)
      expect(
        participant.emergencyHarvestRoundRate,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.averageEmergencyHarvestUnitsPerGame,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.productiveRoundRate,
      ).toBeGreaterThanOrEqual(
        participant.harvestingRoundRate,
      )
      expect(
        participant.marketAuctionParticipationRate,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.marketAuctionParticipationRate,
      ).toBeLessThanOrEqual(100)
      expect(
        participant.inactivityRoundRate,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.inactivityRoundRate,
      ).toBeLessThanOrEqual(100)
      expect(
        participant.maximumInactivityStreak,
      ).toBeGreaterThanOrEqual(0)
    }
    for (const participant of Object.values(
      result.supply.participants,
    )) {
      expect(
        participant.normalSupplyRoundRate,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.basicSupplyRoundRate,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.noSupplyRoundRate,
      ).toBeGreaterThanOrEqual(0)
      expect(
        participant.normalSupplyRoundRate +
          participant.basicSupplyRoundRate +
          participant.noSupplyRoundRate,
      ).toBeCloseTo(100, 1)
      expect(
        participant.populationDeclineRoundRate,
      ).toBeLessThanOrEqual(
        participant.noSupplyRoundRate,
      )
    }
    expect(
      Object.values(
        result.supply.foodDeclineProductionStateCounts,
      ).reduce((total, count) => total + count, 0),
    ).toBeLessThanOrEqual(
      result.supply.populationDeclineReasonCounts.food,
    )
    expect(
      Object.values(
        result.supply.missingFoodHarvesterReasonCounts,
      ).reduce((total, count) => total + count, 0),
    ).toBe(
      result.supply.foodDeclineProductionStateCounts[
        'no-food-harvester'
      ],
    )
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

  it('hält geglättete Versorgung als explizite Analysevariante getrennt', () => {
    const grouped = runHeadlessSimulationBatch({
      games: 8,
      seedStart: 30,
      supplyDemandModel: 'grouped',
    })
    const smoothed = runHeadlessSimulationBatch({
      games: 8,
      seedStart: 30,
      supplyDemandModel: 'smoothed',
    })

    expect(grouped.supplyDemandModel).toBe('grouped')
    expect(smoothed.supplyDemandModel).toBe('smoothed')
    expect(smoothed).not.toEqual(grouped)
  })

  it('hält höhere Grundproduktion als explizite Analysevariante getrennt', () => {
    const current = runHeadlessSimulationBatch({
      games: 8,
      seedStart: 40,
      productionModel: 'current',
    })
    const boosted = runHeadlessSimulationBatch({
      games: 8,
      seedStart: 40,
      productionModel: 'boosted',
    })

    expect(current.productionModel).toBe('current')
    expect(boosted.productionModel).toBe('boosted')
    expect(boosted).not.toEqual(current)
  })

  it('hält den Energiebonus als explizite Analysevariante getrennt', () => {
    const current = runHeadlessSimulationBatch({
      games: 8,
      seedStart: 40,
      productionModel: 'current',
    })
    const energyBoosted = runHeadlessSimulationBatch({
      games: 8,
      seedStart: 40,
      productionModel: 'energy-boosted',
    })

    expect(energyBoosted.productionModel).toBe(
      'energy-boosted',
    )
    expect(energyBoosted).not.toEqual(current)
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
