import {
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  getWarehousePrices,
  marketResourceTypes,
  type MarketCounterparty,
  type MarketDirection,
  type MarketResource,
} from '../game'
import './MarketPanel.css'

type MarketRole = 'neutral' | 'buyer' | 'seller'
type MarketStage =
  | 'declaration'
  | 'auction'
  | 'finished'
  | 'skipped'

type MarketPanelProps = {
  roundPlayed: number
  resource: MarketResource
  resourceAmount: number
  credits: number
  referencePrice: number
  warehouseStock: number
  nextResource: MarketResource | null
  onTrade: (
    resource: MarketResource,
    direction: MarketDirection,
    price: number,
    counterparty: MarketCounterparty,
  ) => void
  onComplete: (resource: MarketResource) => void
}

const movementMilliseconds = 300
const orionTradeLimit = 4
const slowTradeMilliseconds = 1000
const mediumTradeMilliseconds = 650
const fastTradeMilliseconds = 350

function getMarketTiming(roundPlayed: number) {
  if (roundPlayed <= 3) {
    return {
      declarationSeconds: 8,
      auctionSeconds: 30,
    }
  }

  if (roundPlayed <= 7) {
    return {
      declarationSeconds: 6,
      auctionSeconds: 25,
    }
  }

  return {
    declarationSeconds: 5,
    auctionSeconds: 20,
  }
}

function clampPrice(
  price: number,
  minimumPrice: number,
  maximumPrice: number,
) {
  return Math.min(maximumPrice, Math.max(minimumPrice, price))
}

function pricePosition(
  price: number,
  minimumPrice: number,
  maximumPrice: number,
) {
  const relativePosition =
    ((price - minimumPrice) / (maximumPrice - minimumPrice)) *
    100

  return `${8 + relativePosition * 0.84}%`
}

function tradeDelay(elapsedMilliseconds: number) {
  if (elapsedMilliseconds >= 6000) {
    return fastTradeMilliseconds
  }

  if (elapsedMilliseconds >= 3000) {
    return mediumTradeMilliseconds
  }

  return slowTradeMilliseconds
}

