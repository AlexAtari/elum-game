import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import headquartersImage from './assets/hq-four-colonies.webp'
import HexMap from './components/HexMap'
import IntroSequence from './components/IntroSequence'
import LandTieAuctionPanel from './components/LandTieAuctionPanel'
import LeaderboardPanel from './components/LeaderboardPanel'
import LocalEventNotice from './components/LocalEventNotice'
import MultiplayerLobbyScreen from './components/MultiplayerLobbyScreen'
import MarketLauncher from './components/MarketLauncher'
import MarketPanel from './components/MarketPanel'
import RoundBriefingPanel from './components/RoundBriefingPanel'
import SupplyRoundOverview from './components/SupplyRoundOverview'
import { applyAutonomousRivalLandPurchases } from './rivalAutonomousLand'
import { applyStrategicOrionBid } from './orionLandBid'
import {
  activateGlobalEvent,
  applyLocalEvent,
  beginLandTieBreak,
  cancelColonyLandBid,
  calculateSupplyPreview,
  createLeaderboardEntries,
  getRoundsUntilSupplyShip,
  hasHarvesterEnergyShortage,
  isGameFinished,
  getHarvesterCreditCost,
  isHarvesterBuildBlocked,
  isHarvesterRelocationBlocked,
  isHarvesterRetoolingBlocked,
  isLandBidBlocked,
  isMarketInitiationBlocked,
  resolveLandTieBreak,
  runRound,
  selectColonies,
  selectColonyRevealedTileIds,
  selectLocalColony,
  selectOpponentTileIds,
  selectRivalColonies,
  selectGlobalEvent,
  selectLocalEvent,
  type LocalEventId,
  type HarvesterAssignments,
  type GameState,
  type LandAuctionPhase,
  type MarketCounterparty,
  type MarketDirection,
  type MarketResource,
  type ProductionType,
  type ResourceMarketPhase,
  type RoundReport,
  type SupplyPlan,
  createPlayableInitialGameState,
  HARVESTER_ORE_COST,
} from './game'
import {
  executeGameCommand,
  type GameCommandAction,
} from './gameCommands'
import { useI18n } from './i18n/I18nContext'
import type { ParticipantId } from './match'
import { readMultiplayerInvite } from './multiplayerClient'
import './App.css'

const supplyLabelKeys = [
  'supply.none',
  'supply.minimum',
  'supply.normal',
  'supply.extra',
] as const

type PendingRound = {
  harvesters: HarvesterAssignments
  supplyPlan: SupplyPlan
}

type PlanningView = 'colony' | 'headquarters'
type HeadquartersView = 'main' | 'auctions' | 'storage'

let clientCommandSequence = 0

function createClientCommandId() {
  clientCommandSequence += 1
  return `local-${Date.now()}-${clientCommandSequence}`
}

