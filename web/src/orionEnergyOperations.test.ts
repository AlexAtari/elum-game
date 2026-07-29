import { describe, expect, it } from 'vitest'
import { createAgentPlan } from './agents'
import {
  allocateOrionHarvesterEnergy,
} from './orionHarvesterOperations'
import {
  advanceRivalColonies,
  createInitialGameState,
  tiles,
} from './game'

describe('Orions Harvester-Energie', () => {
  it('verbraucht eine Energie pro aktivem Harvester', () => {
    const allocation = allocateOrionHarvesterEnergy(
      {
        A: 'food',
        B: 'ore',
      },
      2,
    )

    expect(allocation).toEqual({
      poweredAssignments: {
        A: 'food',
        B: 'ore',
      },
      inactiveHarvesterIds: [],
      consumedEnergy: 2,
    })
  })

  it('priorisiert bei Energiemangel die Energieproduktion', () => {
    const allocation = allocateOrionHarvesterEnergy(
      {
        A: 'ore',
        B: 'energy',
        C: 'food',
      },
      1,
    )

    expect(allocation.poweredAssignments).toEqual({
      B: 'energy',
    })
    expect(allocation.inactiveHarvesterIds).toEqual([
      'C',
      'A',
    ])
    expect(allocation.consumedEnergy).toBe(1)
  })

  it('schaltet ohne Restenergie alle Harvester ab', () => {
    const allocation = allocateOrionHarvesterEnergy(
      {
        A: 'food',
        B: 'energy',
      },
      0,
    )

    expect(allocation.poweredAssignments).toEqual({})
    expect(allocation.inactiveHarvesterIds).toEqual([
      'B',
      'A',
    ])
    expect(allocation.consumedEnergy).toBe(0)
  })

  it('zieht HQ- und Harvesterenergie im Rundenablauf ab', () => {
    const state = createInitialGameState()
    const freeTiles = tiles
      .filter((tile) => tile.owner === 'free')
      .slice(0, 2)

    expect(freeTiles).toHaveLength(2)

    state.colonies.orion.credits = 0
    state.colonies.orion.population = 10
    state.colonies.orion.resources.energy = 10
    state.colonies.orion.ownedTileIds = freeTiles.map(
      (tile) => tile.id,
    )
    state.colonies.orion.lastLandPurchaseRound = 1
    state.colonies.orion.harvesterAssignments = {
      [freeTiles[0].id]: 'food',
      [freeTiles[1].id]: 'ore',
    }

    const next = advanceRivalColonies(
      state.colonies,
      3,
      null,
    )

    expect(next.orion.lastConsumedEnergyByHq).toBe(2)
    expect(
      next.orion.lastConsumedEnergyByHarvesters,
    ).toBe(2)
    expect(next.orion.resources.energy).toBe(6)
    expect(next.orion.inactiveHarvesterIds).toEqual([])
  })

  it('produziert bei Knappheit nur mit versorgten Harvestern', () => {
    const state = createInitialGameState()
    const freeTiles = tiles
      .filter((tile) => tile.owner === 'free')
      .slice(0, 2)
    const energyTile =
      freeTiles.find((tile) => (tile.energy ?? 0) > 0) ??
      freeTiles[0]
    const otherTile =
      freeTiles.find((tile) => tile.id !== energyTile.id) ??
      freeTiles[1]

    state.colonies.orion.credits = 0
    state.colonies.orion.population = 10
    state.colonies.orion.resources.energy = 3
    state.colonies.orion.ownedTileIds = [
      energyTile.id,
      otherTile.id,
    ]
    state.colonies.orion.lastLandPurchaseRound = 1
    state.colonies.orion.harvesterAssignments = {
      [energyTile.id]: 'energy',
      [otherTile.id]: 'ore',
    }

    const next = advanceRivalColonies(
      state.colonies,
      3,
      null,
    )

    expect(
      next.orion.lastConsumedEnergyByHarvesters,
    ).toBe(1)
    expect(next.orion.inactiveHarvesterIds).toEqual([
      otherTile.id,
    ])
    expect(next.orion.resources.energy).toBe(
      energyTile.energy ?? 0,
    )
  })

  it('plant Energie inklusive der vorhandenen Harvester', () => {
    const plan = createAgentPlan({
      round: 3,
      colony: {
        id: 'orion',
        population: 10,
        credits: 100,
        resources: {
          food: 10,
          energy: 10,
          ore: 8,
          crystals: 0,
        },
        harvesters: 2,
      },
      referencePrices: {
        food: 8,
        energy: 8,
        ore: 15,
        crystals: 40,
      },
      legalActions: {
        harvesterBuild: {
          creditCost: 30,
          oreCost: 3,
        },
        harvesterEnergyCost: 1,
      },
    })

    expect(plan.supply.energyUnits).toBe(4)
    expect(plan.supply.targetEnergyReserve).toBe(8)
  })
})
