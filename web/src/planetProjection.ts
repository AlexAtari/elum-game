import type {
  PlanetMap,
  SpherePosition,
} from './planetMap'

export type PlanetRotation = {
  yaw: number
  pitch: number
}

export type ProjectedPlanetTile = {
  x: number
  y: number
  depth: number
  scale: number
  visible: boolean
}

export type ProjectedPlanetCell = {
  points: Array<{ x: number; y: number }>
  textureTransform: string
}

type ViewPosition = {
  x: number
  y: number
  depth: number
}

export type NormalizedViewPosition = {
  x: number
  y: number
  depth: number
}

export type PlanetSurfaceCells = Record<
  string,
  SpherePosition[]
>

function normalize(position: SpherePosition): SpherePosition {
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

function cross(
  first: SpherePosition,
  second: SpherePosition,
): SpherePosition {
  return {
    x: first.y * second.z - first.z * second.y,
    y: first.z * second.x - first.x * second.z,
    z: first.x * second.y - first.y * second.x,
  }
}

function dot(
  first: SpherePosition,
  second: SpherePosition,
) {
  return (
    first.x * second.x +
    first.y * second.y +
    first.z * second.z
  )
}

function add(
  first: SpherePosition,
  second: SpherePosition,
): SpherePosition {
  return {
    x: first.x + second.x,
    y: first.y + second.y,
    z: first.z + second.z,
  }
}

function scale(
  position: SpherePosition,
  factor: number,
): SpherePosition {
  return {
    x: position.x * factor,
    y: position.y * factor,
    z: position.z * factor,
  }
}

function createViewTransform(
  map: PlanetMap,
  rotation: PlanetRotation,
) {
  const positions = map.spherePositions
  const forward = positions?.[map.hqTileId]

  if (!positions || !forward) {
    throw new Error(
      'planet projection requires sphere positions',
    )
  }

  const reference =
    Math.abs(forward.z) < 0.9
      ? { x: 0, y: 0, z: 1 }
      : { x: 1, y: 0, z: 0 }
  const right = normalize(cross(reference, forward))
  const up = normalize(cross(forward, right))
  const cosYaw = Math.cos(rotation.yaw)
  const sinYaw = Math.sin(rotation.yaw)
  const cosPitch = Math.cos(rotation.pitch)
  const sinPitch = Math.sin(rotation.pitch)

  return (position: SpherePosition): ViewPosition => {
    const localX = dot(position, right)
    const localY = dot(position, up)
    const localZ = dot(position, forward)
    const yawX =
      localX * cosYaw + localZ * sinYaw
    const yawZ =
      -localX * sinYaw + localZ * cosYaw
    const rotatedY =
      localY * cosPitch - yawZ * sinPitch
    const rotatedZ =
      localY * sinPitch + yawZ * cosPitch

    return {
      x: yawX,
      y: -rotatedY,
      depth: rotatedZ,
    }
  }
}

export function createRotationForTile(
  map: PlanetMap,
  tileId: string,
): PlanetRotation {
  const positions = map.spherePositions
  const forward = positions?.[map.hqTileId]
  const target = positions?.[tileId]

  if (!positions || !forward || !target) {
    throw new Error(
      'planet rotation requires sphere positions and a valid tile',
    )
  }

  const reference =
    Math.abs(forward.z) < 0.9
      ? { x: 0, y: 0, z: 1 }
      : { x: 1, y: 0, z: 0 }
  const right = normalize(cross(reference, forward))
  const up = normalize(cross(forward, right))
  const localX = dot(target, right)
  const localY = dot(target, up)
  const localZ = dot(target, forward)
  const yaw = Math.atan2(-localX, localZ)
  const yawDepth = Math.hypot(localX, localZ)

  return {
    yaw,
    pitch: Math.atan2(localY, yawDepth),
  }
}

export function unprojectPlanetViewPosition(
  map: PlanetMap,
  rotation: PlanetRotation,
  position: NormalizedViewPosition,
): SpherePosition {
  return createPlanetViewUnprojector(map, rotation)(position)
}

export function createPlanetViewUnprojector(
  map: PlanetMap,
  rotation: PlanetRotation,
) {
  const positions = map.spherePositions
  const forward = positions?.[map.hqTileId]

  if (!positions || !forward) {
    throw new Error(
      'planet unprojection requires sphere positions',
    )
  }

  const reference =
    Math.abs(forward.z) < 0.9
      ? { x: 0, y: 0, z: 1 }
      : { x: 1, y: 0, z: 0 }
  const right = normalize(cross(reference, forward))
  const up = normalize(cross(forward, right))
  const cosYaw = Math.cos(rotation.yaw)
  const sinYaw = Math.sin(rotation.yaw)
  const cosPitch = Math.cos(rotation.pitch)
  const sinPitch = Math.sin(rotation.pitch)

  return (position: NormalizedViewPosition): SpherePosition => {
    const rotatedY = -position.y
    const localY =
      rotatedY * cosPitch + position.depth * sinPitch
    const yawZ =
      -rotatedY * sinPitch + position.depth * cosPitch
    const localX =
      position.x * cosYaw - yawZ * sinYaw
    const localZ =
      position.x * sinYaw + yawZ * cosYaw

    return {
      x:
        right.x * localX +
        up.x * localY +
        forward.x * localZ,
      y:
        right.y * localX +
        up.y * localY +
        forward.y * localZ,
      z:
        right.z * localX +
        up.z * localY +
        forward.z * localZ,
    }
  }
}

function createTileTangentAxes(
  position: SpherePosition,
) {
  const reference =
    Math.abs(position.z) < 0.9
      ? { x: 0, y: 0, z: 1 }
      : { x: 1, y: 0, z: 0 }
  const first = normalize(cross(reference, position))
  const second = normalize(cross(position, first))

  return { first, second }
}

function clipPolygonToFront(
  points: ViewPosition[],
): ViewPosition[] {
  const clipped: ViewPosition[] = []

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]
    const previous =
      points[(index + points.length - 1) % points.length]
    const currentInside = current.depth >= 0
    const previousInside = previous.depth >= 0

    if (currentInside !== previousInside) {
      const ratio =
        previous.depth /
        (previous.depth - current.depth)
      const intersectionX =
        previous.x + (current.x - previous.x) * ratio
      const intersectionY =
        previous.y + (current.y - previous.y) * ratio
      const length = Math.hypot(
        intersectionX,
        intersectionY,
      )

      clipped.push({
        x: intersectionX / length,
        y: intersectionY / length,
        depth: 0,
      })
    }

    if (currentInside) {
      clipped.push(current)
    }
  }

  return clipped
}

