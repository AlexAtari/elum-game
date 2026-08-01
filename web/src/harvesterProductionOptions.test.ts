import { describe, expect, it } from 'vitest'
import { getHarvesterProductionOptions } from './harvesterProductionOptions'

describe('Harvester-Produktionsauswahl', () => {
  it('zeigt ohne entdecktes Vorkommen nur Standardressourcen', () => {
    expect(getHarvesterProductionOptions(false)).toEqual([
      'food',
      'energy',
      'ore',
    ])
  })

  it('zeigt Kristalle nach der Entdeckung sichtbar an erster Stelle', () => {
    expect(getHarvesterProductionOptions(true)).toEqual([
      'crystals',
      'food',
      'energy',
      'ore',
    ])
  })
})
