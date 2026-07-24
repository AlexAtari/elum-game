import { describe, expect, it } from 'vitest'
import {
  createLandAuctionDecision,
  type AgentContext,
  type AgentLandCandidate,
} from './agents'

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

function createCandidate(
  overrides: Partial<AgentLandCandidate> = {},
): AgentLandCandidate {
  return {
    tileId: 'A7',
    minimumBid: 25,
    food: 1,
    energy: 3,
    ore: 5,
    adjacencyBonus: 0,
    ...overrides,
  }
}

describe('Orions Grundstücksagent', () => {
  it('setzt für ein bezahlbares Feld ein wirtschaftliches Maximalgebot', () => {
    expect(
      createLandAuctionDecision(
        createContext(),
        createCandidate(),
      ),
    ).toMatchObject({
      tileId: 'A7',
      maximumBid: 28,
    })
  })

  it('steigt aus, wenn das Mindestgebot seine Liquiditätsgrenze übersteigt', () => {
    expect(
      createLandAuctionDecision(
        createContext(70),
        createCandidate(),
      ),
    ).toBeNull()
  })

  it('entscheidet bei identischem Zustand reproduzierbar', () => {
    const context = createContext()
    const candidate = createCandidate()

    expect(
      createLandAuctionDecision(context, candidate),
    ).toEqual(
      createLandAuctionDecision(context, candidate),
    )
  })
})
