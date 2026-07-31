type SpaceRotation = {
  yaw: number
  pitch: number
}

type CelestialPosition = {
  x: number
  y: number
}

function toPixelValue(value: number) {
  return `${Number(value.toFixed(3))}px`
}

export function createSpaceBackdropStyle(rotation: SpaceRotation) {
  const fullTurn = Math.PI * 2

  return {
    '--stars-far-x': toPixelValue(
      (rotation.yaw / fullTurn) * 180,
    ),
    '--stars-far-y': toPixelValue(
      (rotation.pitch / Math.PI) * 90,
    ),
    '--stars-near-x': toPixelValue(
      (rotation.yaw / fullTurn) * 260,
    ),
    '--stars-near-y': toPixelValue(
      (rotation.pitch / Math.PI) * 130,
    ),
  }
}

function positionOnOrbit(
  angle: number,
  orbitRadius: number,
): CelestialPosition {
  return {
    x: Math.cos(angle) * orbitRadius,
    y: Math.sin(angle) * orbitRadius,
  }
}

export function createCelestialPositions(
  rotation: SpaceRotation,
  zoom: number,
  planetRadius: number,
) {
  const surfaceRadius = planetRadius * zoom
  const rotationOffset =
    rotation.yaw * 0.38 + rotation.pitch * 0.22

  return {
    sun: positionOnOrbit(
      -2.45 + rotationOffset,
      surfaceRadius + 38,
    ),
    ringedPlanet: positionOnOrbit(
      -1.45 + rotationOffset,
      surfaceRadius + 58,
    ),
  }
}
