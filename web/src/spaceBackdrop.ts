type SpaceRotation = {
  yaw: number
  pitch: number
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
    '--space-object-x': toPixelValue(
      (rotation.yaw / fullTurn) * 520,
    ),
    '--space-object-y': toPixelValue(
      (rotation.pitch / Math.PI) * 100,
    ),
    '--space-object-far-x': toPixelValue(
      (rotation.yaw / fullTurn) * 440,
    ),
    '--space-object-far-y': toPixelValue(
      (rotation.pitch / Math.PI) * 82,
    ),
  }
}
