import type { MarketRole } from './game'

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
