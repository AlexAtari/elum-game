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

export type SpherePosition = {
  x: number
  y: number
  z: number
}

export type PlanetMap = {
  hqTileId: string
  tiles: PlanetTile[]
  flatPositions: Record<string, FlatHexPosition>
  spherePositions?: Record<string, SpherePosition>
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

const icosahedronFaces = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
] as const

const goldenRatio = (1 + Math.sqrt(5)) / 2

function normalizeSpherePosition(
  position: SpherePosition,
): SpherePosition {
  const length = Math.hypot(
    position.x,
    position.y,
    position.z,
  )

  return {
    x: position.x / length,
    y: position.y / length,
    z: position.z / length,
  }
}

const icosahedronVertices: SpherePosition[] = [
  { x: -1, y: goldenRatio, z: 0 },
  { x: 1, y: goldenRatio, z: 0 },
  { x: -1, y: -goldenRatio, z: 0 },
  { x: 1, y: -goldenRatio, z: 0 },
  { x: 0, y: -1, z: goldenRatio },
  { x: 0, y: 1, z: goldenRatio },
  { x: 0, y: -1, z: -goldenRatio },
  { x: 0, y: 1, z: -goldenRatio },
  { x: goldenRatio, y: 0, z: -1 },
  { x: goldenRatio, y: 0, z: 1 },
  { x: -goldenRatio, y: 0, z: -1 },
  { x: -goldenRatio, y: 0, z: 1 },
].map(normalizeSpherePosition)

function spherePositionKey(position: SpherePosition) {
  return [position.x, position.y, position.z]
    .map((value) => value.toFixed(10))
    .join(':')
}

function interpolateTrianglePoint(
  first: SpherePosition,
  second: SpherePosition,
  third: SpherePosition,
  firstWeight: number,
  secondWeight: number,
  thirdWeight: number,
  frequency: number,
) {
  return normalizeSpherePosition({
    x:
      (first.x * firstWeight +
        second.x * secondWeight +
        third.x * thirdWeight) /
      frequency,
    y:
      (first.y * firstWeight +
        second.y * secondWeight +
        third.y * thirdWeight) /
      frequency,
    z:
      (first.z * firstWeight +
        second.z * secondWeight +
        third.z * thirdWeight) /
      frequency,
  })
}

function createPlanetTileId(index: number) {
  return `P${String(index).padStart(3, '0')}`
}

export function createGeodesicPlanetMap(
  frequency: number = 3,
): PlanetMap {
  if (!Number.isInteger(frequency) || frequency < 1) {
    throw new Error('frequency must be a positive integer')
  }

  const positions: SpherePosition[] = []
  const positionIndices = new Map<string, number>()
  const neighborIndices: Array<Set<number>> = []

  function getOrCreatePositionIndex(position: SpherePosition) {
    const key = spherePositionKey(position)
    const existingIndex = positionIndices.get(key)

    if (existingIndex !== undefined) {
      return existingIndex
    }

    const index = positions.length
    positions.push(position)
    positionIndices.set(key, index)
    neighborIndices.push(new Set())
    return index
  }

  function connect(firstIndex: number, secondIndex: number) {
    neighborIndices[firstIndex].add(secondIndex)
    neighborIndices[secondIndex].add(firstIndex)
  }

  for (const [firstIndex, secondIndex, thirdIndex] of icosahedronFaces) {
    const first = icosahedronVertices[firstIndex]
    const second = icosahedronVertices[secondIndex]
    const third = icosahedronVertices[thirdIndex]
    const faceIndices = new Map<string, number>()

    for (
      let secondWeight = 0;
      secondWeight <= frequency;
      secondWeight += 1
    ) {
      for (
        let thirdWeight = 0;
        thirdWeight <= frequency - secondWeight;
        thirdWeight += 1
      ) {
        const firstWeight =
          frequency - secondWeight - thirdWeight
        const position = interpolateTrianglePoint(
          first,
          second,
          third,
          firstWeight,
          secondWeight,
          thirdWeight,
          frequency,
        )
        const positionIndex =
          getOrCreatePositionIndex(position)

        faceIndices.set(
          `${secondWeight}:${thirdWeight}`,
          positionIndex,
        )
      }
    }

    for (const [coordinates, positionIndex] of faceIndices) {
      const [secondWeight, thirdWeight] = coordinates
        .split(':')
        .map(Number)
      const neighborCoordinates = [
        [secondWeight + 1, thirdWeight],
        [secondWeight, thirdWeight + 1],
        [secondWeight + 1, thirdWeight - 1],
      ]

      for (const [neighborSecond, neighborThird] of neighborCoordinates) {
        const neighborIndex = faceIndices.get(
          `${neighborSecond}:${neighborThird}`,
        )

        if (neighborIndex !== undefined) {
          connect(positionIndex, neighborIndex)
        }
      }
    }
  }

  const hqPositionIndex = positions
    .map((position, index) => ({
      index,
      position,
      neighborCount: neighborIndices[index].size,
    }))
    .filter(({ neighborCount }) => neighborCount === 6)
    .sort(
      (first, second) =>
        second.position.y - first.position.y ||
        first.position.x - second.position.x ||
        first.position.z - second.position.z,
    )[0].index
  let propertyIndex = 1
  const tileIds = positions.map((_, index) =>
    index === hqPositionIndex
      ? 'HQ'
      : createPlanetTileId(propertyIndex++),
  )
  const topology = positions.map((_, index) => ({
    id: tileIds[index],
    neighborIds: [...neighborIndices[index]]
      .map((neighborIndex) => tileIds[neighborIndex])
      .sort(),
  }))
  const distances = calculateGraphDistances(topology, 'HQ')

  return {
    hqTileId: 'HQ',
    tiles: topology.map((tile, index) => ({
      ...tile,
      distanceFromHq: distances[tile.id],
      shape:
        neighborIndices[index].size === 5
          ? 'pentagon'
          : 'hexagon',
    })),
    flatPositions: {},
    spherePositions: Object.fromEntries(
      positions.map((position, index) => [
        tileIds[index],
        position,
      ]),
    ),
  }
}

export const prototypePlanetMap =
  createPrototypePlanetMap(4)

export const targetPlanetMap = createGeodesicPlanetMap(3)
