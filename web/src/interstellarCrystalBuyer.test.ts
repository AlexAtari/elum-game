import { describe, expect, it } from 'vitest'
import {
  CONSERVATIVE_INTERSTELLAR_BUYER_CONFIGURATION,
  getInterstellarCrystalBuyerOffer,
} from './interstellarCrystalBuyer'

describe('Interstellarer Kristallkäufer', () => {
  it.each([
    [1, 1],
    [4, 1],
    [5, 2],
    [9, 2],
    [10, 3],
    [14, 3],
    [15, 4],
    [20, 4],
  ])(
    'stellt in Runde %i eine Kapazität von %i bereit',
    (round, expectedCapacity) => {
      expect(
        getInterstellarCrystalBuyerOffer(round, 40, 0).capacity,
      ).toBe(expectedCapacity)
    },
  )

  it('startet bei 36 Credits und folgt gedämpft dem Referenzkurs', () => {
    expect(
      getInterstellarCrystalBuyerOffer(1, 40, 0).offerPrice,
    ).toBe(36)
    expect(
      getInterstellarCrystalBuyerOffer(1, 50, 0).offerPrice,
    ).toBe(45)
  })

  it('begrenzt Preis und verbleibende Kaufmenge', () => {
    const lowOffer = getInterstellarCrystalBuyerOffer(1, 10, 0)
    const highOffer = getInterstellarCrystalBuyerOffer(15, 100, 3)
    const exhaustedOffer = getInterstellarCrystalBuyerOffer(
      5,
      40,
      2,
    )

    expect(lowOffer.offerPrice).toBe(
      CONSERVATIVE_INTERSTELLAR_BUYER_CONFIGURATION.minimumOfferPrice,
    )
    expect(highOffer).toMatchObject({
      offerPrice:
        CONSERVATIVE_INTERSTELLAR_BUYER_CONFIGURATION.maximumOfferPrice,
      remainingCapacity: 1,
      isAvailable: true,
    })
    expect(exhaustedOffer).toMatchObject({
      remainingCapacity: 0,
      isAvailable: false,
    })
  })
})
