import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  getOrionMarketRole,
  getMarketTiming,
  getWarehousePrices,
  marketResourceTypes,
  moveMarketOffer,
  type MarketCounterparty,
  type MarketDirection,
  type MarketResource,
  type MarketRole,
} from '../game'
import './MarketPanel.css'

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
const orionDecisionMilliseconds = 1200
const orionTradeLimit = 4
const slowTradeMilliseconds = 1000
const mediumTradeMilliseconds = 650
const fastTradeMilliseconds = 350

const marketRoleLabels: Record<MarketRole, string> = {
  neutral: 'setzt aus',
  buyer: 'kauft',
  seller: 'verkauft',
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

  return `${22 + relativePosition * 0.56}%`
}

function declarationPosition(
  participantRole: MarketRole | 'pending',
) {
  if (participantRole === 'seller') {
    return '96%'
  }

  if (participantRole === 'buyer') {
    return '4%'
  }

  return '50%'
}

function auctionAvatarPosition(
  price: number,
  minimumPrice: number,
  maximumPrice: number,
  participantRole: 'buyer' | 'seller',
) {
  const linePosition = pricePosition(
    price,
    minimumPrice,
    maximumPrice,
  )

  return participantRole === 'seller'
    ? `calc(${linePosition} + 28px)`
    : `calc(${linePosition} - 28px)`
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
  const [orionRole, setOrionRole] = useState<
    MarketRole | 'pending'
  >('pending')
  const [secondsLeft, setSecondsLeft] = useState(
    declarationSeconds,
  )
  const [playerPrice, setPlayerPrice] = useState(
    referencePrice,
  )
  const [playerOfferActive, setPlayerOfferActive] =
    useState(false)
  const [orionPrice, setOrionPrice] = useState(
    referencePrice,
  )
  const [orionUnitsRemaining, setOrionUnitsRemaining] = useState(
    orionTradeLimit,
  )
  const [orionResourceAmount, setOrionResourceAmount] = useState(
    orionTradeLimit,
  )
  const [orionParked, setOrionParked] = useState(false)
  const [tradedUnits, setTradedUnits] = useState(0)
  const [lastTradePrice, setLastTradePrice] = useState<
    number | null
  >(null)
  const [lastTradePartner, setLastTradePartner] = useState<
    MarketCounterparty | null
  >(null)
  const nextPlayerMovementAt = useRef(0)

  const chooseRole = useCallback((nextRole: MarketRole) => {
    setRole(nextRole)
    setOrionRole('pending')
    setPlayerOfferActive(false)
    setOrionParked(false)
  }, [])

  useEffect(() => {
    if (stage !== 'declaration') {
      return
    }

    const timer = window.setTimeout(() => {
      setOrionRole(
        getOrionMarketRole(roundPlayed, resource, role),
      )
    }, orionDecisionMilliseconds)

    return () => window.clearTimeout(timer)
  }, [resource, role, roundPlayed, stage])

  useEffect(() => {
    if (stage !== 'declaration') {
      return
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((currentSeconds) => {
        if (currentSeconds > 1) {
          return currentSeconds - 1
        }

        const finalOrionRole = getOrionMarketRole(
          roundPlayed,
          resource,
          role,
        )
        setOrionRole(finalOrionRole)

        if (role === 'neutral') {
          setStage('skipped')
          return 0
        }

        setPlayerPrice(
          role === 'seller' ? maximumPrice : minimumPrice,
        )
        setPlayerOfferActive(false)
        setOrionPrice(
          role === 'seller' ? minimumPrice : maximumPrice,
        )
        setOrionResourceAmount(orionTradeLimit)
        setOrionParked(false)
        setStage('auction')
        return auctionSeconds
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [
    auctionSeconds,
    maximumPrice,
    minimumPrice,
    resource,
    role,
    roundPlayed,
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

  const orionParticipates =
    orionRole !== 'pending' && orionRole !== 'neutral'
  const orionActive =
    orionParticipates && orionUnitsRemaining > 0
  const orionRetreating =
    orionParticipates && !orionActive && !orionParked
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

  useEffect(() => {
    if (stage !== 'auction' || !orionRetreating) {
      return
    }

    const exitPrice =
      orionRole === 'seller' ? maximumPrice : minimumPrice
    const timer = window.setTimeout(() => {
      if (orionPrice === exitPrice) {
        setOrionParked(true)
        return
      }

      setOrionPrice((currentPrice) =>
        clampPrice(
          currentPrice + (orionRole === 'seller' ? 1 : -1),
          minimumPrice,
          maximumPrice,
        ),
      )
    }, movementMilliseconds)

    return () => window.clearTimeout(timer)
  }, [
    maximumPrice,
    minimumPrice,
    orionPrice,
    orionRetreating,
    orionRole,
    stage,
  ])

  const orionGuidesPriceLine = orionActive || orionRetreating
  const orionLeadsBuyers =
    orionGuidesPriceLine &&
    orionPrice >= warehousePrices.buyPrice
  const orionLeadsSellers =
    orionGuidesPriceLine &&
    (warehouseStock <= 0 ||
      orionPrice <= warehousePrices.sellPrice)
  const sellerPrice =
    role === 'seller'
      ? playerOfferActive
        ? playerPrice
        : warehousePrices.sellPrice
      : orionLeadsSellers
        ? orionPrice
        : warehousePrices.sellPrice
  const buyerPrice =
    role === 'buyer'
      ? playerOfferActive
        ? playerPrice
        : warehousePrices.buyPrice
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
    playerOfferActive &&
    pricesMeet &&
    (activeCounterparty !== 'orion' || orionActive) &&
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
          setOrionResourceAmount((currentUnits) =>
            Math.max(
              0,
              currentUnits +
                (orionRole === 'buyer' ? 1 : -1),
            ),
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
    orionRole,
    resource,
    role,
    tradePrice,
  ])

  const movePlayerOffer = useCallback((difference: number) => {
    if (stage !== 'auction' || role === 'neutral') {
      return
    }

    const now = Date.now()

    if (now < nextPlayerMovementAt.current) {
      return
    }

    nextPlayerMovementAt.current = now + movementMilliseconds

    const nextOffer = moveMarketOffer(
      role,
      {
        active: playerOfferActive,
        price: playerPrice,
      },
      difference,
      minimumPrice,
      maximumPrice,
      role === 'seller' ? buyerPrice : sellerPrice,
    )

    setPlayerOfferActive(nextOffer.active)
    setPlayerPrice(nextOffer.price)
  }, [
    buyerPrice,
    maximumPrice,
    minimumPrice,
    playerOfferActive,
    playerPrice,
    role,
    sellerPrice,
    stage,
  ])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (stage === 'declaration') {
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          chooseRole('seller')
        } else if (event.key === 'ArrowDown') {
          event.preventDefault()
          chooseRole('buyer')
        } else if (event.key === 'Escape') {
          chooseRole('neutral')
        }
        return
      }

      if (stage === 'auction') {
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          movePlayerOffer(1)
        } else if (event.key === 'ArrowDown') {
          event.preventDefault()
          movePlayerOffer(-1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    chooseRole,
    movePlayerOffer,
    stage,
  ])

  const playerPosition =
    stage === 'declaration'
      ? declarationPosition(role)
      : !playerOfferActive
        ? declarationPosition(role)
      : auctionAvatarPosition(
          playerPrice,
          minimumPrice,
          maximumPrice,
          role === 'seller' ? 'seller' : 'buyer',
        )
  const orionPosition =
    stage === 'declaration'
      ? declarationPosition(orionRole)
      : orionParked
        ? declarationPosition(orionRole)
        : auctionAvatarPosition(
            orionPrice,
            minimumPrice,
            maximumPrice,
            orionRole === 'seller' ? 'seller' : 'buyer',
          )
  const previewParticipants: Array<{
    name: string
    icon: string
    className: string
    role: MarketRole | 'pending'
  }> = [
    {
      name: 'Nova',
      icon: '👩‍🚀',
      className: 'nova-avatar',
      role:
        orionRole === 'pending'
          ? 'pending'
          : role,
    },
    {
      name: 'Vega',
      icon: '🧑‍🚀',
      className: 'vega-avatar',
      role:
        orionRole === 'pending' || role === 'neutral'
          ? orionRole === 'pending'
            ? 'pending'
            : 'neutral'
          : role === 'seller'
            ? 'buyer'
            : 'seller',
    },
  ]
  const sellerName =
    role === 'seller'
      ? playerOfferActive
        ? 'Du'
        : 'HQ-Lager'
      : orionLeadsSellers
        ? 'Orion'
        : 'HQ-Lager'
  const buyerName =
    role === 'buyer'
      ? playerOfferActive
        ? 'Du'
        : 'HQ-Lager'
      : orionLeadsBuyers
        ? 'Orion'
        : 'HQ-Lager'
  const displayedSellerPrice =
    stage === 'declaration'
      ? warehousePrices.sellPrice
      : sellerPrice
  const displayedBuyerPrice =
    stage === 'declaration'
      ? warehousePrices.buyPrice
      : buyerPrice
  const displayedSellerName =
    stage === 'declaration' ? 'HQ-Lager' : sellerName
  const displayedBuyerName =
    stage === 'declaration' ? 'HQ-Lager' : buyerName
  const priceScale = Array.from(
    { length: maximumPrice - minimumPrice + 1 },
    (_, index) => maximumPrice - index,
  )
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
            Marktphase vor Abrechnung Runde {roundPlayed}
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
          <strong
            key={`trades-${tradedUnits}`}
            className={
              tradedUnits > 0
                ? 'market-live-value market-value-up'
                : ''
            }
          >
            {tradedUnits === 0
              ? 'Noch kein Handel abgeschlossen'
              : `${tradedUnits} ${
                  tradedUnits === 1 ? 'Einheit' : 'Einheiten'
                }`}
          </strong>
          <small
            className={
              tradedUnits === 0
                ? 'market-context-placeholder'
                : ''
            }
          >
            {tradedUnits === 0
              ? '\u00a0'
              : `Zuletzt für ${lastTradePrice} Credits mit ${
                  lastTradePartner === 'warehouse'
                    ? 'dem HQ-Lager'
                    : 'Orion'
                }`}
          </small>
        </div>
      </div>

      <div
        className={`market-content market-content-${stage}`}
      >
        <div className="market-arena">
          <div
            className="market-price-scale"
            aria-label={`Preisskala von ${minimumPrice} bis ${maximumPrice} Credits`}
          >
            <strong className="market-price-scale-title">
              Preis
            </strong>
            {priceScale.map((price) => (
              <span
                key={price}
                className="market-price-tick"
                style={{
                  bottom: pricePosition(
                    price,
                    minimumPrice,
                    maximumPrice,
                  ),
                }}
              >
                {price}
              </span>
            ))}
          </div>

          <div className="market-warehouse-gate warehouse-sell-gate">
            <span>📦 HQ-LAGER</span>
            <strong>KAUF VOM LAGER</strong>
            <b>{warehousePrices.sellPrice} Credits</b>
          </div>
          {stage === 'declaration' && (
            <span className="market-zone hold-zone">
              NICHT TEILNEHMEN
            </span>
          )}
          <div className="market-warehouse-gate warehouse-buy-gate">
            <span>📦 HQ-LAGER</span>
            <strong>VERKAUF AN LAGER</strong>
            <b>{warehousePrices.buyPrice} Credits</b>
          </div>

          {(stage === 'declaration' || stage === 'auction') && (
            <>
              <div
                className={`market-price-line seller-price-line ${
                  stage === 'auction' && canTrade
                    ? 'prices-touch'
                    : ''
                }`}
                aria-label={`Niedrigster Verkaufspreis: ${displayedSellerName}, ${displayedSellerPrice} Credits`}
                style={{
                  bottom: pricePosition(
                    displayedSellerPrice,
                    minimumPrice,
                    maximumPrice,
                  ),
                }}
              />
              <div
                className={`market-price-line buyer-price-line ${
                  stage === 'auction' && canTrade
                    ? 'prices-touch'
                    : ''
                }`}
                aria-label={`Höchstes Kaufgebot: ${displayedBuyerName}, ${displayedBuyerPrice} Credits`}
                style={{
                  bottom: pricePosition(
                    displayedBuyerPrice,
                    minimumPrice,
                    maximumPrice,
                  ),
                }}
              />
            </>
          )}

          {(stage === 'declaration' || stage === 'auction') && (
            <div
              className={`market-avatar player-avatar ${
                stage === 'declaration'
                  ? 'market-declaration-avatar'
                  : ''
              }`}
              style={{ bottom: playerPosition }}
            >
              <span>🧑‍🚀</span>
              <strong>Du</strong>
              {stage === 'declaration' ? (
                <b>{marketRoleLabels[role]}</b>
              ) : (
                <b
                  key={`player-units-${resourceAmount}`}
                  className={`market-avatar-quantity ${
                    tradedUnits > 0
                      ? role === 'buyer'
                        ? 'market-value-up'
                        : 'market-value-down'
                      : ''
                  }`}
                >
                  {resourceType.icon} {resourceAmount}
                </b>
              )}
            </div>
          )}

          {(stage === 'declaration' ||
            (stage === 'auction' && orionParticipates)) && (
            <div
              className={`market-avatar orion-avatar ${
                stage === 'declaration'
                  ? 'market-declaration-avatar'
                  : orionRetreating
                    ? 'market-avatar-retreating'
                    : orionParked
                      ? 'market-avatar-finished'
                      : ''
              }`}
              style={{ bottom: orionPosition }}
              aria-live="polite"
            >
              <span>🤖</span>
              <strong>Orion</strong>
              {stage === 'declaration' ? (
                <b>
                  {orionRole === 'pending'
                    ? 'entscheidet …'
                    : marketRoleLabels[orionRole]}
                </b>
              ) : (
                <b
                  key={`orion-units-${orionResourceAmount}`}
                  className={`market-avatar-quantity ${
                    tradedUnits > 0 &&
                    lastTradePartner === 'orion'
                      ? orionRole === 'buyer'
                        ? 'market-value-up'
                        : 'market-value-down'
                      : ''
                  }`}
                >
                  {resourceType.icon} {orionResourceAmount}
                </b>
              )}
            </div>
          )}

          {previewParticipants.map((participant) => {
            if (
              stage !== 'declaration' &&
              (stage !== 'auction' ||
                participant.role === 'neutral' ||
                participant.role === 'pending')
            ) {
              return null
            }

            const participantPosition =
              stage === 'declaration'
                ? declarationPosition(participant.role)
                : auctionAvatarPosition(
                    participant.role === 'seller'
                      ? maximumPrice - 1
                      : minimumPrice + 1,
                    minimumPrice,
                    maximumPrice,
                    participant.role === 'seller'
                      ? 'seller'
                      : 'buyer',
                  )

            return (
              <div
                key={participant.name}
                className={`market-avatar market-preview-avatar ${participant.className} ${
                  stage === 'declaration'
                    ? 'market-declaration-avatar'
                    : ''
                }`}
                style={{ bottom: participantPosition }}
              >
                <span>{participant.icon}</span>
                <strong>{participant.name}</strong>
                <b>
                  {stage === 'declaration'
                    ? participant.role === 'pending'
                      ? 'entscheidet …'
                      : marketRoleLabels[participant.role]
                    : 'wartet'}
                </b>
              </div>
            )
          })}

        </div>

        <aside
          className={`market-controls market-controls-${stage}`}
        >
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
                onClick={() => chooseRole('seller')}
              >
                ↑ Als Verkäufer starten
              </button>
              <button
                className={role === 'neutral' ? 'active' : ''}
                type="button"
                onClick={() => chooseRole('neutral')}
              >
                Nicht teilnehmen
              </button>
              <button
                className={role === 'buyer' ? 'active' : ''}
                type="button"
                onClick={() => chooseRole('buyer')}
              >
                ↓ Als Käufer starten
              </button>

              <p className="market-key-hint">
                Tastatur: ↑ verkaufen · ↓ kaufen · Esc aussetzen
              </p>
              <p className="market-key-hint market-layout-hint">
                Nova und Vega sind vorerst sichtbare Testspieler
                für das Vierer-Layout.
              </p>
            </>
          )}

          {stage === 'auction' && (
            <div
              className="market-control-buttons"
              aria-label="Marktsteuerung"
            >
                <button
                  type="button"
                  onClick={() => movePlayerOffer(1)}
                  aria-label={
                    role === 'buyer' && !playerOfferActive
                      ? 'Markt betreten'
                      : 'Preis erhöhen'
                  }
                >
                  <span aria-hidden="true">
                    ↑{' '}
                    {role === 'buyer' && !playerOfferActive
                      ? 'Markt'
                      : 'Preis'}
                  </span>
                  <span aria-hidden="true">
                    {role === 'buyer' && !playerOfferActive
                      ? 'betreten'
                      : 'erhöhen'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => movePlayerOffer(-1)}
                  aria-label={
                    role === 'seller' && !playerOfferActive
                      ? 'Markt betreten'
                      : 'Preis senken'
                  }
                >
                  <span aria-hidden="true">
                    ↓{' '}
                    {role === 'seller' && !playerOfferActive
                      ? 'Markt'
                      : 'Preis'}
                  </span>
                  <span aria-hidden="true">
                    {role === 'seller' && !playerOfferActive
                      ? 'betreten'
                      : 'senken'}
                  </span>
                </button>
            </div>
          )}

          {stage === 'auction' && canTrade && (
            <div className="trade-indicator" aria-live="polite">
              1 Einheit ·{' '}
              {activeCounterparty === 'warehouse'
                ? 'HQ-Lager'
                : 'Orion'}{' '}
              · {tradePrice} Credits
            </div>
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
                  : 'Weiter zur Rangliste'}
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