function App() {
  const { number, t } = useI18n()
  const initialMultiplayerInvite = useMemo(
    () => readMultiplayerInvite(window.location.search),
    [],
  )
  const [gameStarted, setGameStarted] = useState(false)
  const [showMultiplayerLobby, setShowMultiplayerLobby] =
    useState(() => initialMultiplayerInvite !== null)
  const [showIntroSequence, setShowIntroSequence] = useState(false)
  const [gameState, setGameState] = useState(
    () => createPlayableInitialGameState(Date.now()),
  )
  const [lastReport, setLastReport] =
    useState<RoundReport | null>(null)
  const [foodSupplyLevel, setFoodSupplyLevel] = useState(2)
  const [energySupplyLevel, setEnergySupplyLevel] = useState(2)
  const [pendingRound, setPendingRound] =
    useState<PendingRound | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showRoundBriefing, setShowRoundBriefing] =
    useState(false)
  const [pendingLocalEvent, setPendingLocalEvent] =
    useState<LocalEventId | null>(null)
  const [activeLocalEvent, setActiveLocalEvent] =
    useState<LocalEventId | null>(null)
  const [planningView, setPlanningView] =
    useState<PlanningView>('colony')
  const [headquartersView, setHeadquartersView] =
    useState<HeadquartersView>('main')
  const [focusedTileId, setFocusedTileId] =
    useState<string | null>(null)

  const colonies = useMemo(
    () => selectColonies(gameState),
    [gameState],
  )
  const localColony = useMemo(
    () => selectLocalColony(gameState),
    [gameState],
  )
  const rivals = useMemo(
    () => selectRivalColonies(gameState),
    [gameState],
  )
  const harvesters = localColony.harvesterAssignments
  const freeHarvesterPool = localColony.freeHarvesterPool
  const freeHarvesters = freeHarvesterPool.length
  const opponentTileIds = useMemo(
    () => selectOpponentTileIds(gameState),
    [gameState],
  )
  const harvesterCreditCost = getHarvesterCreditCost(gameState)
  const marketInitiationBlocked =
    isMarketInitiationBlocked(gameState)
  const landBidBlocked = isLandBidBlocked(gameState)
  const harvesterBuildBlocked =
    isHarvesterBuildBlocked(gameState)
  const harvesterRetoolingBlocked =
    isHarvesterRetoolingBlocked(gameState)
  const harvesterRelocationBlocked =
    isHarvesterRelocationBlocked(gameState)
  const activeMarket = gameState.activeResourceMarket
  const activeResourceMarket = activeMarket
    ? gameState.market[activeMarket.resource]
    : null
  const gameFinished =
    lastReport !== null &&
    isGameFinished(lastReport.roundPlayed)
  const roundsUntilSupplyShip = gameFinished
    ? 0
    : getRoundsUntilSupplyShip(gameState.round)

  const supplyPreview = calculateSupplyPreview(gameState, {
    foodLevel: foodSupplyLevel,
    energyLevel: energySupplyLevel,
  })

  const plannedRound = useMemo(
    () =>
      runRound(gameState, harvesters, {
        foodLevel: foodSupplyLevel,
        energyLevel: energySupplyLevel,
      }),
    [
      gameState,
      harvesters,
      foodSupplyLevel,
      energySupplyLevel,
    ],
  )
  const plannedLocalColony = useMemo(
    () => selectColonies(plannedRound.nextState).agima,
    [plannedRound.nextState],
  )

  const leaderboardEntries = useMemo(
    () => createLeaderboardEntries(gameState),
    [gameState],
  )
  const currentPlacement =
    leaderboardEntries.findIndex((entry) => entry.isPlayer) + 1

  const startNewGame = () => {
    setGameState(createPlayableInitialGameState(Date.now()))
    setLastReport(null)
    setFoodSupplyLevel(2)
    setEnergySupplyLevel(2)
    setPendingRound(null)
    setShowLeaderboard(false)
    setShowRoundBriefing(false)
    setPendingLocalEvent(null)
    setActiveLocalEvent(null)
    setPlanningView('colony')
    setFocusedTileId(null)
    setShowIntroSequence(true)
  }

  useEffect(() => {
    if (
      !gameStarted ||
      pendingLocalEvent === null ||
      showLeaderboard ||
      showRoundBriefing ||
      activeMarket !== null ||
      gameState.landAuctionTie !== null
    ) {
      return
    }

    const delayMilliseconds =
      2000 + Math.floor(Math.random() * 4000)
    const localEventTimer = window.setTimeout(() => {
      setGameState((currentState) =>
        applyLocalEvent(currentState, pendingLocalEvent),
      )
      setActiveLocalEvent(pendingLocalEvent)
      setPendingLocalEvent(null)
    }, delayMilliseconds)

    return () => window.clearTimeout(localEventTimer)
  }, [
    activeMarket,
    gameStarted,
    gameState.landAuctionTie,
    pendingLocalEvent,
    showLeaderboard,
    showRoundBriefing,
  ])

  const dispatchParticipantCommand = useCallback(
    (
      participantId: ParticipantId,
      action: GameCommandAction,
      afterSuccess?: (state: GameState) => GameState,
    ) => {
      const command = {
        ...action,
        version: 1,
        commandId: createClientCommandId(),
        participantId,
        expectedRound: gameState.round,
      } as const

      setGameState((currentState) => {
        const result = executeGameCommand(
          currentState,
          command,
        )

        return result.ok && afterSuccess
          ? afterSuccess(result.state)
          : result.state
      })
    },
    [gameState.round],
  )
  const dispatchPlayerCommand = useCallback(
    (
      action: GameCommandAction,
      afterSuccess?: (state: GameState) => GameState,
    ) =>
      dispatchParticipantCommand(
        'agima',
        action,
        afterSuccess,
      ),
    [dispatchParticipantCommand],
  )

  const assignHarvester = (
    tileId: string,
    production: ProductionType,
  ) => {
    dispatchPlayerCommand({
      type: 'assign-harvester',
      payload: { tileId, production },
    })
  }

  const changeHarvesterProduction = (
    tileId: string,
    production: ProductionType,
  ) => {
    dispatchPlayerCommand({
      type: 'change-harvester-production',
      payload: { tileId, production },
    })
  }

  const removeHarvester = (tileId: string) => {
    dispatchPlayerCommand({
      type: 'remove-harvester',
      payload: { tileId },
    })
  }

  const submitLandBid = (tileId: string, amount: number) => {
    dispatchPlayerCommand(
      {
        type: 'place-land-bid',
        payload: { tileId, amount },
      },
      applyStrategicOrionBid,
    )
  }

  const cancelLandOrder = () => {
    dispatchPlayerCommand(
      {
        type: 'cancel-land-bid',
        payload: {},
      },
      (state) => cancelColonyLandBid(state, 'orion'),
    )
  }

  const buildHarvester = () => {
    dispatchPlayerCommand({
      type: 'order-harvester-build',
      payload: {},
    })
  }

  const tradeMarketResource = useCallback(
    (
      resource: MarketResource,
      direction: MarketDirection,
      price: number,
      counterparty: MarketCounterparty,
    ) => {
      dispatchPlayerCommand({
        type: 'execute-market-trade',
        payload: {
          resource,
          direction,
          price,
          counterparty,
        },
      })
    },
    [dispatchPlayerCommand],
  )

  const setMarketRole = useCallback(
    (
      participantId: ParticipantId,
      resource: MarketResource,
      role: 'neutral' | 'buyer' | 'seller',
    ) => {
      dispatchParticipantCommand(participantId, {
        type: 'set-market-role',
        payload: { resource, role },
      })
    },
    [dispatchParticipantCommand],
  )

  const setMarketOffer = useCallback(
    (
      participantId: ParticipantId,
      resource: MarketResource,
      active: boolean,
      price: number,
    ) => {
      dispatchParticipantCommand(participantId, {
        type: 'set-market-offer',
        payload: { resource, active, price },
      })
    },
    [dispatchParticipantCommand],
  )

  const advanceMarketPhase = useCallback(
    (
      resource: MarketResource,
      expectedPhase: ResourceMarketPhase,
    ) => {
      dispatchPlayerCommand({
        type: 'advance-resource-market-phase',
        payload: { resource, expectedPhase },
      })
    },
    [dispatchPlayerCommand],
  )

  const advanceLandAuction = useCallback(
    (tileId: string, expectedPhase: LandAuctionPhase) => {
      dispatchPlayerCommand({
        type: 'advance-land-auction-phase',
        payload: { tileId, expectedPhase },
      })
    },
    [dispatchPlayerCommand],
  )

  const moveLandAuction = useCallback(
    (
      participantId: 'agima' | 'orion',
      tileId: string,
      direction: 'raise' | 'lower',
    ) => {
      dispatchParticipantCommand(participantId, {
        type: 'move-land-auction-bid',
        payload: { tileId, direction },
      })
    },
    [dispatchParticipantCommand],
  )

  const applyCompletedRound = useCallback(
    (completedRound: ReturnType<typeof runRound>) => {
      setGameState(completedRound.nextState)
      setLastReport(completedRound.report)
      setPendingRound(null)
      setPendingLocalEvent(null)
      setActiveLocalEvent(null)
      setShowRoundBriefing(false)
      setShowLeaderboard(true)
    },
    [],
  )

  const initiateMarket = useCallback(
    (resource: MarketResource) => {
      if (
        activeMarket !== null ||
        marketInitiationBlocked ||
        gameState.initiatedMarketResources.includes(resource)
      ) {
        return
      }

      dispatchPlayerCommand({
        type: 'initiate-resource-market',
        payload: { resource },
      })
      setActiveLocalEvent(null)
    },
    [
      activeMarket,
      gameState.initiatedMarketResources,
      marketInitiationBlocked,
      dispatchPlayerCommand,
    ],
  )

  const completeMarketResource = useCallback(
    (resource: MarketResource) => {
      if (
        !activeMarket ||
        activeMarket.resource !== resource
      ) {
        return
      }

      dispatchPlayerCommand({
        type: 'complete-resource-market',
        payload: { resource },
      })
    },
    [activeMarket, dispatchPlayerCommand],
  )

  const completeLandTieAuction = useCallback(
    () => {
      const tie = gameState.landAuctionTie

      if (!pendingRound || !tie || tie.phase !== 'finished') {
        return
      }

      const resolvedState = resolveLandTieBreak(
        gameState,
        tie.liveBids,
      )
      const completedRound = runRound(
        resolvedState,
        pendingRound.harvesters,
        pendingRound.supplyPlan,
      )

      applyCompletedRound(completedRound)
    },
    [applyCompletedRound, gameState, pendingRound],
  )

  const executeRound = () => {
    const roundPlan: PendingRound = {
      harvesters: { ...harvesters },
      supplyPlan: {
        foodLevel: foodSupplyLevel,
        energyLevel: energySupplyLevel,
      },
    }

    const stateWithRivalLand =
    applyAutonomousRivalLandPurchases(gameState)
  const completedRound = runRound(
    stateWithRivalLand,
    roundPlan.harvesters,
    roundPlan.supplyPlan,
  )

  setPendingRound(roundPlan)
    setLastReport(null)
    setShowLeaderboard(false)
    setShowRoundBriefing(false)
    setPendingLocalEvent(null)
    setActiveLocalEvent(null)

    if (completedRound.report.landAuction?.outcome === 'tie') {
      setGameState(beginLandTieBreak)
      return
    }

    applyCompletedRound(completedRound)
  }

  const continueAfterLeaderboard = useCallback(() => {
    const globalEvent = selectGlobalEvent(gameState.round)
    const localEvent = selectLocalEvent(gameState.round)

    setGameState((currentState) =>
      activateGlobalEvent(currentState, globalEvent),
    )
    setPendingLocalEvent(localEvent)
    setShowLeaderboard(false)
    setShowRoundBriefing(true)
  }, [gameState.round])

  const continueAfterBriefing = useCallback(() => {
    setShowRoundBriefing(false)
    setPlanningView('colony')
    setFocusedTileId(null)
  }, [])

  const viewExplorationResult = useCallback(
    (tileId: string) => {
      setFocusedTileId(tileId)
      setShowRoundBriefing(false)
      setPlanningView('colony')
    },
    [],
  )

  const dismissLocalEvent = useCallback(() => {
    setActiveLocalEvent(null)
  }, [])

  if (gameStarted) {
    return (
      <main
        className={`game-screen ${
          activeMarket !== null || gameState.landAuctionTie !== null
            ? 'market-screen'
            : ''
        } ${
          showLeaderboard && lastReport
            ? 'leaderboard-screen'
            : ''
        } ${
          activeMarket === null &&
          gameState.landAuctionTie === null &&
          !showLeaderboard &&
          !showRoundBriefing &&
          planningView === 'colony'
            ? 'immersive-planet-screen'
            : ''
        }`}
      >
        <header className="game-header">
          <div>
            <span className="eyebrow">E.L.U.M.</span>
            <h1>{t('app.colonyName')}</h1>
          </div>

          <div className="round-status">
            <div className="round-badge">
              {gameState.landAuctionTie !== null
                ? t('app.tieAuctionRound', {
                    round: gameState.round,
                  })
                : activeMarket !== null
                ? t('app.marketRound', {
                    round: activeMarket.roundPlayed,
                  })
                : showLeaderboard && lastReport
                  ? gameFinished
                    ? t('app.finalResult')
                    : t('app.leaderboardRound', {
                        round: lastReport.roundPlayed,
                      })
                  : showRoundBriefing
                    ? t('app.briefingRound', {
                        round: gameState.round,
                      })
                    : t('app.round', { round: gameState.round })}
            </div>
            <small>
              {roundsUntilSupplyShip === 0
                ? t('app.supplyShipArrived')
                : t(
                    roundsUntilSupplyShip === 1
                      ? 'app.supplyShipCountdownOne'
                      : 'app.supplyShipCountdown',
                    { rounds: roundsUntilSupplyShip },
                  )}
            </small>
          </div>
        </header>

        {activeMarket === null &&
          gameState.landAuctionTie === null &&
          !showLeaderboard &&
          !showRoundBriefing && (
          <section
            className="compact-status-panel"
            aria-label={t('app.status')}
          >
            <span className="compact-rank">
              <small>Platz</small>
              <strong>{currentPlacement}.</strong>
            </span>
            <span>👥 <strong>{number(localColony.population)}</strong></span>
            <span>💰 <strong>{number(localColony.credits)}</strong></span>
            <span>🌾 <strong>{number(localColony.resources.food)}</strong></span>
            <span>⚡ <strong>{number(localColony.resources.energy)}</strong></span>
            <span>⛏ <strong>{number(localColony.resources.ore)}</strong></span>
            <span>💎 <strong>{number(localColony.resources.crystals)}</strong></span>
          </section>
        )}

        {gameState.landAuctionTie !== null ? (
          <LandTieAuctionPanel
            key={`${gameState.round}-${gameState.landAuctionTie.tileId}`}
            tie={gameState.landAuctionTie}
            credits={localColony.credits}
            orion={rivals.orion}
            roundPlayed={gameState.round}
            onAdvancePhase={advanceLandAuction}
            onMoveBid={moveLandAuction}
            onComplete={completeLandTieAuction}
          />
        ) : activeMarket !== null && activeResourceMarket ? (
          <MarketPanel
            key={`${activeMarket.roundPlayed}-${activeMarket.resource}`}
            roundPlayed={activeMarket.roundPlayed}
            resource={activeMarket.resource}
            resourceAmount={
              localColony.resources[activeMarket.resource]
            }
            credits={localColony.credits}
            referencePrice={activeResourceMarket.referencePrice}
            warehouseStock={activeResourceMarket.warehouseStock}
            interstellarCrystalPurchases={
              gameState.interstellarCrystalPurchases ?? 0
            }
            rivals={rivals}
            rivalResourceAmounts={{
              orion:
                colonies.orion.resources[
                  activeMarket.resource
                ],
              nova:
                colonies.nova.resources[
                  activeMarket.resource
                ],
              vega:
                colonies.vega.resources[
                  activeMarket.resource
                ],
            }}
            nextResource={null}
            initiatorName="Agima"
            completionLabel={t('market.backToPlanning')}
            phase={activeMarket.phase}
            onTrade={tradeMarketResource}
            onSetRole={setMarketRole}
            onSetOffer={setMarketOffer}
            onAdvancePhase={advanceMarketPhase}
            onComplete={completeMarketResource}
          />
        ) : showLeaderboard && lastReport ? (
          <LeaderboardPanel
            roundPlayed={lastReport.roundPlayed}
            nextRound={gameState.round}
            entries={leaderboardEntries}
            isFinal={gameFinished}
            meteorImpact={lastReport.meteorImpact}
            onContinue={continueAfterLeaderboard}
            onRestart={startNewGame}
          />
        ) : showRoundBriefing && lastReport ? (
          <RoundBriefingPanel
            round={gameState.round}
            population={localColony.population}
            report={lastReport}
            globalEvent={gameState.activeGlobalEvent}
            onContinue={continueAfterBriefing}
            onViewExploration={viewExplorationResult}
          />
        ) : (
          <>
            {planningView === 'colony' ? (
              <>
            <HexMap
              participantId="agima"
              round={gameState.round}
              population={localColony.population}
              credits={localColony.credits}
              ore={localColony.resources.ore}
              ownedTileIds={localColony.ownedTileIds}
              revealedTileIds={selectColonyRevealedTileIds(
                gameState,
                'agima',
              )}
              opponentTileIds={opponentTileIds}
              colonies={colonies}
              meteorImpacts={gameState.meteorImpacts ?? []}
              pendingLandBid={gameState.pendingLandBid}
              landAuctionTie={gameState.landAuctionTie}
              freeHarvesters={freeHarvesters}
              harvestersInConstruction={
                localColony.harvestersInConstruction
              }
              harvesters={harvesters}
              harvesterCreditCost={harvesterCreditCost}
              isHarvesterBuildBlocked={harvesterBuildBlocked}
              isLandBidBlocked={landBidBlocked}
              isRetoolingBlocked={harvesterRetoolingBlocked}
              isRelocationBlocked={harvesterRelocationBlocked}
              onBuildHarvester={buildHarvester}
              focusTileId={focusedTileId}
              onOpenHeadquarters={() => {
                setHeadquartersView('main')
                setPlanningView('headquarters')
              }}
              onPlaceLandBid={submitLandBid}
              onCancelLandOrder={cancelLandOrder}
              onAssignHarvester={assignHarvester}
              onChangeHarvesterProduction={
                changeHarvesterProduction
              }
              onRemoveHarvester={removeHarvester}
            />

                <section className="overview-actions">
                  <button
                    className="headquarters-button"
                    type="button"
                    onClick={() => {
                      setHeadquartersView('main')
                      setPlanningView('headquarters')
                    }}
                  >
                    🏚️ Zum Hauptquartier
                  </button>
                  <p>
                    Markt, Versorgung, Vorschau und Harvesterbau
                    befinden sich im HQ.
                  </p>
                </section>
              </>
            ) : (
              <>
                <section className="headquarters-panel">
                <button
                  className={
                    headquartersView === 'main'
                      ? 'headquarters-exit-button'
                      : 'headquarters-back-button'
                  }
                  type="button"
                  onClick={() => {
                    if (headquartersView === 'main') {
                      setPlanningView('colony')
                      return
                    }

                    setHeadquartersView('main')
                  }}
                >
                  ←{' '}
                  {headquartersView === 'main'
                    ? t('headquarters.leave')
                    : t('headquarters.back')}
                </button>

                {headquartersView === 'main' && (
                  <>
                    <div className="headquarters-intro">
                  <figure className="headquarters-image-frame">
                    <img
                      src={headquartersImage}
                      alt="Gemeinsame Zentralkuppel mit den vier angeschlossenen Hauptquartieren von Agima, Orion, Nova und Vega"
                    />
                    <figcaption>
                      Vier Kolonie-HQs an der gemeinsamen
                      Zentralkuppel
                    </figcaption>
                  </figure>
                  <div>
                    <p className="eyebrow">Kolonie Agima</p>
                    <h2>Hauptquartier</h2>
                    <p>
                      Markt, Versorgung und Ausbau der Kolonie
                      werden von hier aus gesteuert.
                    </p>
                  </div>
                    </div>

                    <div className="headquarters-stats">
                  <span>
                    👥 Bevölkerung{' '}
                    <strong>{number(localColony.population)}</strong>
                  </span>
                  <span>
                    🚜 Freie Harvester{' '}
                    <strong>{freeHarvesters}</strong>
                  </span>
                  <span>
                    🏗️ Im Bau{' '}
                    <strong>
                      {localColony.harvestersInConstruction}
                    </strong>
                  </span>
                    </div>

                    <button
                  className="build-harvester-button"
                  type="button"
                  disabled={
                    harvesterBuildBlocked ||
                    localColony.credits < harvesterCreditCost ||
                    localColony.resources.ore <
                      HARVESTER_ORE_COST
                  }
                  onClick={buildHarvester}
                >
                  {harvesterBuildBlocked
                    ? 'Harvesterbau gesperrt'
                    : localColony.credits >= harvesterCreditCost &&
                        localColony.resources.ore >=
                          HARVESTER_ORE_COST
                      ? 'Harvester bauen'
                      : 'Ressourcen reichen nicht'}
                    </button>
                    <p className="build-cost">
                  Kosten: {harvesterCreditCost} Credits +{' '}
                  {HARVESTER_ORE_COST} Erz. Fertig zu Beginn der
                  nächsten Runde.
                    </p>

                    <nav
                  className="headquarters-navigation"
                  aria-label={t('headquarters.navigation')}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setHeadquartersView('auctions')
                    }
                  >
                    {t('headquarters.toAuctions')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setHeadquartersView('storage')
                    }
                  >
                    {t('headquarters.toStorage')}
                  </button>
                    </nav>
                  </>
                )}
                </section>

                {headquartersView === 'auctions' && (
                  <MarketLauncher
                    initiatedResources={
                      gameState.initiatedMarketResources
                    }
                    isBlocked={marketInitiationBlocked}
                    onInitiate={initiateMarket}
                  />
                )}

                {headquartersView === 'storage' && (
                  <section className="supply-panel">
          <h2>{t('supply.plan')}</h2>

          <label htmlFor="food-supply">
            🌾 {t('supply.foodForPopulation')}{' '}
            <strong>
              {foodSupplyLevel} –{' '}
              {t(supplyLabelKeys[foodSupplyLevel])}
            </strong>
          </label>

          <input
            id="food-supply"
            type="range"
            min="0"
            max="3"
            step="1"
            value={foodSupplyLevel}
            onChange={(event) =>
              setFoodSupplyLevel(Number(event.target.value))
            }
          />

          <label htmlFor="energy-supply">
            ⚡ {t('supply.energyForPopulation')}{' '}
            <strong>
              {energySupplyLevel} –{' '}
              {t(supplyLabelKeys[energySupplyLevel])}
            </strong>
          </label>

          <input
            id="energy-supply"
            type="range"
            min="0"
            max="3"
            step="1"
            value={energySupplyLevel}
            onChange={(event) =>
              setEnergySupplyLevel(Number(event.target.value))
            }
          />

          <SupplyRoundOverview
            round={gameState.round}
            currentResources={localColony.resources}
            nextResources={plannedLocalColony.resources}
            report={plannedRound.report}
            populationBefore={localColony.population}
            populationAfter={plannedLocalColony.population}
            totalHarvesters={localColony.harvesters}
            assignedHarvesters={Object.keys(harvesters).length}
            supplyShortage={supplyPreview.hasShortage}
            harvesterEnergyShortage={
              hasHarvesterEnergyShortage(
                supplyPreview,
                Object.keys(harvesters).length,
              )
            }
          />
                  </section>
                )}

                {headquartersView === 'storage' && (
                  <section className="round-actions">
              <button
                className="round-button"
                type="button"
                onClick={executeRound}
              >
                {t('round.execute')}
              </button>

              <p>
                {t('round.executeHint', {
                  food: foodSupplyLevel,
                  energy: energySupplyLevel,
                })}
              </p>
                  </section>
                )}
              </>
            )}
          </>
        )}

        {activeLocalEvent !== null &&
          activeMarket === null &&
          gameState.landAuctionTie === null &&
          !showLeaderboard &&
          !showRoundBriefing && (
            <LocalEventNotice
              event={activeLocalEvent}
              round={gameState.round}
              onDismiss={dismissLocalEvent}
            />
          )}

        <button
          className="secondary-button"
          type="button"
          onClick={() => setGameStarted(false)}
        >
          {t('app.backToStart')}
        </button>
      </main>
    )
  }

  if (showMultiplayerLobby) {
    return (
      <MultiplayerLobbyScreen
        initialInvite={initialMultiplayerInvite}
        onBack={() => setShowMultiplayerLobby(false)}
      />
    )
  }

  if (showIntroSequence) {
    return (
      <IntroSequence
        onComplete={() => {
          setShowIntroSequence(false)
          setGameStarted(true)
        }}
      />
    )
  }

  return (
    <main className="start-screen">
      <div className="start-card">
        <p className="eyebrow">
          {t('start.tagline')}
        </p>

        <h1>E.L.U.M.</h1>

        <p className="subtitle">
          {t('start.subtitle')}
        </p>

        <button
          className="start-button"
          type="button"
          onClick={startNewGame}
        >
          {t('start.newColony')}
        </button>

        <button
          className="secondary-button multiplayer-start-button"
          type="button"
          onClick={() => setShowMultiplayerLobby(true)}
        >
          {t('start.multiplayer')}
        </button>

        <p className="version">{t('start.version')}</p>
      </div>
    </main>
  )
}

export default App
