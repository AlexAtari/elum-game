import { describe, expect, it } from 'vitest'
import {
  GAME_ROUND_LIMIT,
  createPlayableInitialGameState,
} from './game'
import {
  calculateSimulationWealth,
  createBalancedSimulationStartingLand,
  runHeadlessEconomicSimulation,
} from './simulation'

describe('Interne Wirtschaftssimulation', () => {
  it('simuliert eine vollständige Partie ohne Oberfläche', () => {
    const result = runHeadlessEconomicSimulation()

    expect(result.mode).toBe(
      'headless-economic-v2',
    )
    expect(result.roundsPlayed).toBe(
      GAME_ROUND_LIMIT,
    )
    expect(result.marketIncluded).toBe(false)
    expect(result.history).toHaveLength(
      GAME_ROUND_LIMIT + 1,
    )
    expect(result.finalStandings).toHaveLength(4)
  })

  it('liefert in jeder Runde alle vier Kolonien', () => {
    const result = runHeadlessEconomicSimulation({
      rounds: 4,
    })

    for (const snapshot of result.history) {
      expect(
        Object.keys(snapshot.participants).sort(),
      ).toEqual([
        'agima',
        'nova',
        'orion',
        'vega',
      ])

      for (
        const participant of Object.values(
          snapshot.participants,
        )
      ) {
        expect(participant.population).toBeGreaterThanOrEqual(0)
        expect(participant.credits).toBeGreaterThanOrEqual(0)
        expect(participant.harvesters).toBeGreaterThanOrEqual(0)
        expect(participant.ownedTiles).toBeGreaterThanOrEqual(0)
        expect(participant.wealth).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('ist für Balancing-Vergleiche reproduzierbar', () => {
    expect(
      runHeadlessEconomicSimulation({
        rounds: 6,
      }),
    ).toEqual(
      runHeadlessEconomicSimulation({
        rounds: 6,
      }),
    )
  })

  it('verändert den normalen Spielstart nicht', () => {
    const before = createPlayableInitialGameState()

    runHeadlessEconomicSimulation({
      rounds: 3,
    })

    expect(
      createPlayableInitialGameState(),
    ).toEqual(before)
  })

  it('vergibt vier disjunkte und gleichwertige Startfeldpaare', () => {
    const startingLand =
      createBalancedSimulationStartingLand()
    const allocations = Object.values(startingLand)
    const allTileIds = allocations.flatMap(
      (allocation) => allocation.tileIds,
    )

    expect(new Set(allTileIds).size).toBe(8)
    expect(
      new Set(
        allocations.map(
          (allocation) =>
            [
              allocation.foodYield,
              allocation.energyYield,
              allocation.orePotential,
            ].join(':'),
        ),
      ).size,
    ).toBe(1)
  })

  it('startet alle vier Kolonien mit Land und gleichem Vermögen', () => {
    const result = runHeadlessEconomicSimulation({
      rounds: 1,
    })
    const initialParticipants = Object.values(
      result.history[0].participants,
    )

    for (const participant of initialParticipants) {
      expect(participant.ownedTiles).toBe(2)
      expect(participant.harvesters).toBe(2)
    }

    expect(
      new Set(
        initialParticipants.map(
          (participant) => participant.wealth,
        ),
      ).size,
    ).toBe(1)
  })

  it('erzeugt in keiner Runde Produktion ohne Grundstücksbasis', () => {
    const result = runHeadlessEconomicSimulation()

    for (const snapshot of result.history) {
      for (
        const participant of Object.values(
          snapshot.participants,
        )
      ) {
        if (participant.harvesters > 0) {
          expect(
            participant.ownedTiles,
          ).toBeGreaterThan(0)
        }
      }
    }
  })

  it('bewertet Vermögen nachvollziehbar', () => {
    expect(
      calculateSimulationWealth({
        population: 10,
        credits: 150,
        resources: {
          food: 10,
          energy: 10,
          ore: 5,
          crystals: 0,
        },
        harvesters: 2,
        ownedTiles: 0,
      }),
    ).toBe(545)
  })
})
