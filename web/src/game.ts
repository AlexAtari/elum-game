export type ProductionType = 'food' | 'energy' | 'ore'

export type Resources = {
  food: number
  energy: number
  ore: number
  crystals: number
}

export type GameState = {
  round: number
  population: number
  credits: number
  resources: Resources
}

export type TileOwner = 'hq' | 'player' | 'free'

export type Tile = {
  id: string
  x: number
  y: number
  owner: TileOwner
  food?: number
  energy?: number
  ore?: number
}

export type HarvesterAssignment = {
  production: ProductionType
  pendingProduction?: ProductionType
  retoolingReason?: 'production-change' | 'relocation'
  isNew: boolean
}

export type HarvesterAssignments = Partial<
  Record<string, HarvesterAssignment>
>

export type FreeHarvester = {
  previousProduction?: ProductionType
}

export type SupplyPlan = {
  foodLevel: number
  energyLevel: number
}

export type SupplyPreview = {
  plannedFood: number
  plannedEnergy: number
  consumedFood: number
  consumedEnergyByHq: number
  remainingFood: number
  remainingEnergyBeforeHarvesters: number
  populationChange: number
  hasShortage: boolean
}

export type RoundReport = {
  roundPlayed: number
  produced: Record<ProductionType, number>
  consumedFood: number
  consumedEnergyByHq: number
  consumedEnergyByHarvesters: number
  populationChange: number
  inactiveHarvesterIds: string[]
  completedRetoolingIds: string[]
  pausedRetoolingIds: string[]
}

export const productionTypes: Record<
  ProductionType,
  { label: string; icon: string }
> = {
  food: {
    label: 'Nahrung',
    icon: '🌾',
  },
  energy: {
    label: 'Energie',
    icon: '⚡',
  },
  ore: {
    label: 'Erz',
    icon: '⛏',
  },
}

export const tiles: Tile[] = [
  { id: 'HQ', x: 350, y: 250, owner: 'hq' },

  {
    id: 'A',
    x: 350,
    y: 106,
    owner: 'player',
    food: 4,
    energy: 2,
    ore: 4,
  },
  {
    id: 'B',
    x: 475,
    y: 178,
    owner: 'player',
    food: 3,
    energy: 4,
    ore: 2,
  },
  {
    id: 'C',
    x: 475,
    y: 322,
    owner: 'free',
    food: 2,
    energy: 5,
    ore: 1,
  },
  {
    id: 'D',
    x: 350,
    y: 394,
    owner: 'free',
    food: 1,
    energy: 3,
    ore: 5,
  },
  {
    id: 'E',
    x: 225,
    y: 322,
    owner: 'free',
    food: 5,
    energy: 2,
    ore: 2,
  },
  {
    id: 'F',
    x: 225,
    y: 178,
    owner: 'free',
    food: 2,
    energy: 3,
    ore: 4,
  },
]

export function createInitialGameState(): GameState {
  return {
    round: 1,
    population: 10,
    credits: 100,
    resources: {
      food: 10,
      energy: 10,
      ore: 5,
      crystals: 0,
    },
  }
}

function getRating(tile: Tile, production: ProductionType) {
  return tile[production] ?? 0
}

function getDistanceFromHq(tile: Tile) {
  const hq = tiles.find((candidate) => candidate.owner === 'hq')

  if (!hq) {
    return 0
  }

  return Math.hypot(tile.x - hq.x, tile.y - hq.y)
}

const deactivationPriority: Record<ProductionType, number> = {
  ore: 1,
  energy: 2,
  food: 3,
}

export function calculateSupplyPreview(
  currentState: GameState,
  supplyPlan: SupplyPlan,
): SupplyPreview {
  const populationGroups = Math.ceil(
    currentState.population / 10,
  )

  const plannedFood =
    populationGroups * supplyPlan.foodLevel

  const plannedEnergy =
    populationGroups * supplyPlan.energyLevel

  const consumedFood = Math.min(
    currentState.resources.food,
    plannedFood,
  )

  const consumedEnergyByHq = Math.min(
    currentState.resources.energy,
    plannedEnergy,
  )

  const actualFoodLevel = Math.floor(
    consumedFood / populationGroups,
  )

  const actualEnergyLevel = Math.floor(
    consumedEnergyByHq / populationGroups,
  )

  const effectiveSupplyLevel = Math.min(
    actualFoodLevel,
    actualEnergyLevel,
  )

  let populationChange = 0

  if (effectiveSupplyLevel >= 3) {
    populationChange = 2
  } else if (effectiveSupplyLevel >= 2) {
    populationChange = 1
  } else if (effectiveSupplyLevel === 0) {
    populationChange = -1
  }

  return {
    plannedFood,
    plannedEnergy,
    consumedFood,
    consumedEnergyByHq,
    remainingFood: currentState.resources.food - consumedFood,
    remainingEnergyBeforeHarvesters:
      currentState.resources.energy - consumedEnergyByHq,
    populationChange,
    hasShortage:
      consumedFood < plannedFood ||
      consumedEnergyByHq < plannedEnergy,
  }
}

