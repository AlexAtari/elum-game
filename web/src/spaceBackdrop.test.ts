import { describe, expect, it } from 'vitest'
import {
  createCelestialPositions,
  createSpaceBackdropStyle,
} from './spaceBackdrop'

describe('Weltraumhintergrund', () => {
  it('bewegt die Sternenebenen mit der Planetendrehung', () => {
    const style = createSpaceBackdropStyle({
      yaw: Math.PI / 2,
      pitch: Math.PI / 10,
    })

    expect(style['--stars-far-x']).toBe('45px')
    expect(style['--stars-near-x']).toBe('65px')
  })

  it('hält beide Himmelskörper beim Zoomen außerhalb der Kugel', () => {
    for (const zoom of [0.72, 1, 2.2]) {
      const positions = createCelestialPositions(
        { yaw: 0, pitch: 0 },
        zoom,
        280,
      )
      const surfaceRadius = 280 * zoom
      const sunDistance = Math.hypot(
        positions.sun.x,
        positions.sun.y,
      )
      const ringedPlanetDistance = Math.hypot(
        positions.ringedPlanet.x,
        positions.ringedPlanet.y,
      )

      expect(sunDistance - surfaceRadius).toBeCloseTo(38)
      expect(ringedPlanetDistance - surfaceRadius).toBeCloseTo(58)
    }
  })

  it('führt die Himmelskörper bei Drehung um die Kugel', () => {
    const opening = createCelestialPositions(
      { yaw: 0, pitch: 0 },
      1,
      280,
    )
    const rotated = createCelestialPositions(
      { yaw: Math.PI / 2, pitch: Math.PI / 10 },
      1,
      280,
    )

    expect(rotated.sun.x).not.toBeCloseTo(opening.sun.x)
    expect(rotated.sun.y).not.toBeCloseTo(opening.sun.y)
    expect(rotated.ringedPlanet.x).not.toBeCloseTo(
      opening.ringedPlanet.x,
    )
    expect(rotated.ringedPlanet.y).not.toBeCloseTo(
      opening.ringedPlanet.y,
    )
  })
})
