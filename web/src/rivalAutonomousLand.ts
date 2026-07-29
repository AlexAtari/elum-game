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
  isLandBidBlocked,
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
): AgentContext {
  return {
    round: currentState.round,
    colony: currentState.rivals[rivalId],
    referencePrices: MARKET_PRICES,
    legalActions: {
      harvesterBuild: {
        creditCost: HARVESTER_CREDIT_COST,
        oreCost: HARVESTER_ORE_COST,
      },
      harvesterEnergyCost: 1,
      hasIdleHarvester:
        currentState.rivals[rivalId].harvesters >
        (currentState.rivals[rivalId].ownedTileIds?.length ??
          0),
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
): AgentSealedLandBidDecision | null {
  const rival = currentState.rivals[rivalId]
  const rivalTileIds = rival.ownedTileIds ?? []

  if (
    currentState.round < 2 ||
    currentState.round > GAME_ROUND_LIMIT ||
    currentState.pendingLandBid !== null ||
    currentState.landAuctionTie !== null ||
    isLandBidBlocked(currentState) ||
    rival.lastLandPurchaseRound === currentState.round ||
    rivalTileIds.length >= rival.harvesters
  ) {
    return null
  }

  const occupiedTileIds = new Set([
    ...currentState.ownedTileIds,
    ...currentState.opponentTileIds,
  ])
  const rivalTiles = tiles.filter((tile) =>
    rivalTileIds.includes(tile.id),
  )

  const candidates: AgentLandCandidate[] = tiles
    .filter(
      (tile) =>
        tile.owner === 'free' &&
        !occupiedTileIds.has(tile.id) &&
        rivalTiles.some((ownedTile) =>
          areTilesAdjacent(
            targetPlanetMap,
            tile.id,
            ownedTile.id,
          ),
        ),
    )
    .map((tile) => ({
      tileId: tile.id,
      minimumBid: LAND_MINIMUM_BID,
      food: tile.food ?? 0,
      energy: tile.energy ?? 0,
      ore: tile.ore ?? 0,
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
): GameState {
  const decision = getAutonomousRivalLandDecision(
    currentState,
    rivalId,
  )

  if (!decision) {
    return currentState
  }

  const rival = currentState.rivals[rivalId]

  if (
    decision.bid <= 0 ||
    decision.bid > rival.credits ||
    currentState.opponentTileIds.includes(
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
      ownedTileIds: [
        ...colony.ownedTileIds,
        decision.tileId,
      ],
    }),
  )

  return {
    ...stateAfterPurchase,
    rivals: {
      ...stateAfterPurchase.rivals,
      [rivalId]: {
        ...stateAfterPurchase.rivals[rivalId],
        lastLandPurchaseRound: currentState.round,
      },
    },
  }
}

export function applyAutonomousRivalLandPurchases(
  currentState: GameState,
): GameState {
  return getAutonomousRivalPurchaseOrder(
    currentState.round,
  ).reduce(
    (state, rivalId) =>
      applyAutonomousRivalLandPurchase(
        state,
        rivalId,
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
