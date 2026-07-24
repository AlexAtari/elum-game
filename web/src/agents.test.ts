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
      energyUnits: 4,
      targetFoodReserve: 8,
      targetEnergyReserve: 8,
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

  it('liefert bei identischem Zustand dieselbe Entscheidung', () => {
    const context = createContext()

    expect(createAgentPlan(context)).toEqual(createAgentPlan(context))
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
})
