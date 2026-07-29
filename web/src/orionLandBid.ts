import {
  createSealedLandBidDecision,
} from './agents'
import {
  HARVESTER_CREDIT_COST,
  HARVESTER_ORE_COST,
  LAND_MINIMUM_BID,
  MARKET_PRICES,
  placeColonyLandBid,
  selectRivalColonies,
  tiles,
  type GameState,
} from './game'

export function applyStrategicOrionBid(
  currentState: GameState,
): GameState {
  const pendingBid = currentState.pendingLandBid

  if (!pendingBid) {
    return currentState
  }

  const tile = tiles.find(
    (candidate) => candidate.id === pendingBid.tileId,
  )

  if (!tile) {
    return currentState
  }

  const decision = createSealedLandBidDecision(
    {
      round: currentState.round,
      colony: selectRivalColonies(currentState).orion,
      referencePrices: MARKET_PRICES,
      legalActions: {
        harvesterBuild: {
          creditCost: HARVESTER_CREDIT_COST,
          oreCost: HARVESTER_ORE_COST,
        },
      },
    },
    {
      tileId: tile.id,
      minimumBid:
        pendingBid.tieMinimum ?? LAND_MINIMUM_BID,
      food: tile.food ?? 0,
      energy: tile.energy ?? 0,
      ore: tile.ore ?? 0,
    },
  )

  return decision
    ? placeColonyLandBid(
        currentState,
        'orion',
        pendingBid.tileId,
        decision.bid,
      )
    : currentState
}

export function placeStrategicOrionLandBid(
  currentState: GameState,
  tileId: string,
  amount: number,
): GameState {
  return applyStrategicOrionBid(
    placeColonyLandBid(
      currentState,
      'agima',
      tileId,
      amount,
    ),
  )
}
