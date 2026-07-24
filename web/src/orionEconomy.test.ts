import { describe, expect, it } from 'vitest'
import {
  advanceRivalColonies,
  type RivalColonies,
} from './game'

function createRivals(): RivalColonies {
  return {
    orion: {
      id: 'orion',
      name: 'Orion',
      icon: '🤖',
      population: 10,
      credits: 100,
      resources: {
        food: 20,
        energy: 20,
        ore: 10,
        crystals: 0,
      },
      harvesters: 2,
    },
    nova: {
      id: 'nova',
      name: 'Nova',
      icon: '👩‍🚀',
      population: 10,
      credits: 100,
      resources: {
        food: 20,
        energy: 20,
        ore: 10,
        crystals: 0,
      },
      harvesters: 2,
    },
    vega: {
      id: 'vega',
      name: 'Vega',
      icon: '👨‍🚀',
      population: 10,
      credits: 100,
      resources: {
        food: 20,
        energy: 20,
        ore: 10,
        crystals: 0,
      },
      harvesters: 2,
    },
  }
}

describe('Wirtschaft der Rivalenkolonien', () => {
  it('wartet in der ersten Runde mit dem Harvesterbau', () => {
    const next = advanceRivalColonies(createRivals(), 1)

    for (const rival of Object.values(next)) {
      expect(rival.credits).toBe(100)
      expect(
        rival.harvestersInConstruction,
      ).toBeUndefined()
    }
  })

  it('bestellt ab Runde zwei bei sicheren Reserven einen Harvester', () => {
    const next = advanceRivalColonies(createRivals(), 2)

    for (const rival of Object.values(next)) {
      expect(rival.credits).toBe(70)
      expect(rival.harvestersInConstruction).toBe(1)
    }
  })

  it('stellt einen bestellten Harvester in der Folgerunde fertig', () => {
    const rivals = createRivals()
    rivals.orion.credits = 0
    rivals.orion.harvestersInConstruction = 1

    const next = advanceRivalColonies(rivals, 2)

    expect(next.orion.harvesters).toBe(3)
    expect(next.orion.harvestersInConstruction).toBe(0)
  })

  it('bestellt bei einer Lieferkettenstörung keinen Harvester', () => {
    const next = advanceRivalColonies(
      createRivals(),
      2,
      'supply-chain-disruption',
    )

    for (const rival of Object.values(next)) {
      expect(rival.credits).toBe(100)
      expect(
        rival.harvestersInConstruction,
      ).toBeUndefined()
    }
  })
})
