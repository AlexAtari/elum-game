import { useState } from 'react'
import {
  productionTypes,
  tiles,
  type HarvesterAssignments,
  type ProductionType,
} from '../game'
import './HexMap.css'

type HexMapProps = {
  population: number
  freeHarvesters: number
  harvesters: HarvesterAssignments
  onAssignHarvester: (
    tileId: string,
    production: ProductionType,
  ) => void
  onRemoveHarvester: (tileId: string) => void
}

function createHexPoints(x: number, y: number, radius: number) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (60 * index * Math.PI) / 180

    return `${x + radius * Math.cos(angle)},${
      y + radius * Math.sin(angle)
    }`
  }).join(' ')
}

function formatStars(value = 0) {
  return `${'★'.repeat(value)}${'☆'.repeat(5 - value)}`
}

function HexMap({
  population,
  freeHarvesters,
  harvesters,
  onAssignHarvester,
  onRemoveHarvester,
}: HexMapProps) {
  const [selectedId, setSelectedId] = useState('A')
  const [isChoosingProduction, setIsChoosingProduction] =
    useState(false)

  const selectedTile =
    tiles.find((tile) => tile.id === selectedId) ?? tiles[0]!

  const selectedProduction = harvesters[selectedTile.id]

  const selectTile = (tileId: string) => {
    setSelectedId(tileId)
    setIsChoosingProduction(false)
  }

  const assignHarvester = (production: ProductionType) => {
    if (
      selectedTile.owner !== 'player' ||
      freeHarvesters <= 0 ||
      selectedProduction
    ) {
      return
    }

    onAssignHarvester(selectedTile.id, production)
    setIsChoosingProduction(false)
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
            const production = harvesters[tile.id]

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
                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {
                    selectTile(tile.id)
                  }
                }}
              >
                <polygon
                  points={createHexPoints(tile.x, tile.y, 83)}
                />

                <text
                  className="hex-label"
                  x={tile.x}
                  y={tile.y + 7}
                  textAnchor="middle"
                >
                  {tile.id}
                </text>

                {tile.owner === 'player' && !production && (
                  <text
                    className="hex-owner-label"
                    x={tile.x}
                    y={tile.y + 32}
                    textAnchor="middle"
                  >
                    DEIN FELD
                  </text>
                )}

                {production && (
                  <text
                    className="hex-production-label"
                    x={tile.x}
                    y={tile.y + 38}
                    textAnchor="middle"
                  >
                    🚜 {productionTypes[production].icon}
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
                Hier leben die Einwohner der Kolonie. Außerdem
                befinden sich hier Lager, freie Harvester und der
                Zugang zum Markt.
              </p>

              <div className="detail-row">
                <span>👥 Bevölkerung</span>
                <strong>{population}</strong>
              </div>

              <div className="detail-row">
                <span>🚜 Freie Harvester</span>
                <strong>{freeHarvesters}</strong>
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

              {selectedTile.owner === 'player' &&
                selectedProduction && (
                  <div className="harvester-status">
                    <span>🚜 Harvester aktiv</span>
                    <strong>
                      {productionTypes[selectedProduction].icon}{' '}
                      {productionTypes[selectedProduction].label}
                    </strong>

                    <button
                      className="remove-harvester-button"
                      type="button"
                      onClick={() =>
                        onRemoveHarvester(selectedTile.id)
                      }
                    >
                      Harvester entfernen
                    </button>
                  </div>
                )}

              {selectedTile.owner === 'player' &&
                !selectedProduction &&
                !isChoosingProduction && (
                  <button
                    className="field-button"
                    type="button"
                    disabled={freeHarvesters === 0}
                    onClick={() =>
                      setIsChoosingProduction(true)
                    }
                  >
                    {freeHarvesters > 0
                      ? 'Harvester einsetzen'
                      : 'Keine freien Harvester'}
                  </button>
                )}

              {selectedTile.owner === 'player' &&
                !selectedProduction &&
                isChoosingProduction && (
                  <div className="production-picker">
                    <p>
                      Was soll der Harvester produzieren?
                    </p>

                    <div className="production-options">
                      {(
                        Object.keys(
                          productionTypes,
                        ) as ProductionType[]
                      ).map((production) => (
                        <button
                          key={production}
                          className="production-button"
                          type="button"
                          onClick={() =>
                            assignHarvester(production)
                          }
                        >
                          <span>
                            {productionTypes[production].icon}
                          </span>
                          {productionTypes[production].label}
                        </button>
                      ))}
                    </div>

                    <button
                      className="cancel-button"
                      type="button"
                      onClick={() =>
                        setIsChoosingProduction(false)
                      }
                    >
                      Abbrechen
                    </button>
                  </div>
                )}

              {selectedTile.owner === 'free' && (
                <button
                  className="field-button"
                  type="button"
                  disabled
                >
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