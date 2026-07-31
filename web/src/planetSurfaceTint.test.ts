import { describe, expect, it } from 'vitest'
import {
  applyCultivationGreening,
  calculateCultivationGreening,
  calculateResourceColorScale,
  calculateTerraformingBlend,
} from './planetSurfaceTint'

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

  it('beginnt in Runde 1 vollständig marsartig', () => {
    expect(
      calculateTerraformingBlend(
        5,
        2,
        2,
        1,
        1,
        20,
      ),
    ).toBe(0)
  })

  it('entwickelt die Oberfläche in jeder Runde weiter', () => {
    const opening = calculateTerraformingBlend(
      5,
      2,
      2,
      1,
      1,
      20,
    )
    const middle = calculateTerraformingBlend(
      5,
      2,
      2,
      1,
      10,
      20,
    )
    const finale = calculateTerraformingBlend(
      5,
      2,
      2,
      1,
      20,
      20,
    )

    expect(middle).toBeGreaterThan(opening)
    expect(finale).toBeGreaterThan(middle)
    expect(finale).toBeLessThanOrEqual(1)
  })

  it('terraformt nahrungsreiche Regionen schneller', () => {
    const fertile = calculateTerraformingBlend(
      5,
      1,
      1,
      1,
      12,
      20,
    )
    const barren = calculateTerraformingBlend(
      1,
      4,
      5,
      1,
      12,
      20,
    )

    expect(fertile).toBeGreaterThan(barren)
  })

  it('begrünt bewirtschaftete Flächen im Rundenverlauf stärker', () => {
    const opening = calculateCultivationGreening(
      1,
      1,
      1,
      20,
    )
    const finale = calculateCultivationGreening(
      1,
      1,
      20,
      20,
    )
    const uncultivated = calculateCultivationGreening(
      0,
      1,
      20,
      20,
    )

    expect(opening).toBeGreaterThan(0)
    expect(finale).toBeGreaterThan(opening)
    expect(uncultivated).toBe(0)
  })

  it('verschiebt die Kultivierungsfarbe sichtbar ins Grüne', () => {
    const cultivated = applyCultivationGreening(
      { red: 1, green: 1, blue: 1 },
      0.6,
    )

    expect(cultivated.green).toBeGreaterThan(1)
    expect(cultivated.red).toBeLessThan(1)
    expect(cultivated.blue).toBeLessThan(1)
  })
})
