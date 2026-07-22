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
import './App.css'

const supplyLabels = [
  'Keine Versorgung',
  'Mindestversorgung',
  'Normalversorgung',
  'Überversorgung',
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
            <h1>Kolonie Agima</h1>
          </div>

          <div className="round-badge">
            {gameState.landAuctionTie !== null
              ? `Stichauktion · Runde ${gameState.round}`
              : activeMarket !== null
              ? `Markt · Runde ${activeMarket.roundPlayed}`
              : showLeaderboard && lastReport
                ? `Zwischenstand · Runde ${lastReport.roundPlayed}`
                : `Runde ${gameState.round}`}
          </div>
        </header>

        {activeMarket === null &&
          gameState.landAuctionTie === null &&
          !showLeaderboard && (
          <section className="status-panel">
            <h2>Status</h2>

            <div className="status-grid">
              <div className="status-item">
                <span>👥 Bevölkerung</span>
                <strong>{gameState.population}</strong>
              </div>

              <div className="status-item">
                <span>💰 Credits</span>
                <strong>{gameState.credits}</strong>
              </div>

              <div className="status-item">
                <span>🌾 Nahrung</span>
                <strong>{gameState.resources.food}</strong>
              </div>

              <div className="status-item">
                <span>⚡ Energie</span>
                <strong>{gameState.resources.energy}</strong>
              </div>

              <div className="status-item">
                <span>⛏ Erz</span>
                <strong>{gameState.resources.ore}</strong>
              </div>

              <div className="status-item">
                <span>💎 Kristalle</span>
                <strong>{gameState.resources.crystals}</strong>
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
            nextResource={null}
            invitationSeconds={10}
            initiatorName="Agima"
            completionLabel="Zurück zur Planung"
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
          <h2>Versorgung planen</h2>

          <label htmlFor="food-supply">
            🌾 Nahrung für Bevölkerung:{' '}
            <strong>
              {foodSupplyLevel} – {supplyLabels[foodSupplyLevel]}
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
            ⚡ Energie für Bevölkerung:{' '}
            <strong>
              {energySupplyLevel} – {supplyLabels[energySupplyLevel]}
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
              Vorschau Runde {gameState.round}
            </p>

            <div className="supply-preview-grid">
              <div className="supply-preview-item">
                <span>Versorgung</span>
                <strong>
                  🌾 {supplyPreview.consumedFood}/
                  {supplyPreview.plannedFood} · ⚡{' '}
                  {supplyPreview.consumedEnergyByHq}/
                  {supplyPreview.plannedEnergy}
                </strong>
              </div>

              <div className="supply-preview-item">
                <span>Harvesterenergie</span>
                <strong>
                  ⚡ {plannedRound.report.consumedEnergyByHarvesters}
                </strong>
              </div>

              <div className="supply-preview-item">
                <span>Produktion</span>
                <strong>
                  🌾 {plannedRound.report.produced.food} · ⚡{' '}
                  {plannedRound.report.produced.energy} · ⛏{' '}
                  {plannedRound.report.produced.ore}
                </strong>
              </div>

              <div className="supply-preview-item">
                <span>Danach im Vorrat</span>
                <strong>
                  🌾 {plannedRound.nextState.resources.food} · ⚡{' '}
                  {plannedRound.nextState.resources.energy} · ⛏{' '}
                  {plannedRound.nextState.resources.ore}
                </strong>
              </div>

              <div className="supply-preview-item">
                <span>Erwartete Bevölkerung</span>
                <strong>
                  {gameState.population} →{' '}
                  {plannedRound.nextState.population}
                </strong>
              </div>
            </div>

            <p className="supply-preview-note">
              Vorschau vor der Rundenabrechnung. Bereits
              abgeschlossene Marktgeschäfte sind enthalten.
            </p>

            {supplyPreview.hasShortage && (
              <p className="supply-warning">
                ⚠️ Die Vorräte reichen nicht für die gewählte
                Versorgung.
              </p>
            )}

            {plannedRound.report.inactiveHarvesterIds.length >
              0 && (
              <p className="supply-warning">
                ⚠️ Wegen Energiemangels würden deaktiviert:{' '}
                {plannedRound.report.inactiveHarvesterIds.join(
                  ', ',
                )}
              </p>
            )}

            {plannedRound.report.pausedRetoolingIds.length > 0 && (
              <p className="supply-warning">
                ⚠️ Einrichtung/Umrüstung würde pausieren:{' '}
                {plannedRound.report.pausedRetoolingIds.join(', ')}
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
                Runde ausführen
              </button>

              <p>
                Die Runde wird jetzt ohne automatische
                Marktphase abgerechnet. Starte gewünschte
                Auktionen vorher. Gewählt: {foodSupplyLevel}{' '}
                Nahrung und {energySupplyLevel} Energie je zehn
                Einwohner.
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
              Abrechnung Runde {lastReport.roundPlayed}
            </p>

            <h2>Rundenergebnis</h2>

            <div className="report-grid">
              <div className="report-item">
                <span>Produktion</span>
                <strong>
                  🌾 {lastReport.produced.food} · ⚡{' '}
                  {lastReport.produced.energy} · ⛏{' '}
                  {lastReport.produced.ore}
                </strong>
              </div>

              <div className="report-item">
                <span>Versorgung</span>
                <strong>
                  🌾 {lastReport.consumedFood} · ⚡{' '}
                  {lastReport.consumedEnergyByHq}
                </strong>
              </div>

              <div className="report-item">
                <span>Harvesterenergie</span>
                <strong>
                  ⚡ {lastReport.consumedEnergyByHarvesters}
                </strong>
              </div>

              <div className="report-item">
                <span>Bevölkerung</span>
                <strong>
                  {lastReport.populationChange > 0 ? '+' : ''}
                  {lastReport.populationChange}
                </strong>
              </div>
            </div>

            {lastReport.inactiveHarvesterIds.length > 0 && (
              <p className="report-warning">
                Wegen Energiemangels deaktiviert:{' '}
                {lastReport.inactiveHarvesterIds.join(', ')}
              </p>
            )}

            {lastReport.completedRetoolingIds.length > 0 && (
              <p className="report-success">
                Einrichtung/Umrüstung abgeschlossen:{' '}
                {lastReport.completedRetoolingIds.join(', ')}
              </p>
            )}

            {lastReport.pausedRetoolingIds.length > 0 && (
              <p className="report-warning">
                Einrichtung/Umrüstung wegen Energiemangels
                pausiert:{' '}
                {lastReport.pausedRetoolingIds.join(', ')}
              </p>
            )}

            {lastReport.landAuction?.outcome === 'won' && (
              <p className="report-success">
                Auktion gewonnen: Feld{' '}
                {lastReport.landAuction.tileId} für{' '}
                {lastReport.landAuction.playerBid} Credits. Orion
                bot {lastReport.landAuction.rivalBid} Credits.
              </p>
            )}

            {lastReport.landAuction?.outcome === 'lost' && (
              <p className="report-warning">
                Orion erhält Feld {lastReport.landAuction.tileId}
                {' '}für {lastReport.landAuction.rivalBid} Credits.
                Dein Gebot von{' '}
                {lastReport.landAuction.playerBid} Credits wurde
                erstattet.
              </p>
            )}

            {lastReport.completedHarvesters > 0 && (
              <p className="report-success">
                Neue Harvester fertiggestellt:{' '}
                {lastReport.completedHarvesters}
              </p>
            )}

          </section>
        )}

        <button
          className="secondary-button"
          type="button"
          onClick={() => setGameStarted(false)}
        >
          Zurück zum Start
        </button>
      </main>
    )
  }

  return (
    <main className="start-screen">
      <div className="start-card">
        <p className="eyebrow">
          Exploration · Logistics · Utilization · Mining
        </p>

        <h1>E.L.U.M.</h1>

        <p className="subtitle">
          Errichte auf Agima die erfolgreichste Kolonie.
        </p>

        <button
          className="start-button"
          type="button"
          onClick={startNewGame}
        >
          Neue Kolonie
        </button>

        <p className="version">Prototype 0.2</p>
      </div>
    </main>
  )
}

export default App
