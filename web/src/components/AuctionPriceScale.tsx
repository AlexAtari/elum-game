import './AuctionPriceScale.css'

type AuctionPriceScaleProps = {
  minimum: number
  maximum: number
  positionForPrice: (price: number) => string
  ariaLabel: string
}

function AuctionPriceScale({
  minimum,
  maximum,
  positionForPrice,
  ariaLabel,
}: AuctionPriceScaleProps) {
  const prices = Array.from(
    { length: maximum - minimum + 1 },
    (_, index) => maximum - index,
  )

  return (
    <div className="auction-price-scale" aria-label={ariaLabel}>
      <strong className="auction-price-scale-title">
        Preis
      </strong>
      {prices.map((price) => (
        <span
          key={price}
          className="auction-price-tick"
          style={{ bottom: positionForPrice(price) }}
        >
          {price}
        </span>
      ))}
    </div>
  )
}

export default AuctionPriceScale
