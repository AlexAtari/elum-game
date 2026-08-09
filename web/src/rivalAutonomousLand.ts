import {
  createAgentPlan,
  createSealedLandBidDecision,
  type AgentContext,
  type AgentLandCandidate,
  type AgentSealedLandBidDecision,
} from './agents'
import {
  GAME_ROUND_LIMIT,
  HARVESTER_CREDIT_COST,
  HARVESTER_ORE_COST,
  LAND_MINIMUM_BID,
  MARKET_PRICES,
  addColonyOwnedTile,
  isLandBidBlocked,
  isColonyLandTargetAdjacent,
  selectLocalColony,
  selectOpponentTileIds,
  selectRivalColonies,
  tiles,
  updateColony,
  type GameState,
  type RivalId,
} from './game'
import {
  areTilesAdjacent,
  targetPlanetMap,
} from './planetMap'

const autonomousRivalIds: RivalId[] = [
  'orion',
  'nova',
  'vega',
]

function createAgentContext(
  currentState: GameState,
  rivalId: RivalId,
  landCandidates: AgentLandCandidate[],
  normalSupplyDemand?: number,
): AgentContext {
  const rival = selectRivalColonies(currentState)[rivalId]

  return {
    round: currentState.round,
    colony: rival,
    referencePrices: MARKET_PRICES,
    legalActions: {
      harvesterBuild: {
        creditCost: HARVESTER_CREDIT_COST,
        oreCost: HARVESTER_ORE_COST,
      },
      harvesterEnergyCost: 1,
      normalSupplyDemand,
      hasIdleHarvester:
        rival.harvesters > (rival.ownedTileIds?.length ?? 0),
      canExpandFrontier:
        rival.harvesters >= 3 &&
        (rival.ownedTileIds?.length ?? 0) >=
          rival.harvesters &&
        (rival.ownedTileIds?.length ?? 0) <
          rival.harvesters + 2,
      landCandidates,
    },
  }
}

export function getAutonomousRivalPurchaseOrder(
  round: number,
): RivalId[] {
  const offset =
    ((Math.max(1, round) - 1) % autonomousRivalIds.length)

  return [
    ...autonomousRivalIds.slice(offset),
    ...autonomousRivalIds.slice(0, offset),
  ]
}

export function getAutonomousRivalLandDecision(
  currentState: GameState,
  rivalId: RivalId,
  normalSupplyDemand?: number,
): AgentSealedLandBidDecision | null {
  const rival = selectRivalColonies(currentState)[rivalId]
  const rivalTileIds = rival.ownedTileIds ?? []

  if (
    currentState.round < 2 ||
    currentState.round > GAME_ROUND_LIMIT ||
    currentState.pendingLandBid !== null ||
    currentState.landAuctionTie !== null ||
    isLandBidBlocked(currentState) ||
    rival.lastLandPurchaseRound === currentState.round ||
    rivalTileIds.length >= rival.harvesters + 2
  ) {
    return null
  }

  const occupiedTileIds = new Set([
    ...selectLocalColony(currentState).ownedTileIds,
    ...selectOpponentTileIds(currentState),
  ])
  const rivalTiles = tiles.filter((tile) =>
    rivalTileIds.includes(tile.id),
  )

  const candidates: AgentLandCandidate[] = tiles
    .filter(
      (tile) =>
        tile.owner === 'free' &&
        !occupiedTileIds.has(tile.id) &&
        isColonyLandTargetAdjacent(
          currentState,
          rivalId,
          tile.id,
        ),
    )
    .map((tile) => ({
      tileId: tile.id,
      minimumBid: LAND_MINIMUM_BID,
      food: tile.food ?? 0,
      energy: tile.energy ?? 0,
      ore: tile.ore ?? 0,
      distanceFromHq: tile.distanceFromHq,
      adjacencyBonus: rivalTiles.filter(
        (ownedTile) =>
          areTilesAdjacent(
            targetPlanetMap,
            tile.id,
            ownedTile.id,
          ),
      ).length,
    }))

  if (candidates.length === 0) {
    return null
  }

  const context = createAgentContext(
    currentState,
    rivalId,
    candidates,
    normalSupplyDemand,
  )
  const selectedLand = createAgentPlan(context).landBid

  if (!selectedLand) {
    return null
  }

  const selectedCandidate = candidates.find(
    (candidate) =>
      candidate.tileId === selectedLand.tileId,
  )

  if (!selectedCandidate) {
    return null
  }

  return createSealedLandBidDecision(
    context,
    selectedCandidate,
  )
}

export function applyAutonomousRivalLandPurchase(
  currentState: GameState,
  rivalId: RivalId,
  normalSupplyDemand?: number,
): GameState {
  const decision = getAutonomousRivalLandDecision(
    currentState,
    rivalId,
    normalSupplyDemand,
  )

  if (!decision) {
    return currentState
  }

  const rival = selectRivalColonies(currentState)[rivalId]

  if (
    decision.bid <= 0 ||
    decision.bid > rival.credits ||
    !isColonyLandTargetAdjacent(
      currentState,
      rivalId,
      decision.tileId,
    ) ||
    selectOpponentTileIds(currentState).includes(
      decision.tileId,
    )
  ) {
    return currentState
  }

  const stateAfterPurchase = updateColony(
    currentState,
    rivalId,
    (colony) => ({
      ...colony,
      credits: colony.credits - decision.bid,
    }),
  )
  const stateWithLand = addColonyOwnedTile(
    stateAfterPurchase,
    rivalId,
    decision.tileId,
  )

  return updateColony(
    stateWithLand,
    rivalId,
    (colony) => ({
      ...colony,
      lastLandPurchaseRound: currentState.round,
    }),
  )
}

export function applyAutonomousRivalLandPurchases(
  currentState: GameState,
  normalSupplyDemand?: (population: number) => number,
): GameState {
  return getAutonomousRivalPurchaseOrder(
    currentState.round,
  ).reduce(
    (state, rivalId) =>
      applyAutonomousRivalLandPurchase(
        state,
        rivalId,
        normalSupplyDemand?.(
          selectRivalColonies(state)[rivalId]
            .population,
        ),
      ),
    currentState,
  )
}

export function getAutonomousOrionLandDecision(
  currentState: GameState,
): AgentSealedLandBidDecision | null {
  return getAutonomousRivalLandDecision(
    currentState,
    'orion',
  )
}

export function applyAutonomousOrionLandPurchase(
  currentState: GameState,
): GameState {
  return applyAutonomousRivalLandPurchase(
    currentState,
    'orion',
  )
}
