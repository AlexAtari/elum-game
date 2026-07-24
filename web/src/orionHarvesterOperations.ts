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
      harvesterEnergyCost: 1,
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

export type OrionEnergyAllocation = {
  poweredAssignments: OrionHarvesterAssignments
  inactiveHarvesterIds: string[]
  consumedEnergy: number
}

const energyPriority: ProductionType[] = [
  'energy',
  'food',
  'ore',
]

export function allocateOrionHarvesterEnergy(
  assignments: OrionHarvesterAssignments,
  availableEnergy: number,
  energyPerHarvester: number = 1,
): OrionEnergyAllocation {
  const effectiveEnergyCost = Math.max(
    1,
    Math.floor(energyPerHarvester),
  )
  const assignmentEntries = Object.entries(assignments)
    .filter(
      (
        entry,
      ): entry is [string, ProductionType] =>
        entry[1] !== undefined,
    )
    .sort(
      ([firstTileId, firstProduction], [
        secondTileId,
        secondProduction,
      ]) =>
        energyPriority.indexOf(firstProduction) -
          energyPriority.indexOf(secondProduction) ||
        firstTileId.localeCompare(secondTileId),
    )
  const poweredCount = Math.min(
    assignmentEntries.length,
    Math.floor(
      Math.max(0, availableEnergy) /
        effectiveEnergyCost,
    ),
  )
  const poweredEntries = assignmentEntries.slice(
    0,
    poweredCount,
  )
  const inactiveEntries = assignmentEntries.slice(
    poweredCount,
  )

  return {
    poweredAssignments: Object.fromEntries(
      poweredEntries,
    ) as OrionHarvesterAssignments,
    inactiveHarvesterIds: inactiveEntries.map(
      ([tileId]) => tileId,
    ),
    consumedEnergy:
      poweredEntries.length * effectiveEnergyCost,
  }
}
