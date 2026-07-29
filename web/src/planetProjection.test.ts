import { describe, expect, it } from 'vitest'
import { targetPlanetMap } from './planetMap'
import {
  createRotationForTile,
  createPlanetSurfaceCells,
  projectPlanetMap,
  projectPlanetSurfaceCells,
  unprojectPlanetViewPosition,
} from './planetProjection'

function positionKey(position: {
  x: number
  y: number
  z: number
}) {
  return [position.x, position.y, position.z]
    .map((value) => value.toFixed(8))
    .join(':')
}

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

  it('zentriert ein gezielt ausgewähltes Grundstück', () => {
    const rotation = createRotationForTile(
      targetPlanetMap,
      'P071',
    )
    const projection = projectPlanetMap(
      targetPlanetMap,
      rotation,
      280,
    )

    expect(projection.P071.x).toBeCloseTo(0)
    expect(projection.P071.y).toBeCloseTo(0)
    expect(projection.P071.depth).toBeCloseTo(1)
  })

  it('führt Projektion und Rückprojektion verlustfrei zusammen', () => {
    const rotation = { yaw: 0.7, pitch: -0.35 }
    const projection = projectPlanetMap(
      targetPlanetMap,
      rotation,
      1,
    )
    const source =
      targetPlanetMap.spherePositions?.P021
    const projected = projection.P021

    expect(source).toBeDefined()
    const restored = unprojectPlanetViewPosition(
      targetPlanetMap,
      rotation,
      {
        x: projected.x,
        y: projected.y,
        depth: projected.depth,
      },
    )

    expect(restored.x).toBeCloseTo(source!.x)
    expect(restored.y).toBeCloseTo(source!.y)
    expect(restored.z).toBeCloseTo(source!.z)
  })

  it('erzeugt lückenlose gemeinsame Zellkanten', () => {
    const cells =
      createPlanetSurfaceCells(targetPlanetMap)

    for (const tile of targetPlanetMap.tiles) {
      expect(cells[tile.id]).toHaveLength(
        tile.neighborIds.length,
      )

      for (const neighborId of tile.neighborIds) {
        const ownVertices = new Set(
          cells[tile.id].map(positionKey),
        )
        const sharedVertices = cells[neighborId].filter(
          (vertex) =>
            ownVertices.has(positionKey(vertex)),
        )

        expect(sharedVertices).toHaveLength(2)
      }
    }
  })

  it('schneidet Zellflächen an der Kugelsilhouette', () => {
    const radius = 280
    const cells =
      createPlanetSurfaceCells(targetPlanetMap)
    const projection = projectPlanetSurfaceCells(
      targetPlanetMap,
      cells,
      { yaw: 0.8, pitch: -0.35 },
      radius,
    )
    const visibleCells = Object.values(
      projection,
    ).filter((cell) => cell.points.length >= 3)

    expect(visibleCells.length).toBeGreaterThan(40)
    expect(visibleCells.length).toBeLessThan(60)
    for (const cell of visibleCells) {
      for (const point of cell.points) {
        expect(
          Math.hypot(point.x, point.y),
        ).toBeLessThanOrEqual(radius + 0.0001)
      }
    }
  })

  it('verankert die Texturausrichtung an der Kugel', () => {
    const cells =
      createPlanetSurfaceCells(targetPlanetMap)
    const initial = projectPlanetSurfaceCells(
      targetPlanetMap,
      cells,
      { yaw: 0, pitch: 0 },
      280,
    )
    const rotated = projectPlanetSurfaceCells(
      targetPlanetMap,
      cells,
      { yaw: 0.7, pitch: 0.2 },
      280,
    )

    expect(initial.P021.textureTransform).not.toBe(
      rotated.P021.textureTransform,
    )
    expect(initial.P021.textureTransform).toContain(
      'matrix(',
    )
  })
})
