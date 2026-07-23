import { describe, expect, it } from 'vitest'
import {
  activateGlobalEvent,
  advanceRivalColonies,
  applyLocalEvent,
  beginLandTieBreak,
  cancelLandBid,
  completeRoundAfterMarket,
  completeResourceMarket,
  createInitialGameState,
  createLeaderboardEntries,
  executeMarketTrade,
  getEventScale,
  getGlobalEventAmount,
  getHarvesterCreditCost,
  getLocalEventAmount,
  getMarketTiming,
  getNextMarketResource,
  getOrionMarketRole,
  initiateResourceMarket,
  isGameFinished,
  isHarvesterBuildBlocked,
  isHarvesterRelocationBlocked,
  isHarvesterRetoolingBlocked,
  isLandBidBlocked,
  isMarketInitiationBlocked,
  globalEventIds,
  localEventIds,
  lowerLandTieBid,
  moveMarketOffer,
  orderHarvesterBuild,
  placeLandBid,
  raiseLandTieBid,
  resolveLandTieBreak,
  runRound,
  selectGlobalEvent,
  selectLocalEvent,
  type GameState,
  type HarvesterAssignments,
} from './game'

const normalSupply = {
  foodLevel: 2,
  energyLevel: 2,
}

describe('Ereignisse', () => {
  it('löst in Runde eins noch keine Ereignisse aus', () => {
    expect(selectGlobalEvent(1, 0, 0)).toBeNull()
    expect(selectLocalEvent(1, 0, 0)).toBeNull()
  })

  it('wählt globale und lokale Ereignisse mit getrennten Wahrscheinlichkeiten', () => {
    expect(selectGlobalEvent(2, 0.39, 0)).toBe(
      'fertile-season',
    )
    expect(selectGlobalEvent(2, 0.4, 0)).toBeNull()
    expect(selectLocalEvent(2, 0.49, 0)).toBe('food-cache')
    expect(selectLocalEvent(2, 0.5, 0)).toBeNull()
  })

  it('erlaubt dasselbe lokale Ereignis in zwei aufeinanderfolgenden Runden', () => {
    expect(selectLocalEvent(2, 0.2, 0.15)).toBe('ore-cache')
    expect(selectLocalEvent(3, 0.2, 0.15)).toBe('ore-cache')
  })

  it('enthält je 15 globale und lokale Ereignisse', () => {
    expect(globalEventIds).toHaveLength(15)
    expect(localEventIds).toHaveLength(15)
    expect(new Set(globalEventIds).size).toBe(15)
    expect(new Set(localEventIds).size).toBe(15)
  })

  it('verdoppelt Mengenwirkungen nach jeweils sechs Runden', () => {
    expect(getEventScale(1)).toBe(1)
    expect(getEventScale(6)).toBe(1)
    expect(getEventScale(7)).toBe(2)
    expect(getEventScale(12)).toBe(2)
    expect(getEventScale(13)).toBe(4)
    expect(getGlobalEventAmount('colonial-grant', 13)).toBe(60)
    expect(getLocalEventAmount('food-cache', 13)).toBe(12)
    expect(getLocalEventAmount('labor-strike', 13)).toBeNull()
  })

  it('wendet lokale Gewinne und Verluste sofort an', () => {
    const initialState = {
      ...createInitialGameState(),
      resources: {
        ...createInitialGameState().resources,
        food: 1,
        energy: 1,
      },
    }
    const withCredits = applyLocalEvent(
      initialState,
      'credit-grant',
    )
    const afterFoodLoss = applyLocalEvent(
      withCredits,
      'spoiled-food',
    )
    const afterEnergyLoss = applyLocalEvent(
      afterFoodLoss,
      'energy-leak',
    )

    expect(withCredits.credits).toBe(115)
    expect(afterFoodLoss.resources.food).toBe(0)
    expect(afterEnergyLoss.resources.energy).toBe(0)
  })

  it('skaliert lokale Mengenereignisse mit der aktuellen Runde', () => {
    const roundSevenState = {
      ...createInitialGameState(),
      round: 7,
    }
    const roundThirteenState = {
      ...createInitialGameState(),
      round: 13,
    }

    expect(
      applyLocalEvent(roundSevenState, 'ore-cache').resources.ore,
    ).toBe(9)
    expect(
      applyLocalEvent(roundThirteenState, 'new-settlers')
        .population,
    ).toBe(14)
  })

  it('wendet globale Zuschüsse und Kristallstörungen auf alle Kolonien an', () => {
    const roundSevenState = {
      ...createInitialGameState(),
      round: 7,
      resources: {
        ...createInitialGameState().resources,
        crystals: 1,
      },
    }
    const withGrant = activateGlobalEvent(
      roundSevenState,
      'colonial-grant',
    )
    const withCrystals = activateGlobalEvent(
      roundSevenState,
      'crystal-rain',
    )
    const afterDisruption = activateGlobalEvent(
      roundSevenState,
      'crystal-disruption',
    )

    expect(withGrant.credits).toBe(130)
    expect(withGrant.rivals.orion.credits).toBe(126)
    expect(withCrystals.resources.crystals).toBe(3)
    expect(withCrystals.rivals.orion.resources.crystals).toBe(2)
    expect(afterDisruption.resources.crystals).toBe(0)
    expect(afterDisruption.rivals.orion.resources.crystals).toBe(
      0,
    )
  })

  it('verbilligt Harvester skaliert und niemals unter null Credits', () => {
    const roundSevenState = activateGlobalEvent(
      {
        ...createInitialGameState(),
        round: 7,
      },
      'technological-breakthrough',
    )
    const roundThirteenState = activateGlobalEvent(
      {
        ...createInitialGameState(),
        round: 13,
      },
      'technological-breakthrough',
    )

    expect(getHarvesterCreditCost(roundSevenState)).toBe(10)
    expect(getHarvesterCreditCost(roundThirteenState)).toBe(0)
  })

  it('blockiert die vorgesehenen Aktionen für genau die aktive Runde', () => {
    const globalState = {
      ...createInitialGameState(),
      activeGlobalEvent: 'ion-fog' as const,
    }
    const localState = {
      ...createInitialGameState(),
      activeLocalEvent: 'communications-outage' as const,
    }

    expect(isHarvesterRetoolingBlocked(globalState)).toBe(true)
    expect(isHarvesterRelocationBlocked(globalState)).toBe(true)
    expect(isMarketInitiationBlocked(localState)).toBe(true)
    expect(initiateResourceMarket(localState, 'food')).toBe(
      localState,
    )
    expect(
      isLandBidBlocked({
        ...localState,
        activeLocalEvent: 'land-registry-error',
      }),
    ).toBe(true)
    expect(
      isHarvesterBuildBlocked({
        ...globalState,
        activeGlobalEvent: 'supply-chain-disruption',
      }),
    ).toBe(true)

    const landBlockedState = {
      ...createInitialGameState(),
      activeLocalEvent: 'land-registry-error' as const,
    }
    const buildBlockedState = {
      ...createInitialGameState(),
      activeLocalEvent: 'labor-strike' as const,
    }

    expect(placeLandBid(landBlockedState, 'C', 25)).toBe(
      landBlockedState,
    )
    expect(orderHarvesterBuild(buildBlockedState)).toBe(
      buildBlockedState,
    )
  })

  it('legt bei Störung die skalierte Anzahl Harvester still', () => {
    const harvesters: HarvesterAssignments = {
      A: {
        production: 'food',
        isNew: false,
      },
      B: {
        production: 'energy',
        isNew: false,
      },
    }
    const state = applyLocalEvent(
      {
        ...createInitialGameState(),
        round: 7,
      },
      'harvester-breakdown',
    )
    const result = runRound(state, harvesters, normalSupply)

    expect(result.report.inactiveHarvesterIds).toHaveLength(2)
    expect(result.report.produced).toEqual({
      food: 0,
      energy: 0,
      ore: 0,
    })
  })

  it('verändert globale Produktion für Spieler und KI in derselben Runde', () => {
    const harvesters: HarvesterAssignments = {
      A: {
        production: 'food',
        isNew: false,
      },
    }
    const eventState = activateGlobalEvent(
      createInitialGameState(),
      'fertile-season',
    )
    const result = runRound(eventState, harvesters, normalSupply)

    expect(result.report.produced.food).toBe(5)
    expect(result.report.globalEvent).toBe('fertile-season')
    expect(result.nextState.activeGlobalEvent).toBeNull()
    expect(result.nextState.rivals.orion.resources.food).toBe(10)
  })

  it('skaliert globale Produktionsmodifikatoren ab Runde sieben', () => {
    const harvesters: HarvesterAssignments = {
      A: {
        production: 'food',
        isNew: false,
      },
    }
    const eventState = activateGlobalEvent(
      {
        ...createInitialGameState(),
        round: 7,
      },
      'fertile-season',
    )
    const result = runRound(eventState, harvesters, normalSupply)

    expect(result.report.produced.food).toBe(6)
  })
})

