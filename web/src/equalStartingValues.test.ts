import { describe, expect, it } from 'vitest'
import {
  STARTING_CREDITS,
  STARTING_CRYSTALS,
  STARTING_ENERGY,
  STARTING_FOOD,
  STARTING_HARVESTERS,
  STARTING_ORE,
  createPlayableInitialGameState,
  selectOpponentTileIds,
} from './game'

describe('Gleiche Startwerte aller Spieler', () => {
  it('startet Agima, Orion, Nova und Vega wirtschaftlich identisch', () => {
    const state = createPlayableInitialGameState()

    expect(state.colonies.agima.credits).toBe(STARTING_CREDITS)
    expect(state.colonies.agima.harvesters).toBe(STARTING_HARVESTERS)

    for (const rival of Object.values(state.colonies)) {
      expect(rival.credits).toBe(state.colonies.agima.credits)
      expect(rival.population).toBe(state.colonies.agima.population)
      expect(rival.resources).toEqual(state.colonies.agima.resources)
      expect(rival.harvesters).toBe(
        STARTING_HARVESTERS,
      )
    }
  })

  it('verwendet die gemeinsamen wirtschaftlichen Startwerte', () => {
    expect(STARTING_CREDITS).toBe(150)
    expect(STARTING_HARVESTERS).toBe(2)
    expect(STARTING_FOOD).toBe(15)
    expect(STARTING_ENERGY).toBe(15)
    expect(STARTING_ORE).toBe(6)
    expect(STARTING_CRYSTALS).toBe(1)

    const state = createPlayableInitialGameState()

    expect(state.colonies.agima.resources).toEqual({
      food: STARTING_FOOD,
      energy: STARTING_ENERGY,
      ore: STARTING_ORE,
      crystals: STARTING_CRYSTALS,
    })
    for (const rival of Object.values(state.colonies)) {
      expect(rival.resources.crystals).toBe(
        STARTING_CRYSTALS,
      )
    }
  })

  it('teilt keine veränderbaren Ressourcenobjekte', () => {
    const state = createPlayableInitialGameState()

    expect(state.colonies.orion.resources).not.toBe(
      state.colonies.agima.resources,
    )
    expect(state.colonies.nova.resources).not.toBe(
      state.colonies.orion.resources,
    )
    expect(state.colonies.vega.resources).not.toBe(
      state.colonies.nova.resources,
    )
  })

  it('gibt jeder Kolonie genau zwei eigene Startfelder', () => {
    const state = createPlayableInitialGameState()
    const rivalTileIds = (
      ['orion', 'nova', 'vega'] as const
    ).flatMap(
      (rivalId) => state.colonies[rivalId].ownedTileIds,
    )

    expect(state.colonies.agima.ownedTileIds).toHaveLength(2)
    expect(rivalTileIds).toHaveLength(6)
    expect(selectOpponentTileIds(state)).toEqual(rivalTileIds)
    expect(
      new Set([...state.colonies.agima.ownedTileIds, ...rivalTileIds]).size,
    ).toBe(8)
  })
})
