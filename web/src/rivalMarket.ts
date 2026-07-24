import {
  createComplementaryMarketDecision,
  type AgentMarketIntent,
} from './agents'
import {
  HARVESTER_CREDIT_COST,
  HARVESTER_ORE_COST,
  MARKET_PRICES,
  type MarketResource,
  type MarketRole,
  type RivalColonies,
  type RivalId,
} from './game'

export type RivalMarketParticipant = {
  rivalId: RivalId
  name: string
  icon: string
  decision: AgentMarketIntent
}

export type RivalMarketSelection = {
  participants: RivalMarketParticipant[]
  active: RivalMarketParticipant | null
}

const rivalIds: RivalId[] = [
  'orion',
  'nova',
  'vega',
]

const resourceOffsets: Record<MarketResource, number> = {
  food: 0,
  energy: 1,
  ore: 2,
  crystals: 3,
}

export function getRivalMarketOrder(
  round: number,
  resource: MarketResource,
): RivalId[] {
  const offset =
    (
      Math.max(1, round) -
      1 +
      resourceOffsets[resource]
    ) % rivalIds.length

  return [
    ...rivalIds.slice(offset),
    ...rivalIds.slice(0, offset),
  ]
}

export function createRivalMarketSelection(
  rivals: RivalColonies,
  round: number,
  resource: MarketResource,
  playerRole: MarketRole,
  referencePrice: number,
): RivalMarketSelection {
  const order = getRivalMarketOrder(round, resource)
  const orderIndex = new Map(
    order.map((rivalId, index) => [rivalId, index]),
  )
  const participants = rivalIds.map((rivalId) => {
    const rival = rivals[rivalId]
    const decision = createComplementaryMarketDecision(
      {
        round,
        colony: rival,
        referencePrices: {
          ...MARKET_PRICES,
          [resource]: referencePrice,
        },
        legalActions: {
          harvesterBuild: {
            creditCost: HARVESTER_CREDIT_COST,
            oreCost: HARVESTER_ORE_COST,
          },
          harvesterEnergyCost: 1,
        },
      },
      resource,
      playerRole,
    )

    return {
      rivalId,
      name: rival.name,
      icon: rival.icon,
      decision,
    }
  })

  if (playerRole === 'neutral') {
    return {
      participants,
      active: null,
    }
  }

  const active =
    participants
      .filter(
        (participant) =>
          participant.decision.role !== 'neutral' &&
          participant.decision.quantity > 0,
      )
      .sort((first, second) => {
        const priceDifference =
          playerRole === 'seller'
            ? second.decision.limitPrice -
              first.decision.limitPrice
            : first.decision.limitPrice -
              second.decision.limitPrice

        return (
          priceDifference ||
          second.decision.urgency -
            first.decision.urgency ||
          second.decision.quantity -
            first.decision.quantity ||
          (orderIndex.get(first.rivalId) ?? 0) -
            (orderIndex.get(second.rivalId) ?? 0)
        )
      })[0] ?? null

  return {
    participants,
    active,
  }
}
