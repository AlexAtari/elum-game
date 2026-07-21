import { describe, expect, it } from 'vitest'
import {
  beginLandTieBreak,
  cancelLandBid,
  completeResourceMarket,
  createInitialGameState,
  executeMarketTrade,
  orderHarvesterBuild,
  placeLandBid,
  runRound,
  type GameState,
  type HarvesterAssignments,
} from './game'

const normalSupply = {
  foodLevel: 2,
  energyLevel: 2,
}

describe('Markthandel', () => {
  it('kauft eine Einheit und bezahlt den Handelspreis', () => {
    const state = executeMarketTrade(
      createInitialGameState(),
      'food',
      'buy',
      8,
    )

    expect(state.credits).toBe(92)
    expect(state.resources.food).toBe(11)
  })

  it('verkauft eine Einheit und erhält den Handelspreis', () => {
    const state = executeMarketTrade(
      createInitialGameState(),
      'food',
      'sell',
      8,
    )

    expect(state.credits).toBe(108)
    expect(state.resources.food).toBe(9)
  })

  it('verhindert Handel ohne Geld oder Vorrat', () => {
    const emptyState: GameState = {
      ...createInitialGameState(),
      credits: 0,
      resources: {
        ...createInitialGameState().resources,
        food: 0,
      },
    }

    expect(
      executeMarketTrade(emptyState, 'food', 'buy', 8),
    ).toBe(emptyState)
    expect(
      executeMarketTrade(emptyState, 'food', 'sell', 8),
    ).toBe(emptyState)
  })

  it('überträgt je Transaktion genau eine Einheit mit dem HQ-Lager', () => {
    const state = executeMarketTrade(
      createInitialGameState(),
      'food',
      'sell',
      5,
      'warehouse',
    )

    expect(state.resources.food).toBe(9)
    expect(state.credits).toBe(105)
    expect(state.market.food.warehouseStock).toBe(21)
    expect(state.market.food.netWarehouseFlow).toBe(1)
  })

  it('senkt den Folgepreis bei hohem Zufluss ins HQ-Lager', () => {
    let state = createInitialGameState()

    for (let unit = 0; unit < 7; unit += 1) {
      state = executeMarketTrade(
        state,
        'food',
        'sell',
        5,
        'warehouse',
      )
    }

    const nextState = completeResourceMarket(state, 'food')

    expect(nextState.market.food.referencePrice).toBe(5)
    expect(nextState.market.food.warehouseStock).toBe(27)
    expect(nextState.market.food.netWarehouseFlow).toBe(0)
  })

  it('erhöht den Folgepreis bei hoher Nachfrage am HQ-Lager', () => {
    let state = createInitialGameState()

    for (let unit = 0; unit < 4; unit += 1) {
      state = executeMarketTrade(
        state,
        'food',
        'buy',
        11,
        'warehouse',
      )
    }

    const nextState = completeResourceMarket(state, 'food')

    expect(nextState.market.food.referencePrice).toBe(10)
    expect(nextState.market.food.warehouseStock).toBe(16)
    expect(nextState.market.food.netWarehouseFlow).toBe(0)
  })
})

describe('Harvesterbau', () => {
  it('bezahlt den Bauauftrag sofort mit Credits und Erz', () => {
    const state = orderHarvesterBuild(createInitialGameState())

    expect(state.credits).toBe(70)
    expect(state.resources.ore).toBe(2)
    expect(state.harvestersInConstruction).toBe(1)
  })

  it('verhindert einen Auftrag bei unzureichenden Ressourcen', () => {
    const firstOrder = orderHarvesterBuild(
      createInitialGameState(),
    )
    const secondOrder = orderHarvesterBuild(firstOrder)

    expect(secondOrder).toBe(firstOrder)
    expect(secondOrder.harvestersInConstruction).toBe(1)
  })

  it('stellt mehrere bezahlte Harvester zu Beginn der nächsten Runde fertig', () => {
    const richState: GameState = {
      ...createInitialGameState(),
      credits: 200,
      resources: {
        ...createInitialGameState().resources,
        ore: 10,
      },
    }
    const firstOrder = orderHarvesterBuild(richState)
    const secondOrder = orderHarvesterBuild(firstOrder)
    const result = runRound(secondOrder, {}, normalSupply)

    expect(result.report.completedHarvesters).toBe(2)
    expect(result.nextState.harvestersInConstruction).toBe(0)
    expect(result.nextState.credits).toBe(140)
    expect(result.nextState.resources.ore).toBe(4)
  })
})

