import { useEffect, useMemo, useState } from 'react'
import headquartersImage from '../assets/hq-four-colonies.webp'
import {
  calculateColonySupplyPreview,
  createParticipantLeaderboardEntries,
  getColonyLocalEvent,
  getHarvesterCreditCost,
  getWarehousePrices,
  isColonyHarvesterBuildBlocked,
  isColonyHarvesterRelocationBlocked,
  isColonyHarvesterRetoolingBlocked,
  isColonyLandBidBlocked,
  isColonyMarketInitiationBlocked,
  isGameFinished,
  selectColonyHarvesterAssignments,
  selectOtherColonyTileIds,
  type MarketResource,
  type ProductionType,
} from '../game'
import type { GameCommandAction } from '../gameCommands'
import { useI18n } from '../i18n/I18nContext'
import {
  participantIds,
  type ParticipantId,
} from '../match'
import type {
  MultiplayerClientMessage,
} from '../multiplayerProtocol'
import type { AuthoritativeMatchSnapshot } from '../authoritativeMatch'
import { getInterstellarCrystalBuyerOffer } from '../interstellarCrystalBuyer'
import { getDefaultMultiplayerMarketOfferPrice } from '../multiplayerMarket'
import HexMap from './HexMap'
import LocalEventNotice from './LocalEventNotice'
import MultiplayerLeaderboard from './MultiplayerLeaderboard'
import RoundBriefingPanel from './RoundBriefingPanel'
import './MultiplayerGameScreen.css'

type MultiplayerGameScreenProps = {
  participantId: ParticipantId
  snapshot: AuthoritativeMatchSnapshot
  error: string | null
  isHost: boolean
  sendMessage: (message: MultiplayerClientMessage) => void
  onRestart: () => void
  onLeave: () => void
}

type PlanningView = 'colony' | 'headquarters'

const supplyLabelKeys = [
  'supply.none',
  'supply.minimum',
  'supply.normal',
  'supply.extra',
] as const

let commandSequence = 0

function createCommandId() {
  commandSequence += 1
  return `network-${Date.now()}-${commandSequence}`
}

