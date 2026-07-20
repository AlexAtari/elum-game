import { useState } from 'react'
import './HexMap.css'

type TileOwner = 'hq' | 'player' | 'free'

type Tile = {
  id: string
  x: number
  y: number
  owner: TileOwner
  food?: number
  energy?: number
  ore?: number
}

const tiles: Tile[] = [
  { id: 'HQ', x: 350, y: 250, owner: 'hq' },

  { id: 'A', x: 350, y: 95, owner: 'player', food: 4, energy: 2, ore: 4 },
  { id: 'B', x: 485, y: 170, owner: 'player', food: 3, energy: 4, ore: 2 },

  { id: 'C', x: 485, y: 330, owner: 'free', food: 2, energy: 5, ore: 1 },
  { id: 'D', x: 350, y: 405, owner: 'free', food: 1, energy: 3, ore: 5 },
  { id: 'E', x: 215, y: 330, owner: 'free', food: 5, energy: 2, ore: 2 },
  { id: 'F', x: 215, y: 170, owner: 'free', food: 2, energy: 3, ore: 4 },
]

function createHexPoints(x: number, y: number, radius: number) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = ((60 * index + 30) * Math.PI) / 180

    return `${x + radius * Math.cos(angle)},${y + radius * Math.sin(angle)}`
  }).join(' ')
}

function formatStars(value = 0) {
  return `${'★'.repeat(value)}${'☆'.repeat(5 - value)}`
}

function HexMap() {
  const [selectedId, setSelectedId] = useState('A')

  const selectedTile =
    tiles.find((tile) => tile.id === selectedId) ?? tiles[1]

  const selectTile = (tileId: string) => {
    setSelectedId(tileId)
  }

  return (
    <section className="map-panel">
      <div className="map-heading">
        <div>
          <p className="eyebrow">Planet Agima</p>
          <h2>Koloniegebiet</h2>
        </div>

        <span className="map-hint">Feld auswählen</span>
      </div>

      <div className="map-layout">
        <svg
          className="hex-map"
          viewBox="0 0 700 500"
          aria-label="Hexkarte der Kolonie"
        >
          {tiles.map((tile) => {
            const isSelected = tile.id === selectedId

            return (
              <g
                key={tile.id}
                className={[
                  'hex-tile',
                  tile.owner,
                  isSelected ? 'selected' : '',
                ].join(' ')}
                role="button"
                tabIndex={0}
                onClick={() => selectTile(tile.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    selectTile(tile.id)
                  }
                }}
              >
                <polygon points={createHexPoints(tile.x, tile.y, 83)} />

                <text
                  className="hex-label"
                  x={tile.x}
                  y={tile.y + 7}
                  textAnchor="middle"
                >
                  {tile.id}
                </text>

                {tile.owner === 'player' && (
                  <text
                    className="hex-owner-label"
                    x={tile.x}
                    y={tile.y + 32}
                    textAnchor="middle"
                  >
                    DEIN FELD
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        <aside className="tile-details">
          {selectedTile.owner === 'hq' ? (
            <>
              <p className="eyebrow">Zentrale</p>
              <h3>Hauptquartier</h3>

              <p>
                Hier leben die Einwohner der Kolonie. Außerdem befinden sich
                hier Lager, freie Harvester und der Zugang zum Markt.
              </p>

              <div className="detail-row">
                <span>👥 Bevölkerung</span>
                <strong>10</strong>
              </div>

              <div className="detail-row">
                <span>🚜 Freie Harvester</span>
                <strong>2</strong>
              </div>
            </>
          ) : (
            <>
              <p className="eyebrow">
                {selectedTile.owner === 'player'
                  ? 'Eigenes Grundstück'
                  : 'Freies Grundstück'}
              </p>

              <h3>Feld {selectedTile.id}</h3>

              <div className="resource-rating">
                <span>🌾 Nahrung</span>
                <strong>{formatStars(selectedTile.food)}</strong>
              </div>

              <div className="resource-rating">
                <span>⚡ Energie</span>
                <strong>{formatStars(selectedTile.energy)}</strong>
              </div>

              <div className="resource-rating">
                <span>⛏ Erz</span>
                <strong>{formatStars(selectedTile.ore)}</strong>
              </div>

              {selectedTile.owner === 'player' ? (
                <button className="field-button" type="button">
                  Harvester einsetzen
                </button>
              ) : (
                <button className="field-button" type="button" disabled>
                  Noch nicht im Besitz
                </button>
              )}
            </>
          )}
        </aside>
      </div>
    </section>
  )
}

export default HexMap