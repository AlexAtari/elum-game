import { describe, expect, it } from 'vitest'
import {
  STARTING_CREDITS,
  STARTING_CRYSTALS,
  STARTING_HARVESTERS,
  createPlayableInitialGameState,
} from './game'

describe('Gleiche Startwerte aller Spieler', () => {
  it('startet Agima, Orion, Nova und Vega wirtschaftlich identisch', () => {
    const state = createPlayableInitialGameState()

    expect(state.credits).toBe(STARTING_CREDITS)
    expect(state.harvesters).toBe(STARTING_HARVESTERS)

    for (const rival of Object.values(state.rivals)) {
      expect(rival.credits).toBe(state.credits)
      expect(rival.population).toBe(state.population)
      expect(rival.resources).toEqual(state.resources)
      expect(rival.harvesters).toBe(
        STARTING_HARVESTERS,
      )
    }
  })

  it('verwendet 150 Credits, zwei Harvester und eine Kristallprobe', () => {
    expect(STARTING_CREDITS).toBe(150)
    expect(STARTING_HARVESTERS).toBe(2)
    expect(STARTING_CRYSTALS).toBe(1)

    const state = createPlayableInitialGameState()

    expect(state.resources.crystals).toBe(
      STARTING_CRYSTALS,
    )
    for (const rival of Object.values(state.rivals)) {
      expect(rival.resources.crystals).toBe(
        STARTING_CRYSTALS,
      )
    }
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

  it('gibt jeder Kolonie genau zwei eigene Startfelder', () => {
    const state = createPlayableInitialGameState()
    const rivalTileIds = Object.values(state.rivals).flatMap(
      (rival) => rival.ownedTileIds ?? [],
    )

    expect(state.ownedTileIds).toHaveLength(2)
    expect(rivalTileIds).toHaveLength(6)
    expect(state.opponentTileIds).toEqual(rivalTileIds)
    expect(
      new Set([...state.ownedTileIds, ...rivalTileIds]).size,
    ).toBe(8)
  })
})
