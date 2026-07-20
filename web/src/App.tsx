import { useState } from 'react'
import './App.css'

function App() {
  const [gameStarted, setGameStarted] = useState(false)

  if (gameStarted) {
    return (
      <main className="game-screen">
        <header className="game-header">
          <div>
            <span className="eyebrow">E.L.U.M.</span>
            <h1>Kolonie Agima</h1>
          </div>

          <div className="round-badge">Runde 1</div>
        </header>

        <section className="status-panel">
          <h2>Status</h2>

          <div className="status-grid">
            <div className="status-item">
              <span>👥 Bevölkerung</span>
              <strong>10</strong>
            </div>

            <div className="status-item">
              <span>💰 Credits</span>
              <strong>100</strong>
            </div>

            <div className="status-item">
              <span>🌾 Nahrung</span>
              <strong>10</strong>
            </div>

            <div className="status-item">
              <span>⚡ Energie</span>
              <strong>10</strong>
            </div>

            <div className="status-item">
              <span>⛏ Erz</span>
              <strong>5</strong>
            </div>

            <div className="status-item">
              <span>💎 Kristalle</span>
              <strong>0</strong>
            </div>
          </div>
        </section>

        <section className="prototype-panel">
          <div className="planet-placeholder">AGIMA</div>

          <h2>Die erste Kolonie wartet.</h2>
          <p>
            Als Nächstes bauen wir hier die Hexkarte, das HQ und die ersten
            Harvester ein.
          </p>
        </section>

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
        <p className="eyebrow">Exploration · Logistics · Utilization · Mining</p>

        <h1>E.L.U.M.</h1>

        <p className="subtitle">
          Errichte auf Agima die erfolgreichste Kolonie.
        </p>

        <button
          className="start-button"
          type="button"
          onClick={() => setGameStarted(true)}
        >
          Neue Kolonie
        </button>

        <p className="version">Prototype 0.1</p>
      </div>
    </main>
  )
}

export default App