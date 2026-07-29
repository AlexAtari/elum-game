import {
  createAgentPlan,
  type AgentContext,
} from './agents'
import type {
  ProductionType,
  RivalColonyState,
  Tile,
} from './game'
import {
  getEffectiveCrystalRating,
  type MeteorImpact,
} from './meteor'
import { targetCrystalRatings } from './planetMap'

export type RivalHarvesterAssignments = Partial<
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
  'crystals',
]

function getTileYield(
  tile: Tile,
  production: ProductionType,
  meteorImpacts: MeteorImpact[] = [],
) {
  if (production === 'crystals') {
    return getEffectiveCrystalRating(
      tile.id,
      targetCrystalRatings,
      meteorImpacts,
    )
  }

  return tile[production] ?? 0
}

function canRivalExtractCrystals(
  rival: RivalColonyState,
  tileId: string,
  roundPlayed: number,
) {
  const discoveryRound =
    rival.crystalDiscoveryRoundByTileId?.[tileId]

  return (
    discoveryRound !== undefined &&
    roundPlayed >= discoveryRound
  )
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

export const RIVAL_RETOOL_CREDIT_COST = 5

export type RivalHarvesterOperationsPlan = {
  assignments: RivalHarvesterAssignments
  retooledTileId: string | null
  retoolingCost: number
}

function getEmergencyRetoolTarget(
  rival: RivalColonyState,
  plan: ReturnType<typeof createAgentPlan>,
): ProductionType | null {
  const hadEnergyShutdown =
    (rival.inactiveHarvesterIds?.length ?? 0) > 0

  if (
    plan.emergency.energyShortage > 0 &&
    hadEnergyShutdown
  ) {
    return 'energy'
  }

  if (plan.emergency.foodShortage > 0) {
    return 'food'
  }

  if (plan.emergency.level === 'warning') {
    return plan.productionPriorities[0]?.resource ?? null
  }

  return null
}

function getAssignmentUtility(
  tile: Tile,
  production: ProductionType,
  priorityScores: Record<ProductionType, number>,
  meteorImpacts: MeteorImpact[] = [],
) {
  return (
    priorityScores[production] +
    getTileYield(tile, production, meteorImpacts) * 12
  )
}

export function planRivalHarvesterOperations(
  rival: RivalColonyState,
  allTiles: Tile[],
  roundPlayed: number,
  referencePrices: AgentContext['referencePrices'],
  harvesterBuild: HarvesterBuildCost,
  meteorImpacts: MeteorImpact[] = [],
): RivalHarvesterOperationsPlan {
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
  const assignments: RivalHarvesterAssignments = {}
  const assignmentCounts: Record<ProductionType, number> = {
    food: 0,
    energy: 0,
    ore: 0,
    crystals: 0,
  }

  for (const tile of productiveTiles) {
    if (
      Object.keys(assignments).length >= maximumAssignments
    ) {
      break
    }

    const existingProduction =
      rival.harvesterAssignments?.[tile.id]

    if (
      !existingProduction ||
      (existingProduction === 'crystals' &&
        !canRivalExtractCrystals(
          rival,
          tile.id,
          roundPlayed,
        ))
    ) {
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
        const firstIsAvailable =
          first !== 'crystals' ||
          canRivalExtractCrystals(
            rival,
            tile.id,
            roundPlayed,
          )
        const secondIsAvailable =
          second !== 'crystals' ||
          canRivalExtractCrystals(
            rival,
            tile.id,
            roundPlayed,
          )
        const firstScore =
          firstIsAvailable
            ? priorityScores[first] +
              getTileYield(tile, first, meteorImpacts) * 12 -
              assignmentCounts[first] * 4
            : Number.NEGATIVE_INFINITY
        const secondScore =
          secondIsAvailable
            ? priorityScores[second] +
              getTileYield(tile, second, meteorImpacts) * 12 -
              assignmentCounts[second] * 4
            : Number.NEGATIVE_INFINITY

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

  const retoolTarget = getEmergencyRetoolTarget(
    rival,
    plan,
  )
  const canRetool =
    retoolTarget !== null &&
    rival.credits >= RIVAL_RETOOL_CREDIT_COST &&
    rival.lastHarvesterRetoolRound !== roundPlayed
  const minimumUtilityGain =
    plan.emergency.level === 'critical' ? 0 : 15

  if (canRetool && retoolTarget !== null) {
    const retoolCandidate = Object.entries(assignments)
      .flatMap(([tileId, currentProduction]) => {
        if (
          !currentProduction ||
          currentProduction === retoolTarget
        ) {
          return []
        }

        const tile = productiveTiles.find(
          (candidate) => candidate.id === tileId,
        )
        if (
          !tile ||
          getTileYield(
            tile,
            retoolTarget,
            meteorImpacts,
          ) <= 0
        ) {
          return []
        }

        const utilityGain =
          getAssignmentUtility(
            tile,
            retoolTarget,
            priorityScores,
            meteorImpacts,
          ) -
          getAssignmentUtility(
            tile,
            currentProduction,
            priorityScores,
            meteorImpacts,
          )

        return [
          {
            tileId,
            utilityGain,
            targetYield: getTileYield(
              tile,
              retoolTarget,
              meteorImpacts,
            ),
          },
        ]
      })
      .filter(
        (candidate) =>
          candidate.utilityGain >= minimumUtilityGain,
      )
      .sort(
        (first, second) =>
          second.utilityGain - first.utilityGain ||
          second.targetYield - first.targetYield ||
          first.tileId.localeCompare(second.tileId),
      )[0]

    if (retoolCandidate) {
      assignments[retoolCandidate.tileId] = retoolTarget

      return {
        assignments,
        retooledTileId: retoolCandidate.tileId,
        retoolingCost: RIVAL_RETOOL_CREDIT_COST,
      }
    }
  }

  return {
    assignments,
    retooledTileId: null,
    retoolingCost: 0,
  }
}

export function planRivalHarvesterAssignments(
  rival: RivalColonyState,
  allTiles: Tile[],
  roundPlayed: number,
  referencePrices: AgentContext['referencePrices'],
  harvesterBuild: HarvesterBuildCost,
): RivalHarvesterAssignments {
  return planRivalHarvesterOperations(
    rival,
    allTiles,
    roundPlayed,
    referencePrices,
    harvesterBuild,
  ).assignments
}

export function calculateRivalAssignedProduction(
  assignments: RivalHarvesterAssignments,
  allTiles: Tile[],
  getModifier: ProductionModifier = () => 0,
  meteorImpacts: MeteorImpact[] = [],
): Record<ProductionType, number> {
  const production: Record<ProductionType, number> = {
    food: 0,
    energy: 0,
    ore: 0,
    crystals: 0,
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
      getTileYield(
        tile,
        productionType,
        meteorImpacts,
      ) +
        getModifier(productionType),
    )
  }

  return production
}

export type RivalEnergyAllocation = {
  poweredAssignments: RivalHarvesterAssignments
  inactiveHarvesterIds: string[]
  consumedEnergy: number
}

const energyPriority: ProductionType[] = [
  'energy',
  'food',
  'ore',
  'crystals',
]

export function allocateRivalHarvesterEnergy(
  assignments: RivalHarvesterAssignments,
  availableEnergy: number,
  energyPerHarvester: number = 1,
): RivalEnergyAllocation {
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
    ) as RivalHarvesterAssignments,
    inactiveHarvesterIds: inactiveEntries.map(
      ([tileId]) => tileId,
    ),
    consumedEnergy:
      poweredEntries.length * effectiveEnergyCost,
  }
}
