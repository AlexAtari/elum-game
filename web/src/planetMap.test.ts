import { describe, expect, it } from 'vitest'
import {
  areTilesAdjacent,
  calculateGraphDistances,
  createPrototypePlanetMap,
  prototypePlanetMap,
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