describe('Grundstücksauktion', () => {
  it('reserviert das verdeckte Gebot', () => {
    const state = placeLandBid(
      createInitialGameState(),
      'C',
      30,
      35,
    )

    expect(state.credits).toBe(70)
    expect(state.pendingLandBid).toEqual({
      tileId: 'C',
      amount: 30,
      rivalBid: 35,
      tieMinimum: undefined,
    })
    expect(state.ownedTileIds).toEqual(['A', 'B'])
  })

  it('erstattet ein zurückgenommenes Gebot', () => {
    const reservedState = placeLandBid(
      createInitialGameState(),
      'C',
      30,
      35,
    )
    const state = cancelLandBid(reservedState)

    expect(state.credits).toBe(100)
    expect(state.pendingLandBid).toBeNull()
  })

  it('überträgt das Feld bei einem höheren Gebot an den Spieler', () => {
    const state = placeLandBid(
      createInitialGameState(),
      'C',
      36,
      35,
    )
    const result = runRound(state, {}, normalSupply)

    expect(result.nextState.credits).toBe(64)
    expect(result.nextState.ownedTileIds).toEqual([
      'A',
      'B',
      'C',
    ])
    expect(result.nextState.pendingLandBid).toBeNull()
    expect(result.report.landAuction?.outcome).toBe('won')
  })

  it('erstattet das Gebot und überträgt das Feld bei einer Niederlage an Orion', () => {
    const state = placeLandBid(
      createInitialGameState(),
      'C',
      30,
      35,
    )
    const result = runRound(state, {}, normalSupply)

    expect(result.nextState.credits).toBe(100)
    expect(result.nextState.ownedTileIds).toEqual(['A', 'B'])
    expect(result.nextState.opponentTileIds).toEqual(['C'])
    expect(result.report.landAuction?.outcome).toBe('lost')
  })

  it('fordert bei Gleichstand ein höheres Stichgebot', () => {
    const state = placeLandBid(
      createInitialGameState(),
      'C',
      30,
      30,
    )
    const tieState = beginLandTieBreak(state)

    expect(tieState.credits).toBe(100)
    expect(tieState.pendingLandBid).toBeNull()
    expect(tieState.landAuctionTie).toEqual({
      tileId: 'C',
      tiedBid: 30,
      minimumBid: 31,
    })

    const newBidState = placeLandBid(
      tieState,
      'C',
      35,
      34,
    )
    const result = runRound(newBidState, {}, normalSupply)

    expect(result.report.landAuction?.outcome).toBe('won')
    expect(result.nextState.ownedTileIds).toContain('C')
  })
})

describe('Versorgung und Bevölkerung', () => {
  it('verbraucht die geplante Versorgung und erhöht die Bevölkerung', () => {
    const result = runRound(
      createInitialGameState(),
      {},
      normalSupply,
    )

    expect(result.nextState.population).toBe(11)
    expect(result.nextState.resources.food).toBe(8)
    expect(result.nextState.resources.energy).toBe(8)
    expect(result.report.populationChange).toBe(1)
  })

  it('richtet die Bevölkerungsentwicklung nach der knapperen Ressource aus', () => {
    const state: GameState = {
      ...createInitialGameState(),
      population: 11,
      resources: {
        ...createInitialGameState().resources,
        food: 3,
      },
    }

    const result = runRound(state, {}, normalSupply)

    expect(result.report.consumedFood).toBe(3)
    expect(result.report.consumedEnergyByHq).toBe(4)
    expect(result.report.populationChange).toBe(0)
    expect(result.nextState.population).toBe(11)
  })
})

