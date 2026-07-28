import { describe, expect, it } from 'vitest'
import {
  GAME_ROUND_LIMIT,
  createPlayableInitialGameState,
} from './game'
import {
  calculateSimulationWealth,
  compareSimulationFinalScores,
  createBalancedSimulationStartingLand,
  runHeadlessEconomicSimulation,
} from './simulation'

describe('Interne Wirtschaftssimulation', () => {
  it('simuliert eine vollständige Partie ohne Oberfläche', () => {
    const result = runHeadlessEconomicSimulation()

    expect(result.mode).toBe(
      'headless-economic-v6',
    )
    expect(result.roundsPlayed).toBe(
      GAME_ROUND_LIMIT,
    )
    expect(result.marketIncluded).toBe(true)
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
        expect(
          participant.settlementWealth,
        ).toBeGreaterThanOrEqual(0)
        expect(
          participant.remainingResources,
        ).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('ordnet den Endstand lexikografisch wie die Browserpartie', () => {
    const result = runHeadlessEconomicSimulation({
      rounds: 4,
      seed: 8,
    })

    for (
      let index = 1;
      index < result.finalStandings.length;
      index += 1
    ) {
      expect(
        compareSimulationFinalScores(
          result.finalStandings[index - 1]!,
          result.finalStandings[index]!,
        ),
      ).toBeLessThanOrEqual(0)
    }
  })

  it('wendet alle vier Gleichstandsstufen in der richtigen Reihenfolge an', () => {
    const base =
      runHeadlessEconomicSimulation({
        rounds: 1,
        seed: 3,
      }).finalStandings[0]!

    expect(
      compareSimulationFinalScores(
        { ...base, population: 21, settlementWealth: 0 },
        { ...base, population: 20, settlementWealth: 999 },
      ),
    ).toBeLessThan(0)
    expect(
      compareSimulationFinalScores(
        { ...base, settlementWealth: 101, remainingResources: 0 },
        { ...base, settlementWealth: 100, remainingResources: 999 },
      ),
    ).toBeLessThan(0)
    expect(
      compareSimulationFinalScores(
        { ...base, remainingResources: 11, harvesters: 0 },
        { ...base, remainingResources: 10, harvesters: 99 },
      ),
    ).toBeLessThan(0)
    expect(
      compareSimulationFinalScores(
        { ...base, harvesters: 3 },
        { ...base, harvesters: 2 },
      ),
    ).toBeLessThan(0)
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

  it('wendet den seedbasierten Meteorplan reproduzierbar an', () => {
    const first = runHeadlessEconomicSimulation({
      seed: 12,
    })
    const second = runHeadlessEconomicSimulation({
      seed: 12,
    })

    expect(first.meteorImpacts.length).toBeGreaterThanOrEqual(2)
    expect(first.meteorImpacts.length).toBeLessThanOrEqual(3)
    expect(first.meteorImpacts).toEqual(second.meteorImpacts)
    expect(
      first.meteorImpacts.map((impact) => impact.round),
    ).toEqual(
      [...first.meteorImpacts]
        .map((impact) => impact.round)
        .sort((left, right) => left - right),
    )
  })

  it('begrenzt simulierte Verkäufe an den interstellaren Käufer', () => {
    const result = runHeadlessEconomicSimulation({
      rounds: 1,
      seed: 4,
      initialCrystalStock: 3,
    })
    const interstellarTrades =
      result.marketTransactions.filter(
        (transaction) =>
          transaction.kind === 'interstellar',
      )

    expect(interstellarTrades).toHaveLength(1)
    expect(interstellarTrades[0]).toMatchObject({
      resource: 'crystals',
      buyer: 'interstellar-buyer',
      price: 36,
    })
    expect(
      result.marketSummary.interstellarTrades,
    ).toBe(1)
  })

  it('startet standardmäßig mit einer Kristallprobe je Kolonie', () => {
    const result = runHeadlessEconomicSimulation({
      rounds: 1,
      includeMarket: false,
      seed: 2,
    })
    const initialParticipants =
      result.history[0].participants

    for (const participant of Object.values(
      initialParticipants,
    )) {
      expect(participant.resources.crystals).toBe(1)
    }
  })

  it('bleibt mit demselben Seed vollständig reproduzierbar', () => {
    const first = runHeadlessEconomicSimulation({
      rounds: 8,
      seed: 17,
    })
    const second = runHeadlessEconomicSimulation({
      rounds: 8,
      seed: 17,
    })

    expect(second).toEqual(first)
  })

  it('variiert faire Startfelder und Marktprioritäten per Seed', () => {
    expect(
      createBalancedSimulationStartingLand(1),
    ).not.toEqual(
      createBalancedSimulationStartingLand(2),
    )

    const signatures = new Set(
      [1, 2, 3, 4, 5, 6].map((seed) =>
        runHeadlessEconomicSimulation({
          rounds: 8,
          seed,
        }).finalStandings
          .map(
            (participant) =>
              `${participant.id}:${participant.wealth}`,
          )
          .join('|'),
      ),
    )

    expect(signatures.size).toBeGreaterThan(1)
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

  it('führt den Markt vor Versorgung und Produktion aus', () => {
    const result = runHeadlessEconomicSimulation()

    expect(
      result.marketSummary.totalTransactions,
    ).toBeGreaterThan(0)
    expect(
      result.marketTransactions,
    ).toHaveLength(
      result.marketSummary.totalTransactions,
    )
    expect(
      result.history.reduce(
        (total, snapshot) =>
          total + snapshot.marketTransactions,
        0,
      ),
    ).toBe(
      result.marketSummary.totalTransactions,
    )

    for (const transaction of result.marketTransactions) {
      expect(transaction.quantity).toBe(1)
      expect(transaction.price).toBeGreaterThan(0)
      expect(transaction.buyer).not.toBe(
        transaction.seller,
      )
    }
  })

  it('erzeugt mindestens einen direkten Spielerhandel', () => {
    const result = runHeadlessEconomicSimulation()

    expect(
      result.marketSummary.playerTrades,
    ).toBeGreaterThan(0)
    expect(
      result.marketDiagnostics.some(
        (diagnostic) =>
          diagnostic.buyerCount > 0 &&
          diagnostic.sellerCount > 0 &&
          diagnostic.compatiblePairs > 0 &&
          diagnostic.playerTrades > 0,
      ),
    ).toBe(true)
  })

  it('ordnet jede Transaktion genau einem Handelsweg zu', () => {
    const result = runHeadlessEconomicSimulation()

    expect(
      result.marketSummary.playerTrades +
        result.marketSummary.warehouseTrades +
        result.marketSummary.interstellarTrades,
    ).toBe(
      result.marketSummary.totalTransactions,
    )
    expect(
      Object.values(
        result.marketSummary.finalWarehouseStock,
      ).every((stock) => stock >= 0),
    ).toBe(true)
    expect(
      Object.values(
        result.marketSummary.finalPrices,
      ).every((price) => price >= 1),
    ).toBe(true)
  })

  it('protokolliert jede Ressourcenauktion mit allen vier Rollen', () => {
    const result = runHeadlessEconomicSimulation({
      rounds: 5,
    })

    expect(result.marketDiagnostics).toHaveLength(
      5 * 4,
    )

    for (const diagnostic of result.marketDiagnostics) {
      expect(diagnostic.intents).toHaveLength(4)
      expect(
        new Set(
          diagnostic.intents.map(
            (intent) => intent.participantId,
          ),
        ).size,
      ).toBe(4)
      expect(diagnostic.referencePrice).toBeGreaterThan(0)
      expect(diagnostic.warehouseBuyPrice).toBeGreaterThan(0)
      expect(diagnostic.warehouseSellPrice).toBeGreaterThan(
        diagnostic.warehouseBuyPrice,
      )
    }
  })

  it('verknüpft Diagnose und ausgeführte Markttransaktionen', () => {
    const result = runHeadlessEconomicSimulation()

    expect(
      result.marketDiagnostics.reduce(
        (total, diagnostic) =>
          total + diagnostic.playerTrades,
        0,
      ),
    ).toBe(result.marketSummary.playerTrades)
    expect(
      result.marketDiagnostics.reduce(
        (total, diagnostic) =>
          total + diagnostic.warehouseTrades,
        0,
      ),
    ).toBe(result.marketSummary.warehouseTrades)

    for (const diagnostic of result.marketDiagnostics) {
      if (diagnostic.playerTrades > 0) {
        expect(diagnostic.compatiblePairs).toBeGreaterThan(0)
        expect(diagnostic.outcome).toBe('player-trade')
        expect(diagnostic.reason).toBe('matched')
      }
    }
  })

  it('kann den Markt für einen direkten Vergleich deaktivieren', () => {
    const result = runHeadlessEconomicSimulation({
      rounds: 6,
      includeMarket: false,
    })

    expect(result.marketIncluded).toBe(false)
    expect(result.marketTransactions).toEqual([])
    expect(result.marketDiagnostics).toEqual([])
    expect(
      result.marketSummary.totalTransactions,
    ).toBe(0)
    expect(
      result.history.every(
        (snapshot) =>
          snapshot.marketTransactions === 0,
      ),
    ).toBe(true)
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
