import { describe, expect, it } from 'vitest'
import { calculateResourceColorScale } from './planetSurfaceTint'

describe('geglättete Ressourcenfarbnuancen', () => {
  it('zeichnet Nahrung durch einen gedämpften Grünanteil aus', () => {
    const scale = calculateResourceColorScale(
      5,
      0,
      0,
      1,
      1,
      20,
    )

    expect(scale.green).toBeGreaterThan(scale.red)
    expect(scale.green).toBeGreaterThan(scale.blue)
  })

  it('zeichnet Energie durch einen kühlen Blauanteil aus', () => {
    const scale = calculateResourceColorScale(
      0,
      5,
      0,
      1,
      1,
      20,
    )

    expect(scale.blue).toBeGreaterThan(scale.red)
    expect(scale.blue).toBeGreaterThan(scale.green)
  })

  it('zeichnet Erz durch einen eisenroten Anteil aus', () => {
    const scale = calculateResourceColorScale(
      0,
      0,
      5,
      1,
      1,
      20,
    )

    expect(scale.red).toBeGreaterThan(scale.green)
    expect(scale.red).toBeGreaterThan(scale.blue)
  })

  it('bleibt bei fehlenden Ressourcen neutral', () => {
    expect(
      calculateResourceColorScale(0, 0, 0, 1, 1, 20),
    ).toEqual({
      red: 1,
      green: 1,
      blue: 1,
    })
  })

  it('lässt Nahrungsregionen im Spielverlauf grüner werden', () => {
    const opening = calculateResourceColorScale(
      5,
      0,
      0,
      1,
      1,
      20,
    )
    const finale = calculateResourceColorScale(
      5,
      0,
      0,
      1,
      20,
      20,
    )

    expect(finale.green).toBeGreaterThan(opening.green)
    expect(finale.red).toBeLessThan(opening.red)
  })
})
