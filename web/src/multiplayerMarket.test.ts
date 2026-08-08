import { describe, expect, it } from 'vitest'
import { getDefaultMultiplayerMarketOfferPrice } from './multiplayerMarket'

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
})