function formatRoundTime(milliseconds: number) {
  const totalSeconds = Math.max(
    0,
    Math.ceil(milliseconds / 1000),
  )
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function MultiplayerGameScreen({
  participantId,
  snapshot,
  error,
  isHost,
  sendMessage,
  onRestart,
  onLeave,
}: MultiplayerGameScreenProps) {
  const { number, t } = useI18n()
  const { state } = snapshot
  const colony = state.colonies[participantId]
  const [planningView, setPlanningView] =
    useState<PlanningView>('colony')
  const [foodSupplyLevel, setFoodSupplyLevel] = useState(2)
  const [energySupplyLevel, setEnergySupplyLevel] = useState(2)
  const [dismissedReportRound, setDismissedReportRound] =
    useState<number | null>(null)
  const [
    dismissedLeaderboardRound,
    setDismissedLeaderboardRound,
  ] = useState<number | null>(null)
  const [focusedTileId, setFocusedTileId] = useState<
    string | null
  >(null)
  const [
    dismissedLocalEventKey,
    setDismissedLocalEventKey,
  ] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(() =>
    Date.now(),
  )
  const [marketOfferDraft, setMarketOfferDraft] = useState<{
    resource: MarketResource
    price: number
  } | null>(null)
  const harvesters = useMemo(
    () =>
      selectColonyHarvesterAssignments(state, participantId),
    [participantId, state],
  )
  const opponentTileIds = useMemo(
    () => selectOtherColonyTileIds(state, participantId),
    [participantId, state],
  )
  const leaderboardEntries = useMemo(
    () =>
      createParticipantLeaderboardEntries(
        state,
        participantId,
      ),
    [participantId, state],
  )
  const currentPlacement =
    leaderboardEntries.findIndex((entry) => entry.isPlayer) + 1
  const ready =
    snapshot.roundReadiness.readyParticipantIds.includes(
      participantId,
    )
  const runningRoundDeadline =
    snapshot.roundTiming?.status === 'running'
      ? snapshot.roundTiming.deadlineAt
      : null

  useEffect(() => {
    if (runningRoundDeadline === null) {
      return
    }

    const refresh = () => {
      setCurrentTime(Date.now())
    }
    const initialRefresh = globalThis.setTimeout(refresh, 0)
    const interval = globalThis.setInterval(refresh, 1000)

    return () => {
      globalThis.clearTimeout(initialRefresh)
      globalThis.clearInterval(interval)
    }
  }, [runningRoundDeadline])

  const roundTimeRemaining =
    snapshot.roundTiming?.status === 'running'
      ? Math.max(0, snapshot.roundTiming.deadlineAt - currentTime)
      : snapshot.roundTiming?.remainingMilliseconds ?? null
  const roundTimeSeconds =
    roundTimeRemaining === null
      ? null
      : Math.ceil(roundTimeRemaining / 1000)
  const roundTimerStatus =
    roundTimeRemaining === null ? null : (
      <small
        className={`network-round-timer ${
          snapshot.roundTiming?.status === 'paused'
            ? 'is-paused'
            : roundTimeSeconds !== null &&
                roundTimeSeconds <= 15
              ? 'is-urgent'
              : roundTimeSeconds !== null &&
                  roundTimeSeconds <= 60
                ? 'is-warning'
                : ''
        }`}
        role="status"
      >
        {t(
          snapshot.roundTiming?.status === 'paused'
            ? 'multiplayerGame.roundTimePaused'
            : 'multiplayerGame.roundTime',
          { time: formatRoundTime(roundTimeRemaining) },
        )}
      </small>
    )
  const activeMarket = state.activeResourceMarket
  const localEvent = getColonyLocalEvent(state, participantId)
  const localEventKey = localEvent
    ? `${state.round}:${localEvent}`
    : null
  const lastRoundReport = snapshot.lastRoundReport
  const marketState = activeMarket
    ? state.market[activeMarket.resource]
    : null
  const marketPrices =
    activeMarket && marketState
      ? getWarehousePrices(
          activeMarket.resource,
          marketState.referencePrice,
        )
      : null
  const marketRole =
    activeMarket?.roles[participantId] ?? 'neutral'
  const marketOffer = activeMarket?.offers[participantId]
  const marketOfferPrice =
    activeMarket && marketPrices
      ? marketOfferDraft?.resource === activeMarket.resource
        ? marketOfferDraft.price
        : getDefaultMultiplayerMarketOfferPrice(
            marketRole,
            marketPrices,
          )
      : 1
  const interstellarBuyerOffer =
    activeMarket?.resource === 'crystals' && marketState
      ? getInterstellarCrystalBuyerOffer(
          state.round,
          marketState.referencePrice,
          state.interstellarCrystalPurchases ?? 0,
        )
      : null
  const supplyPreview = calculateColonySupplyPreview(
    state,
    participantId,
    {
      foodLevel: foodSupplyLevel,
      energyLevel: energySupplyLevel,
    },
  )
  const actionsBlocked =
    ready ||
    activeMarket !== null ||
    state.landAuctionTie !== null

  const sendAction = (action: GameCommandAction) => {
    sendMessage({
      version: 1,
      requestId: createCommandId(),
      type: 'game-command',
      payload: {
        command: {
          ...action,
          version: 1,
          commandId: createCommandId(),
          participantId,
          expectedRound: state.round,
        },
      },
    })
  }

  const submitRoundPlan = () => {
    sendMessage({
      version: 1,
      requestId: createCommandId(),
      type: 'submit-round-plan',
      payload: {
        supplyPlan: {
          foodLevel: foodSupplyLevel,
          energyLevel: energySupplyLevel,
        },
      },
    })
  }

  if (state.landAuctionTie) {
    const tie = state.landAuctionTie
    const ownBid = tie.liveBids.bids[participantId] ?? 0

    return (
      <main className="network-game-screen">
        <header className="network-game-header">
          <div>
            <span className="eyebrow">E.L.U.M.</span>
            <h1>{colony.name}</h1>
          </div>
          <div className="network-round-status">
            <div className="round-badge">
              {t('multiplayerGame.landAuction')}
            </div>
            {roundTimerStatus}
          </div>
        </header>
        <section className="network-auction-panel">
          <p className="eyebrow">
            {t('multiplayerGame.serverControlled')}
          </p>
          <h2>{t('multiplayerGame.landAuction')}</h2>
          <p>
            {t('multiplayerGame.auctionPhase', {
              phase: t(`multiplayerGame.phase.${tie.phase}`),
            })}
          </p>
          <div className="network-auction-bid">
            <span>{t('multiplayerGame.yourBid')}</span>
            <strong>{number(ownBid)}</strong>
          </div>
          {tie.phase === 'auction' ? (
            <div className="network-auction-actions">
              <button
                type="button"
                onClick={() =>
                  sendAction({
                    type: 'move-land-auction-bid',
                    payload: {
                      tileId: tie.tileId,
                      direction: 'lower',
                    },
                  })
                }
              >
                −
              </button>
              <button
                type="button"
                onClick={() =>
                  sendAction({
                    type: 'move-land-auction-bid',
                    payload: {
                      tileId: tie.tileId,
                      direction: 'raise',
                    },
                  })
                }
              >
                +
              </button>
            </div>
          ) : (
            <p>{t('multiplayerGame.waitForServer')}</p>
          )}
          <div className="network-bid-list">
            {participantIds
              .filter(
                (id) => tie.liveBids.bids[id] !== undefined,
              )
              .map((id) => (
                <span key={id}>
                  {id.toUpperCase()} ·{' '}
                  {number(tie.liveBids.bids[id] ?? 0)}
                </span>
              ))}
          </div>
        </section>
      </main>
    )
  }

  if (activeMarket && marketState && marketPrices) {
    const resourceLabel = t(
      `resource.${activeMarket.resource}`,
    )

    return (
      <main className="network-game-screen">
        <header className="network-game-header">
          <div>
            <span className="eyebrow">E.L.U.M.</span>
            <h1>{colony.name}</h1>
          </div>
          <div className="network-round-status">
            <div className="round-badge">
              {t('multiplayerGame.resourceMarket')}
            </div>
            {roundTimerStatus}
          </div>
        </header>
        <section className="network-market-panel">
          <p className="eyebrow">
            {t('multiplayerGame.serverControlled')}
          </p>
          <h2>
            {resourceLabel} ·{' '}
            {t(`multiplayerGame.phase.${activeMarket.phase}`)}
          </h2>
          <p>
            {t('multiplayerGame.marketReference', {
              price: marketState.referencePrice,
            })}
          </p>

          {interstellarBuyerOffer ? (
            <div className="network-interstellar-buyer">
              <strong>
                {t('multiplayerGame.interstellarBuyer')}
              </strong>
              <span>
                {t('multiplayerGame.interstellarBuyerStatus', {
                  price: interstellarBuyerOffer.offerPrice,
                  remaining:
                    interstellarBuyerOffer.remainingCapacity,
                  capacity: interstellarBuyerOffer.capacity,
                })}
              </span>
            </div>
          ) : null}

          {activeMarket.phase === 'declaration' ? (
            <div className="network-role-actions">
              {(['neutral', 'buyer', 'seller'] as const).map(
                (role) => (
                  <button
                    className={
                      marketRole === role ? 'is-selected' : ''
                    }
                    key={role}
                    type="button"
                    onClick={() =>
                      sendAction({
                        type: 'set-market-role',
                        payload: {
                          resource: activeMarket.resource,
                          role,
                        },
                      })
                    }
                  >
                    {t(`multiplayerGame.role.${role}`)}
                  </button>
                ),
              )}
            </div>
          ) : null}

          {activeMarket.phase === 'auction' &&
          marketRole !== 'neutral' ? (
            <>
              <label className="network-offer-control">
                <span>{t('multiplayerGame.limitPrice')}</span>
                <input
                  max={marketPrices.sellPrice}
                  min={marketPrices.buyPrice}
                  type="number"
                  value={marketOfferPrice}
                  onChange={(event) =>
                    setMarketOfferDraft({
                      resource: activeMarket.resource,
                      price: Number(event.target.value),
                    })
                  }
                />
              </label>
              <button
                className="network-primary-button"
                type="button"
                onClick={() =>
                  sendAction({
                    type: 'set-market-offer',
                    payload: {
                      resource: activeMarket.resource,
                      active: true,
                      price: marketOfferPrice,
                    },
                  })
                }
              >
                {marketOffer?.active
                  ? t('multiplayerGame.updateOffer')
                  : t('multiplayerGame.activateOffer')}
              </button>

              {marketOffer?.active ? (
                <div className="network-market-trade-actions">
                  <button
                    className="network-trade-button"
                    type="button"
                    onClick={() =>
                      sendAction({
                        type: 'execute-market-trade',
                        payload: {
                          resource: activeMarket.resource,
                          direction:
                            marketRole === 'buyer'
                              ? 'buy'
                              : 'sell',
                          price:
                            marketRole === 'buyer'
                              ? marketPrices.sellPrice
                              : marketPrices.buyPrice,
                          counterparty: 'warehouse',
                        },
                      })
                    }
                  >
                    {marketRole === 'buyer'
                      ? t('multiplayerGame.buyWarehouse', {
                          price: marketPrices.sellPrice,
                        })
                      : t('multiplayerGame.sellWarehouse', {
                          price: marketPrices.buyPrice,
                        })}
                  </button>

                  {interstellarBuyerOffer &&
                  marketRole === 'seller' ? (
                    <button
                      className="network-trade-button is-interstellar"
                      type="button"
                      disabled={
                        !interstellarBuyerOffer.isAvailable ||
                        colony.resources.crystals < 1 ||
                        marketOffer.price >
                          interstellarBuyerOffer.offerPrice
                      }
                      onClick={() =>
                        sendAction({
                          type: 'execute-market-trade',
                          payload: {
                            resource: 'crystals',
                            direction: 'sell',
                            price:
                              interstellarBuyerOffer.offerPrice,
                            counterparty:
                              'interstellar-buyer',
                          },
                        })
                      }
                    >
                      {t(
                        'multiplayerGame.sellInterstellar',
                        {
                          price:
                            interstellarBuyerOffer.offerPrice,
                        },
                      )}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {interstellarBuyerOffer &&
              marketRole === 'seller' &&
              marketOffer?.active &&
              marketOffer.price >
                interstellarBuyerOffer.offerPrice ? (
                <small className="network-market-hint">
                  {t(
                    'multiplayerGame.interstellarLimitTooHigh',
                    {
                      price: interstellarBuyerOffer.offerPrice,
                    },
                  )}
                </small>
              ) : null}
            </>
          ) : null}

          {activeMarket.phase === 'finished' ? (
            activeMarket.initiatorId === participantId ? (
              <button
                className="network-primary-button"
                type="button"
                onClick={() =>
                  sendAction({
                    type: 'complete-resource-market',
                    payload: {
                      resource: activeMarket.resource,
                    },
                  })
                }
              >
                {t('multiplayerGame.closeMarket')}
              </button>
            ) : (
              <p>{t('multiplayerGame.waitForInitiator')}</p>
            )
          ) : null}
        </section>
      </main>
    )
  }

  if (
    lastRoundReport &&
    dismissedLeaderboardRound !==
      lastRoundReport.roundPlayed
  ) {
    const finalLeaderboard = isGameFinished(
      lastRoundReport.roundPlayed,
    )

    return (
      <main className="network-game-screen">
        <header className="network-game-header">
          <div>
            <span className="eyebrow">E.L.U.M.</span>
            <h1>{colony.name}</h1>
          </div>
          <div className="network-round-status">
            <div className="round-badge">
              {t('app.round', { round: state.round })}
            </div>
            {roundTimerStatus}
          </div>
        </header>
        <MultiplayerLeaderboard
          entries={leaderboardEntries}
          mode="interstitial"
          roundPlayed={lastRoundReport.roundPlayed}
          isFinal={finalLeaderboard}
          isHost={isHost}
          onRestart={onRestart}
          onContinue={
            finalLeaderboard
              ? undefined
              : () =>
                  setDismissedLeaderboardRound(
                    lastRoundReport.roundPlayed,
                  )
          }
        />
      </main>
    )
  }

  if (
    lastRoundReport &&
    dismissedReportRound !==
      lastRoundReport.roundPlayed
  ) {
    return (
      <main className="network-game-screen">
        <header className="network-game-header">
          <div>
            <span className="eyebrow">E.L.U.M.</span>
            <h1>{colony.name}</h1>
          </div>
          <div className="network-round-status">
            <div className="round-badge">
              {t('app.round', { round: state.round })}
            </div>
            {roundTimerStatus}
          </div>
        </header>
        <RoundBriefingPanel
          round={state.round}
          population={colony.population}
          report={lastRoundReport}
          globalEvent={state.activeGlobalEvent}
          onContinue={() =>
            setDismissedReportRound(
              lastRoundReport.roundPlayed,
            )
          }
          onViewExploration={(tileId) => {
            setFocusedTileId(tileId)
            setPlanningView('colony')
            setDismissedReportRound(
              lastRoundReport.roundPlayed,
            )
          }}
        />
      </main>
    )
  }

  return (
    <main
      className={`network-game-screen ${
        planningView === 'colony'
          ? 'immersive-planet-screen'
          : ''
      }`}
    >
      <header className="network-game-header">
        <div>
          <span className="eyebrow">E.L.U.M.</span>
          <h1>{colony.name}</h1>
        </div>
        <div className="network-round-status">
          <div className="round-badge">
            {t('app.round', { round: state.round })}
          </div>
          <small>
            {ready
              ? t('multiplayerGame.readyWaiting')
              : t('multiplayerGame.connectedAs', {
                  colony: participantId.toUpperCase(),
                })}
          </small>
          {roundTimerStatus}
        </div>
      </header>

      <section className="compact-status-panel">
        <span className="compact-rank">
          <small>{t('multiplayerGame.place')}</small>
          <strong>{currentPlacement}.</strong>
        </span>
        <span>👥 <strong>{number(colony.population)}</strong></span>
        <span>💰 <strong>{number(colony.credits)}</strong></span>
        <span>🌾 <strong>{number(colony.resources.food)}</strong></span>
        <span>⚡ <strong>{number(colony.resources.energy)}</strong></span>
        <span>⛏ <strong>{number(colony.resources.ore)}</strong></span>
        <span>💎 <strong>{number(colony.resources.crystals)}</strong></span>
      </section>

      {planningView === 'colony' ? (
        <>
          <HexMap
            participantId={participantId}
            focusTileId={focusedTileId}
            round={state.round}
            population={colony.population}
            credits={colony.credits}
            ore={colony.resources.ore}
            ownedTileIds={colony.ownedTileIds}
            opponentTileIds={opponentTileIds}
            colonies={state.colonies}
            meteorImpacts={state.meteorImpacts ?? []}
            pendingLandBid={state.pendingLandBid}
            landAuctionTie={state.landAuctionTie}
            freeHarvesters={colony.freeHarvesterPool.length}
            harvestersInConstruction={
              colony.harvestersInConstruction
            }
            harvesters={harvesters}
            harvesterCreditCost={getHarvesterCreditCost(state)}
            isHarvesterBuildBlocked={
              actionsBlocked ||
              isColonyHarvesterBuildBlocked(
                state,
                participantId,
              )
            }
            isLandBidBlocked={
              actionsBlocked ||
              isColonyLandBidBlocked(state, participantId)
            }
            isRetoolingBlocked={
              actionsBlocked ||
              isColonyHarvesterRetoolingBlocked(
                state,
                participantId,
              )
            }
            isRelocationBlocked={
              actionsBlocked ||
              isColonyHarvesterRelocationBlocked(
                state,
                participantId,
              )
            }
            onBuildHarvester={() =>
              sendAction({
                type: 'order-harvester-build',
                payload: {},
              })
            }
            onOpenHeadquarters={() =>
              setPlanningView('headquarters')
            }
            onPlaceLandBid={(tileId, amount) =>
              sendAction({
                type: 'place-land-bid',
                payload: { tileId, amount },
              })
            }
            onCancelLandOrder={() =>
              sendAction({
                type: 'cancel-land-bid',
                payload: {},
              })
            }
            onAssignHarvester={(
              tileId,
              production: ProductionType,
            ) =>
              sendAction({
                type: 'assign-harvester',
                payload: { tileId, production },
              })
            }
            onChangeHarvesterProduction={(
              tileId,
              production,
            ) =>
              sendAction({
                type: 'change-harvester-production',
                payload: { tileId, production },
              })
            }
            onRemoveHarvester={(tileId) =>
              sendAction({
                type: 'remove-harvester',
                payload: { tileId },
              })
            }
          />
          <section className="overview-actions">
            <button
              className="headquarters-button"
              type="button"
              onClick={() => setPlanningView('headquarters')}
            >
              🏚️ {t('multiplayerGame.toHeadquarters')}
            </button>
            <p>{t('multiplayerGame.serverStateHint')}</p>
          </section>
        </>
      ) : (
        <section className="network-headquarters">
          <button
            className="headquarters-back-button"
            type="button"
            onClick={() => setPlanningView('colony')}
          >
            ← {t('multiplayerGame.toColony')}
          </button>
          <div className="network-hq-intro">
            <img
              src={headquartersImage}
              alt={t('multiplayerGame.headquartersImageAlt')}
            />
            <div>
              <p className="eyebrow">
                {t('multiplayerGame.networkPlanning')}
              </p>
              <h2>{t('multiplayerGame.headquarters')}</h2>
              <p>{t('multiplayerGame.headquartersHint')}</p>
            </div>
          </div>

          <MultiplayerLeaderboard
            entries={leaderboardEntries}
            mode="headquarters"
          />

          <div className="network-market-launcher">
            <h3>{t('multiplayerGame.resourceMarkets')}</h3>
            <div>
              {(
                ['food', 'energy', 'ore', 'crystals'] as const
              ).map((resource: MarketResource) => (
                <button
                  disabled={
                    ready ||
                    isColonyMarketInitiationBlocked(
                      state,
                      participantId,
                    ) ||
                    state.initiatedMarketResources.includes(
                      resource,
                    )
                  }
                  key={resource}
                  type="button"
                  onClick={() =>
                    sendAction({
                      type: 'initiate-resource-market',
                      payload: { resource },
                    })
                  }
                >
                  {t(`resource.${resource}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="network-supply-panel">
            <h3>{t('supply.plan')}</h3>
            <p className="network-round-time-hint">
              {t('multiplayerGame.roundTimeHint')}
            </p>
            <label>
              <span>{t('supply.foodForPopulation')}</span>
              <strong>{t(supplyLabelKeys[foodSupplyLevel])}</strong>
            </label>
            <input
              disabled={ready}
              max="3"
              min="0"
              type="range"
              value={foodSupplyLevel}
              onChange={(event) =>
                setFoodSupplyLevel(Number(event.target.value))
              }
            />
            <label>
              <span>{t('supply.energyForPopulation')}</span>
              <strong>{t(supplyLabelKeys[energySupplyLevel])}</strong>
            </label>
            <input
              disabled={ready}
              max="3"
              min="0"
              type="range"
              value={energySupplyLevel}
              onChange={(event) =>
                setEnergySupplyLevel(Number(event.target.value))
              }
            />
            <div className="network-supply-preview">
              <span>
                {t('supply.expectedPopulation')}{' '}
                <strong>
                  {number(
                    Math.max(
                      1,
                      colony.population +
                        supplyPreview.populationChange,
                    ),
                  )}
                </strong>
              </span>
              <span>
                {t('supply.stockAfterRound')} · 🌾{' '}
                {number(supplyPreview.remainingFood)} · ⚡{' '}
                {number(
                  supplyPreview.remainingEnergyBeforeHarvesters,
                )}
              </span>
            </div>
            <button
              className="network-primary-button"
              disabled={ready}
              type="button"
              onClick={submitRoundPlan}
            >
              {ready
                ? t('multiplayerGame.readyWaiting')
                : t('multiplayerGame.finishPlanning')}
            </button>
          </div>
        </section>
      )}

      {error ? (
        <p className="multiplayer-error" role="alert">
          {error}
        </p>
      ) : null}
      {localEvent && localEventKey !== dismissedLocalEventKey ? (
        <LocalEventNotice
          event={localEvent}
          round={state.round}
          onDismiss={() =>
            setDismissedLocalEventKey(localEventKey)
          }
        />
      ) : null}
      <button
        className="secondary-button network-leave-button"
        type="button"
        onClick={onLeave}
      >
        {t('multiplayerGame.leave')}
      </button>
    </main>
  )
}

export default MultiplayerGameScreen
