import { describe, expect, it } from 'vitest'
import { targetPlanetMap } from './planetMap'
import { projectPlanetMap } from './planetProjection'

describe('Kugelprojektion der Planetenkarte', () => {
  it('zentriert das HQ in der Ausgangsansicht', () => {
    const projection = projectPlanetMap(
      targetPlanetMap,
      { yaw: 0, pitch: 0 },
      280,
    )

    expect(projection.HQ.x).toBeCloseTo(0)
    expect(projection.HQ.y).toBeCloseTo(0)
    expect(projection.HQ.depth).toBeCloseTo(1)
    expect(projection.HQ.visible).toBe(true)
  })

  it('projiziert alle Felder innerhalb der Kugelsilhouette', () => {
    const radius = 280
    const projection = projectPlanetMap(
      targetPlanetMap,
      { yaw: 0.7, pitch: -0.4 },
      radius,
    )

    expect(Object.keys(projection)).toHaveLength(92)
    for (const tile of Object.values(projection)) {
      expect(Number.isFinite(tile.x)).toBe(true)
      expect(Number.isFinite(tile.y)).toBe(true)
      expect(
        Math.hypot(tile.x, tile.y),
      ).toBeLessThanOrEqual(radius + 0.0001)
    }
  })

  it('blendet die Rückseite nach einer halben Drehung aus', () => {
    const projection = projectPlanetMap(
      targetPlanetMap,
      { yaw: Math.PI, pitch: 0 },
      280,
    )

    expect(projection.HQ.depth).toBeCloseTo(-1)
    expect(projection.HQ.visible).toBe(false)
  })
})
