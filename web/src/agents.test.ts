import { describe, expect, it } from 'vitest'
import {
  agentProfiles,
  createAgentPlan,
  createComplementaryMarketDecision,
  getAgentMarketIntent,
  type AgentContext,
} from './agents'

const createContext = (
  overrides: Partial<AgentContext> = {},
): AgentContext => ({
  round: 1,
  colony: {
    id: 'orion',
    population: 10,
    credits: 100,
    resources: {
      food: 10,
      energy: 10,
      ore: 8,
      crystals: 0,
    },
    harvesters: 2,
  },
  referencePrices: {
    food: 8,
    energy: 8,
    ore: 15,
    crystals: 40,
  },
  legalActions: {
    harvesterBuild: {
      creditCost: 30,
      oreCost: 3,
    },
    landCandidates: [],
  },
  ...overrides,
})

describe('Wirtschaftsagenten', () => {
  it('berechnet die Versorgung nach Bevölkerungsgruppen', () => {
    const plan = createAgentPlan(
      createContext({
        colony: {
          ...createContext().colony,
          population: 11,
        },
      }),
    )

    expect(plan.supply).toEqual({
      foodUnits: 4,
      energyUnits: 6,
      targetFoodReserve: 8,
      targetEnergyReserve: 12,
    })
  })

  it('verwendet einen expliziten Simulationsbedarf ohne die Standardregel zu ändern', () => {
    const plan = createAgentPlan(
      createContext({
        colony: {
          ...createContext().colony,
          population: 11,
        },
        legalActions: {
          ...createContext().legalActions,
          normalSupplyDemand: 3,
        },
      }),
    )

    expect(plan.supply).toEqual({
      foodUnits: 3,
      energyUnits: 5,
      targetFoodReserve: 6,
      targetEnergyReserve: 10,
    })
  })

  it('priorisiert und kauft eine akut fehlende Ressource', () => {
    const context = createContext({
      colony: {
        ...createContext().colony,
        resources: {
          ...createContext().colony.resources,
          food: 1,
        },
      },
    })
    const plan = createAgentPlan(context)

    expect(plan.productionPriorities[0].resource).toBe('food')
    expect(getAgentMarketIntent(plan, 'food')).toMatchObject({
      role: 'buyer',
      quantity: 3,
      urgency: 100,
    })
  })

  it('verkauft nur Bestand oberhalb von Reserve und nächstem Bedarf', () => {
    const context = createContext({
      colony: {
        ...createContext().colony,
        resources: {
          ...createContext().colony.resources,
          food: 12,
        },
      },
    })
    const plan = createAgentPlan(context)

    expect(getAgentMarketIntent(plan, 'food')).toMatchObject({
      role: 'seller',
      quantity: 6,
    })
  })

  it('verkauft die Kristallprobe nur oberhalb der Profilreserve', () => {
    const crystalResources = {
      ...createContext().colony.resources,
      crystals: 1,
    }
    const novaPlan = createAgentPlan(
      createContext({
        colony: {
          ...createContext().colony,
          id: 'nova',
          resources: crystalResources,
        },
      }),
    )
    const orionPlan = createAgentPlan(
      createContext({
        colony: {
          ...createContext().colony,
          id: 'orion',
          resources: crystalResources,
        },
      }),
    )

    expect(
      getAgentMarketIntent(novaPlan, 'crystals'),
    ).toMatchObject({
      role: 'seller',
      quantity: 1,
    })
    expect(
      getAgentMarketIntent(orionPlan, 'crystals'),
    ).toMatchObject({
      role: 'neutral',
      quantity: 0,
    })
  })

  it('baut nur bei sicherer Versorgung und ausreichender Liquidität', () => {
    const safePlan = createAgentPlan(createContext())
    const unsafePlan = createAgentPlan(
      createContext({
        colony: {
          ...createContext().colony,
          resources: {
            ...createContext().colony.resources,
            energy: 2,
          },
        },
      }),
    )

    expect(safePlan.harvester).toEqual({
      build: true,
      reason: 'affordable',
    })
    expect(unsafePlan.harvester).toEqual({
      build: false,
      reason: 'unsafe-supply',
    })
  })

  it('erlaubt den dritten Harvester bei sicherer nächster Runde', () => {
    const expansionResources = {
      food: 2,
      energy: 5,
      ore: 8,
      crystals: 0,
    }
    const initialExpansion = createAgentPlan(
      createContext({
        colony: {
          ...createContext().colony,
          resources: expansionResources,
          harvesters: 2,
        },
      }),
    )
    const laterExpansion = createAgentPlan(
      createContext({
        colony: {
          ...createContext().colony,
          resources: expansionResources,
          harvesters: 3,
        },
      }),
    )

    expect(initialExpansion.harvester).toEqual({
      build: true,
      reason: 'affordable',
    })
    expect(laterExpansion.harvester).toEqual({
      build: false,
      reason: 'unsafe-supply',
    })
  })

  it('wählt das wirtschaftlich beste bezahlbare Grundstück', () => {
    const plan = createAgentPlan(
      createContext({
        legalActions: {
          harvesterBuild: {
            creditCost: 30,
            oreCost: 3,
          },
          landCandidates: [
            {
              tileId: 'X',
              minimumBid: 18,
              food: 4,
              energy: 2,
              ore: 1,
            },
            {
              tileId: 'Y',
              minimumBid: 20,
              food: 2,
              energy: 3,
              ore: 5,
              adjacencyBonus: 1,
            },
            {
              tileId: 'Z',
              minimumBid: 40,
              food: 5,
              energy: 5,
              ore: 5,
            },
          ],
        },
      }),
    )

    expect(plan.landBid).toMatchObject({
      tileId: 'Y',
      maximumBid: 25,
    })
  })

  it('nutzt einen freien Harvester für die erste Expansion trotz Warnreserve', () => {
    const warningColony = {
      ...createContext().colony,
      resources: {
        ...createContext().colony.resources,
        food: 2,
        energy: 5,
      },
      harvesters: 3,
    }
    const landCandidate = {
      tileId: 'X',
      minimumBid: 25,
      food: 3,
      energy: 3,
      ore: 3,
    }
    const withoutIdleHarvester = createAgentPlan(
      createContext({
        colony: warningColony,
        legalActions: {
          ...createContext().legalActions,
          landCandidates: [landCandidate],
          hasIdleHarvester: false,
        },
      }),
    )
    const withIdleHarvester = createAgentPlan(
      createContext({
        colony: warningColony,
        legalActions: {
          ...createContext().legalActions,
          landCandidates: [landCandidate],
          hasIdleHarvester: true,
        },
      }),
    )

    expect(withoutIdleHarvester.landBid).toBeNull()
    expect(withIdleHarvester.landBid).not.toBeNull()
  })

  it('erschließt nach dem dritten Harvester höchstens zum Mindestgebot die äußere Route', () => {
    const warningColony = {
      ...createContext().colony,
      credits: 35,
      resources: {
        ...createContext().colony.resources,
        food: 2,
        energy: 5,
      },
      harvesters: 3,
    }
    const plan = createAgentPlan(
      createContext({
        colony: warningColony,
        legalActions: {
          ...createContext().legalActions,
          hasIdleHarvester: false,
          canExpandFrontier: true,
          landCandidates: [
            {
              tileId: 'INNER',
              minimumBid: 25,
              food: 3,
              energy: 3,
              ore: 3,
              distanceFromHq: 3,
            },
            {
              tileId: 'OUTER',
              minimumBid: 25,
              food: 3,
              energy: 3,
              ore: 3,
              distanceFromHq: 4,
            },
          ],
        },
      }),
    )

    expect(plan.landBid).toEqual({
      tileId: 'OUTER',
      maximumBid: 25,
      score: 14.4,
    })
  })

  it('sperrt Prospektionsland bei akuter Versorgungskrise', () => {
    const plan = createAgentPlan(
      createContext({
        colony: {
          ...createContext().colony,
          resources: {
            ...createContext().colony.resources,
            food: 1,
          },
          harvesters: 3,
        },
        legalActions: {
          ...createContext().legalActions,
          hasIdleHarvester: false,
          canExpandFrontier: true,
          landCandidates: [
            {
              tileId: 'OUTER',
              minimumBid: 25,
              food: 3,
              energy: 3,
              ore: 3,
              distanceFromHq: 4,
            },
          ],
        },
      }),
    )

    expect(plan.landBid).toBeNull()
  })

  it('liefert bei identischem Zustand dieselbe Entscheidung', () => {
    const context = createContext()

    expect(createAgentPlan(context)).toEqual(createAgentPlan(context))
  })


  it('erzeugt durch unterschiedliche Erzreserven echte Marktgegner', () => {
    const baseContext = createContext({
      colony: {
        ...createContext().colony,
        resources: {
          ...createContext().colony.resources,
          ore: 5,
        },
      },
      legalActions: {
        harvesterBuild: {
          creditCost: 30,
          oreCost: 3,
        },
        landCandidates: [],
      },
    })
    const orionPlan = createAgentPlan({
      ...baseContext,
      colony: {
        ...baseContext.colony,
        id: 'orion',
      },
    })
    const novaPlan = createAgentPlan({
      ...baseContext,
      colony: {
        ...baseContext.colony,
        id: 'nova',
      },
    })
    const vegaPlan = createAgentPlan({
      ...baseContext,
      colony: {
        ...baseContext.colony,
        id: 'vega',
      },
    })
    const orionOre =
      getAgentMarketIntent(orionPlan, 'ore')
    const novaOre =
      getAgentMarketIntent(novaPlan, 'ore')
    const vegaOre =
      getAgentMarketIntent(vegaPlan, 'ore')

    expect(orionOre).toMatchObject({
      role: 'seller',
      quantity: 1,
    })
    expect(novaOre).toMatchObject({
      role: 'neutral',
      quantity: 0,
    })
    expect(vegaOre).toMatchObject({
      role: 'buyer',
      quantity: 1,
    })
    expect(vegaOre?.limitPrice).toBeGreaterThanOrEqual(
      orionOre?.limitPrice ?? Number.MAX_SAFE_INTEGER,
    )
  })

  it('bildet unterschiedliche Strategien in den Profilen ab', () => {
    expect(agentProfiles.nova.expansionBias).toBeGreaterThan(
      agentProfiles.orion.expansionBias,
    )
    expect(agentProfiles.vega.productionWeights.ore).toBeGreaterThan(
      agentProfiles.orion.productionWeights.ore,
    )
  })

  it('unterstützt Agima als vierten Bot-Slot', () => {
    const plan = createAgentPlan(
      createContext({
        colony: {
          ...createContext().colony,
          id: 'agima',
        },
      }),
    )

    expect(plan.playerId).toBe('agima')
    expect(agentProfiles.agima.personality).toBe('autopilot')
  })

  it('nimmt nur eine wirtschaftlich passende Marktrolle ein', () => {
    const context = createContext({
      colony: {
        ...createContext().colony,
        resources: {
          ...createContext().colony.resources,
          food: 1,
        },
      },
    })

    expect(
      createComplementaryMarketDecision(
        context,
        'food',
        'seller',
      ),
    ).toMatchObject({
      role: 'buyer',
      quantity: 3,
      urgency: 100,
    })

    expect(
      createComplementaryMarketDecision(
        context,
        'food',
        'buyer',
      ),
    ).toMatchObject({
      role: 'neutral',
      quantity: 0,
    })
  })

  it('verkauft am Markt nur echten Überschuss', () => {
    const context = createContext({
      colony: {
        ...createContext().colony,
        resources: {
          ...createContext().colony.resources,
          food: 12,
        },
      },
    })

    expect(
      createComplementaryMarketDecision(
        context,
        'food',
        'buyer',
      ),
    ).toMatchObject({
      role: 'seller',
      quantity: 6,
    })
  })

  it('balanciert Nova offensiv und Vega versorgungsorientiert', () => {
    expect(
      agentProfiles.nova.cashReserve,
    ).toBeLessThan(
      agentProfiles.orion.cashReserve,
    )
    expect(
      agentProfiles.nova.harvesterBias,
    ).toBeGreaterThan(
      agentProfiles.orion.harvesterBias,
    )
    expect(
      agentProfiles.nova.expansionBias,
    ).toBeGreaterThan(
      agentProfiles.vega.expansionBias,
    )
    expect(
      agentProfiles.vega.reserveRounds,
    ).toBeGreaterThanOrEqual(
      agentProfiles.orion.reserveRounds,
    )
    expect(
      agentProfiles.vega.productionWeights.energy,
    ).toBeGreaterThanOrEqual(
      agentProfiles.vega.productionWeights.food,
    )
  })

})