export function runRound(
  currentState: GameState,
  harvesters: HarvesterAssignments,
  supplyPlan: SupplyPlan,
): {
  nextState: GameState
  nextHarvesters: HarvesterAssignments
  report: RoundReport
} {
  const supplyPreview = calculateSupplyPreview(
    currentState,
    supplyPlan,
  )

  const {
    consumedFood,
    consumedEnergyByHq,
    populationChange,
  } = supplyPreview

  const energyAfterHq =
    currentState.resources.energy - consumedEnergyByHq

  const harvesterTasks: Array<{
    id: string
    kind: 'production' | 'retooling'
    tile?: Tile
    production: ProductionType
    retoolingReason?: HarvesterAssignment['retoolingReason']
    rating: number
    distance: number
    randomOrder: number
  }> = []

  for (const [tileId, assignment] of Object.entries(
    harvesters,
  ) as Array<[string, HarvesterAssignment]>) {
    const tile = tiles.find((candidate) => candidate.id === tileId)

    if (tile) {
      const isRetooling =
        assignment.pendingProduction !== undefined

      harvesterTasks.push({
        id: tile.id,
        kind: isRetooling ? 'retooling' : 'production',
        tile,
        production:
          assignment.pendingProduction ?? assignment.production,
        retoolingReason: assignment.retoolingReason,
        rating: isRetooling
          ? assignment.retoolingReason === 'production-change'
            ? Math.ceil(
                getRating(
                  tile,
                  assignment.pendingProduction!,
                ) / 2,
              )
            : 0
          : getRating(tile, assignment.production),
        distance: getDistanceFromHq(tile),
        randomOrder: Math.random(),
      })
    }
  }

  const availableHarvesterEnergy = Math.max(0, energyAfterHq)

  const amountToDeactivate = Math.max(
    0,
    harvesterTasks.length - availableHarvesterEnergy,
  )

  const deactivationOrder = [...harvesterTasks].sort(
    (first, second) => {
      const ratingDifference = first.rating - second.rating

      if (ratingDifference !== 0) {
        return ratingDifference
      }

      const resourceDifference =
        deactivationPriority[first.production] -
        deactivationPriority[second.production]

      if (resourceDifference !== 0) {
        return resourceDifference
      }

      const distanceDifference = second.distance - first.distance

      if (distanceDifference !== 0) {
        return distanceDifference
      }

      return first.randomOrder - second.randomOrder
    },
  )

  const inactiveTaskIds = deactivationOrder
    .slice(0, amountToDeactivate)
    .map((task) => task.id)

  const inactiveTaskSet = new Set(inactiveTaskIds)

  const activeTasks = harvesterTasks.filter(
    (task) => !inactiveTaskSet.has(task.id),
  )

  const activeProductionTasks = activeTasks.filter(
    (task) =>
      task.tile &&
      (task.kind === 'production' ||
        task.retoolingReason === 'production-change'),
  )

  const completedRetoolingIds = activeTasks
    .filter((task) => task.kind === 'retooling')
    .map((task) => task.id)

  const completedRetoolingSet = new Set(completedRetoolingIds)

  const pausedRetoolingIds = harvesterTasks
    .filter(
      (task) =>
        task.kind === 'retooling' && inactiveTaskSet.has(task.id),
    )
    .map((task) => task.id)

  const produced: Record<ProductionType, number> = {
    food: 0,
    energy: 0,
    ore: 0,
  }

  for (const task of activeProductionTasks) {
    produced[task.production] += task.rating
  }

  const consumedEnergyByHarvesters = activeTasks.length

  const nextHarvesters: HarvesterAssignments = {}

  for (const [tileId, assignment] of Object.entries(
    harvesters,
  ) as Array<[string, HarvesterAssignment]>) {
    if (
      assignment.pendingProduction &&
      completedRetoolingSet.has(tileId)
    ) {
      nextHarvesters[tileId] = {
        production: assignment.pendingProduction,
        isNew: false,
      }
    } else {
      nextHarvesters[tileId] = {
        ...assignment,
        isNew: false,
      }
    }
  }

  const inactiveHarvesterIds = harvesterTasks
    .filter(
      (task) =>
        task.kind === 'production' && inactiveTaskSet.has(task.id),
    )
    .map((task) => task.id)

  const nextState: GameState = {
    round: currentState.round + 1,
    population: Math.max(
      1,
      currentState.population + populationChange,
    ),
    credits: currentState.credits,
    resources: {
      food:
        currentState.resources.food -
        consumedFood +
        produced.food,
      energy:
        currentState.resources.energy -
        consumedEnergyByHq -
        consumedEnergyByHarvesters +
        produced.energy,
      ore: currentState.resources.ore + produced.ore,
      crystals: currentState.resources.crystals,
    },
  }

  return {
    nextState,
    nextHarvesters,
    report: {
      roundPlayed: currentState.round,
      produced,
      consumedFood,
      consumedEnergyByHq,
      consumedEnergyByHarvesters,
      populationChange,
      inactiveHarvesterIds,
      completedRetoolingIds,
      pausedRetoolingIds,
    },
  }
}
