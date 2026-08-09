export type ScreenPoint = {
  x: number
  y: number
}

type FieldHologramLayoutInput = {
  fieldPoint: ScreenPoint
  viewport: {
    width: number
    height: number
  }
  hologram: {
    width: number
    height: number
  }
  topInset: number
  bottomInset: number
  edgeInset?: number
}

export function createFieldHologramLayout({
  fieldPoint,
  viewport,
  hologram,
  topInset,
  bottomInset,
  edgeInset = 12,
}: FieldHologramLayoutInput) {
  const placeLeft = fieldPoint.x > viewport.width / 2
  const placeTop = fieldPoint.y > viewport.height / 2
  const left = placeLeft
    ? edgeInset
    : Math.max(
        edgeInset,
        viewport.width - hologram.width - edgeInset,
      )
  const bottomCornerTop = Math.max(
    topInset,
    viewport.height - hologram.height - bottomInset,
  )
  const top = placeTop ? topInset : bottomCornerTop

  return {
    corner: `${placeTop ? 'top' : 'bottom'}-${
      placeLeft ? 'left' : 'right'
    }` as const,
    left,
    top,
    connectorPoint: {
      x: placeLeft ? left + hologram.width : left,
      y: placeTop ? top + hologram.height : top,
    },
  }
}
