import { describe, expect, it } from 'vitest'
import {
  createPlayableInitialGameState,
  tiles,
  type GameState,
} from './game'
import {
  createConservativeRoundPlan,
  previewParticipantRound,
  runMultiplayerRound,
} from './multiplayerRound'

function withRemoteOrion(state: GameState): GameState {
  return {
    ...state,
    match: {
      ...state.match,
      participants: {
        ...state.match.participants,
        orion: {
          ...state.match.participants.orion,
          controller: {
            kind: 'human',
            input: 'remote',
          },
        },
      },
    },
  }
}

describe('Gemeinsame Multiplayer-Rundenabrechnung', () => {
  it('verwendet für die Vorschau dieselbe Teilnehmerökonomie wie für die Abrechnung', () => {
    const state = withRemoteOrion(
      createPlayableInitialGameState(),
    )
    const plan = {
      supplyPlan: { foodLevel: 2, energyLevel: 2 },
    }
    const preview = previewParticipantRound(
      state,
      'orion',
      plan,
    )
    const result = runMultiplayerRound(state, {
      agima: plan,
      orion: plan,
    })

    expect(result.reports.orion).toMatchObject({
      consumedFood: preview.report.consumedFood,
      consumedEnergyByHq:
        preview.report.consumedEnergyByHq,
      consumedEnergyByHarvesters:
        preview.report.consumedEnergyByHarvesters,
      produced: preview.report.produced,
      populationChange: preview.report.populationChange,
    })
    expect(result.nextState.colonies.orion.resources).toEqual(
      preview.nextColony.resources,
    )
    expect(result.nextState.colonies.orion.population).toBe(
      preview.nextColony.population,
    )
  })

  it('wählt höchstens die gemeinsam bezahlbare Normalversorgung', () => {
    const initialState = createPlayableInitialGameState()

    expect(
      createConservativeRoundPlan(initialState, 'agima'),
    ).toEqual({
      supplyPlan: { foodLevel: 2, energyLevel: 2 },
    })

    const minimumState: GameState = {
      ...initialState,
      colonies: {
        ...initialState.colonies,
        agima: {
          ...initialState.colonies.agima,
          resources: {
            ...initialState.colonies.agima.resources,
            food: 1,
            energy: 1,
          },
        },
      },
    }
    expect(
      createConservativeRoundPlan(minimumState, 'agima'),
    ).toEqual({
      supplyPlan: { foodLevel: 1, energyLevel: 1 },
    })

    const shortageState: GameState = {
      ...minimumState,
      colonies: {
        ...minimumState.colonies,
        agima: {
          ...minimumState.colonies.agima,
          resources: {
            ...minimumState.colonies.agima.resources,
            energy: 0,
          },
        },
      },
    }
    expect(
      createConservativeRoundPlan(shortageState, 'agima'),
    ).toEqual({
      supplyPlan: { foodLevel: 0, energyLevel: 0 },
    })
  })

  it('meldet den Grundstücksausgang aus Sicht jedes Sitzes', () => {
    const baseState = withRemoteOrion(
      createPlayableInitialGameState(),
    )
    const tileId = tiles.find(
      (tile) =>
        tile.owner === 'free' &&
        !baseState.colonies.agima.ownedTileIds.includes(tile.id) &&
        !baseState.colonies.orion.ownedTileIds.includes(tile.id),
    )!.id
    const state: GameState = {
      ...baseState,
      pendingLandBid: {
        tileId,
        bids: {
          agima: 20,
          orion: 25,
        },
        reservedCredits: {
          agima: 20,
          orion: 25,
        },
        winnerId: 'orion',
      },
    }
    const result = runMultiplayerRound(state, {
      agima: {
        supplyPlan: { foodLevel: 2, energyLevel: 2 },
      },
      orion: {
        supplyPlan: { foodLevel: 2, energyLevel: 2 },
      },
    })

    expect(result.reports.agima?.landAuction).toMatchObject({
      tileId,
      playerBid: 20,
      rivalBid: 25,
      outcome: 'lost',
    })
    expect(result.reports.orion?.landAuction).toMatchObject({
      tileId,
      playerBid: 25,
      rivalBid: 20,
      outcome: 'won',
    })
  })
})
