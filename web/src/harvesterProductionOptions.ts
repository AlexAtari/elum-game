import type { ProductionType } from './game'

const standardProductionOptions: ProductionType[] = [
  'food',
  'energy',
  'ore',
]

export function getHarvesterProductionOptions(
  canProduceCrystals: boolean,
): ProductionType[] {
  return canProduceCrystals
    ? ['crystals', ...standardProductionOptions]
    : [...standardProductionOptions]
}
