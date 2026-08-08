import { describe, expect, it } from 'vitest'
import {
  advanceColonyResourceMarketPhase,
  createPlayableInitialGameState,
  initiateColonyResourceMarket,
  setColonyMarketOffer,
  setColonyMarketRole,
  type ActiveResourceMarket,
} from './game'
import {
  getDefaultMultiplayerMarketOfferPrice,
  getMultiplayerParticipantTradePrice,
  prepareMultiplayerAiMarketOffers,
  prepareMultiplayerAiMarketRoles,
} from './multiplayerMarket'

describe('Mehrspieler-Markt', () => {
  const warehousePrices = {
    buyPrice: 30,
    sellPrice: 50,
  }

  it('belegt das Käuferlimit mit dem Verkaufspreis des HQ-Lagers vor', () => {
    expect(
      getDefaultMultiplayerMarketOfferPrice(
        'buyer',
        warehousePrices,
      ),
    ).toBe(50)
  })

  it('belegt das Verkäuferlimit mit dem Ankaufspreis des HQ-Lagers vor', () => {
    expect(
      getDefaultMultiplayerMarketOfferPrice(
        'seller',
        warehousePrices,
      ),
    ).toBe(30)
  })

  it('ermittelt den Preis eines passenden direkten Koloniegeschäfts', () => {
    const market: ActiveResourceMarket = {
      resource: 'food',
      roundPlayed: 1,
      initiatorId: 'agima',
      phase: 'auction',
      roles: {
        agima: 'buyer',
        orion: 'seller',
        nova: 'buyer',
        vega: 'neutral',
      },
      offers: {
        agima: { active: true, price: 10 },
        orion: { active: true, price: 9 },
        nova: { active: true, price: 8 },
      },
    }

    expect(
      getMultiplayerParticipantTradePrice(
        market,
        'agima',
        'orion',
      ),
    ).toBe(9)
    expect(
      getMultiplayerParticipantTradePrice(
        market,
        'agima',
        'nova',
      ),
    ).toBeNull()
  })

  it('lässt jeden Mehrspieler-Sitz über die Fortsetzung des Markts entscheiden', () => {
    const initialState = createPlayableInitialGameState()
    const announced = initiateColonyResourceMarket(
      initialState,
      'agima',
      'food',
    )
    const declaration = advanceColonyResourceMarketPhase(
      announced,
      'agima',
      'food',
      'announcement',
    )
    const withOtherBuyer = setColonyMarketRole(
      declaration,
      'orion',
      'food',
      'buyer',
    )
    const auction = advanceColonyResourceMarketPhase(
      withOtherBuyer,
      'agima',
      'food',
      'declaration',
    )

    expect(announced.activeResourceMarket?.roles).toEqual({
      agima: 'neutral',
      orion: 'neutral',
      nova: 'neutral',
      vega: 'neutral',
    })
    expect(auction.activeResourceMarket?.phase).toBe('auction')
  })

  it('setzt Rollen und Angebote freier KI-Sitze serverseitig', () => {
    const initialState = createPlayableInitialGameState()
    initialState.colonies.orion.resources.food = 0
    initialState.colonies.orion.credits = 100
    const announced = initiateColonyResourceMarket(
      initialState,
      'agima',
      'food',
    )
    const declaration = advanceColonyResourceMarketPhase(
      announced,
      'agima',
      'food',
      'announcement',
    )
    const withAiRoles = prepareMultiplayerAiMarketRoles(
      declaration,
    )
    const auction = advanceColonyResourceMarketPhase(
      withAiRoles,
      'agima',
      'food',
      'declaration',
    )
    const withAiOffers = prepareMultiplayerAiMarketOffers(auction)

    expect(
      withAiRoles.activeResourceMarket?.roles.orion,
    ).toBe('buyer')
    expect(
      withAiOffers.activeResourceMarket?.offers.orion,
    ).toMatchObject({ active: true })
  })

  it('handelt nur bei aktiven, kompatiblen Angeboten direkt', () => {
    const initialState = createPlayableInitialGameState()
    const announced = initiateColonyResourceMarket(
      initialState,
      'agima',
      'food',
    )
    const declaration = advanceColonyResourceMarketPhase(
      announced,
      'agima',
      'food',
      'announcement',
    )
    const withRoles = setColonyMarketRole(
      setColonyMarketRole(
        declaration,
        'agima',
        'food',
        'seller',
      ),
      'orion',
      'food',
      'buyer',
    )
    const auction = advanceColonyResourceMarketPhase(
      withRoles,
      'agima',
      'food',
      'declaration',
    )
    const withOffers = setColonyMarketOffer(
      setColonyMarketOffer(
        auction,
        'agima',
        'food',
        { active: true, price: 8 },
      ),
      'orion',
      'food',
      { active: true, price: 9 },
    )

    expect(
      getMultiplayerParticipantTradePrice(
        withOffers.activeResourceMarket!,
        'agima',
        'orion',
      ),
    ).toBe(8)
  })
})
