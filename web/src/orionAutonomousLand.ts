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
  type GameState,
  type Tile,
} from './game'

function getHexDistance(first: Tile, second: Tile) {
  const qDifference = first.q - second.q
  const rDifference = first.r - second.r

  return (
    Math.abs(qDifference) +
    Math.abs(rDifference) +
    Math.abs(qDifference + rDifference)
  ) / 2
}

function createAgentContext(
  currentState: GameState,
  landCandidates: AgentLandCandidate[],
): AgentContext {
  return {
    round: currentState.round,
    colony: currentState.rivals.orion,
    referencePrices: MARKET_PRICES,
    legalActions: {
      harvesterBuild: {
        creditCost: HARVESTER_CREDIT_COST,
        oreCost: HARVESTER_ORE_COST,
      },
      landCandidates,
    },
  }
}

export function getAutonomousOrionLandDecision(
  currentState: GameState,
): AgentSealedLandBidDecision | null {
  const orion = currentState.rivals.orion
  const orionTileIds = orion.ownedTileIds ?? []

  if (
    currentState.round < 2 ||
    currentState.round > GAME_ROUND_LIMIT ||
    currentState.pendingLandBid !== null ||
    currentState.landAuctionTie !== null ||
    isLandBidBlocked(currentState) ||
    orion.lastLandPurchaseRound === currentState.round ||
    orionTileIds.length >= orion.harvesters
  ) {
    return null
  }

  const occupiedTileIds = new Set([
    ...currentState.ownedTileIds,
    ...currentState.opponentTileIds,
  ])
  const orionTiles = tiles.filter((tile) =>
    orionTileIds.includes(tile.id),
  )

  const candidates: AgentLandCandidate[] = tiles
    .filter(
      (tile) =>
        tile.owner === 'free' &&
        !occupiedTileIds.has(tile.id),
    )
    .map((tile) => ({
      tileId: tile.id,
      minimumBid: LAND_MINIMUM_BID,
      food: tile.food ?? 0,
      energy: tile.energy ?? 0,
      ore: tile.ore ?? 0,
      adjacencyBonus: orionTiles.filter(
        (ownedTile) => getHexDistance(tile, ownedTile) === 1,
      ).length,
    }))

  if (candidates.length === 0) {
    return null
  }

  const context = createAgentContext(currentState, candidates)
  const selectedLand = createAgentPlan(context).landBid

  if (!selectedLand) {
    return null
  }

  const selectedCandidate = candidates.find(
    (candidate) => candidate.tileId === selectedLand.tileId,
  )

  if (!selectedCandidate) {
    return null
  }

  return createSealedLandBidDecision(
    context,
    selectedCandidate,
  )
}

export function applyAutonomousOrionLandPurchase(
  currentState: GameState,
): GameState {
  const decision = getAutonomousOrionLandDecision(currentState)

  if (!decision) {
    return currentState
  }

  const orion = currentState.rivals.orion
  const orionTileIds = orion.ownedTileIds ?? []

  if (
    decision.bid <= 0 ||
    decision.bid > orion.credits ||
    currentState.opponentTileIds.includes(decision.tileId)
  ) {
    return currentState
  }

  return {
    ...currentState,
    opponentTileIds: [
      ...currentState.opponentTileIds,
      decision.tileId,
    ],
    rivals: {
      ...currentState.rivals,
      orion: {
        ...orion,
        credits: orion.credits - decision.bid,
        ownedTileIds: [...orionTileIds, decision.tileId],
        lastLandPurchaseRound: currentState.round,
      },
    },
  }
}
