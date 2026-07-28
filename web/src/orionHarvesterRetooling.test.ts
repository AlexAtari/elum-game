import { describe, expect, it } from 'vitest'
import {
  ORION_RETOOL_CREDIT_COST,
  planOrionHarvesterOperations,
} from './orionHarvesterOperations'
import {
  advanceRivalColonies,
  createInitialGameState,
  tiles,
  type RivalColonyState,
  type Tile,
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

const testTiles: Tile[] = [
  {
    id: 'A',
    neighborIds: ['B'],
    distanceFromHq: 1,
    shape: 'hexagon',
    owner: 'free',
    food: 4,
    energy: 1,
    ore: 5,
  },
  {
    id: 'B',
    neighborIds: ['A'],
    distanceFromHq: 2,
    shape: 'hexagon',
    owner: 'free',
    food: 1,
    energy: 5,
    ore: 4,
  },
]

function createOrion(
  overrides: Partial<RivalColonyState> = {},
): RivalColonyState {
  return {
    id: 'orion',
    name: 'Orion',
    icon: '🤖',
    population: 10,
    credits: 100,
    resources: {
      food: 10,
      energy: 12,
      ore: 8,
      crystals: 0,
    },
    harvesters: 2,
    ownedTileIds: ['A', 'B'],
    harvesterAssignments: {
      A: 'ore',
      B: 'ore',
    },
    ...overrides,
  }
}

describe('Orions Harvester-Umrüstung', () => {
  it('rüstet bei kritischem Nahrungsmangel einen Harvester um', () => {
    const plan = planOrionHarvesterOperations(
      createOrion({
        resources: {
          food: 0,
          energy: 12,
          ore: 8,
          crystals: 0,
        },
      }),
      testTiles,
      4,
      referencePrices,
      buildCost,
    )

    expect(plan.retooledTileId).toBe('A')
    expect(plan.assignments.A).toBe('food')
    expect(plan.retoolingCost).toBe(
      ORION_RETOOL_CREDIT_COST,
    )
  })

  it('rüstet nach einem Energieausfall gezielt auf Energie um', () => {
    const plan = planOrionHarvesterOperations(
      createOrion({
        resources: {
          food: 10,
          energy: 1,
          ore: 8,
          crystals: 0,
        },
        inactiveHarvesterIds: ['B'],
      }),
      testTiles,
      4,
      referencePrices,
      buildCost,
    )

    expect(plan.retooledTileId).toBe('B')
    expect(plan.assignments.B).toBe('energy')
    expect(plan.retoolingCost).toBe(5)
  })

  it('rüstet ohne vorherigen Energieausfall nicht hektisch um', () => {
    const plan = planOrionHarvesterOperations(
      createOrion({
        resources: {
          food: 10,
          energy: 1,
          ore: 8,
          crystals: 0,
        },
        inactiveHarvesterIds: [],
      }),
      testTiles,
      4,
      referencePrices,
      buildCost,
    )

    expect(plan.retooledTileId).toBeNull()
    expect(plan.retoolingCost).toBe(0)
  })

  it('rüstet höchstens einmal pro Runde um', () => {
    const plan = planOrionHarvesterOperations(
      createOrion({
        resources: {
          food: 0,
          energy: 12,
          ore: 8,
          crystals: 0,
        },
        lastHarvesterRetoolRound: 4,
      }),
      testTiles,
      4,
      referencePrices,
      buildCost,
    )

    expect(plan.retooledTileId).toBeNull()
    expect(plan.assignments).toEqual({
      A: 'ore',
      B: 'ore',
    })
  })

  it('rüstet ohne ausreichende Credits nicht um', () => {
    const plan = planOrionHarvesterOperations(
      createOrion({
        credits: 4,
        resources: {
          food: 0,
          energy: 12,
          ore: 8,
          crystals: 0,
        },
      }),
      testTiles,
      4,
      referencePrices,
      buildCost,
    )

    expect(plan.retooledTileId).toBeNull()
    expect(plan.retoolingCost).toBe(0)
  })

  it('zieht die Kosten im zentralen Rundenablauf ab', () => {
    const state = createInitialGameState()
    const foodTile = tiles.find(
      (tile) =>
        tile.owner === 'free' &&
        (tile.food ?? 0) > 0,
    )

    expect(foodTile).toBeDefined()

    state.rivals.orion.credits = 100
    state.rivals.orion.resources.food = 0
    state.rivals.orion.resources.energy = 20
    state.rivals.orion.ownedTileIds = [foodTile!.id]
    state.rivals.orion.lastLandPurchaseRound = 1
    state.rivals.orion.harvesterAssignments = {
      [foodTile!.id]: 'ore',
    }

    const next = advanceRivalColonies(
      state.rivals,
      4,
      null,
    )

    expect(next.orion.credits).toBe(95)
    expect(next.orion.lastHarvesterRetoolRound).toBe(4)
    expect(next.orion.lastRetooledHarvesterId).toBe(
      foodTile!.id,
    )
    expect(next.orion.lastHarvesterRetoolCost).toBe(5)
    expect(
      next.orion.harvesterAssignments?.[foodTile!.id],
    ).toBe('food')
  })
})
