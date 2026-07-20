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

export type HarvesterAssignments = Partial<
  Record<string, ProductionType>
>

export type RoundReport = {
  roundPlayed: number
  produced: Record<ProductionType, number>
  consumedFood: number
  consumedEnergyByHq: number
  consumedEnergyByHarvesters: number
  populationChange: number
  inactiveHarvesterIds: string[]
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
    y: 95,
    owner: 'player',
    food: 4,
    energy: 2,
    ore: 4,
  },
  {
    id: 'B',
    x: 485,
    y: 170,
    owner: 'player',
    food: 3,
    energy: 4,
    ore: 2,
  },

  {
    id: 'C',
    x: 485,
    y: 330,
    owner: 'free',
    food: 2,
    energy: 5,
    ore: 1,
  },
  {
    id: 'D',
    x: 350,
    y: 405,
    owner: 'free',
    food: 1,
    energy: 3,
    ore: 5,
  },
  {
    id: 'E',
    x: 215,
    y: 330,
    owner: 'free',
    food: 5,
    energy: 2,
    ore: 2,
  },
  {
    id: 'F',
    x: 215,
    y: 170,
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

export function runRound(
  currentState: GameState,
  harvesters: HarvesterAssignments,
): {
  nextState: GameState
  report: RoundReport
} {
  const normalFoodRequirement =
    Math.ceil(currentState.population / 10) * 2

  const normalEnergyRequirement =
    Math.ceil(currentState.population / 10) * 2

  const consumedFood = Math.min(
    currentState.resources.food,
    normalFoodRequirement,
  )

  const consumedEnergyByHq = Math.min(
    currentState.resources.energy,
    normalEnergyRequirement,
  )

  const energyAfterHq =
    currentState.resources.energy - consumedEnergyByHq

  const assignedHarvesters: Array<{
    tile: Tile
    production: ProductionType
    randomOrder: number
  }> = []

  for (const [tileId, production] of Object.entries(
    harvesters,
  ) as Array<[string, ProductionType]>) {
    const tile = tiles.find((candidate) => candidate.id === tileId)

    if (tile) {
      assignedHarvesters.push({
        tile,
        production,
        randomOrder: Math.random(),
      })
    }
  }

  const availableHarvesterEnergy = Math.max(0, energyAfterHq)

  const amountToDeactivate = Math.max(
    0,
    assignedHarvesters.length - availableHarvesterEnergy,
  )

  const deactivationOrder = [...assignedHarvesters].sort(
    (first, second) => {
      const ratingDifference =
        getRating(first.tile, first.production) -
        getRating(second.tile, second.production)

      if (ratingDifference !== 0) {
        return ratingDifference
      }

      const resourceDifference =
        deactivationPriority[first.production] -
        deactivationPriority[second.production]

      if (resourceDifference !== 0) {
        return resourceDifference
      }

      const distanceDifference =
        getDistanceFromHq(second.tile) -
        getDistanceFromHq(first.tile)

      if (distanceDifference !== 0) {
        return distanceDifference
      }

      return first.randomOrder - second.randomOrder
    },
  )

  const inactiveHarvesterIds = deactivationOrder
    .slice(0, amountToDeactivate)
    .map((harvester) => harvester.tile.id)

  const inactiveHarvesterSet = new Set(inactiveHarvesterIds)

  const activeHarvesters = assignedHarvesters.filter(
    (harvester) => !inactiveHarvesterSet.has(harvester.tile.id),
  )

  const produced: Record<ProductionType, number> = {
    food: 0,
    energy: 0,
    ore: 0,
  }

  for (const harvester of activeHarvesters) {
    produced[harvester.production] += getRating(
      harvester.tile,
      harvester.production,
    )
  }

  const consumedEnergyByHarvesters = activeHarvesters.length

  let populationChange = 0

  if (
    consumedFood >= normalFoodRequirement &&
    consumedEnergyByHq >= normalEnergyRequirement
  ) {
    populationChange = 1
  } else if (consumedFood === 0 || consumedEnergyByHq === 0) {
    populationChange = -1
  }

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
    report: {
      roundPlayed: currentState.round,
      produced,
      consumedFood,
      consumedEnergyByHq,
      consumedEnergyByHarvesters,
      populationChange,
      inactiveHarvesterIds,
    },
  }
}