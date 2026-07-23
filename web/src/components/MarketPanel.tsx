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
import AuctionPriceScale from './AuctionPriceScale'
import AuctionTimer from './AuctionTimer'
import './MarketPanel.css'

type MarketStage =
  | 'introduction'
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
  rivalResourceAmounts: {
    orion: number
    nova: number
    vega: number
  }
  nextResource: MarketResource | null
  invitationSeconds?: number
  completionLabel?: string
  initiatorName?: string
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
  rivalResourceAmounts,
  nextResource,
  invitationSeconds,
  completionLabel,
  initiatorName,
  onTrade,
  onComplete,
}: MarketPanelProps) {
  const marketTiming = getMarketTiming(roundPlayed)
  const introductionSeconds =
    marketTiming.introductionSeconds
  const declarationSeconds =
    invitationSeconds ?? marketTiming.declarationSeconds
  const auctionSeconds = marketTiming.auctionSeconds
  const resourceType = marketResourceTypes[resource]
  const warehousePrices = getWarehousePrices(
    resource,
    referencePrice,
  )
  const minimumPrice = warehousePrices.buyPrice
  const maximumPrice = warehousePrices.sellPrice
  const [stage, setStage] =
    useState<MarketStage>('introduction')
  const [role, setRole] = useState<MarketRole>('neutral')
  const [orionRole, setOrionRole] = useState<
    MarketRole | 'pending'
  >('pending')
  const [secondsLeft, setSecondsLeft] = useState(
    introductionSeconds,
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
    if (stage !== 'introduction') {
      return
    }

    const timer = window.setTimeout(
      () => {
        if (secondsLeft > 0) {
          setSecondsLeft(secondsLeft - 1)
          return
        }

        setStage('declaration')
        setSecondsLeft(declarationSeconds)
      },
      secondsLeft === 0 ? 300 : 1000,
    )

    return () => window.clearTimeout(timer)
  }, [declarationSeconds, secondsLeft, stage])

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
  const buyerShortfall =
    stage === 'auction' && role === 'buyer'
      ? Math.max(0, sellerPrice - credits)
      : 0
  const buyerCannotEnterMarket =
    role === 'buyer' && credits < minimumPrice
  const buyerReachedCreditLimit =
    role === 'buyer' &&
    playerOfferActive &&
    playerPrice >= credits
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
        if (role === 'buyer') {
          const creditsAfterTrade = credits - tradePrice

          if (creditsAfterTrade < minimumPrice) {
            setPlayerOfferActive(false)
            setPlayerPrice(minimumPrice)
          } else if (playerPrice > creditsAfterTrade) {
            setPlayerPrice(creditsAfterTrade)
          }
        }
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
    credits,
    minimumPrice,
    onTrade,
    orionRole,
    playerPrice,
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
      credits,
    )

    setPlayerOfferActive(nextOffer.active)
    setPlayerPrice(nextOffer.price)
  }, [
    buyerPrice,
    credits,
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
  const timerMaximum =
    stage === 'introduction'
      ? introductionSeconds
      : stage === 'declaration'
        ? declarationSeconds
        : auctionSeconds
  const introductionParticipants = [
    {
      name: 'Du',
      icon: '🧑‍🚀',
      amount: resourceAmount,
    },
    {
      name: 'Orion',
      icon: '🤖',
      amount: rivalResourceAmounts.orion,
    },
    {
      name: 'Nova',
      icon: '👩‍🚀',
      amount: rivalResourceAmounts.nova,
    },
    {
      name: 'Vega',
      icon: '🧑‍🚀',
      amount: rivalResourceAmounts.vega,
    },
  ]

  return (
    <section className="market-panel">
      <div className="market-heading">
        <div>
          <p className="eyebrow">
            {stage === 'introduction'
              ? 'Auktion angekündigt'
              : stage === 'declaration' && initiatorName
              ? `Auktionseinladung von ${initiatorName}`
              : `Marktphase in Runde ${roundPlayed}`}
          </p>
          <h2>
            {resourceType.icon} {resourceType.auctionLabel}
          </h2>
        </div>

        <AuctionTimer
          secondsLeft={secondsLeft}
          totalSeconds={timerMaximum}
          label={
            stage === 'introduction'
              ? 'Start der Rollenwahl'
              : stage === 'declaration'
              ? 'Restzeit Rollenwahl'
              : 'Restzeit Auktion'
          }
          ariaLabel="Verbleibende Marktzeit"
        />
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
          <AuctionPriceScale
            minimum={minimumPrice}
            maximum={maximumPrice}
            positionForPrice={(price) =>
              pricePosition(
                price,
                minimumPrice,
                maximumPrice,
              )
            }
            ariaLabel={`Preisskala von ${minimumPrice} bis ${maximumPrice} Credits`}
          />

          {stage === 'introduction' && (
            <div
              className="market-introduction"
              role="status"
              aria-live="polite"
            >
              <p className="eyebrow">Ressourcenauktion</p>
              <h3>
                {resourceType.icon} {resourceType.auctionLabel}
              </h3>
              <p>
                {initiatorName ?? 'Ein Spieler'} hat die Auktion
                gestartet.
              </p>

              <div className="market-introduction-roster">
                {introductionParticipants.map((participant) => (
                  <div key={participant.name}>
                    <span>{participant.icon}</span>
                    <strong>{participant.name}</strong>
                    <b>
                      {resourceType.icon} {participant.amount}
                    </b>
                  </div>
                ))}
              </div>

              <strong className="market-introduction-countdown">
                Beginn in {secondsLeft}
              </strong>
              <small>
                Bereitmachen: Gleich Käufer, Verkäufer oder nicht
                teilnehmen wählen.
              </small>
            </div>
          )}

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
          {stage === 'introduction' && (
            <div className="market-introduction-ready">
              <p className="eyebrow">Bereitmachen</p>
              <strong>{secondsLeft}</strong>
              <small>
                Danach hast du fünf Sekunden für deine Rollenwahl.
              </small>
            </div>
          )}

          {stage === 'declaration' && (
            <>
              <p className="eyebrow">Positionierungsphase</p>
              <h3>Wie möchtest du teilnehmen?</h3>
              <p>
                {initiatorName
                  ? `${initiatorName} hat diese Auktion gestartet. `
                  : ''}
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
                  disabled={
                    buyerCannotEnterMarket ||
                    buyerReachedCreditLimit
                  }
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

          {stage === 'auction' && buyerShortfall > 0 && (
            <div
              className="market-affordability-warning"
              aria-live="polite"
            >
              <strong>Nicht genügend Credits</strong>
              <span>
                Günstigstes Angebot: {sellerPrice} · Dir fehlen{' '}
                {buyerShortfall}
              </span>
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
                {completionLabel ?? (nextResource
                  ? `Weiter zur ${
                      marketResourceTypes[nextResource]
                        .auctionLabel
                    }`
                  : 'Weiter zur Rangliste')}
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
