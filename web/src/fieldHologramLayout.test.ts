import { describe, expect, it } from 'vitest'
import { createFieldHologramLayout } from './fieldHologramLayout'

const viewport = { width: 1_200, height: 800 }
const hologram = { width: 280, height: 330 }
const insets = { topInset: 132, bottomInset: 82 }

describe('Eckenposition der Gebietsinformation', () => {
  it.each([
    [{ x: 300, y: 200 }, 'bottom-right', 908, 388],
    [{ x: 900, y: 200 }, 'bottom-left', 12, 388],
    [{ x: 300, y: 600 }, 'top-right', 908, 132],
    [{ x: 900, y: 600 }, 'top-left', 12, 132],
  ] as const)(
    'legt ein Feld bei %o in die gegenüberliegende Ecke %s',
    (fieldPoint, corner, left, top) => {
      expect(
        createFieldHologramLayout({
          fieldPoint,
          viewport,
          hologram,
          ...insets,
        }),
      ).toMatchObject({ corner, left, top })
    },
  )

  it('nutzt auf dem Smartphone den Platz bis knapp vor der Steuerung', () => {
    expect(
      createFieldHologramLayout({
        fieldPoint: { x: 100, y: 200 },
        viewport: { width: 390, height: 844 },
        hologram: { width: 230, height: 230 },
        topInset: 118,
        bottomInset: 45,
      }),
    ).toMatchObject({
      corner: 'bottom-right',
      left: 148,
      top: 569,
    })
  })
})
