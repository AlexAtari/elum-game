import { describe, expect, it } from 'vitest'
import {
  applyAutonomousOrionLandPurchase,
  getAutonomousOrionLandDecision,
} from './orionAutonomousLand'
import {
  createPlayableInitialGameState,
  LAND_MINIMUM_BID,
  selectOpponentTileIds,
  tiles,
} from './game'

function createRoundTwoState() {
  const state = createPlayableInitialGameState()
  state.round = 2
  state.colonies.orion.harvesters = 3
  state.colonies.orion.credits = 100
  return state
}

describe('Orions selbstständiger Grundstückskauf', () => {
  it('wählt ab Runde zwei reproduzierbar ein freies Grundstück', () => {
    const state = createRoundTwoState()

    const firstDecision =
      getAutonomousOrionLandDecision(state)
    const secondDecision =
      getAutonomousOrionLandDecision(state)

    expect(firstDecision).not.toBeNull()
    expect(firstDecision).toEqual(secondDecision)
    expect(firstDecision!.bid).toBeGreaterThanOrEqual(
      LAND_MINIMUM_BID,
    )

    const selectedTile = tiles.find(
      (tile) => tile.id === firstDecision!.tileId,
    )
    expect(selectedTile?.owner).toBe('free')
  })

  it('bezahlt das Grundstück und speichert Orions Besitz', () => {
    const state = createRoundTwoState()
    const decision =
      getAutonomousOrionLandDecision(state)

    expect(decision).not.toBeNull()

    const next =
      applyAutonomousOrionLandPurchase(state)

    expect(next.colonies.orion.credits).toBe(
      state.colonies.orion.credits - decision!.bid,
    )
    expect(next.colonies.orion.ownedTileIds).toContain(
      decision!.tileId,
    )
    expect(selectOpponentTileIds(next)).toContain(decision!.tileId)
    expect(next.colonies.orion.lastLandPurchaseRound).toBe(2)
  })

  it('kauft in derselben Runde kein zweites Grundstück', () => {
    const state = createRoundTwoState()
    const afterFirstPurchase =
      applyAutonomousOrionLandPurchase(state)
    const afterSecondAttempt =
      applyAutonomousOrionLandPurchase(afterFirstPurchase)

    expect(afterSecondAttempt).toBe(afterFirstPurchase)
  })

  it('greift nicht in ein laufendes Spielergebot ein', () => {
    const state = createRoundTwoState()
    state.pendingLandBid = {
      tileId: 'X',
      bids: { agima: LAND_MINIMUM_BID },
      reservedCredits: { agima: LAND_MINIMUM_BID },
    }

    expect(
      applyAutonomousOrionLandPurchase(state),
    ).toBe(state)
  })

  it('respektiert eine Sperre der Grundstücksvermessung', () => {
    const state = createRoundTwoState()
    state.activeGlobalEvent = 'surveying-stop'

    expect(
      getAutonomousOrionLandDecision(state),
    ).toBeNull()
  })

  it('kauft nicht mehr Grundstücke als vorhandene Harvester', () => {
    const state = createRoundTwoState()
    const freeTileIds = tiles
      .filter((tile) => tile.owner === 'free')
      .slice(0, state.colonies.orion.harvesters)
      .map((tile) => tile.id)

    state.colonies.orion.ownedTileIds = freeTileIds

    expect(
      getAutonomousOrionLandDecision(state),
    ).toBeNull()
  })
})
