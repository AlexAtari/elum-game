import { describe, expect, it } from 'vitest'
import {
  areTilesAdjacent,
  calculateGraphDistances,
  createGeodesicPlanetMap,
  createPrototypePlanetMap,
  prototypePlanetMap,
  targetPlanetMap,
  validatePlanetMap,
} from './planetMap'

describe('Planetenkartenmodell', () => {
  it('trennt die Graphdaten von der flachen Darstellung', () => {
    expect(prototypePlanetMap.tiles).toHaveLength(61)
    expect(prototypePlanetMap.tiles[0]).toEqual({
      id: 'HQ',
      neighborIds: ['C', 'D', 'E', 'F', 'A', 'B'],
      distanceFromHq: 0,
      shape: 'hexagon',
    })
    expect(prototypePlanetMap.flatPositions.HQ).toEqual({
      q: 0,
      r: 0,
    })
    expect(prototypePlanetMap.tiles[0]).not.toHaveProperty('q')
    expect(prototypePlanetMap.tiles[0]).not.toHaveProperty('r')
  })

  it('erzeugt einen verbundenen Graphen mit symmetrischen Nachbarn', () => {
    expect(validatePlanetMap(prototypePlanetMap)).toEqual([])
    expect(
      areTilesAdjacent(prototypePlanetMap, 'HQ', 'A'),
    ).toBe(true)
    expect(
      areTilesAdjacent(prototypePlanetMap, 'A', 'HQ'),
    ).toBe(true)
    expect(
      areTilesAdjacent(prototypePlanetMap, 'A', 'D'),
    ).toBe(false)
  })

  it('berechnet HQ-Distanzen ausschließlich aus Nachbarlisten', () => {
    const map = createPrototypePlanetMap(4)
    const distances = calculateGraphDistances(
      map.tiles,
      map.hqTileId,
    )

    expect(Math.max(...Object.values(distances))).toBe(4)
    expect(
      map.tiles.every(
        (tile) =>
          tile.distanceFromHq === distances[tile.id],
      ),
    ).toBe(true)
  })

  it('erkennt unsymmetrische und unverbundene Graphdaten', () => {
    const invalidMap = {
      hqTileId: 'HQ',
      tiles: [
        {
          id: 'HQ',
          neighborIds: ['A'],
          distanceFromHq: 0,
          shape: 'hexagon' as const,
        },
        {
          id: 'A',
          neighborIds: [],
          distanceFromHq: 1,
          shape: 'hexagon' as const,
        },
        {
          id: 'B',
          neighborIds: [],
          distanceFromHq: 2,
          shape: 'hexagon' as const,
        },
      ],
      flatPositions: {
        HQ: { q: 0, r: 0 },
        A: { q: 1, r: 0 },
        B: { q: 2, r: 0 },
      },
    }

    expect(validatePlanetMap(invalidMap)).toEqual([
      'HQ and A are not symmetric',
      'B is disconnected',
    ])
  })
})

describe('92-Felder-Planetengraph', () => {
  it('erzeugt exakt ein HQ und 91 Grundstücke', () => {
    expect(targetPlanetMap.tiles).toHaveLength(92)
    expect(
      targetPlanetMap.tiles.filter((tile) => tile.id === 'HQ'),
    ).toHaveLength(1)
    expect(new Set(targetPlanetMap.tiles.map((tile) => tile.id)).size)
      .toBe(92)
    expect(targetPlanetMap.tiles.find((tile) => tile.id === 'HQ'))
      .toMatchObject({
        shape: 'hexagon',
        distanceFromHq: 0,
      })
  })

  it('besitzt zwölf Pentagone und 80 Hexagone', () => {
    const pentagons = targetPlanetMap.tiles.filter(
      (tile) => tile.shape === 'pentagon',
    )
    const hexagons = targetPlanetMap.tiles.filter(
      (tile) => tile.shape === 'hexagon',
    )

    expect(pentagons).toHaveLength(12)
    expect(hexagons).toHaveLength(80)
    expect(
      pentagons.every((tile) => tile.neighborIds.length === 5),
    ).toBe(true)
    expect(
      hexagons.every((tile) => tile.neighborIds.length === 6),
    ).toBe(true)
  })

  it('ist vollständig verbunden, symmetrisch und topologisch geschlossen', () => {
    expect(validatePlanetMap(targetPlanetMap)).toEqual([])

    const edgeCount =
      targetPlanetMap.tiles.reduce(
        (total, tile) => total + tile.neighborIds.length,
        0,
      ) / 2
    const triangularFaceCount = 20 * 3 ** 2

    expect(edgeCount).toBe(270)
    expect(
      targetPlanetMap.tiles.length -
        edgeCount +
        triangularFaceCount,
    ).toBe(2)
  })

  it('erzeugt dieselben IDs, Nachbarn und Positionen reproduzierbar', () => {
    const recreatedMap = createGeodesicPlanetMap(3)

    expect(recreatedMap).toEqual(targetPlanetMap)
    expect(
      Object.values(targetPlanetMap.spherePositions ?? {}).every(
        (position) =>
          Math.abs(
            Math.hypot(position.x, position.y, position.z) - 1,
          ) < 1e-10,
      ),
    ).toBe(true)
    expect(targetPlanetMap.flatPositions).toEqual({})
  })

  it('weist ungültige Unterteilungsfrequenzen zurück', () => {
    expect(() => createGeodesicPlanetMap(0)).toThrow(
      'frequency must be a positive integer',
    )
    expect(() => createGeodesicPlanetMap(1.5)).toThrow(
      'frequency must be a positive integer',
    )
  })
})
