import { describe, expect, it } from 'vitest'
import {
  applyAutonomousRivalLandPurchase,
  applyAutonomousRivalLandPurchases,
  getAutonomousRivalLandDecision,
  getAutonomousRivalPurchaseOrder,
} from './rivalAutonomousLand'
import {
  createPlayableInitialGameState,
  selectOpponentTileIds,
  tiles,
  type RivalId,
} from './game'

const rivalIds: RivalId[] = [
  'orion',
  'nova',
  'vega',
]

function createRoundTwoState() {
  const state = createPlayableInitialGameState()
  state.round = 2
  state.pendingLandBid = null
  state.landAuctionTie = null

  for (const rivalId of rivalIds) {
    const rival = state.colonies[rivalId]
    rival.harvesters = 3
    rival.credits = 100
    rival.resources.food = 20
    rival.resources.energy = 20
    rival.resources.ore = 10
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

  it('wählt für jede KI ausschließlich ein angrenzendes Feld', () => {
    const state = createRoundTwoState()

    for (const rivalId of rivalIds) {
      const decision = getAutonomousRivalLandDecision(
        state,
        rivalId,
      )

      expect(decision).not.toBeNull()
      expect(
        state.colonies[rivalId].ownedTileIds.some(
          (ownedTileId) =>
            tiles
              .find((tile) => tile.id === ownedTileId)
              ?.neighborIds.includes(decision!.tileId),
        ),
      ).toBe(true)
    }
  })

  it('lässt alle drei Rivalen ein unterschiedliches Grundstück kaufen', () => {
    const state = createRoundTwoState()
    const initialTileIds = new Set(
      rivalIds.flatMap(
        (rivalId) =>
          state.colonies[rivalId].ownedTileIds ?? [],
      ),
    )
    const next =
      applyAutonomousRivalLandPurchases(state)
    const purchasedTileIds = rivalIds.flatMap(
      (rivalId) =>
        (
          next.colonies[rivalId].ownedTileIds ?? []
        ).filter((tileId) => !initialTileIds.has(tileId)),
    )

    expect(purchasedTileIds).toHaveLength(3)
    expect(new Set(purchasedTileIds).size).toBe(3)

    for (const rivalId of rivalIds) {
      expect(
        next.colonies[rivalId].ownedTileIds,
      ).toHaveLength(3)
      expect(next.colonies[rivalId].credits).toBeLessThan(
        state.colonies[rivalId].credits,
      )
      const purchasedTileId = purchasedTileIds.find((tileId) =>
        next.colonies[rivalId].ownedTileIds.includes(tileId),
      )!
      expect(
        next.colonies[rivalId]
          .crystalDiscoveryRoundByTileId[purchasedTileId],
      ).toBe(4)
    }

    for (const tileId of purchasedTileIds) {
      expect(selectOpponentTileIds(next)).toContain(tileId)
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

  it('erschließt für einen brachliegenden Harvester auch im Versorgungsnotfall Land', () => {
    const state = createRoundTwoState()
    state.colonies.nova.resources.food = 0

    expect(
      getAutonomousRivalLandDecision(state, 'nova'),
    ).not.toBeNull()
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
      afterSecondAttempt.colonies.vega.ownedTileIds,
    ).toHaveLength(3)
  })

  it('greift während eines Spielergebots überhaupt nicht ein', () => {
    const state = createRoundTwoState()
    state.pendingLandBid = {
      tileId: 'X',
      bids: { agima: 20 },
      reservedCredits: { agima: 20 },
    }

    expect(
      applyAutonomousRivalLandPurchases(state),
    ).toBe(state)
  })
})
