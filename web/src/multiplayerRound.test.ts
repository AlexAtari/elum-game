import { describe, expect, it } from 'vitest'
import {
  createPlayableInitialGameState,
  tiles,
  type GameState,
} from './game'
import { runMultiplayerRound } from './multiplayerRound'

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
