import {
  getWarehousePrices,
  HARVESTER_CREDIT_COST,
  HARVESTER_ORE_COST,
  setColonyMarketOffer,
  setColonyMarketRole,
  type ActiveResourceMarket,
  type GameState,
  type MarketRole,
  type MarketResource,
} from './game'
import {
  createAgentPlan,
  getAgentMarketIntent,
} from './agents'
import {
  participantIds,
  type ParticipantId,
} from './match'

type WarehousePrices = {
  buyPrice: number
  sellPrice: number
}

export function getDefaultMultiplayerMarketOfferPrice(
  role: MarketRole,
  warehousePrices: WarehousePrices,
) {
  return role === 'seller'
    ? warehousePrices.buyPrice
    : warehousePrices.sellPrice
}

function getAiMarketIntent(
  state: GameState,
  participantId: ParticipantId,
  resource: MarketResource,
) {
  return getAgentMarketIntent(
    createAgentPlan({
      round: state.round,
      colony: state.colonies[participantId],
      referencePrices: {
        food: state.market.food.referencePrice,
        energy: state.market.energy.referencePrice,
        ore: state.market.ore.referencePrice,
        crystals: state.market.crystals.referencePrice,
      },
      legalActions: {
        harvesterBuild: {
          creditCost: HARVESTER_CREDIT_COST,
          oreCost: HARVESTER_ORE_COST,
        },
        harvesterEnergyCost: 1,
      },
    }),
    resource,
  )
}

export function prepareMultiplayerAiMarketRoles(
  state: GameState,
) {
  const activeMarket = state.activeResourceMarket

  if (!activeMarket || activeMarket.phase !== 'declaration') {
    return state
  }

  return participantIds.reduce((nextState, participantId) => {
    if (
      state.match.participants[participantId].controller.kind !==
      'ai'
    ) {
      return nextState
    }

    const intent = getAiMarketIntent(
      state,
      participantId,
      activeMarket.resource,
    )

    return setColonyMarketRole(
      nextState,
      participantId,
      activeMarket.resource,
      intent?.role ?? 'neutral',
    )
  }, state)
}

export function prepareMultiplayerAiMarketOffers(
  state: GameState,
) {
  const activeMarket = state.activeResourceMarket

  if (!activeMarket || activeMarket.phase !== 'auction') {
    return state
  }

  const prices = getWarehousePrices(
    activeMarket.resource,
    state.market[activeMarket.resource].referencePrice,
  )

  return participantIds.reduce((nextState, participantId) => {
    if (
      state.match.participants[participantId].controller.kind !==
      'ai'
    ) {
      return nextState
    }

    const intent = getAiMarketIntent(
      state,
      participantId,
      activeMarket.resource,
    )
    const price = Math.max(
      prices.buyPrice,
      Math.min(prices.sellPrice, intent?.limitPrice ?? 0),
    )

    return setColonyMarketOffer(
      nextState,
      participantId,
      activeMarket.resource,
      {
        active:
          intent !== undefined &&
          intent.role !== 'neutral' &&
          intent.quantity > 0,
        price,
      },
    )
  }, state)
}

export function getMultiplayerParticipantTradePrice(
  market: ActiveResourceMarket,
  participantId: ParticipantId,
  counterpartyId: ParticipantId,
) {
  if (
    market.phase !== 'auction' ||
    participantId === counterpartyId
  ) {
    return null
  }

  const participantRole = market.roles[participantId]
  const counterpartyRole = market.roles[counterpartyId]
  const participantOffer = market.offers[participantId]
  const counterpartyOffer = market.offers[counterpartyId]

  if (!participantOffer?.active || !counterpartyOffer?.active) {
    return null
  }

  if (
    participantRole === 'buyer' &&
    counterpartyRole === 'seller' &&
    participantOffer.price >= counterpartyOffer.price
  ) {
    return counterpartyOffer.price
  }

  if (
    participantRole === 'seller' &&
    counterpartyRole === 'buyer' &&
    counterpartyOffer.price >= participantOffer.price
  ) {
    return participantOffer.price
  }

  return null
}
