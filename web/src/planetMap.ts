export type TileShape = 'hexagon' | 'pentagon'

export type PlanetTile = {
  id: string
  neighborIds: string[]
  distanceFromHq: number
  shape: TileShape
}

export type FlatHexPosition = {
  q: number
  r: number
}

export type PlanetMap = {
  hqTileId: string
  tiles: PlanetTile[]
  flatPositions: Record<string, FlatHexPosition>
}

const clockwiseHexDirections: FlatHexPosition[] = [
  { q: 1, r: 0 },
  { q: 0, r: 1 },
  { q: -1, r: 1 },
  { q: -1, r: 0 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
]

function createTileId(index: number) {
  let remainingIndex = index
  let id = ''

  do {
    id =
      String.fromCharCode(65 + (remainingIndex % 26)) + id
    remainingIndex = Math.floor(remainingIndex / 26) - 1
  } while (remainingIndex >= 0)

  return id
}

function positionKey(position: FlatHexPosition) {
  return `${position.q}:${position.r}`
}

export function calculateGraphDistances(
  tiles: Pick<PlanetTile, 'id' | 'neighborIds'>[],
  hqTileId: string,
) {
  const distances: Record<string, number> = {
    [hqTileId]: 0,
  }
  const queue = [hqTileId]
  const tilesById = new Map(
    tiles.map((tile) => [tile.id, tile]),
  )

  for (let index = 0; index < queue.length; index += 1) {
    const tileId = queue[index]
    const tile = tilesById.get(tileId)

    if (!tile) {
      continue
    }

    for (const neighborId of tile.neighborIds) {
      if (distances[neighborId] !== undefined) {
        continue
      }

      distances[neighborId] = distances[tileId] + 1
      queue.push(neighborId)
    }
  }

  return distances
}

export function createPrototypePlanetMap(
  radius: number,
): PlanetMap {
  const positions: Array<FlatHexPosition & { id: string }> = [
    { id: 'HQ', q: 0, r: 0 },
  ]
  let tileIndex = 0

  for (
    let ringRadius = 1;
    ringRadius <= radius;
    ringRadius += 1
  ) {
    let q = 0
    let r = -ringRadius

    for (const direction of clockwiseHexDirections) {
      for (let step = 0; step < ringRadius; step += 1) {
        positions.push({
          id: createTileId(tileIndex),
          q,
          r,
        })
        tileIndex += 1
        q += direction.q
        r += direction.r
      }
    }
  }

  const idsByPosition = new Map(
    positions.map((position) => [
      positionKey(position),
      position.id,
    ]),
  )
  const topology = positions.map((position) => ({
    id: position.id,
    neighborIds: clockwiseHexDirections.flatMap(
      (direction) => {
        const neighborId = idsByPosition.get(
          positionKey({
            q: position.q + direction.q,
            r: position.r + direction.r,
          }),
        )

        return neighborId ? [neighborId] : []
      },
    ),
  }))
  const distances = calculateGraphDistances(topology, 'HQ')

  return {
    hqTileId: 'HQ',
    tiles: topology.map((tile) => ({
      ...tile,
      distanceFromHq: distances[tile.id],
      shape: 'hexagon',
    })),
    flatPositions: Object.fromEntries(
      positions.map(({ id, q, r }) => [id, { q, r }]),
    ),
  }
}

export function areTilesAdjacent(
  map: PlanetMap,
  firstTileId: string,
  secondTileId: string,
) {
  return (
    map.tiles
      .find((tile) => tile.id === firstTileId)
      ?.neighborIds.includes(secondTileId) ?? false
  )
}

export function validatePlanetMap(map: PlanetMap) {
  const errors: string[] = []
  const tilesById = new Map(
    map.tiles.map((tile) => [tile.id, tile]),
  )

  if (tilesById.size !== map.tiles.length) {
    errors.push('tile IDs must be unique')
  }

  if (!tilesById.has(map.hqTileId)) {
    errors.push('HQ tile must exist')
  }

  for (const tile of map.tiles) {
    for (const neighborId of tile.neighborIds) {
      const neighbor = tilesById.get(neighborId)

      if (!neighbor) {
        errors.push(
          `${tile.id} references missing neighbor ${neighborId}`,
        )
      } else if (!neighbor.neighborIds.includes(tile.id)) {
        errors.push(
          `${tile.id} and ${neighborId} are not symmetric`,
        )
      }
    }
  }

  const distances = calculateGraphDistances(
    map.tiles,
    map.hqTileId,
  )

  for (const tile of map.tiles) {
    if (distances[tile.id] === undefined) {
      errors.push(`${tile.id} is disconnected`)
    } else if (distances[tile.id] !== tile.distanceFromHq) {
      errors.push(`${tile.id} has an invalid HQ distance`)
    }
  }

  return errors
}

export const prototypePlanetMap =
  createPrototypePlanetMap(4)
