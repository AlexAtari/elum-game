import { describe, expect, it } from 'vitest'
import {
  beginLandTieBreak,
  cancelLandBid,
  completeRoundAfterMarket,
  completeResourceMarket,
  createInitialGameState,
  createLeaderboardEntries,
  executeMarketTrade,
  getMarketTiming,
  getNextMarketResource,
  getOrionMarketRole,
  moveMarketOffer,
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
  it('lässt Verkäufer die Lagerlinie erst betreten und später wieder dahinter zurücktreten', () => {
    const parkedOffer = {
      active: false,
      price: 11,
    }
    const lineContact = moveMarketOffer(
      'seller',
      parkedOffer,
      -1,
      5,
      11,
      5,
    )
    const marketOffer = moveMarketOffer(
      'seller',
      lineContact,
      -1,
      5,
      11,
      5,
    )
    const backAtWarehouse = moveMarketOffer(
      'seller',
      { active: true, price: 11 },
      1,
      5,
      11,
      5,
    )

    expect(lineContact).toEqual({ active: true, price: 11 })
    expect(marketOffer).toEqual({ active: true, price: 10 })
    expect(backAtWarehouse).toEqual({
      active: false,
      price: 11,
    })
  })

  it('spiegelt Lagerkontakt und Rückzug für Käufer', () => {
    const parkedOffer = {
      active: false,
      price: 5,
    }
    const lineContact = moveMarketOffer(
      'buyer',
      parkedOffer,
      1,
      5,
      11,
      11,
    )
    const marketOffer = moveMarketOffer(
      'buyer',
      lineContact,
      1,
      5,
      11,
      11,
    )
    const backAtWarehouse = moveMarketOffer(
      'buyer',
      { active: true, price: 5 },
      -1,
      5,
      11,
      11,
    )

    expect(lineContact).toEqual({ active: true, price: 5 })
    expect(marketOffer).toEqual({ active: true, price: 6 })
    expect(backAtWarehouse).toEqual({
      active: false,
      price: 5,
    })
  })

  it('zeigt Orions tatsächliche Marktrolle bereits bei der Positionierung', () => {
    expect(getOrionMarketRole(1, 'food', 'seller')).toBe(
      'buyer',
    )
    expect(getOrionMarketRole(1, 'energy', 'buyer')).toBe(
      'seller',
    )
    expect(getOrionMarketRole(2, 'ore', 'seller')).toBe(
      'neutral',
    )
    expect(getOrionMarketRole(1, 'food', 'neutral')).toBe(
      'neutral',
    )
  })

  it('führt Nahrung, Energie und Erz in der vorgesehenen Reihenfolge', () => {
    expect(getNextMarketResource('food')).toBe('energy')
    expect(getNextMarketResource('energy')).toBe('ore')
    expect(getNextMarketResource('ore')).toBe('crystals')
    expect(getNextMarketResource('crystals')).toBeNull()
  })

  it('verkürzt den Markt in Runde zwei und ab Runde drei dauerhaft', () => {
    expect(getMarketTiming(1)).toEqual({
      declarationSeconds: 8,
      auctionSeconds: 30,
    })
    expect(getMarketTiming(2)).toEqual({
      declarationSeconds: 6,
      auctionSeconds: 25,
    })
    expect(getMarketTiming(3)).toEqual({
      declarationSeconds: 5,
      auctionSeconds: 20,
    })
    expect(getMarketTiming(12)).toEqual(getMarketTiming(3))
  })

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

  it('wendet dieselbe Lagerlogik auf Energie an', () => {
    const tradedState = executeMarketTrade(
      createInitialGameState(),
      'energy',
      'buy',
      11,
      'warehouse',
    )
    const nextState = completeResourceMarket(
      tradedState,
      'energy',
    )

    expect(tradedState.resources.energy).toBe(11)
    expect(tradedState.market.energy.warehouseStock).toBe(19)
    expect(nextState.market.energy.referencePrice).toBe(9)
  })

  it('wendet die Erzpreise und Lagerlogik auf Erz an', () => {
    const tradedState = executeMarketTrade(
      createInitialGameState(),
      'ore',
      'buy',
      20,
      'warehouse',
    )
    const nextState = completeResourceMarket(
      tradedState,
      'ore',
    )

    expect(tradedState.credits).toBe(80)
    expect(tradedState.resources.ore).toBe(6)
    expect(tradedState.market.ore.warehouseStock).toBe(19)
    expect(nextState.market.ore.referencePrice).toBe(16)
  })

  it('handelt Kristalle als vierten Ressourcenmarkt', () => {
    const tradedState = executeMarketTrade(
      createInitialGameState(),
      'crystals',
      'buy',
      50,
      'warehouse',
    )
    const nextState = completeResourceMarket(
      tradedState,
      'crystals',
    )

    expect(tradedState.credits).toBe(50)
    expect(tradedState.resources.crystals).toBe(1)
    expect(tradedState.market.crystals.warehouseStock).toBe(9)
    expect(nextState.market.crystals.referencePrice).toBe(41)
  })

  it('rechnet Marktkäufe vor Versorgung und Bevölkerung ab', () => {
    const hungryState: GameState = {
      ...createInitialGameState(),
      resources: {
        ...createInitialGameState().resources,
        food: 0,
      },
    }
    const firstPurchase = executeMarketTrade(
      hungryState,
      'food',
      'buy',
      11,
      'warehouse',
    )
    const secondPurchase = executeMarketTrade(
      firstPurchase,
      'food',
      'buy',
      11,
      'warehouse',
    )
    const stateAfterFoodMarket = completeResourceMarket(
      secondPurchase,
      'food',
    )
    const stateAfterEnergyMarket = completeResourceMarket(
      stateAfterFoodMarket,
      'energy',
    )
    const stateAfterOreMarket = completeResourceMarket(
      stateAfterEnergyMarket,
      'ore',
    )
    const result = completeRoundAfterMarket(
      stateAfterOreMarket,
      'crystals',
      {},
      normalSupply,
    )

    expect(
      runRound(hungryState, {}, normalSupply).nextState
        .population,
    ).toBe(9)
    expect(result.report.consumedFood).toBe(2)
    expect(result.nextState.resources.food).toBe(0)
    expect(result.nextState.population).toBe(11)
  })
})

describe('Rangliste', () => {
  it('zeigt echte Spielerwerte und sortiert Bevölkerung zuerst', () => {
    const state: GameState = {
      ...createInitialGameState(),
      population: 15,
      credits: 42,
      resources: {
        food: 3,
        energy: 4,
        ore: 5,
        crystals: 6,
      },
    }
    const entries = createLeaderboardEntries(state, 4, 2)
    const player = entries.find((entry) => entry.isPlayer)

    expect(player).toMatchObject({
      population: 15,
      credits: 42,
      resources: 18,
      harvesters: 4,
    })
    expect(entries[0].id).toBe('player')
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