export function createPlanetSurfaceCells(
  map: PlanetMap,
): PlanetSurfaceCells {
  const positions = map.spherePositions

  if (!positions) {
    throw new Error(
      'planet surface cells require sphere positions',
    )
  }

  const tilesById = new Map(
    map.tiles.map((tile) => [tile.id, tile]),
  )
  const faceCenters = new Map<string, SpherePosition>()

  return Object.fromEntries(
    map.tiles.map((tile) => {
      const position = positions[tile.id]
      const axes = createTileTangentAxes(position)
      const vertices: SpherePosition[] = []

      for (
        let firstIndex = 0;
        firstIndex < tile.neighborIds.length;
        firstIndex += 1
      ) {
        for (
          let secondIndex = firstIndex + 1;
          secondIndex < tile.neighborIds.length;
          secondIndex += 1
        ) {
          const firstId = tile.neighborIds[firstIndex]
          const secondId = tile.neighborIds[secondIndex]

          if (
            !tilesById
              .get(firstId)
              ?.neighborIds.includes(secondId)
          ) {
            continue
          }

          const faceKey = [
            tile.id,
            firstId,
            secondId,
          ]
            .sort()
            .join(':')
          let faceCenter = faceCenters.get(faceKey)

          if (!faceCenter) {
            faceCenter = normalize(
              add(
                add(position, positions[firstId]),
                positions[secondId],
              ),
            )
            faceCenters.set(faceKey, faceCenter)
          }

          vertices.push(faceCenter)
        }
      }

      vertices.sort(
        (first, second) =>
          Math.atan2(
            dot(first, axes.second),
            dot(first, axes.first),
          ) -
          Math.atan2(
            dot(second, axes.second),
            dot(second, axes.first),
          ),
      )

      return [tile.id, vertices]
    }),
  )
}

export function projectPlanetSurfaceCells(
  map: PlanetMap,
  cells: PlanetSurfaceCells,
  rotation: PlanetRotation,
  radius: number,
): Record<string, ProjectedPlanetCell> {
  const positions = map.spherePositions

  if (!positions) {
    throw new Error(
      'planet surface projection requires sphere positions',
    )
  }

  const transform = createViewTransform(map, rotation)
  const tangentOffset = 0.16

  return Object.fromEntries(
    map.tiles.map((tile) => {
      const position = positions[tile.id]
      const center = transform(position)
      const axes = createTileTangentAxes(position)
      const firstAnchor = transform(
        normalize(
          add(
            position,
            scale(axes.first, tangentOffset),
          ),
        ),
      )
      const secondAnchor = transform(
        normalize(
          add(
            position,
            scale(axes.second, tangentOffset),
          ),
        ),
      )
      const clipped = clipPolygonToFront(
        cells[tile.id].map(transform),
      )
      const firstVector = {
        x: (firstAnchor.x - center.x) * radius,
        y: (firstAnchor.y - center.y) * radius,
      }
      const secondVector = {
        x: (secondAnchor.x - center.x) * radius,
        y: (secondAnchor.y - center.y) * radius,
      }

      return [
        tile.id,
        {
          points: clipped.map((point) => ({
            x: point.x * radius,
            y: point.y * radius,
          })),
          textureTransform:
            `matrix(${firstVector.x} ${firstVector.y} ` +
            `${secondVector.x} ${secondVector.y} ` +
            `${center.x * radius} ${center.y * radius})`,
        },
      ]
    }),
  )
}

export function projectPlanetMap(
  map: PlanetMap,
  rotation: PlanetRotation,
  radius: number,
): Record<string, ProjectedPlanetTile> {
  const positions = map.spherePositions

  if (!positions) {
    throw new Error(
      'planet projection requires sphere positions',
    )
  }

  const transform = createViewTransform(map, rotation)

  return Object.fromEntries(
    map.tiles.map((tile) => {
      const position = transform(positions[tile.id])

      return [
        tile.id,
        {
          x: position.x * radius,
          y: position.y * radius,
          depth: position.depth,
          scale:
            0.82 + (position.depth + 1) * 0.14,
          visible: position.depth > -0.08,
        },
      ]
    }),
  )
}