function MarketPanel({
  roundPlayed,
  resource,
  resourceAmount,
  credits,
  referencePrice,
  warehouseStock,
  nextResource,
  onTrade,
  onComplete,
}: MarketPanelProps) {
  const { declarationSeconds, auctionSeconds } =
    getMarketTiming(roundPlayed)
  const resourceType = marketResourceTypes[resource]
  const warehousePrices = getWarehousePrices(
    resource,
    referencePrice,
  )
  const minimumPrice = warehousePrices.buyPrice
  const maximumPrice = warehousePrices.sellPrice
  const [stage, setStage] =
    useState<MarketStage>('declaration')
  const [role, setRole] = useState<MarketRole>('neutral')
  const [secondsLeft, setSecondsLeft] = useState(
    declarationSeconds,
  )
  const [playerPrice, setPlayerPrice] = useState(
    referencePrice,
  )
  const [orionPrice, setOrionPrice] = useState(
    referencePrice,
  )
  const [orionUnitsRemaining, setOrionUnitsRemaining] = useState(
    orionTradeLimit,
  )
  const [tradedUnits, setTradedUnits] = useState(0)
  const [lastTradePrice, setLastTradePrice] = useState<
    number | null
  >(null)
  const [lastTradePartner, setLastTradePartner] = useState<
    MarketCounterparty | null
  >(null)
  const nextPlayerMovementAt = useRef(0)

  useEffect(() => {
    if (stage !== 'declaration') {
      return
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((currentSeconds) => {
        if (currentSeconds > 1) {
          return currentSeconds - 1
        }

        if (role === 'neutral') {
          setStage('skipped')
          return 0
        }

        setPlayerPrice(
          role === 'seller' ? maximumPrice : minimumPrice,
        )
        setOrionPrice(
          role === 'seller' ? minimumPrice : maximumPrice,
        )
        setStage('auction')
        return auctionSeconds
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [
    auctionSeconds,
    maximumPrice,
    minimumPrice,
    role,
    stage,
  ])

  useEffect(() => {
    if (stage !== 'skipped') {
      return
    }

    const timer = window.setTimeout(
      () => onComplete(resource),
      800,
    )

    return () => window.clearTimeout(timer)
  }, [onComplete, resource, stage])

  useEffect(() => {
    if (stage !== 'auction') {
      return
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((currentSeconds) => {
        if (currentSeconds > 1) {
          return currentSeconds - 1
        }

        setStage('finished')
        return 0
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [stage])

  const orionActive = orionUnitsRemaining > 0
  const orionPriceLimit = clampPrice(
    role === 'seller' ? referencePrice + 1 : referencePrice - 1,
    minimumPrice,
    maximumPrice,
  )

  useEffect(() => {
    if (stage !== 'auction' || !orionActive) {
      return
    }

    const timer = window.setInterval(() => {
      setOrionPrice((currentPrice) =>
        role === 'seller'
          ? Math.min(
              playerPrice,
              orionPriceLimit,
              clampPrice(
                currentPrice + 1,
                minimumPrice,
                maximumPrice,
              ),
            )
          : Math.max(
              playerPrice,
              orionPriceLimit,
              clampPrice(
                currentPrice - 1,
                minimumPrice,
                maximumPrice,
              ),
            ),
      )
    }, movementMilliseconds)

    return () => window.clearInterval(timer)
  }, [
    maximumPrice,
    minimumPrice,
    orionActive,
    orionPriceLimit,
    playerPrice,
    role,
    stage,
  ])

  const orionLeadsBuyers =
    orionActive && orionPrice >= warehousePrices.buyPrice
  const orionLeadsSellers =
    orionActive &&
    (warehouseStock <= 0 ||
      orionPrice <= warehousePrices.sellPrice)
  const sellerPrice =
    role === 'seller'
      ? playerPrice
      : orionLeadsSellers
        ? orionPrice
        : warehousePrices.sellPrice
  const buyerPrice =
    role === 'buyer'
      ? playerPrice
      : orionLeadsBuyers
        ? orionPrice
        : warehousePrices.buyPrice
  const activeCounterparty: MarketCounterparty =
    role === 'seller'
      ? orionLeadsBuyers
        ? 'orion'
        : 'warehouse'
      : orionLeadsSellers
        ? 'orion'
        : 'warehouse'
  const tradePrice = sellerPrice
  const pricesMeet = buyerPrice === sellerPrice
  const canTrade =
    stage === 'auction' &&
    pricesMeet &&
    (role === 'seller'
      ? resourceAmount > 0
      : credits >= tradePrice) &&
    !(
      role === 'buyer' &&
      activeCounterparty === 'warehouse' &&
      warehouseStock <= 0
    )

  useEffect(() => {
    if (!canTrade) {
      return
    }

    const contactStartedAt = Date.now()
    let timer: number
    let cancelled = false

    const scheduleTrade = () => {
      const elapsedMilliseconds = Date.now() - contactStartedAt

      timer = window.setTimeout(() => {
        if (cancelled) {
          return
        }

        onTrade(
          resource,
          role === 'seller' ? 'sell' : 'buy',
          tradePrice,
          activeCounterparty,
        )
        if (activeCounterparty === 'orion') {
          setOrionUnitsRemaining((currentUnits) =>
            Math.max(0, currentUnits - 1),
          )
        }
        setTradedUnits((currentUnits) => currentUnits + 1)
        setLastTradePrice(tradePrice)
        setLastTradePartner(activeCounterparty)
        scheduleTrade()
      }, tradeDelay(elapsedMilliseconds))
    }

    scheduleTrade()

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [
    activeCounterparty,
    canTrade,
    onTrade,
    resource,
    role,
    tradePrice,
  ])

  const changePlayerPrice = (difference: number) => {
    const now = Date.now()

    if (now < nextPlayerMovementAt.current) {
      return
    }

    nextPlayerMovementAt.current = now + movementMilliseconds

    setPlayerPrice((currentPrice) => {
      const nextPrice = clampPrice(
        currentPrice + difference,
        minimumPrice,
        maximumPrice,
      )

      if (stage !== 'auction') {
        return nextPrice
      }

      return role === 'seller'
        ? Math.max(nextPrice, buyerPrice)
        : Math.min(nextPrice, sellerPrice)
    })
  }

  useEffect(() => {
    const moveWithKeyboard = (difference: number) => {
      const now = Date.now()

      if (now < nextPlayerMovementAt.current) {
        return
      }

      nextPlayerMovementAt.current = now + movementMilliseconds

      setPlayerPrice((currentPrice) => {
        const nextPrice = clampPrice(
          currentPrice + difference,
          minimumPrice,
          maximumPrice,
        )

        if (stage !== 'auction') {
          return nextPrice
        }

        return role === 'seller'
          ? Math.max(nextPrice, buyerPrice)
          : Math.min(nextPrice, sellerPrice)
      })
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (stage === 'declaration') {
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          setRole('seller')
        } else if (event.key === 'ArrowDown') {
          event.preventDefault()
          setRole('buyer')
        } else if (event.key === 'Escape') {
          setRole('neutral')
        }
        return
      }

      if (stage === 'auction') {
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          moveWithKeyboard(1)
        } else if (event.key === 'ArrowDown') {
          event.preventDefault()
          moveWithKeyboard(-1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    buyerPrice,
    maximumPrice,
    minimumPrice,
    role,
    sellerPrice,
    stage,
  ])

  const playerPosition =
    stage === 'declaration'
      ? role === 'seller'
        ? '85%'
        : role === 'buyer'
          ? '15%'
          : '50%'
      : pricePosition(playerPrice, minimumPrice, maximumPrice)
  const sellerName =
    role === 'seller'
      ? 'Du'
      : activeCounterparty === 'orion'
        ? 'Orion'
        : 'HQ-Lager'
  const buyerName =
    role === 'buyer'
      ? 'Du'
      : activeCounterparty === 'orion'
        ? 'Orion'
        : 'HQ-Lager'
  const timerMaximum =
    stage === 'declaration' ? declarationSeconds : auctionSeconds
  const timerProgress = Math.max(
    0,
    (secondsLeft / timerMaximum) * 100,
  )

  return (
    <section className="market-panel">
      <div className="market-heading">
        <div>
          <p className="eyebrow">
            Marktphase nach Runde {roundPlayed}
          </p>
          <h2>
            {resourceType.icon} {resourceType.auctionLabel}
          </h2>
        </div>

        <div className="market-timer" aria-live="polite">
          {secondsLeft}s
        </div>
      </div>

      <div className="market-time-track">
        <div className="market-time-label">
          <span>
            {stage === 'declaration'
              ? 'Restzeit Positionierung'
              : 'Restzeit Auktion'}
          </span>
          <strong>{secondsLeft} Sekunden</strong>
        </div>
        <div
          className="market-time-bar"
          role="progressbar"
          aria-label="Verbleibende Marktzeit"
          aria-valuemin={0}
          aria-valuemax={timerMaximum}
          aria-valuenow={secondsLeft}
        >
          <span style={{ width: `${timerProgress}%` }} />
        </div>
      </div>

      <div className="market-summary">
        <div>
          <span>Dein Vorrat</span>
          <strong
            key={`${resource}-${resourceAmount}`}
            className={`market-live-value ${
              tradedUnits > 0
                ? role === 'buyer'
                  ? 'market-value-up'
                  : 'market-value-down'
                : ''
            }`}
          >
            {resourceType.icon} {resourceAmount}
          </strong>
        </div>
        <div>
          <span>Deine Credits</span>
          <strong
            key={`credits-${credits}`}
            className={`market-live-value ${
              tradedUnits > 0
                ? role === 'seller'
                  ? 'market-value-up'
                  : 'market-value-down'
                : ''
            }`}
          >
            💰 {credits}
          </strong>
        </div>
      </div>

      <div className="market-context" aria-live="polite">
        <div>
          <span>HQ-Gesamtlager</span>
          <strong
            key={`warehouse-${warehouseStock}`}
            className={`market-live-value ${
              tradedUnits > 0 &&
              lastTradePartner === 'warehouse'
                ? role === 'seller'
                  ? 'market-value-up'
                  : 'market-value-down'
                : ''
            }`}
          >
            {resourceType.icon} {warehouseStock}
          </strong>
        </div>

        <div>
          <span>Handelsverlauf</span>
          {tradedUnits === 0 ? (
            <strong>Noch kein Handel abgeschlossen</strong>
          ) : (
            <>
              <strong
                key={`trades-${tradedUnits}`}
                className="market-live-value market-value-up"
              >
                {tradedUnits}{' '}
                {tradedUnits === 1 ? 'Einheit' : 'Einheiten'}
              </strong>
              <small>
                Zuletzt für {lastTradePrice} Credits mit{' '}
                {lastTradePartner === 'warehouse'
                  ? 'dem HQ-Lager'
                  : 'Orion'}
              </small>
            </>
          )}
        </div>
      </div>

      <div className="market-content">
        <div className="market-arena">
          <span className="market-zone sell-zone">
            HQ VERKAUFT · {warehousePrices.sellPrice} Credits
          </span>
          {stage === 'declaration' && (
            <span className="market-zone hold-zone">
              NICHT TEILNEHMEN
            </span>
          )}
          <span className="market-zone buy-zone">
            HQ KAUFT · {warehousePrices.buyPrice} Credits
          </span>

          {stage === 'auction' && (
            <>
              <div
                className={`market-price-line seller-price-line ${
                  pricesMeet ? 'prices-touch' : ''
                }`}
                style={{
                  bottom: pricePosition(
                    sellerPrice,
                    minimumPrice,
                    maximumPrice,
                  ),
                }}
              >
                <span>
                  Verkauf · {sellerName} · {sellerPrice}
                </span>
              </div>
              <div
                className={`market-price-line buyer-price-line ${
                  pricesMeet ? 'prices-touch' : ''
                }`}
                style={{
                  bottom: pricePosition(
                    buyerPrice,
                    minimumPrice,
                    maximumPrice,
                  ),
                }}
              >
                <span>
                  Kauf · {buyerName} · {buyerPrice}
                </span>
              </div>
            </>
          )}

          <div
            className="market-avatar player-avatar"
            style={{ bottom: playerPosition }}
          >
            <span>🧑‍🚀</span>
            <strong>Du</strong>
            {stage === 'auction' && <b>{playerPrice}</b>}
          </div>

          {stage === 'auction' && orionActive && (
            <div
              className="market-avatar orion-avatar"
              style={{
                bottom: pricePosition(
                  orionPrice,
                  minimumPrice,
                  maximumPrice,
                ),
              }}
            >
              <span>🤖</span>
              <strong>Orion</strong>
              <b>{orionPrice}</b>
            </div>
          )}

          {canTrade && (
            <div
              className="trade-indicator"
              style={{
                bottom: pricePosition(
                  tradePrice,
                  minimumPrice,
                  maximumPrice,
                ),
              }}
            >
              1 Einheit ·{' '}
              {activeCounterparty === 'warehouse'
                ? 'HQ-Lager'
                : 'Orion'}{' '}
              · {tradePrice} Credits
            </div>
          )}
        </div>

        <aside className="market-controls">
          {stage === 'declaration' && (
            <>
              <p className="eyebrow">Positionierungsphase</p>
              <h3>Wie möchtest du teilnehmen?</h3>
              <p>
                Entscheide dich vor Ablauf der Zeit. Du kannst die
                Position bis dahin jederzeit wechseln.
              </p>

              <button
                className={role === 'seller' ? 'active' : ''}
                type="button"
                onClick={() => setRole('seller')}
              >
                ↑ Als Verkäufer starten
              </button>
              <button
                className={role === 'neutral' ? 'active' : ''}
                type="button"
                onClick={() => setRole('neutral')}
              >
                Nicht teilnehmen
              </button>
              <button
                className={role === 'buyer' ? 'active' : ''}
                type="button"
                onClick={() => setRole('buyer')}
              >
                ↓ Als Käufer starten
              </button>

              <p className="market-key-hint">
                Tastatur: ↑ verkaufen · ↓ kaufen · Esc aussetzen
              </p>
            </>
          )}

          {stage === 'auction' && (
            <>
              <p className="eyebrow">Auktion läuft</p>
              <h3>
                Du bist {role === 'seller' ? 'Verkäufer' : 'Käufer'}
              </h3>
              <p>
                {role === 'seller'
                  ? 'Bewege dich nach unten, um deinen Verkaufspreis zu senken.'
                  : 'Bewege dich nach oben, um dein Kaufgebot zu erhöhen.'}
              </p>

              <button
                type="button"
                onClick={() => changePlayerPrice(1)}
              >
                ↑ Preis erhöhen
              </button>
              <button
                type="button"
                onClick={() => changePlayerPrice(-1)}
              >
                ↓ Preis senken
              </button>

              <p className="market-key-hint">
                Pro Transaktion wird genau eine Einheit übertragen.
                Du und Orion bewegen euch höchstens einen
                Preisschritt je 0,3 Sekunden.
              </p>

              <p className="market-key-hint">
                {orionActive
                  ? `Orions Preisgrenze: ${orionPriceLimit} Credits · gewünschte Restmenge: ${orionUnitsRemaining}`
                  : 'Orion hat seine gewünschte Menge gehandelt. Jetzt bleibt das HQ-Lager als Handelspartner.'}
              </p>
            </>
          )}

          {stage === 'finished' && (
            <>
              <p className="eyebrow">Auktion beendet</p>
              <h3>
                {role === 'neutral'
                  ? 'Nicht teilgenommen'
                  : `${tradedUnits} Einheiten gehandelt`}
              </h3>
              <p>
                Die Marktwerte wurden sofort in deinen Vorräten
                und Credits verbucht. Käufe und Verkäufe mit dem
                HQ-Lager verändern den Orientierungspreis der
                nächsten Runde.
              </p>

              <button
                className="complete-market-button"
                type="button"
                onClick={() => onComplete(resource)}
              >
                {nextResource
                  ? `Weiter zur ${
                      marketResourceTypes[nextResource]
                        .auctionLabel
                    }`
                  : 'Weiter zur nächsten Runde'}
              </button>
            </>
          )}

          {stage === 'skipped' && (
            <>
              <p className="eyebrow">Markt übersprungen</p>
              <h3>Keine Teilnahme</h3>
              <p>
                Da niemand teilnehmen möchte, findet keine{' '}
                {resourceType.auctionLabel} statt. Es geht
                automatisch weiter.
              </p>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}

export default MarketPanel
