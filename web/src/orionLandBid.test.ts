import { describe, expect, it } from 'vitest'
import {
  createSealedLandBidDecision,
  type AgentContext,
  type AgentLandCandidate,
} from './agents'
import { applyStrategicOrionBid } from './orionLandBid'
import {
  createInitialGameState,
  createPlayableInitialGameState,
  LAND_MINIMUM_BID,
  tiles,
} from './game'

function createContext(credits = 100): AgentContext {
  return {
    round: 3,
    colony: {
      id: 'orion',
      population: 10,
      credits,
      resources: {
        food: 10,
        energy: 10,
        ore: 8,
        crystals: 0,
      },
      harvesters: 2,
    },
    referencePrices: {
      food: 8,
      energy: 8,
      ore: 15,
      crystals: 40,
    },
    legalActions: {
      harvesterBuild: {
        creditCost: 30,
        oreCost: 3,
      },
    },
  }
}

function createCandidate(): AgentLandCandidate {
  return {
    tileId: 'A7',
    minimumBid: LAND_MINIMUM_BID,
    food: 1,
    energy: 3,
    ore: 5,
  }
}

describe('Orions verdecktes Grundstücksgebot', () => {
  it('bietet unterhalb seines Maximalgebots', () => {
    const decision = createSealedLandBidDecision(
      createContext(),
      createCandidate(),
    )

    expect(decision).toMatchObject({
      tileId: 'A7',
      bid: 27,
      maximumBid: 28,
    })
  })

  it('setzt aus, wenn das Mindestgebot nicht finanzierbar ist', () => {
    expect(
      createSealedLandBidDecision(
        createContext(70),
        createCandidate(),
      ),
    ).toBeNull()
  })

  it('ergänzt Orions Gebot teilnehmerbezogen im Spielzustand', () => {
    const state = createPlayableInitialGameState()
    const orionStartTile = tiles.find(
      (tile) =>
        tile.id === state.colonies.orion.ownedTileIds[1],
    )!
    const occupiedTileIds = Object.values(state.colonies).flatMap(
      (colony) => colony.ownedTileIds,
    )
    const tileId = orionStartTile.neighborIds.find(
      (candidateId) =>
        !occupiedTileIds.includes(candidateId) &&
        tiles.find((tile) => tile.id === candidateId)?.owner ===
          'free',
    )!
    state.pendingLandBid = {
      tileId,
      bids: { agima: LAND_MINIMUM_BID },
      reservedCredits: { agima: LAND_MINIMUM_BID },
    }

    const next = applyStrategicOrionBid(state)
    const orionBid = next.pendingLandBid?.bids.orion

    expect(orionBid).toBeGreaterThanOrEqual(
      LAND_MINIMUM_BID,
    )
    expect(orionBid).toBeLessThan(
      state.colonies.orion.credits,
    )
    expect(next.colonies.orion.credits).toBe(
      state.colonies.orion.credits - orionBid!,
    )
  })

  it('verändert einen Zustand ohne Grundstücksgebot nicht', () => {
    const state = createInitialGameState()

    expect(applyStrategicOrionBid(state)).toBe(state)
  })
})
