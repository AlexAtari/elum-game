import { describe, expect, it } from 'vitest'
import {
  createInitialGameState,
  runRound,
  type GameState,
  type HarvesterAssignments,
} from './game'

const normalSupply = {
  foodLevel: 2,
  energyLevel: 2,
}

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