describe('Spielende', () => {
  it('beendet die Standardpartie nach Runde 15', () => {
    expect(isGameFinished(14)).toBe(false)
    expect(isGameFinished(15)).toBe(true)
    expect(isGameFinished(16)).toBe(true)
  })
})

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

  it('begrenzt ein Kaufgebot auf die verfügbaren Credits', () => {
    const unaffordableEntry = {
      active: false,
      price: 10,
    }

    expect(
      moveMarketOffer(
        'buyer',
        unaffordableEntry,
        1,
        10,
        20,
        14,
        6,
      ),
    ).toBe(unaffordableEntry)

    expect(
      moveMarketOffer(
        'buyer',
        { active: true, price: 12 },
        1,
        10,
        20,
        14,
        12,
      ),
    ).toEqual({ active: true, price: 12 })
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
      introductionSeconds: 5,
      declarationSeconds: 5,
      auctionSeconds: 30,
    })
    expect(getMarketTiming(2)).toEqual({
      introductionSeconds: 4,
      declarationSeconds: 5,
      auctionSeconds: 25,
    })
    expect(getMarketTiming(3)).toEqual({
      introductionSeconds: 3,
      declarationSeconds: 5,
      auctionSeconds: 20,
    })
    expect(getMarketTiming(12)).toEqual(getMarketTiming(3))
  })

  it('erlaubt jede Ressourcenauktion nur einmal pro Runde', () => {
    const initialState = createInitialGameState()
    const afterFoodAuction = initiateResourceMarket(
      initialState,
      'food',
    )
    const duplicateAttempt = initiateResourceMarket(
      afterFoodAuction,
      'food',
    )
    const afterEnergyAuction = initiateResourceMarket(
      afterFoodAuction,
      'energy',
    )

    expect(afterFoodAuction.initiatedMarketResources).toEqual([
      'food',
    ])
    expect(duplicateAttempt).toBe(afterFoodAuction)
    expect(afterEnergyAuction.initiatedMarketResources).toEqual([
      'food',
      'energy',
    ])
  })

  it('gibt alle Auktionsrechte zu Beginn der nächsten Runde frei', () => {
    let state = createInitialGameState()

    for (const resource of [
      'food',
      'energy',
      'ore',
      'crystals',
    ] as const) {
      state = initiateResourceMarket(state, resource)
    }

    const nextState = runRound(state, {}, normalSupply).nextState

    expect(nextState.initiatedMarketResources).toEqual([])
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
  it('zeigt echte Koloniewerte und sortiert Bevölkerung zuerst', () => {
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
      rivals: {
        ...createInitialGameState().rivals,
        orion: {
          ...createInitialGameState().rivals.orion,
          population: 14,
          credits: 31,
          resources: {
            food: 1,
            energy: 2,
            ore: 3,
            crystals: 4,
          },
          harvesters: 5,
        },
      },
    }
    const entries = createLeaderboardEntries(state, 4)
    const player = entries.find((entry) => entry.isPlayer)
    const orion = entries.find((entry) => entry.id === 'orion')

    expect(player).toMatchObject({
      population: 15,
      credits: 42,
      resources: 18,
      harvesters: 4,
    })
    expect(orion).toMatchObject({
      population: 14,
      credits: 31,
      resources: 10,
      harvesters: 5,
    })
    expect(entries[0].id).toBe('player')
  })

  it('entwickelt die gespeicherten KI-Kolonien pro Runde weiter', () => {
    const initialRivals = createInitialGameState().rivals
    const nextRivals = advanceRivalColonies(initialRivals, 1)

    expect(nextRivals.orion).toMatchObject({
      population: 11,
      credits: 96,
      harvesters: 2,
      resources: {
        food: 9,
        energy: 9,
        ore: 6,
        crystals: 0,
      },
    })
    expect(nextRivals.orion).not.toBe(initialRivals.orion)
  })

  it('lässt eine unversorgte KI-Bevölkerung schrumpfen', () => {
    const initialRivals = createInitialGameState().rivals
    const nextRivals = advanceRivalColonies(
      {
        ...initialRivals,
        orion: {
          ...initialRivals.orion,
          resources: {
            ...initialRivals.orion.resources,
            food: 0,
          },
        },
      },
      1,
    )

    expect(nextRivals.orion.population).toBe(9)
    expect(nextRivals.orion.resources.food).toBe(3)
  })

  it('rechnet die KI-Kolonien mit der Spielerunde genau einmal ab', () => {
    const state = createInitialGameState()
    const result = runRound(state, {}, normalSupply)

    expect(result.nextState.rivals.orion.population).toBe(11)
    expect(result.nextState.rivals.nova.population).toBe(10)
    expect(result.nextState.rivals.vega.population).toBe(12)
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

  it('startet bei Gleichstand eine grafische Stichauktion', () => {
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
  })

  it('lässt bei gleichem Preis den zuerst Führenden vorne', () => {
    const start = {
      playerBid: 30,
      orionBid: 30,
      leader: null,
    } as const
    const playerLeads = raiseLandTieBid(
      start,
      'player',
      100,
    )
    const orionDrawsLevel = raiseLandTieBid(
      playerLeads,
      'orion',
      100,
    )
    const orionOvertakes = raiseLandTieBid(
      orionDrawsLevel,
      'orion',
      100,
    )

    expect(playerLeads).toEqual({
      playerBid: 31,
      orionBid: 30,
      leader: 'player',
    })
    expect(orionDrawsLevel).toEqual({
      playerBid: 31,
      orionBid: 31,
      leader: 'player',
    })
    expect(orionOvertakes).toEqual({
      playerBid: 31,
      orionBid: 32,
      leader: 'orion',
    })
  })

  it('verhindert Gebote oberhalb der verfügbaren Credits', () => {
    const bids = {
      playerBid: 30,
      orionBid: 30,
      leader: null,
    } as const

    expect(raiseLandTieBid(bids, 'player', 30)).toBe(bids)
  })

  it('nimmt den Bestgebotsbalken bis zum nächsten Spieler zurück', () => {
    const playerStillLeads = lowerLandTieBid(
      {
        playerBid: 34,
        orionBid: 32,
        leader: 'player',
      },
      'player',
      31,
    )
    const orionTakesLine = lowerLandTieBid(
      {
        playerBid: 33,
        orionBid: 32,
        leader: 'player',
      },
      'player',
      31,
    )

    expect(playerStillLeads).toEqual({
      playerBid: 33,
      orionBid: 32,
      leader: 'player',
    })
    expect(orionTakesLine).toEqual({
      playerBid: 32,
      orionBid: 32,
      leader: 'orion',
    })
  })

  it('senkt ein abgegebenes Gebot nicht unter den Startpreis', () => {
    const bids = {
      playerBid: 31,
      orionBid: 30,
      leader: 'player',
    } as const

    expect(lowerLandTieBid(bids, 'player', 31)).toBe(bids)
  })

  it('gibt den Balken beim Rückzug am Startpreis an einen wartenden Spieler ab', () => {
    const bids = lowerLandTieBid(
      {
        playerBid: 31,
        orionBid: 31,
        leader: 'player',
      },
      'player',
      31,
    )

    expect(bids).toEqual({
      playerBid: 31,
      orionBid: 31,
      leader: 'orion',
    })
  })

  it('reserviert das Siegergebot der grafischen Stichauktion', () => {
    const state = beginLandTieBreak(
      placeLandBid(
        createInitialGameState(),
        'C',
        30,
        30,
      ),
    )
    const resolvedState = resolveLandTieBreak(state, {
      playerBid: 31,
      orionBid: 30,
      leader: 'player',
    })

    expect(resolvedState.credits).toBe(69)
    expect(resolvedState.landAuctionTie).toBeNull()
    expect(resolvedState.pendingLandBid).toEqual({
      tileId: 'C',
      amount: 31,
      rivalBid: 30,
      reservedCredits: 31,
      tieWinner: 'player',
    })

    const result = runRound(resolvedState, {}, normalSupply)

    expect(result.report.landAuction?.outcome).toBe('won')
    expect(result.nextState.ownedTileIds).toContain('C')
    expect(result.nextState.credits).toBe(69)
  })

  it('löst eine nicht bezahlbare Stichauktion ohne Sackgasse auf', () => {
    const poorState: GameState = {
      ...createInitialGameState(),
      credits: 30,
    }
    const tieState = beginLandTieBreak(
      placeLandBid(poorState, 'C', 30, 30),
    )
    const resolvedState = resolveLandTieBreak(tieState, {
      playerBid: 30,
      orionBid: 31,
      leader: 'orion',
    })

    expect(resolvedState.credits).toBe(30)
    expect(resolvedState.landAuctionTie).toBeNull()
    expect(resolvedState.pendingLandBid).toEqual({
      tileId: 'C',
      amount: 30,
      rivalBid: 31,
      reservedCredits: 0,
      tieWinner: 'orion',
    })

    const result = runRound(resolvedState, {}, normalSupply)

    expect(result.report.landAuction?.outcome).toBe('lost')
    expect(result.nextState.credits).toBe(30)
    expect(result.nextState.opponentTileIds).toContain('C')
    expect(result.nextState.rivals.orion.credits).toBe(65)
  })

  it('vergibt das Feld bei gleichem Schlussgebot an den zuerst Führenden', () => {
    const state = beginLandTieBreak(
      placeLandBid(
        createInitialGameState(),
        'C',
        30,
        30,
      ),
    )
    const resolvedState = resolveLandTieBreak(state, {
      playerBid: 31,
      orionBid: 31,
      leader: 'player',
    })
    const result = runRound(resolvedState, {}, normalSupply)

    expect(result.report.landAuction).toEqual({
      tileId: 'C',
      playerBid: 31,
      rivalBid: 31,
      outcome: 'won',
    })
    expect(result.nextState.ownedTileIds).toContain('C')
  })

  it('lässt das Feld frei, wenn niemand das Gebot erhöht', () => {
    const state = beginLandTieBreak(
      placeLandBid(
        createInitialGameState(),
        'C',
        30,
        30,
      ),
    )
    const resolvedState = resolveLandTieBreak(state, {
      playerBid: 30,
      orionBid: 30,
      leader: null,
    })

    expect(resolvedState.credits).toBe(100)
    expect(resolvedState.landAuctionTie).toBeNull()
    expect(resolvedState.pendingLandBid).toBeNull()
    expect(resolvedState.ownedTileIds).not.toContain('C')
    expect(resolvedState.opponentTileIds).not.toContain('C')
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