describe('Harvesterproduktion', () => {
  it('produziert beim erstmaligen Einsatz sofort mit voller Leistung', () => {
    const harvesters: HarvesterAssignments = {
      B: {
        production: 'energy',
        isNew: true,
      },
    }

    const result = runRound(
      createInitialGameState(),
      harvesters,
      normalSupply,
    )

    expect(result.report.produced.energy).toBe(4)
    expect(result.report.consumedEnergyByHarvesters).toBe(1)
    expect(result.nextState.resources.energy).toBe(11)
    expect(result.nextHarvesters.B).toEqual({
      production: 'energy',
      isNew: false,
    })
  })

  it('deaktiviert bei Energiemangel zuerst den schwächeren Harvester', () => {
    const state: GameState = {
      ...createInitialGameState(),
      resources: {
        ...createInitialGameState().resources,
        energy: 3,
      },
    }
    const harvesters: HarvesterAssignments = {
      A: {
        production: 'energy',
        isNew: false,
      },
      B: {
        production: 'energy',
        isNew: false,
      },
    }

    const result = runRound(state, harvesters, normalSupply)

    expect(result.report.inactiveHarvesterIds).toEqual(['A'])
    expect(result.report.produced.energy).toBe(4)
    expect(result.report.consumedEnergyByHarvesters).toBe(1)
    expect(result.nextState.resources.energy).toBe(4)
  })
})

describe('Umrüstung und Versetzung', () => {
  it('produziert bei einer Umrüstung die Hälfte der neuen Ressource aufgerundet', () => {
    const harvesters: HarvesterAssignments = {
      B: {
        production: 'energy',
        pendingProduction: 'food',
        retoolingReason: 'production-change',
        isNew: false,
      },
    }

    const result = runRound(
      createInitialGameState(),
      harvesters,
      normalSupply,
    )

    expect(result.report.produced.food).toBe(2)
    expect(result.report.produced.energy).toBe(0)
    expect(result.report.consumedEnergyByHarvesters).toBe(1)
    expect(result.report.completedRetoolingIds).toEqual(['B'])
    expect(result.nextHarvesters.B).toEqual({
      production: 'food',
      isNew: false,
    })
  })

  it('verbraucht bei einer Versetzung Energie, produziert aber noch nichts', () => {
    const harvesters: HarvesterAssignments = {
      B: {
        production: 'energy',
        pendingProduction: 'food',
        retoolingReason: 'relocation',
        isNew: false,
      },
    }

    const result = runRound(
      createInitialGameState(),
      harvesters,
      normalSupply,
    )

    expect(result.report.produced).toEqual({
      food: 0,
      energy: 0,
      ore: 0,
    })
    expect(result.report.consumedEnergyByHarvesters).toBe(1)
    expect(result.report.completedRetoolingIds).toEqual(['B'])
    expect(result.nextHarvesters.B).toEqual({
      production: 'food',
      isNew: false,
    })
  })

  it('pausiert eine Umrüstung, wenn nach der Versorgung keine Energie bleibt', () => {
    const state: GameState = {
      ...createInitialGameState(),
      resources: {
        ...createInitialGameState().resources,
        energy: 2,
      },
    }
    const harvesters: HarvesterAssignments = {
      B: {
        production: 'energy',
        pendingProduction: 'food',
        retoolingReason: 'production-change',
        isNew: false,
      },
    }

    const result = runRound(state, harvesters, normalSupply)

    expect(result.report.produced.food).toBe(0)
    expect(result.report.consumedEnergyByHarvesters).toBe(0)
    expect(result.report.completedRetoolingIds).toEqual([])
    expect(result.report.pausedRetoolingIds).toEqual(['B'])
    expect(result.nextHarvesters.B).toEqual(harvesters.B)
  })
})
