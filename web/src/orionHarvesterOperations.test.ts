import { describe, expect, it } from 'vitest'
import {
  calculateOrionAssignedProduction,
  planOrionHarvesterAssignments,
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
      energy: 10,
      ore: 8,
      crystals: 0,
    },
    harvesters: 2,
    ownedTileIds: ['A', 'B'],
    ...overrides,
  }
}

const testTiles: Tile[] = [
  {
    id: 'A',
    neighborIds: ['B'],
    distanceFromHq: 1,
    shape: 'hexagon',
    owner: 'free',
    food: 5,
    energy: 1,
    ore: 2,
  },
  {
    id: 'B',
    neighborIds: ['A', 'C'],
    distanceFromHq: 2,
    shape: 'hexagon',
    owner: 'free',
    food: 1,
    energy: 4,
    ore: 5,
  },
  {
    id: 'C',
    neighborIds: ['B'],
    distanceFromHq: 3,
    shape: 'hexagon',
    owner: 'free',
    food: 3,
    energy: 3,
    ore: 3,
  },
]

describe('Orions Harvester-Zuweisungen', () => {
  it('weist reifen Grundstücken höchstens einen Harvester zu', () => {
    const assignments =
      planOrionHarvesterAssignments(
        createOrion(),
        testTiles,
        3,
        referencePrices,
        buildCost,
      )

    expect(Object.keys(assignments)).toHaveLength(2)
    expect(assignments.A).toBeDefined()
    expect(assignments.B).toBeDefined()
  })

  it('lässt ein gerade gekauftes Grundstück bis zur Folgerunde ruhen', () => {
    const orion = createOrion({
      lastLandPurchaseRound: 3,
    })

    const currentRound =
      planOrionHarvesterAssignments(
        orion,
        testTiles,
        3,
        referencePrices,
        buildCost,
      )
    const nextRound =
      planOrionHarvesterAssignments(
        orion,
        testTiles,
        4,
        referencePrices,
        buildCost,
      )

    expect(currentRound.B).toBeUndefined()
    expect(nextRound.B).toBeDefined()
  })

  it('behält eine bestehende Zuweisung stabil bei', () => {
    const assignments =
      planOrionHarvesterAssignments(
        createOrion({
          harvesterAssignments: {
            A: 'ore',
          },
        }),
        testTiles,
        3,
        referencePrices,
        buildCost,
      )

    expect(assignments.A).toBe('ore')
  })

  it('weist nie mehr Felder als vorhandene Harvester zu', () => {
    const assignments =
      planOrionHarvesterAssignments(
        createOrion({
          harvesters: 1,
          ownedTileIds: ['A', 'B', 'C'],
        }),
        testTiles,
        3,
        referencePrices,
        buildCost,
      )

    expect(Object.keys(assignments)).toHaveLength(1)
  })

  it('berechnet Produktion aus Feldwert und Ereignismodifikator', () => {
    const production =
      calculateOrionAssignedProduction(
        {
          A: 'food',
          B: 'ore',
        },
        testTiles,
        (resource) => (resource === 'food' ? 1 : 0),
      )

    expect(production).toEqual({
      food: 6,
      energy: 0,
      ore: 5,
    })
  })

  it('speichert die Zuweisung im zentralen Rundenablauf', () => {
    const state = createInitialGameState()
    const freeTile = tiles.find(
      (tile) => tile.owner === 'free',
    )
    expect(freeTile).toBeDefined()

    state.rivals.orion.credits = 0
    state.rivals.orion.ownedTileIds = [freeTile!.id]
    state.rivals.orion.lastLandPurchaseRound = 2

    const next = advanceRivalColonies(
      state.rivals,
      3,
      null,
    )

    expect(
      next.orion.harvesterAssignments?.[freeTile!.id],
    ).toBeDefined()
  })
})
