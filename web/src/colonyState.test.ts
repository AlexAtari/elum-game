import { describe, expect, it } from 'vitest'
import {
  STARTING_HARVESTERS,
  PLAYER_START_TILE_IDS,
  addColonyOwnedTile,
  advanceRivalColonies,
  advanceRivalColoniesInGame,
  assignPlayerHarvester,
  changePlayerHarvesterProduction,
  createPlayableInitialGameState,
  executeColonyTrade,
  placeLandBid,
  removePlayerHarvester,
  runRound,
  selectColonies,
  selectOpponentTileIds,
  selectRivalColonies,
  updateColony,
  tiles,
} from './game'
import { participantIds } from './match'

const normalSupply = {
  foodLevel: 2,
  energyLevel: 2,
}

function getFreeAdjacentTileId(
  state: ReturnType<typeof createPlayableInitialGameState>,
) {
  const startTile = tiles.find(
    (tile) => tile.id === state.colonies.agima.ownedTileIds[1],
  )!

  return startTile.neighborIds.find(
    (tileId) =>
      !state.colonies.agima.ownedTileIds.includes(tileId) &&
      !selectOpponentTileIds(state).includes(tileId) &&
      tiles.find((tile) => tile.id === tileId)?.owner === 'free',
  )!
}

describe('Gemeinsame Kolonieansicht', () => {
  it('speichert dynamische Koloniedaten ausschließlich in der kanonischen Map', () => {
    const state = createPlayableInitialGameState()
    const serializedState = JSON.parse(JSON.stringify(state))

    expect(serializedState.colonies).toEqual(state.colonies)
    expect(serializedState).not.toHaveProperty('population')
    expect(serializedState).not.toHaveProperty('credits')
    expect(serializedState).not.toHaveProperty('resources')
    expect(serializedState).not.toHaveProperty('ownedTileIds')
    expect(serializedState).not.toHaveProperty('opponentTileIds')
    expect(serializedState).not.toHaveProperty('rivals')
  })

  it('normalisiert alle vier Kolonien in dieselbe Struktur', () => {
    const state = createPlayableInitialGameState()
    const colonies = selectColonies(state)

    expect(Object.keys(colonies)).toEqual([...participantIds])

    for (const participantId of participantIds) {
      const colony = colonies[participantId]

      expect(colony.id).toBe(participantId)
      expect(colony.population).toBe(state.colonies.agima.population)
      expect(colony.credits).toBe(state.colonies.agima.credits)
      expect(colony.resources).toEqual(state.colonies.agima.resources)
      expect(colony.harvesters).toBe(STARTING_HARVESTERS)
      expect(colony.harvestersInConstruction).toBe(0)
      expect(colony.ownedTileIds).toHaveLength(2)
    }
  })

  it('leitet gegnerischen Besitz aus den Kolonien ab', () => {
    const state = createPlayableInitialGameState()

    expect(selectOpponentTileIds(state)).toEqual(
      Object.values(selectRivalColonies(state)).flatMap(
        (rival) => rival.ownedTileIds ?? [],
      ),
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

    expect(withNovaLand.colonies.agima.ownedTileIds).toContain('TEST-AGIMA')
    expect(withNovaLand.colonies.nova.ownedTileIds).toContain(
      'TEST-NOVA',
    )
    expect(selectOpponentTileIds(withNovaLand)).toContain(
      'TEST-NOVA',
    )
    expect(selectOpponentTileIds(withNovaLand)).not.toContain(
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

  it('überführt die Rivalen-Rundenabrechnung verlustfrei in den Spielzustand', () => {
    const state = createPlayableInitialGameState()
    const expectedRivals = advanceRivalColonies(
      selectRivalColonies(state),
      state.round,
      state.activeGlobalEvent,
      state.meteorImpacts,
    )
    const next = advanceRivalColoniesInGame(state)

    expect(selectRivalColonies(next)).toEqual(expectedRivals)
    expect(selectColonies(next).agima).toEqual(
      selectColonies(state).agima,
    )
    expect(selectOpponentTileIds(next)).toEqual(
      Object.values(expectedRivals).flatMap(
        (rival) => rival.ownedTileIds ?? [],
      ),
    )
  })

  it('schließt Landgewinne beider Auktionsseiten über die Koloniegrenze ab', () => {
    const initialState = createPlayableInitialGameState()
    const tileId = getFreeAdjacentTileId(initialState)
    const reservedState = placeLandBid(
      initialState,
      tileId,
      25,
      30,
    )
    const playerWin = runRound(
      {
        ...reservedState,
        pendingLandBid: {
          ...reservedState.pendingLandBid!,
          tieWinner: 'player',
        },
      },
      {},
      normalSupply,
    ).nextState
    const orionWin = runRound(
      {
        ...reservedState,
        pendingLandBid: {
          ...reservedState.pendingLandBid!,
          tieWinner: 'orion',
        },
      },
      {},
      normalSupply,
    ).nextState

    expect(selectColonies(playerWin).agima.ownedTileIds).toContain(
      tileId,
    )
    expect(selectOpponentTileIds(playerWin)).not.toContain(tileId)
    expect(
      selectColonies(orionWin).orion.ownedTileIds,
    ).toContain(tileId)
    expect(selectOpponentTileIds(orionWin)).toContain(tileId)
  })

  it('führt fertiggestellte Harvester in der Gesamtzahl fort', () => {
    const initialState = createPlayableInitialGameState()
    const state = {
      ...initialState,
      colonies: {
        ...initialState.colonies,
        agima: {
          ...initialState.colonies.agima,
          harvestersInConstruction: 2,
        },
      },
    }
    const completedRound = runRound(state, {}, normalSupply)

    expect(completedRound.report.completedHarvesters).toBe(2)
    expect(completedRound.nextState.colonies.agima.harvesters).toBe(
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

    expect(assignedState.colonies.agima.freeHarvesterPool).toHaveLength(1)
    expect(assignedState.colonies.agima.harvesterAssignments[tileId]).toEqual({
      production: 'food',
      isNew: true,
    })
    expect(changedState.colonies.agima.harvesterAssignments[tileId]).toEqual({
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

    expect(removedState.colonies.agima.harvesterAssignments[tileId]).toBeUndefined()
    expect(removedState.colonies.agima.freeHarvesterPool).toHaveLength(2)
  })
})
