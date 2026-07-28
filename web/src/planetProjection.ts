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

export function projectPlanetMap(
  map: PlanetMap,
  rotation: PlanetRotation,
  radius: number,
): Record<string, ProjectedPlanetTile> {
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

  return Object.fromEntries(
    map.tiles.map((tile) => {
      const position = positions[tile.id]
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

      return [
        tile.id,
        {
          x: yawX * radius,
          y: -rotatedY * radius,
          depth: rotatedZ,
          scale: 0.82 + (rotatedZ + 1) * 0.14,
          visible: rotatedZ > -0.08,
        },
      ]
    }),
  )
}
