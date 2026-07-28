import { describe, expect, it } from 'vitest'
import {
  CONSERVATIVE_METEOR_CONFIGURATION,
  combineMeteorBonuses,
  createMeteorImpact,
  createMeteorSchedule,
  getEffectiveCrystalRating,
} from './meteor'
import {
  calculateGraphDistances,
  targetCrystalRatings,
  targetPlanetMap,
  targetStartConfiguration,
} from './planetMap'

describe('Meteoritenplan', () => {
  it('plant zwei garantierte und reproduzierbar optional einen dritten Einschlag', () => {
    expect(createMeteorSchedule(12)).toEqual(
      createMeteorSchedule(12),
    )

    let schedulesWithThirdImpact = 0

    for (let seed = 1; seed <= 200; seed += 1) {
      const schedule = createMeteorSchedule(seed)

      expect(schedule.length).toBeGreaterThanOrEqual(2)
      expect(schedule.length).toBeLessThanOrEqual(3)
      expect(schedule[0]).toBeGreaterThanOrEqual(5)
      expect(schedule[0]).toBeLessThanOrEqual(6)
      expect(schedule[1]).toBeGreaterThanOrEqual(10)
      expect(schedule[1]).toBeLessThanOrEqual(12)

      if (schedule[2] !== undefined) {
        schedulesWithThirdImpact += 1
        expect(schedule[2]).toBeGreaterThanOrEqual(15)
        expect(schedule[2]).toBeLessThanOrEqual(16)
      }
    }

    expect(schedulesWithThirdImpact).toBeGreaterThan(80)
    expect(schedulesWithThirdImpact).toBeLessThan(120)
  })
})

describe('Konservativer Meteoritenkrater', () => {
  const firstImpact = createMeteorImpact(
    targetPlanetMap,
    targetStartConfiguration,
    targetCrystalRatings,
    targetStartConfiguration.crystalFreeTileIds,
    [],
    5,
    42,
  )!
  const secondImpact = createMeteorImpact(
    targetPlanetMap,
    targetStartConfiguration,
    targetCrystalRatings,
    targetStartConfiguration.crystalFreeTileIds,
    [firstImpact],
    10,
    42,
  )!

  it('erzeugt genau ein Zentrum, drei direkte und vier äußere Felder', () => {
    const bonuses = Object.entries(firstImpact.tileBonuses)
    const centerTile = targetPlanetMap.tiles.find(
      (tile) => tile.id === firstImpact.centerTileId,
    )!
    const distances = calculateGraphDistances(
      targetPlanetMap.tiles,
      firstImpact.centerTileId,
    )

    expect(bonuses).toHaveLength(8)
    expect(centerTile.shape).toBe('hexagon')
    expect(
      targetStartConfiguration.crystalFreeTileIds,
    ).not.toContain(firstImpact.centerTileId)
    expect(
      centerTile.neighborIds.filter(
        (tileId) =>
          firstImpact.tileBonuses[tileId] !== undefined,
      ),
    ).toHaveLength(
      CONSERVATIVE_METEOR_CONFIGURATION.directTileCount,
    )
    expect(
      bonuses.filter(
        ([tileId]) => distances[tileId] === 2,
      ),
    ).toHaveLength(
      CONSERVATIVE_METEOR_CONFIGURATION.outerTileCount,
    )
  })

  it('hält Abstand zu früheren Zentren und schließt verkaufte Zentren aus', () => {
    const distances = calculateGraphDistances(
      targetPlanetMap.tiles,
      firstImpact.centerTileId,
    )
    const soldTileIds = [
      ...targetStartConfiguration.crystalFreeTileIds,
      secondImpact.centerTileId,
    ]
    const replacement = createMeteorImpact(
      targetPlanetMap,
      targetStartConfiguration,
      targetCrystalRatings,
      soldTileIds,
      [firstImpact],
      10,
      42,
    )!

    expect(distances[secondImpact.centerTileId]).toBeGreaterThanOrEqual(
      CONSERVATIVE_METEOR_CONFIGURATION.preferredMinimumCenterDistance,
    )
    expect(replacement.centerTileId).not.toBe(
      secondImpact.centerTileId,
    )
  })

  it('addiert Einschläge, ohne ein Feld über fünf Sterne zu heben', () => {
    const impacts = [firstImpact, secondImpact]
    const bonuses = combineMeteorBonuses(impacts)

    expect(Object.keys(bonuses).length).toBeGreaterThanOrEqual(8)

    for (const tileId of Object.keys(bonuses)) {
      expect(
        getEffectiveCrystalRating(
          tileId,
          targetCrystalRatings,
          impacts,
        ),
      ).toBeLessThanOrEqual(5)
    }
  })
})
