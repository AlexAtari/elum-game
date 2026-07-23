import { useCallback, useMemo, useState } from 'react'
import HexMap from './components/HexMap'
import LandTieAuctionPanel from './components/LandTieAuctionPanel'
import LeaderboardPanel from './components/LeaderboardPanel'
import MarketLauncher from './components/MarketLauncher'
import MarketPanel from './components/MarketPanel'
import {
  beginLandTieBreak,
  cancelLandBid,
  calculateSupplyPreview,
  completeResourceMarket,
  createLeaderboardEntries,
  createInitialGameState,
  executeMarketTrade,
  initiateResourceMarket,
  orderHarvesterBuild,
  placeLandBid,
  resolveLandTieBreak,
  runRound,
  type FreeHarvester,
  type HarvesterAssignments,
  type LandTieBidState,
  type MarketCounterparty,
  type MarketDirection,
  type MarketResource,
  type ProductionType,
  type RoundReport,
  type SupplyPlan,
} from './game'
import { useI18n } from './i18n/I18nContext'
import './App.css'

const supplyLabelKeys = [
  'supply.none',
  'supply.minimum',
  'supply.normal',
  'supply.extra',
] as const

type ActiveMarket = {
  roundPlayed: number
  resource: MarketResource
}

type PendingRound = {
  harvesters: HarvesterAssignments
  supplyPlan: SupplyPlan
}

