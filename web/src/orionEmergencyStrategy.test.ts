import { describe, expect, it } from 'vitest'
import {
  createAgentEmergencyAssessment,
  createAgentPlan,
  getAgentMarketIntent,
  type AgentContext,
} from './agents'

function createContext(
  overrides: Partial<AgentContext> = {},
): AgentContext {
  return {
    round: 4,
    colony: {
      id: 'orion',
      population: 10,
      credits: 100,
      resources: {
        food: 10,
        energy: 12,
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
      harvesterEnergyCost: 1,
      landCandidates: [
        {
          tileId: 'A7',
          minimumBid: 20,
          food: 3,
          energy: 3,
          ore: 3,
        },
      ],
    },
    ...overrides,
  }
}

describe('Orions Notfallstrategie', () => {
  it('bleibt bei ausreichenden Reserven im Normalmodus', () => {
    expect(
      createAgentEmergencyAssessment(createContext()),
    ).toEqual({
      level: 'normal',
      foodShortage: 0,
      energyShortage: 0,
      suspendInvestments: false,
      emergencyCashReserve: 35,
    })
  })

  it('wechselt unterhalb der Zielreserve in den Warnmodus', () => {
    const context = createContext({
      colony: {
        ...createContext().colony,
        resources: {
          ...createContext().colony.resources,
          food: 3,
        },
      },
    })

    expect(
      createAgentEmergencyAssessment(context),
    ).toMatchObject({
      level: 'warning',
      suspendInvestments: true,
      emergencyCashReserve: 17,
    })
  })

  it('erkennt fehlende Energie für HQ und Harvester als kritisch', () => {
    const context = createContext({
      colony: {
        ...createContext().colony,
        resources: {
          ...createContext().colony.resources,
          energy: 3,
        },
      },
    })

    expect(
      createAgentEmergencyAssessment(context),
    ).toMatchObject({
      level: 'critical',
      energyShortage: 1,
      suspendInvestments: true,
      emergencyCashReserve: 0,
    })
  })

  it('setzt im kritischen Notfall auch die Creditreserve für Energie ein', () => {
    const base = createContext()
    const plan = createAgentPlan({
      ...base,
      colony: {
        ...base.colony,
        credits: 40,
        resources: {
          ...base.colony.resources,
          energy: 0,
        },
      },
    })

    expect(getAgentMarketIntent(plan, 'energy')).toMatchObject({
      role: 'buyer',
      quantity: 5,
      urgency: 100,
    })
  })

  it('stoppt Grundstückskauf und Harvesterbau im Notfall', () => {
    const base = createContext()
    const plan = createAgentPlan({
      ...base,
      colony: {
        ...base.colony,
        resources: {
          ...base.colony.resources,
          food: 1,
        },
      },
    })

    expect(plan.emergency.level).toBe('critical')
    expect(plan.harvester).toEqual({
      build: false,
      reason: 'unsafe-supply',
    })
    expect(plan.landBid).toBeNull()
  })

  it('priorisiert Energie inklusive des Harvesterbedarfs', () => {
    const base = createContext()
    const plan = createAgentPlan({
      ...base,
      colony: {
        ...base.colony,
        resources: {
          ...base.colony.resources,
          food: 3,
          energy: 3,
        },
      },
    })

    expect(plan.productionPriorities[0].resource).toBe(
      'energy',
    )
    expect(plan.emergency.level).toBe('critical')
  })
})
