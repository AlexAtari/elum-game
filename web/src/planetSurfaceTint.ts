export type ResourceColorScale = {
  red: number
  green: number
  blue: number
}

function calculateRoundProgress(
  round: number,
  finalRound: number,
) {
  return Math.min(
    1,
    Math.max(0, (round - 1) / Math.max(1, finalRound - 1)),
  )
}

export function calculateTerraformingBlend(
  food: number,
  energy: number,
  ore: number,
  weightTotal: number,
  round: number,
  finalRound: number,
) {
  const roundProgress = calculateRoundProgress(
    round,
    finalRound,
  )
  const resourceTotal = food + energy + ore

  if (
    roundProgress === 0 ||
    weightTotal === 0 ||
    resourceTotal === 0
  ) {
    return roundProgress * 0.38
  }

  const foodRating = Math.min(
    1,
    food / weightTotal / 5,
  )
  const foodShare = food / resourceTotal
  const suitability =
    foodRating * 0.65 + foodShare * 0.35

  return Math.min(
    1,
    roundProgress * (0.38 + suitability * 0.62),
  )
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
  round: number,
  finalRound: number,
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
  const roundProgress = calculateRoundProgress(
    round,
    finalRound,
  )
  const foodGreening = 1 + roundProgress * 0.5

  return {
    red:
      1 +
      strength *
        (foodShare * -0.11 * foodGreening +
          energyShare * -0.1 +
          oreShare * 0.12),
    green:
      1 +
      strength *
        (foodShare * 0.18 * foodGreening +
          energyShare * 0.055 +
          oreShare * -0.06),
    blue:
      1 +
      strength *
        (foodShare * -0.035 * foodGreening +
          energyShare * 0.16 +
          oreShare * -0.1),
  }
}