function App() {
  const { number, t } = useI18n()
  const [gameStarted, setGameStarted] = useState(false)
  const [gameState, setGameState] = useState(
    createInitialGameState,
  )
  const [harvesters, setHarvesters] =
    useState<HarvesterAssignments>({})
  const [freeHarvesterPool, setFreeHarvesterPool] = useState<
    FreeHarvester[]
  >([{}, {}])
  const [lastReport, setLastReport] =
    useState<RoundReport | null>(null)
  const [foodSupplyLevel, setFoodSupplyLevel] = useState(2)
  const [energySupplyLevel, setEnergySupplyLevel] = useState(2)
  const [activeMarket, setActiveMarket] =
    useState<ActiveMarket | null>(null)
  const [pendingRound, setPendingRound] =
    useState<PendingRound | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const freeHarvesters = freeHarvesterPool.length
  const totalHarvesters =
    freeHarvesters + Object.keys(harvesters).length
  const activeResourceMarket = activeMarket
    ? gameState.market[activeMarket.resource]
    : null

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

  const leaderboardEntries = useMemo(
    () =>
      createLeaderboardEntries(
        gameState,
        totalHarvesters,
      ),
    [gameState, totalHarvesters],
  )

  const startNewGame = () => {
    setGameState(createInitialGameState())
    setHarvesters({})
    setFreeHarvesterPool([{}, {}])
    setLastReport(null)
    setFoodSupplyLevel(2)
    setEnergySupplyLevel(2)
    setActiveMarket(null)
    setPendingRound(null)
    setShowLeaderboard(false)
    setGameStarted(true)
  }

  const assignHarvester = (
    tileId: string,
    production: ProductionType,
  ) => {
    if (freeHarvesters <= 0 || harvesters[tileId]) {
      return
    }

    const unusedHarvesterIndex = freeHarvesterPool.findIndex(
      (harvester) => harvester.previousProduction === undefined,
    )

    const selectedHarvesterIndex =
      unusedHarvesterIndex >= 0 ? unusedHarvesterIndex : 0

    const selectedHarvester =
      freeHarvesterPool[selectedHarvesterIndex]

    if (!selectedHarvester) {
      return
    }

    setFreeHarvesterPool((currentPool) =>
      currentPool.filter(
        (_, index) => index !== selectedHarvesterIndex,
      ),
    )

    setHarvesters((currentHarvesters) => ({
      ...currentHarvesters,
      [tileId]:
        selectedHarvester.previousProduction === undefined
          ? {
              production,
              isNew: true,
            }
          : {
              production: selectedHarvester.previousProduction,
              pendingProduction: production,
              retoolingReason: 'relocation',
              isNew: false,
            },
    }))
  }

  const changeHarvesterProduction = (
    tileId: string,
    production: ProductionType,
  ) => {
    setHarvesters((currentHarvesters) => {
      const currentAssignment = currentHarvesters[tileId]

      if (!currentAssignment) {
        return currentHarvesters
      }

      if (currentAssignment.isNew) {
        return {
          ...currentHarvesters,
          [tileId]: {
            production,
            isNew: true,
          },
        }
      }

      if (currentAssignment.retoolingReason === 'relocation') {
        return {
          ...currentHarvesters,
          [tileId]: {
            ...currentAssignment,
            pendingProduction: production,
          },
        }
      }

      if (production === currentAssignment.production) {
        return {
          ...currentHarvesters,
          [tileId]: {
            production: currentAssignment.production,
            isNew: false,
          },
        }
      }

      return {
        ...currentHarvesters,
        [tileId]: {
          ...currentAssignment,
          pendingProduction: production,
          retoolingReason: 'production-change',
        },
      }
    })
  }

  const removeHarvester = (tileId: string) => {
    const currentAssignment = harvesters[tileId]

    if (!currentAssignment) {
      return
    }

    setHarvesters((currentHarvesters) => {
      if (!currentHarvesters[tileId]) {
        return currentHarvesters
      }

      const updatedHarvesters = { ...currentHarvesters }
      delete updatedHarvesters[tileId]

      return updatedHarvesters
    })

    if (!currentAssignment.isNew) {
      setFreeHarvesterPool((currentPool) => [
        ...currentPool,
        { previousProduction: currentAssignment.production },
      ])
    } else {
      setFreeHarvesterPool((currentPool) => [
        ...currentPool,
        {},
      ])
    }
  }

  const submitLandBid = (tileId: string, amount: number) => {
    setGameState((currentState) =>
      placeLandBid(currentState, tileId, amount),
    )
  }

  const cancelLandOrder = () => {
    setGameState(cancelLandBid)
  }

  const buildHarvester = () => {
    setGameState(orderHarvesterBuild)
  }

  const tradeMarketResource = useCallback(
    (
      resource: MarketResource,
      direction: MarketDirection,
      price: number,
      counterparty: MarketCounterparty,
    ) => {
      setGameState((currentState) =>
        executeMarketTrade(
          currentState,
          resource,
          direction,
          price,
          counterparty,
        ),
      )
    },
    [],
  )

  const applyCompletedRound = useCallback(
    (completedRound: ReturnType<typeof runRound>) => {
      setGameState(completedRound.nextState)
      setHarvesters(completedRound.nextHarvesters)
      if (completedRound.report.completedHarvesters > 0) {
        setFreeHarvesterPool((currentPool) => [
          ...currentPool,
          ...Array.from(
            { length: completedRound.report.completedHarvesters },
            () => ({}),
          ),
        ])
      }
      setLastReport(completedRound.report)
      setPendingRound(null)
      setActiveMarket(null)
      setShowLeaderboard(true)
    },
    [],
  )

  const initiateMarket = useCallback(
    (resource: MarketResource) => {
      if (
        activeMarket !== null ||
        gameState.initiatedMarketResources.includes(resource)
      ) {
        return
      }

      setGameState((currentState) =>
        initiateResourceMarket(currentState, resource),
      )
      setActiveMarket({
        roundPlayed: gameState.round,
        resource,
      })
    },
    [activeMarket, gameState.initiatedMarketResources, gameState.round],
  )

  const completeMarketResource = useCallback(
    (resource: MarketResource) => {
      if (
        !activeMarket ||
        activeMarket.resource !== resource
      ) {
        return
      }

      setGameState((currentState) =>
        completeResourceMarket(currentState, resource),
      )
      setActiveMarket(null)
    },
    [activeMarket],
  )

  const completeLandTieAuction = useCallback(
    (bids: LandTieBidState) => {
      if (!pendingRound) {
        return
      }

      const resolvedState = resolveLandTieBreak(gameState, bids)
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

    setPendingRound(roundPlan)
    setLastReport(null)
    setShowLeaderboard(false)

    if (plannedRound.report.landAuction?.outcome === 'tie') {
      setGameState(beginLandTieBreak)
      return
    }

    applyCompletedRound(plannedRound)
  }

  const continueAfterLeaderboard = useCallback(() => {
    setShowLeaderboard(false)
  }, [])

  if (gameStarted) {
    return (
      <main
        className={`game-screen ${
          activeMarket !== null || gameState.landAuctionTie !== null
            ? 'market-screen'
            : ''
        }`}
      >
        <header className="game-header">
          <div>
            <span className="eyebrow">E.L.U.M.</span>
            <h1>{t('app.colonyName')}</h1>
          </div>

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
                ? t('app.leaderboardRound', {
                    round: lastReport.roundPlayed,
                  })
                : t('app.round', { round: gameState.round })}
          </div>
        </header>

        {activeMarket === null &&
          gameState.landAuctionTie === null &&
          !showLeaderboard && (
          <section className="status-panel">
            <h2>{t('app.status')}</h2>

            <div className="status-grid">
              <div className="status-item">
                <span>👥 {t('resource.population')}</span>
                <strong>{number(gameState.population)}</strong>
              </div>

              <div className="status-item">
                <span>💰 {t('resource.credits')}</span>
                <strong>{number(gameState.credits)}</strong>
              </div>

              <div className="status-item">
                <span>🌾 {t('resource.food')}</span>
                <strong>{number(gameState.resources.food)}</strong>
              </div>

              <div className="status-item">
                <span>⚡ {t('resource.energy')}</span>
                <strong>
                  {number(gameState.resources.energy)}
                </strong>
              </div>

              <div className="status-item">
                <span>⛏ {t('resource.ore')}</span>
                <strong>{number(gameState.resources.ore)}</strong>
              </div>

              <div className="status-item">
                <span>💎 {t('resource.crystals')}</span>
                <strong>
                  {number(gameState.resources.crystals)}
                </strong>
              </div>
            </div>
          </section>
        )}

        {gameState.landAuctionTie !== null ? (
          <LandTieAuctionPanel
            key={`${gameState.round}-${gameState.landAuctionTie.tileId}`}
            tie={gameState.landAuctionTie}
            credits={gameState.credits}
            orionCredits={gameState.rivals.orion.credits}
            onComplete={completeLandTieAuction}
          />
        ) : activeMarket !== null && activeResourceMarket ? (
          <MarketPanel
            key={`${activeMarket.roundPlayed}-${activeMarket.resource}`}
            roundPlayed={activeMarket.roundPlayed}
            resource={activeMarket.resource}
            resourceAmount={
              gameState.resources[activeMarket.resource]
            }
            credits={gameState.credits}
            referencePrice={activeResourceMarket.referencePrice}
            warehouseStock={activeResourceMarket.warehouseStock}
            rivalResourceAmounts={{
              orion:
                gameState.rivals.orion.resources[
                  activeMarket.resource
                ],
              nova:
                gameState.rivals.nova.resources[
                  activeMarket.resource
                ],
              vega:
                gameState.rivals.vega.resources[
                  activeMarket.resource
                ],
            }}
            nextResource={null}
            initiatorName="Agima"
            completionLabel={t('market.backToPlanning')}
            onTrade={tradeMarketResource}
            onComplete={completeMarketResource}
          />
        ) : showLeaderboard && lastReport ? (
          <LeaderboardPanel
            roundPlayed={lastReport.roundPlayed}
            nextRound={gameState.round}
            entries={leaderboardEntries}
            onContinue={continueAfterLeaderboard}
          />
        ) : (
          <>
            <HexMap
              population={gameState.population}
              credits={gameState.credits}
              ore={gameState.resources.ore}
              ownedTileIds={gameState.ownedTileIds}
              opponentTileIds={gameState.opponentTileIds}
              pendingLandBid={gameState.pendingLandBid}
              landAuctionTie={gameState.landAuctionTie}
              freeHarvesters={freeHarvesters}
              harvestersInConstruction={
                gameState.harvestersInConstruction
              }
              harvesters={harvesters}
              onBuildHarvester={buildHarvester}
              onPlaceLandBid={submitLandBid}
              onCancelLandOrder={cancelLandOrder}
              onAssignHarvester={assignHarvester}
              onChangeHarvesterProduction={
                changeHarvesterProduction
              }
              onRemoveHarvester={removeHarvester}
            />

            <MarketLauncher
              initiatedResources={
                gameState.initiatedMarketResources
              }
              onInitiate={initiateMarket}
            />

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

          <div className="supply-preview">
            <p className="eyebrow">
              {t('supply.previewRound', {
                round: gameState.round,
              })}
            </p>

            <div className="supply-preview-grid">
              <div className="supply-preview-item">
                <span>{t('supply.supply')}</span>
                <strong>
                  🌾 {supplyPreview.consumedFood}/
                  {supplyPreview.plannedFood} · ⚡{' '}
                  {supplyPreview.consumedEnergyByHq}/
                  {supplyPreview.plannedEnergy}
                </strong>
              </div>

              <div className="supply-preview-item">
                <span>{t('supply.harvesterEnergy')}</span>
                <strong>
                  ⚡ {plannedRound.report.consumedEnergyByHarvesters}
                </strong>
              </div>

              <div className="supply-preview-item">
                <span>{t('supply.production')}</span>
                <strong>
                  🌾 {plannedRound.report.produced.food} · ⚡{' '}
                  {plannedRound.report.produced.energy} · ⛏{' '}
                  {plannedRound.report.produced.ore}
                </strong>
              </div>

              <div className="supply-preview-item">
                <span>{t('supply.stockAfterRound')}</span>
                <strong>
                  🌾 {plannedRound.nextState.resources.food} · ⚡{' '}
                  {plannedRound.nextState.resources.energy} · ⛏{' '}
                  {plannedRound.nextState.resources.ore}
                </strong>
              </div>

              <div className="supply-preview-item">
                <span>{t('supply.expectedPopulation')}</span>
                <strong>
                  {gameState.population} →{' '}
                  {plannedRound.nextState.population}
                </strong>
              </div>
            </div>

            <p className="supply-preview-note">
              {t('supply.previewNote')}
            </p>

            {supplyPreview.hasShortage && (
              <p className="supply-warning">
                {t('supply.shortage')}
              </p>
            )}

            {plannedRound.report.inactiveHarvesterIds.length >
              0 && (
              <p className="supply-warning">
                {t('supply.inactiveHarvesters', {
                  ids: plannedRound.report.inactiveHarvesterIds.join(
                    ', ',
                  ),
                })}
              </p>
            )}

            {plannedRound.report.pausedRetoolingIds.length > 0 && (
              <p className="supply-warning">
                {t('supply.pausedRetooling', {
                  ids: plannedRound.report.pausedRetoolingIds.join(
                    ', ',
                  ),
                })}
              </p>
            )}
          </div>
            </section>

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
          </>
        )}

        {activeMarket === null &&
          gameState.landAuctionTie === null &&
          !showLeaderboard &&
          lastReport && (
          <section className="round-report">
            <p className="eyebrow">
              {t('round.calculation', {
                round: lastReport.roundPlayed,
              })}
            </p>

            <h2>{t('round.result')}</h2>

            <div className="report-grid">
              <div className="report-item">
                <span>{t('supply.production')}</span>
                <strong>
                  🌾 {lastReport.produced.food} · ⚡{' '}
                  {lastReport.produced.energy} · ⛏{' '}
                  {lastReport.produced.ore}
                </strong>
              </div>

              <div className="report-item">
                <span>{t('supply.supply')}</span>
                <strong>
                  🌾 {lastReport.consumedFood} · ⚡{' '}
                  {lastReport.consumedEnergyByHq}
                </strong>
              </div>

              <div className="report-item">
                <span>{t('supply.harvesterEnergy')}</span>
                <strong>
                  ⚡ {lastReport.consumedEnergyByHarvesters}
                </strong>
              </div>

              <div className="report-item">
                <span>{t('round.population')}</span>
                <strong>
                  {lastReport.populationChange > 0 ? '+' : ''}
                  {lastReport.populationChange}
                </strong>
              </div>
            </div>

            {lastReport.inactiveHarvesterIds.length > 0 && (
              <p className="report-warning">
                {t('round.inactiveHarvesters', {
                  ids: lastReport.inactiveHarvesterIds.join(', '),
                })}
              </p>
            )}

            {lastReport.completedRetoolingIds.length > 0 && (
              <p className="report-success">
                {t('round.completedRetooling', {
                  ids: lastReport.completedRetoolingIds.join(', '),
                })}
              </p>
            )}

            {lastReport.pausedRetoolingIds.length > 0 && (
              <p className="report-warning">
                {t('round.pausedRetooling', {
                  ids: lastReport.pausedRetoolingIds.join(', '),
                })}
              </p>
            )}

            {lastReport.landAuction?.outcome === 'won' && (
              <p className="report-success">
                {t('round.landWon', {
                  tile: lastReport.landAuction.tileId,
                  playerBid: lastReport.landAuction.playerBid,
                  rivalBid: lastReport.landAuction.rivalBid,
                })}
              </p>
            )}

            {lastReport.landAuction?.outcome === 'lost' && (
              <p className="report-warning">
                {t('round.landLost', {
                  tile: lastReport.landAuction.tileId,
                  playerBid: lastReport.landAuction.playerBid,
                  rivalBid: lastReport.landAuction.rivalBid,
                })}
              </p>
            )}

            {lastReport.completedHarvesters > 0 && (
              <p className="report-success">
                {t('round.completedHarvesters', {
                  amount: lastReport.completedHarvesters,
                })}
              </p>
            )}

          </section>
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

        <p className="version">{t('start.version')}</p>
      </div>
    </main>
  )
}

export default App
