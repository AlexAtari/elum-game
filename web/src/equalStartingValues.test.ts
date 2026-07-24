import { describe, expect, it } from 'vitest'
import {
  STARTING_CREDITS,
  STARTING_HARVESTERS,
  createPlayableInitialGameState,
} from './game'

describe('Gleiche Startwerte aller Spieler', () => {
  it('startet Agima, Orion, Nova und Vega wirtschaftlich identisch', () => {
    const state = createPlayableInitialGameState()

    expect(state.credits).toBe(STARTING_CREDITS)

    for (const rival of Object.values(state.rivals)) {
      expect(rival.credits).toBe(state.credits)
      expect(rival.population).toBe(state.population)
      expect(rival.resources).toEqual(state.resources)
      expect(rival.harvesters).toBe(
        STARTING_HARVESTERS,
      )
    }
  })

  it('verwendet 150 Credits und zwei Harvester', () => {
    expect(STARTING_CREDITS).toBe(150)
    expect(STARTING_HARVESTERS).toBe(2)
  })

  it('teilt keine veränderbaren Ressourcenobjekte', () => {
    const state = createPlayableInitialGameState()

    expect(state.rivals.orion.resources).not.toBe(
      state.resources,
    )
    expect(state.rivals.nova.resources).not.toBe(
      state.rivals.orion.resources,
    )
    expect(state.rivals.vega.resources).not.toBe(
      state.rivals.nova.resources,
    )
  })
})
