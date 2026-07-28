import { describe, expect, it } from 'vitest'
import {
  advanceRivalColonies,
  type RivalColonies,
} from './game'

function createRivals(): RivalColonies {
  const resources = {
    food: 20,
    energy: 20,
    ore: 10,
    crystals: 0,
  }

  return {
    orion: {
      id: 'orion',
      name: 'Orion',
      icon: '🤖',
      population: 10,
      credits: 100,
      resources: { ...resources },
      harvesters: 2,
    },
    nova: {
      id: 'nova',
      name: 'Nova',
      icon: '👩‍🚀',
      population: 10,
      credits: 100,
      resources: { ...resources },
      harvesters: 2,
    },
    vega: {
      id: 'vega',
      name: 'Vega',
      icon: '👨‍🚀',
      population: 10,
      credits: 100,
      resources: { ...resources },
      harvesters: 2,
    },
  }
}

describe('Investitionsstrategien der Rivalen', () => {
  it('lässt alle drei Rivalen selbstständig Harvester bestellen', () => {
    const next = advanceRivalColonies(createRivals(), 2)

    expect(next.orion.harvestersInConstruction).toBe(1)
    expect(next.nova.harvestersInConstruction).toBe(1)
    expect(next.vega.harvestersInConstruction).toBe(1)
  })

  it('bildet die unterschiedlichen Risikoprofile ab', () => {
    const rivals = createRivals()
    for (const rival of Object.values(rivals)) {
      rival.credits = 70
      rival.harvesters = 3
    }

    const next = advanceRivalColonies(rivals, 2)

    expect(next.orion.harvestersInConstruction).toBeUndefined()
    expect(next.nova.harvestersInConstruction).toBe(1)
    expect(next.vega.harvestersInConstruction).toBe(1)
  })

  it('stoppt Investitionen bei einer Versorgungskrise', () => {
    const rivals = createRivals()

    for (const rival of Object.values(rivals)) {
      rival.resources.food = 0
      rival.resources.energy = 0
    }

    const next = advanceRivalColonies(rivals, 2)

    for (const rival of Object.values(next)) {
      expect(
        rival.harvestersInConstruction,
      ).toBeUndefined()
      expect(rival.credits).toBe(100)
    }
  })

  it('stellt bestellte Harvester bei allen Rivalen fertig', () => {
    const rivals = createRivals()

    for (const rival of Object.values(rivals)) {
      rival.credits = 0
      rival.harvestersInConstruction = 1
    }

    const next = advanceRivalColonies(rivals, 3)

    for (const rival of Object.values(next)) {
      expect(rival.harvesters).toBe(3)
      expect(rival.harvestersInConstruction).toBe(0)
    }
  })
})
