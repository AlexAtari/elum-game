import { describe, expect, it } from 'vitest'
import {
  applyAutonomousRivalLandPurchase,
  applyAutonomousRivalLandPurchases,
  getAutonomousRivalLandDecision,
  getAutonomousRivalPurchaseOrder,
} from './rivalAutonomousLand'
import {
  createInitialGameState,
  tiles,
  type RivalId,
} from './game'

const rivalIds: RivalId[] = [
  'orion',
  'nova',
  'vega',
]

function createRoundTwoState() {
  const state = createInitialGameState()
  state.round = 2
  state.pendingLandBid = null
  state.landAuctionTie = null

  for (const rival of Object.values(state.rivals)) {
    rival.credits = 100
    rival.resources.food = 20
    rival.resources.energy = 20
    rival.resources.ore = 10
    rival.ownedTileIds = []
    rival.lastLandPurchaseRound = undefined
  }

  return state
}

describe('Selbstständige Grundstückskäufe aller Rivalen', () => {
  it('ermittelt für Nova und Vega eigene Agentenentscheidungen', () => {
    const state = createRoundTwoState()

    expect(
      getAutonomousRivalLandDecision(state, 'nova'),
    ).not.toBeNull()
    expect(
      getAutonomousRivalLandDecision(state, 'vega'),
    ).not.toBeNull()
  })

  it('lässt alle drei Rivalen ein unterschiedliches Grundstück kaufen', () => {
    const state = createRoundTwoState()
    const next =
      applyAutonomousRivalLandPurchases(state)
    const purchasedTileIds = rivalIds.flatMap(
      (rivalId) =>
        next.rivals[rivalId].ownedTileIds ?? [],
    )

    expect(purchasedTileIds).toHaveLength(3)
    expect(new Set(purchasedTileIds).size).toBe(3)

    for (const rivalId of rivalIds) {
      expect(
        next.rivals[rivalId].ownedTileIds,
      ).toHaveLength(1)
      expect(next.rivals[rivalId].credits).toBeLessThan(
        state.rivals[rivalId].credits,
      )
    }

    for (const tileId of purchasedTileIds) {
      expect(next.opponentTileIds).toContain(tileId)
      expect(
        tiles.find((tile) => tile.id === tileId)?.owner,
      ).toBe('free')
    }
  })

  it('wechselt die Kaufreihenfolge fair nach Runde', () => {
    expect(getAutonomousRivalPurchaseOrder(1)).toEqual([
      'orion',
      'nova',
      'vega',
    ])
    expect(getAutonomousRivalPurchaseOrder(2)).toEqual([
      'nova',
      'vega',
      'orion',
    ])
    expect(getAutonomousRivalPurchaseOrder(3)).toEqual([
      'vega',
      'orion',
      'nova',
    ])
  })

  it('stoppt den Grundstückskauf eines Rivalen im Versorgungsnotfall', () => {
    const state = createRoundTwoState()
    state.rivals.nova.resources.food = 0

    expect(
      getAutonomousRivalLandDecision(state, 'nova'),
    ).toBeNull()
  })

  it('kauft pro Rivalen höchstens ein Grundstück je Runde', () => {
    const state = createRoundTwoState()
    const afterFirstPurchase =
      applyAutonomousRivalLandPurchase(
        state,
        'vega',
      )
    const afterSecondAttempt =
      applyAutonomousRivalLandPurchase(
        afterFirstPurchase,
        'vega',
      )

    expect(afterSecondAttempt).toBe(
      afterFirstPurchase,
    )
    expect(
      afterSecondAttempt.rivals.vega.ownedTileIds,
    ).toHaveLength(1)
  })

  it('greift während eines Spielergebots überhaupt nicht ein', () => {
    const state = createRoundTwoState()
    state.pendingLandBid = {
      tileId: 'X',
      amount: 20,
      rivalBid: 20,
    }

    expect(
      applyAutonomousRivalLandPurchases(state),
    ).toBe(state)
  })
})
