export type ResourceColorScale = {
  red: number
  green: number
  blue: number
}

const NEUTRAL_COLOR_SCALE: ResourceColorScale = {
  red: 1,
  green: 1,
  blue: 1,
}

export function calculateResourceColorScale(
  food: number,
  energy: number,
  ore: number,
  weightTotal: number,
): ResourceColorScale {
  const resourceTotal = food + energy + ore

  if (weightTotal === 0 || resourceTotal === 0) {
    return NEUTRAL_COLOR_SCALE
  }

  const foodShare = food / resourceTotal
  const energyShare = energy / resourceTotal
  const oreShare = ore / resourceTotal
  const strength = Math.min(
    1,
    resourceTotal / weightTotal / 5,
  )

  return {
    red:
      1 +
      strength *
        (foodShare * -0.1 +
          energyShare * -0.1 +
          oreShare * 0.12),
    green:
      1 +
      strength *
        (foodShare * 0.16 +
          energyShare * 0.055 +
          oreShare * -0.06),
    blue:
      1 +
      strength *
        (foodShare * -0.025 +
          energyShare * 0.16 +
          oreShare * -0.1),
  }
}
