import {
  createAgentPlan,
  type AgentContext,
} from './agents'
import type {
  ProductionType,
  RivalColonyState,
  Tile,
} from './game'

export type OrionHarvesterAssignments = Partial<
  Record<string, ProductionType>
>

type HarvesterBuildCost = {
  creditCost: number
  oreCost: number
}

type ProductionModifier = (
  production: ProductionType,
) => number

const productionOrder: ProductionType[] = [
  'food',
  'energy',
  'ore',
]

function getTileYield(
  tile: Tile,
  production: ProductionType,
) {
  return tile[production] ?? 0
}

function getProductiveTileIds(
  rival: RivalColonyState,
  roundPlayed: number,
) {
  const ownedTileIds = rival.ownedTileIds ?? []

  if (
    rival.lastLandPurchaseRound !== roundPlayed ||
    ownedTileIds.length === 0
  ) {
    return ownedTileIds
  }

  return ownedTileIds.slice(0, -1)
}

export function planOrionHarvesterAssignments(
  rival: RivalColonyState,
  allTiles: Tile[],
  roundPlayed: number,
  referencePrices: AgentContext['referencePrices'],
  harvesterBuild: HarvesterBuildCost,
): OrionHarvesterAssignments {
  const productiveTileIds = getProductiveTileIds(
    rival,
    roundPlayed,
  )
  const productiveTiles = productiveTileIds
    .map((tileId) =>
      allTiles.find((tile) => tile.id === tileId),
    )
    .filter((tile): tile is Tile => tile !== undefined)
  const maximumAssignments = Math.min(
    rival.harvesters,
    productiveTiles.length,
  )
  const assignments: OrionHarvesterAssignments = {}
  const assignmentCounts: Record<ProductionType, number> = {
    food: 0,
    energy: 0,
    ore: 0,
  }

  for (const tile of productiveTiles) {
    if (
      Object.keys(assignments).length >= maximumAssignments
    ) {
      break
    }

    const existingProduction =
      rival.harvesterAssignments?.[tile.id]

    if (!existingProduction) {
      continue
    }

    assignments[tile.id] = existingProduction
    assignmentCounts[existingProduction] += 1
  }

  const plan = createAgentPlan({
    round: roundPlayed,
    colony: rival,
    referencePrices,
    legalActions: {
      harvesterBuild,
    },
  })
  const priorityScores = Object.fromEntries(
    plan.productionPriorities.map(
      ({ resource, score }) => [resource, score],
    ),
  ) as Record<ProductionType, number>

  for (const tile of productiveTiles) {
    if (
      Object.keys(assignments).length >= maximumAssignments
    ) {
      break
    }

    if (assignments[tile.id]) {
      continue
    }

    const production = [...productionOrder].sort(
      (first, second) => {
        const firstScore =
          priorityScores[first] +
          getTileYield(tile, first) * 12 -
          assignmentCounts[first] * 4
        const secondScore =
          priorityScores[second] +
          getTileYield(tile, second) * 12 -
          assignmentCounts[second] * 4

        return (
          secondScore - firstScore ||
          productionOrder.indexOf(first) -
            productionOrder.indexOf(second)
        )
      },
    )[0]

    assignments[tile.id] = production
    assignmentCounts[production] += 1
  }

  return assignments
}

export function calculateOrionAssignedProduction(
  assignments: OrionHarvesterAssignments,
  allTiles: Tile[],
  getModifier: ProductionModifier = () => 0,
): Record<ProductionType, number> {
  const production: Record<ProductionType, number> = {
    food: 0,
    energy: 0,
    ore: 0,
  }

  for (const [tileId, productionType] of Object.entries(
    assignments,
  )) {
    if (!productionType) {
      continue
    }

    const tile = allTiles.find(
      (candidate) => candidate.id === tileId,
    )
    if (!tile) {
      continue
    }

    production[productionType] += Math.max(
      0,
      getTileYield(tile, productionType) +
        getModifier(productionType),
    )
  }

  return production
}
