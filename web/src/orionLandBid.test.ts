import { describe, expect, it } from 'vitest'
import {
  createSealedLandBidDecision,
  type AgentContext,
  type AgentLandCandidate,
} from './agents'
import { applyStrategicOrionBid } from './orionLandBid'
import {
  createInitialGameState,
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

  it('ersetzt das bisherige Rivalengebot im Spielzustand', () => {
    const tile = tiles.find(
      (candidate) => candidate.owner === 'free',
    )
    expect(tile).toBeDefined()

    const state = createInitialGameState()
    state.pendingLandBid = {
      tileId: tile!.id,
      amount: LAND_MINIMUM_BID,
      rivalBid: 999,
    }

    const next = applyStrategicOrionBid(state)

    expect(next.pendingLandBid?.rivalBid).toBeGreaterThanOrEqual(
      LAND_MINIMUM_BID,
    )
    expect(next.pendingLandBid?.rivalBid).toBeLessThanOrEqual(
      28,
    )
    expect(next.pendingLandBid?.rivalBid).not.toBe(999)
  })

  it('verändert einen Zustand ohne Grundstücksgebot nicht', () => {
    const state = createInitialGameState()

    expect(applyStrategicOrionBid(state)).toBe(state)
  })
})
