import { describe, expect, it } from 'vitest'
import {
  STARTING_HARVESTERS,
  PLAYER_START_TILE_IDS,
  addColonyOwnedTile,
  assignPlayerHarvester,
  changePlayerHarvesterProduction,
  createPlayableInitialGameState,
  executeColonyTrade,
  removePlayerHarvester,
  runRound,
  selectColonies,
  selectOpponentTileIds,
  updateColony,
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

  it('aktualisiert Wirtschaftsdaten jedes Teilnehmers über dieselbe Grenze', () => {
    for (const participantId of participantIds) {
      const state = createPlayableInitialGameState()
      const before = selectColonies(state)
      const next = updateColony(
        state,
        participantId,
        (colony) => ({
          ...colony,
          population: colony.population + 1,
          credits: colony.credits + 7,
          resources: {
            ...colony.resources,
            food: colony.resources.food + 2,
          },
        }),
      )
      const after = selectColonies(next)

      expect(after[participantId]).toMatchObject({
        population: before[participantId].population + 1,
        credits: before[participantId].credits + 7,
        resources: {
          food: before[participantId].resources.food + 2,
        },
      })

      for (const otherId of participantIds) {
        if (otherId !== participantId) {
          expect(after[otherId]).toEqual(before[otherId])
        }
      }
    }
  })

  it('synchronisiert Grundstücksbesitz für Agima und Rivalen', () => {
    const state = createPlayableInitialGameState()
    const withAgimaLand = addColonyOwnedTile(
      state,
      'agima',
      'TEST-AGIMA',
    )
    const withNovaLand = addColonyOwnedTile(
      withAgimaLand,
      'nova',
      'TEST-NOVA',
    )

    expect(withNovaLand.ownedTileIds).toContain('TEST-AGIMA')
    expect(withNovaLand.rivals.nova.ownedTileIds).toContain(
      'TEST-NOVA',
    )
    expect(withNovaLand.opponentTileIds).toContain('TEST-NOVA')
    expect(withNovaLand.opponentTileIds).not.toContain(
      'TEST-AGIMA',
    )
  })

  it('überträgt Handel zwischen beliebigen Koloniesitzen beidseitig', () => {
    const state = createPlayableInitialGameState()
    const before = selectColonies(state)
    const next = executeColonyTrade(
      state,
      'orion',
      'nova',
      'food',
      8,
    )
    const after = selectColonies(next)

    expect(after.orion.credits).toBe(before.orion.credits - 8)
    expect(after.orion.resources.food).toBe(
      before.orion.resources.food + 1,
    )
    expect(after.nova.credits).toBe(before.nova.credits + 8)
    expect(after.nova.resources.food).toBe(
      before.nova.resources.food - 1,
    )
    expect(after.agima).toEqual(before.agima)
    expect(after.vega).toEqual(before.vega)
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
