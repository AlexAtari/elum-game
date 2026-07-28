import { describe, expect, it } from 'vitest'
import {
  areTilesAdjacent,
  assignStartCorridors,
  calculateGraphDistances,
  combineCrystalVeinRatings,
  createGeodesicPlanetMap,
  createNaturalCrystalVeins,
  createPrototypePlanetMap,
  createRadialGraphLayout,
  createTargetPlanetZones,
  createTargetStartConfiguration,
  prototypePlanetMap,
  targetCrystalRatings,
  targetCrystalVeins,
  targetPlanetMap,
  targetPlanetZones,
  targetStartConfiguration,
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
    const tilesById = new Map(
      targetPlanetMap.tiles.map((tile) => [tile.id, tile]),
    )
    expect(
      tilesById
        .get('HQ')!
        .neighborIds.every(
          (tileId) => tilesById.get(tileId)?.shape === 'hexagon',
        ),
    ).toBe(true)
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
    recreatedMap.displayPositions =
      createRadialGraphLayout(recreatedMap)

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

describe('Natürliche Kristalladern', () => {
  const tilesById = new Map(
    targetPlanetMap.tiles.map((tile) => [tile.id, tile]),
  )

  it('erzeugt vier reproduzierbare, abgestufte Adern', () => {
    expect(targetCrystalVeins).toHaveLength(4)
    expect(
      createNaturalCrystalVeins(
        targetPlanetMap,
        targetPlanetZones,
        targetStartConfiguration,
      ),
    ).toEqual(targetCrystalVeins)

    for (const vein of targetCrystalVeins) {
      const ratings = Object.values(vein.tileRatings)

      expect(ratings.filter((rating) => rating === 5)).toHaveLength(
        1,
      )
      expect(ratings.filter((rating) => rating === 4)).toHaveLength(
        2,
      )
      expect(ratings.filter((rating) => rating === 3)).toHaveLength(
        3,
      )
      expect(ratings.filter((rating) => rating === 2)).toHaveLength(
        4,
      )
    }
  })

  it('setzt weit entfernte Hexagon-Kerne mit Mindestabstand', () => {
    const coreTileIds = targetCrystalVeins.map(
      (vein) => vein.coreTileId,
    )

    for (const coreTileId of coreTileIds) {
      expect(tilesById.get(coreTileId)).toMatchObject({
        shape: 'hexagon',
      })
      expect(targetPlanetZones[coreTileId]).toBe('far')
    }

    for (
      let firstIndex = 0;
      firstIndex < coreTileIds.length;
      firstIndex += 1
    ) {
      const distances = calculateGraphDistances(
        targetPlanetMap.tiles,
        coreTileIds[firstIndex]!,
      )

      for (
        let secondIndex = firstIndex + 1;
        secondIndex < coreTileIds.length;
        secondIndex += 1
      ) {
        expect(
          distances[coreTileIds[secondIndex]!],
        ).toBeGreaterThanOrEqual(4)
      }
    }
  })

  it('hält alle Startgrundstücke kristallfrei und begrenzt natürliche Spitzen auf Kerne', () => {
    expect(
      targetStartConfiguration.crystalFreeTileIds.every(
        (tileId) => targetCrystalRatings[tileId] === undefined,
      ),
    ).toBe(true)
    expect(
      Object.values(targetCrystalRatings).filter(
        (rating) => rating === 5,
      ),
    ).toHaveLength(4)
    expect(combineCrystalVeinRatings(targetCrystalVeins)).toEqual(
      targetCrystalRatings,
    )
  })

  it('bildet jede Ader als zusammenhängende Feldgruppe', () => {
    for (const vein of targetCrystalVeins) {
      const veinTileIds = new Set(Object.keys(vein.tileRatings))
      const reached = new Set([vein.coreTileId])
      const queue = [vein.coreTileId]

      for (let index = 0; index < queue.length; index += 1) {
        for (const neighborId of tilesById.get(queue[index]!)!
          .neighborIds) {
          if (
            veinTileIds.has(neighborId) &&
            !reached.has(neighborId)
          ) {
            reached.add(neighborId)
            queue.push(neighborId)
          }
        }
      }

      expect(reached).toEqual(veinTileIds)
    }
  })
})

describe('Startkorridore und Entfernungszonen', () => {
  const tilesById = new Map(
    targetPlanetMap.tiles.map((tile) => [tile.id, tile]),
  )

  it('wählt vier feste Korridore und zwei neutrale HQ-Nachbarn', () => {
    expect(targetStartConfiguration.corridors).toEqual([
      {
        id: 'start-1',
        innerTileId: 'P012',
        outerTileId: 'P015',
      },
      {
        id: 'start-2',
        innerTileId: 'P017',
        outerTileId: 'P022',
      },
      {
        id: 'start-3',
        innerTileId: 'P018',
        outerTileId: 'P027',
      },
      {
        id: 'start-4',
        innerTileId: 'P021',
        outerTileId: 'P060',
      },
    ])
    expect(
      targetStartConfiguration.neutralHqNeighborIds,
    ).toEqual(['P011', 'P020'])
  })

  it('verwendet acht eindeutige, zusammenhängende Hexagone', () => {
    const startTileIds =
      targetStartConfiguration.corridors.flatMap(
        (corridor) => [
          corridor.innerTileId,
          corridor.outerTileId,
        ],
      )

    expect(new Set(startTileIds).size).toBe(8)
    expect(
      targetStartConfiguration.crystalFreeTileIds,
    ).toEqual(startTileIds)

    for (const corridor of targetStartConfiguration.corridors) {
      const innerTile = tilesById.get(corridor.innerTileId)!
      const outerTile = tilesById.get(corridor.outerTileId)!

      expect(innerTile).toMatchObject({
        distanceFromHq: 1,
        shape: 'hexagon',
      })
      expect(outerTile).toMatchObject({
        distanceFromHq: 2,
        shape: 'hexagon',
      })
      expect(innerTile.neighborIds).toContain('HQ')
      expect(innerTile.neighborIds).toContain(outerTile.id)
    }
  })

  it('gibt allen Korridoren dieselben geprüften Expansionsmerkmale', () => {
    const pentagons = targetPlanetMap.tiles.filter(
      (tile) => tile.shape === 'pentagon',
    )
    const farTiles = targetPlanetMap.tiles.filter(
      (tile) => targetPlanetZones[tile.id] === 'far',
    )
    const metrics = targetStartConfiguration.corridors.map(
      (corridor) => {
        const outerTile = tilesById.get(corridor.outerTileId)!
        const distances = calculateGraphDistances(
          targetPlanetMap.tiles,
          outerTile.id,
        )

        return {
          outwardConnections: outerTile.neighborIds.filter(
            (tileId) =>
              tilesById.get(tileId)?.distanceFromHq === 3,
          ).length,
          nearestPentagon: Math.min(
            ...pentagons.map((tile) => distances[tile.id]),
          ),
          nearestFarZone: Math.min(
            ...farTiles.map((tile) => distances[tile.id]),
          ),
        }
      },
    )

    expect(
      new Set(metrics.map((metric) => JSON.stringify(metric))).size,
    ).toBe(1)
    expect(metrics[0]).toEqual({
      outwardConnections: 3,
      nearestPentagon: 1,
      nearestFarZone: 3,
    })
  })

  it('ordnet vollständige Distanzringe reproduzierbaren Zonen zu', () => {
    const zoneCounts = Object.values(targetPlanetZones).reduce(
      (counts, zone) => ({
        ...counts,
        [zone]: (counts[zone] ?? 0) + 1,
      }),
      {} as Record<string, number>,
    )

    expect(zoneCounts).toEqual({
      inner: 10,
      exploration: 33,
      far: 40,
      start: 9,
    })

    for (const tile of targetPlanetMap.tiles) {
      const zone = targetPlanetZones[tile.id]

      if (zone === 'start') {
        continue
      }

      if (tile.distanceFromHq <= 2) {
        expect(zone).toBe('inner')
      } else if (tile.distanceFromHq <= 4) {
        expect(zone).toBe('exploration')
      } else {
        expect(zone).toBe('far')
      }
    }
  })

  it('erzeugt Startkonfiguration und Zonen deterministisch', () => {
    const recreatedMap = createGeodesicPlanetMap(3)
    const recreatedStarts =
      createTargetStartConfiguration(recreatedMap)

    expect(recreatedStarts).toEqual(targetStartConfiguration)
    expect(
      createTargetPlanetZones(recreatedMap, recreatedStarts),
    ).toEqual(targetPlanetZones)
  })

  it('ordnet die Korridore seedbasiert genau einmal zu', () => {
    const participantIds = ['agima', 'orion', 'nova', 'vega']
    const firstAssignment = assignStartCorridors(
      targetStartConfiguration.corridors,
      participantIds,
      17,
    )
    const repeatedAssignment = assignStartCorridors(
      targetStartConfiguration.corridors,
      participantIds,
      17,
    )
    const otherAssignment = assignStartCorridors(
      targetStartConfiguration.corridors,
      participantIds,
      18,
    )

    expect(repeatedAssignment).toEqual(firstAssignment)
    expect(otherAssignment).not.toEqual(firstAssignment)
    expect(
      firstAssignment.map(({ participantId }) => participantId),
    ).toEqual(participantIds)
    expect(
      new Set(
        firstAssignment.map(({ corridor }) => corridor.id),
      ).size,
    ).toBe(4)
  })

  it('weist unvollständige Startzuordnungen zurück', () => {
    expect(() =>
      assignStartCorridors(
        targetStartConfiguration.corridors,
        ['agima'],
        1,
      ),
    ).toThrow(
      'each participant must receive exactly one start corridor',
    )
  })
})

describe('Flache Zielgraph-Darstellung', () => {
  it('positioniert alle 92 Felder eindeutig um das HQ', () => {
    const displayPositions =
      targetPlanetMap.displayPositions ?? {}
    const entries = Object.entries(displayPositions)

    expect(entries).toHaveLength(92)
    expect(displayPositions.HQ).toEqual({ x: 0, y: 0 })
    expect(
      new Set(
        entries.map(
          ([, position]) =>
            `${position.x.toFixed(8)}:${position.y.toFixed(8)}`,
        ),
      ).size,
    ).toBe(92)
  })

  it('hält genügend Abstand zwischen den Feldzentren', () => {
    const positions = Object.values(
      targetPlanetMap.displayPositions ?? {},
    )
    let minimumDistance = Number.POSITIVE_INFINITY

    for (let firstIndex = 0; firstIndex < positions.length; firstIndex += 1) {
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < positions.length;
        secondIndex += 1
      ) {
        minimumDistance = Math.min(
          minimumDistance,
          Math.hypot(
            positions[firstIndex].x - positions[secondIndex].x,
            positions[firstIndex].y - positions[secondIndex].y,
          ),
        )
      }
    }

    expect(minimumDistance).toBeGreaterThan(48)
  })
})
