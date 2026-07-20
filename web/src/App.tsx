import { useState } from 'react'
import HexMap from './components/HexMap'
import {
  createInitialGameState,
  runRound,
  type HarvesterAssignments,
  type ProductionType,
  type RoundReport,
} from './game'
import './App.css'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameState, setGameState] = useState(
    createInitialGameState,
  )
  const [harvesters, setHarvesters] =
    useState<HarvesterAssignments>({})
  const [lastReport, setLastReport] =
    useState<RoundReport | null>(null)

  const freeHarvesters =
    2 - Object.keys(harvesters).length

  const startNewGame = () => {
    setGameState(createInitialGameState())
    setHarvesters({})
    setLastReport(null)
    setGameStarted(true)
  }

  const assignHarvester = (
    tileId: string,
    production: ProductionType,
  ) => {
    if (freeHarvesters <= 0 || harvesters[tileId]) {
      return
    }

    setHarvesters((currentHarvesters) => ({
      ...currentHarvesters,
      [tileId]: production,
    }))
  }

  const executeRound = () => {
    const result = runRound(gameState, harvesters)

    setGameState(result.nextState)
    setLastReport(result.report)
  }

  if (gameStarted) {
    return (
      <main className="game-screen">
        <header className="game-header">
          <div>
            <span className="eyebrow">E.L.U.M.</span>
            <h1>Kolonie Agima</h1>
          </div>

          <div className="round-badge">
            Runde {gameState.round}
          </div>
        </header>

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

        <HexMap
          population={gameState.population}
          freeHarvesters={freeHarvesters}
          harvesters={harvesters}
          onAssignHarvester={assignHarvester}
        />

        <section className="round-actions">
          <button
            className="round-button"
            type="button"
            onClick={executeRound}
          >
            Runde ausführen
          </button>

          <p>
            Versorgung: 2 Nahrung und 2 Energie je zehn
            Einwohner. Jeder aktive Harvester benötigt eine
            Energie.
          </p>
        </section>

        {lastReport && (
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