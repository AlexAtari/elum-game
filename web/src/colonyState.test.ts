import { describe, expect, it } from 'vitest'
import {
  STARTING_HARVESTERS,
  PLAYER_START_TILE_IDS,
  assignPlayerHarvester,
  changePlayerHarvesterProduction,
  createPlayableInitialGameState,
  removePlayerHarvester,
  runRound,
  selectColonies,
  selectOpponentTileIds,
} from './game'
import { participantIds } from './match'

const normalSupply = {
  foodLevel: 2,
  energyLevel: 2,
}

describe('Gemeinsame Kolonieansicht', () => {
  it('normalisiert alle vier Kolonien in dieselbe Struktur', () => {
    const state = createPlayableInitialGameState()
    const colonies = selectColonies(state)

    expect(Object.keys(colonies)).toEqual([...participantIds])

    for (const participantId of participantIds) {
      const colony = colonies[participantId]

      expect(colony.id).toBe(participantId)
      expect(colony.population).toBe(state.population)
      expect(colony.credits).toBe(state.credits)
      expect(colony.resources).toEqual(state.resources)
      expect(colony.harvesters).toBe(STARTING_HARVESTERS)
      expect(colony.harvestersInConstruction).toBe(0)
      expect(colony.ownedTileIds).toHaveLength(2)
    }
  })

  it('leitet gegnerischen Besitz aus den Kolonien ab', () => {
    const state = createPlayableInitialGameState()

    expect(selectOpponentTileIds(state)).toEqual(
      state.opponentTileIds,
    )
  })

  it('führt fertiggestellte Harvester in der Gesamtzahl fort', () => {
    const state = {
      ...createPlayableInitialGameState(),
      harvestersInConstruction: 2,
    }
    const completedRound = runRound(state, {}, normalSupply)

    expect(completedRound.report.completedHarvesters).toBe(2)
    expect(completedRound.nextState.harvesters).toBe(
      STARTING_HARVESTERS + 2,
    )
    expect(
      selectColonies(completedRound.nextState).agima.harvesters,
    ).toBe(STARTING_HARVESTERS + 2)
  })

  it('speichert Harvester-Zuweisungen vollständig im Spielzustand', () => {
    const tileId = PLAYER_START_TILE_IDS[0]
    const initialState = createPlayableInitialGameState()
    const assignedState = assignPlayerHarvester(
      initialState,
      tileId,
      'food',
    )
    const changedState = changePlayerHarvesterProduction(
      assignedState,
      tileId,
      'energy',
    )

    expect(assignedState.freeHarvesterPool).toHaveLength(1)
    expect(assignedState.harvesterAssignments[tileId]).toEqual({
      production: 'food',
      isNew: true,
    })
    expect(changedState.harvesterAssignments[tileId]).toEqual({
      production: 'energy',
      isNew: true,
    })
    expect(
      JSON.parse(JSON.stringify(changedState)),
    ).toEqual(changedState)

    const removedState = removePlayerHarvester(
      changedState,
      tileId,
    )

    expect(removedState.harvesterAssignments[tileId]).toBeUndefined()
    expect(removedState.freeHarvesterPool).toHaveLength(2)
  })
})
