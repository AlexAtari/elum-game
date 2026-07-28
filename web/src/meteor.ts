import {
  calculateGraphDistances,
  type PlanetMap,
  type StartConfiguration,
} from './planetMap'

export type MeteorImpact = {
  id: string
  round: number
  centerTileId: string
  tileBonuses: Record<string, number>
}

export type MeteorCraterConfiguration = {
  centerBonus: number
  directBonus: number
  directTileCount: number
  outerBonus: number
  outerTileCount: number
  maximumRating: number
  preferredMinimumCenterDistance: number
}

export const CONSERVATIVE_METEOR_CONFIGURATION: MeteorCraterConfiguration =
  {
    centerBonus: 3,
    directBonus: 2,
    directTileCount: 3,
    outerBonus: 1,
    outerTileCount: 4,
    maximumRating: 5,
    preferredMinimumCenterDistance: 4,
  }

function normalizeSeed(seed: number) {
  return Math.abs(
    Math.trunc(Number.isFinite(seed) ? seed : 1),
  ) >>> 0
}

function createSeededRandom(seed: number) {
  let state = normalizeSeed(seed)

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^=
      value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function createStableTileScore(tileId: string, seed: number) {
  return [...tileId].reduce(
    (score, character, index) =>
      Math.imul(score ^ character.charCodeAt(0), 31 + index),
    normalizeSeed(seed) || 1,
  ) >>> 0
}

export function createMeteorSchedule(seed: number): number[] {
  const random = createSeededRandom(seed)
  const rounds = [
    5 + Math.floor(random() * 2),
    10 + Math.floor(random() * 3),
  ]

  if (random() < 0.5) {
    rounds.push(15 + Math.floor(random() * 2))
  }

  return rounds
}

export function combineMeteorBonuses(
  impacts: MeteorImpact[],
): Record<string, number> {
  const bonuses: Record<string, number> = {}

  for (const impact of impacts) {
    for (const [tileId, bonus] of Object.entries(
      impact.tileBonuses,
    )) {
      bonuses[tileId] = (bonuses[tileId] ?? 0) + bonus
    }
  }

  return bonuses
}

export function getEffectiveCrystalRating(
  tileId: string,
  naturalRatings: Record<string, number>,
  impacts: MeteorImpact[],
  maximumRating: number = 5,
) {
  return Math.min(
    maximumRating,
    (naturalRatings[tileId] ?? 0) +
      (combineMeteorBonuses(impacts)[tileId] ?? 0),
  )
}

export function createMeteorImpact(
  map: PlanetMap,
  startConfiguration: StartConfiguration,
  naturalRatings: Record<string, number>,
  soldTileIds: string[],
  previousImpacts: MeteorImpact[],
  round: number,
  seed: number,
  configuration: MeteorCraterConfiguration =
    CONSERVATIVE_METEOR_CONFIGURATION,
): MeteorImpact | null {
  const tilesById = new Map(
    map.tiles.map((tile) => [tile.id, tile]),
  )
  const excludedCenterIds = new Set([
    map.hqTileId,
    ...startConfiguration.crystalFreeTileIds,
    ...soldTileIds,
  ])
  const previousCenterIds = previousImpacts.map(
    (impact) => impact.centerTileId,
  )
  const distancesByPreviousCenter = new Map(
    previousCenterIds.map((centerTileId) => [
      centerTileId,
      calculateGraphDistances(map.tiles, centerTileId),
    ]),
  )
  const validCandidates = map.tiles.filter(
    (tile) =>
      tile.shape === 'hexagon' &&
      !excludedCenterIds.has(tile.id),
  )
  let centerTileId: string | undefined

  for (
    let minimumDistance =
      configuration.preferredMinimumCenterDistance;
    minimumDistance >= 0 && !centerTileId;
    minimumDistance -= 1
  ) {
    centerTileId = validCandidates
      .filter((candidate) =>
        previousCenterIds.every(
          (previousCenterId) =>
            distancesByPreviousCenter.get(previousCenterId)![
              candidate.id
            ] >= minimumDistance,
        ),
      )
      .map((candidate) => ({
        candidate,
        nearestPreviousCenter:
          previousCenterIds.length === 0
            ? Number.POSITIVE_INFINITY
            : Math.min(
                ...previousCenterIds.map(
                  (previousCenterId) =>
                    distancesByPreviousCenter.get(
                      previousCenterId,
                    )![candidate.id],
                ),
              ),
      }))
      .sort(
        (first, second) =>
          second.nearestPreviousCenter -
            first.nearestPreviousCenter ||
          second.candidate.distanceFromHq -
            first.candidate.distanceFromHq ||
          createStableTileScore(
            first.candidate.id,
            seed + round,
          ) -
            createStableTileScore(
              second.candidate.id,
              seed + round,
            ) ||
          first.candidate.id.localeCompare(second.candidate.id),
      )[0]?.candidate.id
  }

  if (!centerTileId) {
    return null
  }

  const centerTile = tilesById.get(centerTileId)!
  const directTileIds = [...centerTile.neighborIds]
    .sort(
      (firstId, secondId) =>
        createStableTileScore(firstId, seed + round * 3) -
          createStableTileScore(
            secondId,
            seed + round * 3,
          ) ||
        firstId.localeCompare(secondId),
    )
    .slice(0, configuration.directTileCount)
  const distancesFromCenter = calculateGraphDistances(
    map.tiles,
    centerTileId,
  )
  const outerTileIds = [
    ...new Set(
      directTileIds.flatMap(
        (tileId) => tilesById.get(tileId)!.neighborIds,
      ),
    ),
  ]
    .filter(
      (tileId) =>
        tileId !== map.hqTileId &&
        tileId !== centerTileId &&
        !directTileIds.includes(tileId) &&
        distancesFromCenter[tileId] === 2,
    )
    .sort(
      (firstId, secondId) =>
        createStableTileScore(firstId, seed + round * 7) -
          createStableTileScore(
            secondId,
            seed + round * 7,
          ) ||
        firstId.localeCompare(secondId),
    )
    .slice(0, configuration.outerTileCount)

  if (
    directTileIds.length < configuration.directTileCount ||
    outerTileIds.length < configuration.outerTileCount
  ) {
    return null
  }

  const requestedBonuses: Record<string, number> = {
    [centerTileId]: configuration.centerBonus,
    ...Object.fromEntries(
      directTileIds.map((tileId) => [
        tileId,
        configuration.directBonus,
      ]),
    ),
    ...Object.fromEntries(
      outerTileIds.map((tileId) => [
        tileId,
        configuration.outerBonus,
      ]),
    ),
  }
  const tileBonuses = Object.fromEntries(
    Object.entries(requestedBonuses).map(
      ([tileId, requestedBonus]) => {
        const currentRating = getEffectiveCrystalRating(
          tileId,
          naturalRatings,
          previousImpacts,
          configuration.maximumRating,
        )

        return [
          tileId,
          Math.min(
            requestedBonus,
            configuration.maximumRating - currentRating,
          ),
        ]
      },
    ),
  )

  return {
    id: `meteor-${previousImpacts.length + 1}`,
    round,
    centerTileId,
    tileBonuses,
  }
}
