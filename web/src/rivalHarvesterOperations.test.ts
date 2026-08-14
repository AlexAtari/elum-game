import { describe, expect, it } from 'vitest'
import {
  RIVAL_RETOOL_CREDIT_COST,
  allocateRivalHarvesterEnergy,
  calculateEmergencyHarvestProduction,
  planRivalHarvesterOperations,
} from './rivalHarvesterOperations'
import {
  advanceRivalColonies,
  createInitialGameState,
  tiles,
  type RivalId,
} from './game'

const referencePrices = {
  food: 8,
  energy: 8,
  ore: 15,
  crystals: 40,
}

const buildCost = {
  creditCost: 30,
  oreCost: 3,
}

const rivalIds: RivalId[] = [
  'orion',
  'nova',
  'vega',
]

describe('Gemeinsame Harvesterlogik der Rivalen', () => {
  it('liefert bei Energiemangel automatisch eine Noternte ohne Kristalle', () => {
    expect(
      calculateEmergencyHarvestProduction(
        {
          A: 'food',
          B: 'ore',
          C: 'crystals',
        },
        ['A', 'B', 'C'],
      ),
    ).toEqual({
      food: 1,
      energy: 0,
      ore: 1,
      crystals: 0,
    })
  })

  it('schließt Umrüstungsfelder von der Noternte aus', () => {
    expect(
      calculateEmergencyHarvestProduction(
        { A: 'energy', B: 'food' },
        ['A', 'B'],
        ['A'],
      ),
    ).toEqual({
      food: 1,
      energy: 0,
      ore: 0,
      crystals: 0,
    })
  })

  it('plant für Nova und Vega konkrete Feldzuweisungen', () => {
    const state = createInitialGameState()
    const freeTile = tiles.find(
      (tile) => tile.owner === 'free',
    )

    expect(freeTile).toBeDefined()

    for (const rivalId of ['nova', 'vega'] as RivalId[]) {
      const rival = state.colonies[rivalId]
      rival.ownedTileIds = [freeTile!.id]
      rival.lastLandPurchaseRound = 1

      const plan = planRivalHarvesterOperations(
        rival,
        tiles,
        3,
        referencePrices,
        buildCost,
      )

      expect(plan.assignments[freeTile!.id]).toBeDefined()
    }
  })

  it('verbraucht bei jedem Rivalen Energie für aktive Harvester', () => {
    const state = createInitialGameState()
    const freeTiles = tiles
      .filter((tile) => tile.owner === 'free')
      .slice(0, rivalIds.length)

    expect(freeTiles).toHaveLength(rivalIds.length)

    rivalIds.forEach((rivalId, index) => {
      const rival = state.colonies[rivalId]
      const tileId = freeTiles[index].id

      rival.credits = 0
      rival.resources.energy = 20
      rival.ownedTileIds = [tileId]
      rival.lastLandPurchaseRound = 1
      rival.harvesterAssignments = {
        [tileId]: 'food',
      }
    })

    const next = advanceRivalColonies(
      state.colonies,
      3,
      null,
    )

    for (const rivalId of rivalIds) {
      expect(
        next[rivalId].lastConsumedEnergyByHarvesters,
      ).toBe(1)
      expect(next[rivalId].inactiveHarvesterIds).toEqual([])
    }
  })

  it('wendet einen Analysebonus nur auf Nahrung und Energie an', () => {
    const createState = () => {
      const state = createInitialGameState()
      const foodTile = tiles.find(
        (tile) =>
          tile.owner === 'free' &&
          (tile.food ?? 0) > 0,
      )!
      const orion = state.colonies.orion

      orion.credits = 0
      orion.resources.energy = 20
      orion.ownedTileIds = [foodTile.id]
      orion.lastLandPurchaseRound = 1
      orion.harvesterAssignments = {
        [foodTile.id]: 'food',
      }

      return state
    }
    const currentState = createState()
    const boostedState = createState()
    const current = advanceRivalColonies(
      currentState.colonies,
      3,
    )
    const boosted = advanceRivalColonies(
      boostedState.colonies,
      3,
      null,
      [],
      { basicProductionBonus: 1 },
    )

    expect(boosted.orion.resources.food).toBe(
      current.orion.resources.food + 1,
    )
    expect(boosted.orion.resources.ore).toBe(
      current.orion.resources.ore,
    )
  })

  it('rüstet auch Vega bei kritischem Nahrungsmangel um', () => {
    const state = createInitialGameState()
    const foodTile = tiles.find(
      (tile) =>
        tile.owner === 'free' &&
        (tile.food ?? 0) > 0,
    )

    expect(foodTile).toBeDefined()

    const vega = state.colonies.vega
    vega.credits = 100
    vega.resources.food = 0
    vega.resources.energy = 20
    vega.ownedTileIds = [foodTile!.id]
    vega.lastLandPurchaseRound = 1
    vega.harvesterAssignments = {
      [foodTile!.id]: 'ore',
    }

    const plan = planRivalHarvesterOperations(
      vega,
      tiles,
      4,
      referencePrices,
      buildCost,
    )

    expect(plan.retooledTileId).toBe(foodTile!.id)
    expect(plan.assignments[foodTile!.id]).toBe('food')
    expect(plan.retoolingCost).toBe(
      RIVAL_RETOOL_CREDIT_COST,
    )
  })

  it('zieht Umrüstungskosten bei Nova im Rundenablauf ab', () => {
    const state = createInitialGameState()
    const foodTile = tiles.find(
      (tile) =>
        tile.owner === 'free' &&
        (tile.food ?? 0) > 0,
    )

    expect(foodTile).toBeDefined()

    const nova = state.colonies.nova
    nova.credits = 100
    nova.resources.food = 0
    nova.resources.energy = 20
    nova.resources.ore = 0
    nova.ownedTileIds = [foodTile!.id]
    nova.lastLandPurchaseRound = 1
    nova.harvesterAssignments = {
      [foodTile!.id]: 'ore',
    }

    const next = advanceRivalColonies(
      state.colonies,
      4,
      null,
    )

    expect(next.nova.credits).toBe(95)
    expect(next.nova.lastHarvesterRetoolRound).toBe(4)
    expect(next.nova.lastRetooledHarvesterId).toBe(
      foodTile!.id,
    )
    expect(
      next.nova.harvesterAssignments?.[foodTile!.id],
    ).toBe('food')
  })

  it('priorisiert bei Energiemangel für alle dieselbe Sicherheitsreihenfolge', () => {
    const allocation = allocateRivalHarvesterEnergy(
      {
        A: 'ore',
        B: 'energy',
        C: 'food',
      },
      2,
    )

    expect(allocation.poweredAssignments).toEqual({
      B: 'energy',
      C: 'food',
    })
    expect(allocation.inactiveHarvesterIds).toEqual([
      'A',
    ])
  })
})
