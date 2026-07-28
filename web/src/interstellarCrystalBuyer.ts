export type InterstellarCrystalBuyerConfiguration = {
  capacityTiers: Array<{
    fromRound: number
    capacity: number
  }>
  referencePriceFactor: number
  minimumOfferPrice: number
  maximumOfferPrice: number
}

export type InterstellarCrystalBuyerOffer = {
  capacity: number
  purchasedUnits: number
  remainingCapacity: number
  offerPrice: number
  isAvailable: boolean
}

export const CONSERVATIVE_INTERSTELLAR_BUYER_CONFIGURATION: InterstellarCrystalBuyerConfiguration =
  {
    capacityTiers: [
      { fromRound: 1, capacity: 1 },
      { fromRound: 5, capacity: 2 },
      { fromRound: 10, capacity: 3 },
      { fromRound: 15, capacity: 4 },
    ],
    referencePriceFactor: 0.9,
    minimumOfferPrice: 20,
    maximumOfferPrice: 60,
  }

export function getInterstellarCrystalBuyerOffer(
  round: number,
  referencePrice: number,
  purchasedUnits: number,
  configuration: InterstellarCrystalBuyerConfiguration =
    CONSERVATIVE_INTERSTELLAR_BUYER_CONFIGURATION,
): InterstellarCrystalBuyerOffer {
  const capacity =
    [...configuration.capacityTiers]
      .sort(
        (first, second) =>
          second.fromRound - first.fromRound,
      )
      .find((tier) => round >= tier.fromRound)?.capacity ?? 0
  const normalizedPurchasedUnits = Math.max(
    0,
    Math.trunc(purchasedUnits),
  )
  const remainingCapacity = Math.max(
    0,
    capacity - normalizedPurchasedUnits,
  )
  const offerPrice = Math.min(
    configuration.maximumOfferPrice,
    Math.max(
      configuration.minimumOfferPrice,
      Math.round(
        referencePrice * configuration.referencePriceFactor,
      ),
    ),
  )

  return {
    capacity,
    purchasedUnits: normalizedPurchasedUnits,
    remainingCapacity,
    offerPrice,
    isAvailable: remainingCapacity > 0,
  }
}
