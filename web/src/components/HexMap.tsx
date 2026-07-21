import { useState } from 'react'
import {
  LAND_MINIMUM_BID,
  productionTypes,
  tiles,
  type HarvesterAssignments,
  type LandAuctionTie,
  type LandBid,
  type ProductionType,
} from '../game'
import './HexMap.css'

type HexMapProps = {
  population: number
  credits: number
  ownedTileIds: string[]
  opponentTileIds: string[]
  pendingLandBid: LandBid | null
  landAuctionTie: LandAuctionTie | null
  freeHarvesters: number
  harvesters: HarvesterAssignments
  onPlaceLandBid: (tileId: string, amount: number) => void
  onCancelLandOrder: () => void
  onAssignHarvester: (
    tileId: string,
    production: ProductionType,
  ) => void
  onChangeHarvesterProduction: (
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
  credits,
  ownedTileIds,
  opponentTileIds,
  pendingLandBid,
  landAuctionTie,
  freeHarvesters,
  harvesters,
  onPlaceLandBid,
  onCancelLandOrder,
  onAssignHarvester,
  onChangeHarvesterProduction,
  onRemoveHarvester,
}: HexMapProps) {
  const [selectedId, setSelectedId] = useState('A')
  const [isChoosingProduction, setIsChoosingProduction] =
    useState(false)
  const [bidAmount, setBidAmount] = useState(LAND_MINIMUM_BID)

  const selectedTile =
    tiles.find((tile) => tile.id === selectedId) ?? tiles[0]!

  const selectedHarvester = harvesters[selectedTile.id]
  const selectedProduction = selectedHarvester?.production
  const selectedIsPlayerOwned = ownedTileIds.includes(
    selectedTile.id,
  )
  const selectedIsOpponentOwned = opponentTileIds.includes(
    selectedTile.id,
  )
  const selectedPendingBid =
    pendingLandBid?.tileId === selectedTile.id
      ? pendingLandBid
      : null
  const selectedAuctionTie =
    landAuctionTie?.tileId === selectedTile.id
      ? landAuctionTie
      : null
  const minimumBid =
    selectedAuctionTie?.minimumBid ?? LAND_MINIMUM_BID
  const effectiveBidAmount = Math.max(bidAmount, minimumBid)

  const selectTile = (tileId: string) => {
    setSelectedId(tileId)
    setIsChoosingProduction(false)
    setBidAmount(
      landAuctionTie?.tileId === tileId
        ? landAuctionTie.minimumBid
        : LAND_MINIMUM_BID,
    )
  }

  const assignHarvester = (production: ProductionType) => {
    if (
      !selectedIsPlayerOwned ||
      freeHarvesters <= 0 ||
      selectedProduction
    ) {
      return
    }

    onAssignHarvester(selectedTile.id, production)
    setIsChoosingProduction(false)
  }

  const changeHarvesterProduction = (
    production: ProductionType,
  ) => {
    if (!selectedHarvester) {
      return
    }

    onChangeHarvesterProduction(selectedTile.id, production)
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
            const harvester = harvesters[tile.id]
            const production = harvester?.production
            const isPlayerOwned = ownedTileIds.includes(tile.id)
            const isOpponentOwned = opponentTileIds.includes(
              tile.id,
            )
            const hasPendingBid = pendingLandBid?.tileId === tile.id
            const hasAuctionTie = landAuctionTie?.tileId === tile.id
            const ownershipClass =
              tile.owner === 'hq'
                ? 'hq'
                : isPlayerOwned
                  ? 'player'
                  : isOpponentOwned
                    ? 'opponent'
                    : hasPendingBid || hasAuctionTie
                    ? 'pending'
                    : 'free'

            return (
              <g
                key={tile.id}
                className={[
                  'hex-tile',
                  ownershipClass,
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

                {isPlayerOwned && !production && (
                  <text
                    className="hex-owner-label"
                    x={tile.x}
                    y={tile.y + 32}
                    textAnchor="middle"
                  >
                    DEIN FELD
                  </text>
                )}

                {isOpponentOwned && (
                  <text
                    className="hex-opponent-label"
                    x={tile.x}
                    y={tile.y + 32}
                    textAnchor="middle"
                  >
                    ORION
                  </text>
                )}

                {(hasPendingBid || hasAuctionTie) && (
                  <text
                    className="hex-pending-label"
                    x={tile.x}
                    y={tile.y + 32}
                    textAnchor="middle"
                  >
                    {hasAuctionTie ? 'STICHAUKTION' : 'GEBOT'}
                  </text>
                )}

                {harvester && (
                  <text
                    className="hex-production-label"
                    x={tile.x}
                    y={tile.y + 38}
                    textAnchor="middle"
                  >
                    {harvester.pendingProduction ? '🔧' : '🚜'}{' '}
                    {
                      productionTypes[
                        harvester.pendingProduction ?? production!
                      ].icon
                    }
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
                {selectedIsPlayerOwned
                  ? 'Eigenes Grundstück'
                  : selectedIsOpponentOwned
                    ? 'Konsortium Orion'
                    : selectedAuctionTie
                      ? 'Stichauktion'
                      : selectedPendingBid
                        ? 'Gebot abgegeben'
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

              {selectedIsPlayerOwned &&
                selectedHarvester && (
                  <div className="harvester-status">
                    {selectedHarvester.pendingProduction ? (
                      <>
                        <span>
                          🔧{' '}
                          {selectedHarvester.retoolingReason ===
                          'relocation'
                            ? 'Einrichtung nach Versetzung'
                            : 'Umrüstung ausstehend'}
                        </span>
                        <strong>
                          {
                            productionTypes[
                              selectedHarvester.production
                            ].icon
                          }{' '}
                          {
                            productionTypes[
                              selectedHarvester.production
                            ].label
                          }{' '}
                          →{' '}
                          {
                            productionTypes[
                              selectedHarvester.pendingProduction
                            ].icon
                          }{' '}
                          {
                            productionTypes[
                              selectedHarvester.pendingProduction
                            ].label
                          }
                        </strong>
                      </>
                    ) : (
                      <>
                        <span>
                          🚜 Harvester{' '}
                          {selectedHarvester.isNew
                            ? 'neu eingesetzt'
                            : 'aktiv'}
                        </span>
                        <strong>
                          {productionTypes[selectedProduction!].icon}{' '}
                          {productionTypes[selectedProduction!].label}
                        </strong>
                      </>
                    )}

                    <button
                      className="change-production-button"
                      type="button"
                      onClick={() => setIsChoosingProduction(true)}
                    >
                      Produktion ändern
                    </button>

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

              {selectedIsPlayerOwned &&
                selectedHarvester &&
                isChoosingProduction && (
                  <div className="production-picker">
                    <p>Neue Produktion wählen:</p>

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
                            changeHarvesterProduction(production)
                          }
                        >
                          <span>
                            {productionTypes[production].icon}
                          </span>
                          {production === selectedProduction
                            ? `${productionTypes[production].label} beibehalten`
                            : productionTypes[production].label}
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

              {selectedIsPlayerOwned &&
                !selectedProduction &&
                !selectedHarvester &&
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

              {selectedIsPlayerOwned &&
                !selectedProduction &&
                !selectedHarvester &&
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

              {selectedIsOpponentOwned && (
                <div className="opponent-land-status">
                  <span>🏢 Grundstück vergeben</span>
                  <strong>Besitzer: Konsortium Orion</strong>
                  <p>
                    Dieses Feld steht für weitere Gebote nicht mehr
                    zur Verfügung.
                  </p>
                </div>
              )}

              {selectedPendingBid && (
                  <div className="land-purchase-status">
                    <span>🔒 Verdecktes Gebot abgegeben</span>
                    <strong>
                      {selectedPendingBid.amount} Credits reserviert
                    </strong>
                    <p>
                      Orions Gebot wird beim Ausführen der Runde
                      aufgedeckt.
                    </p>

                    <button
                      className="cancel-land-button"
                      type="button"
                      onClick={onCancelLandOrder}
                    >
                      Gebot zurücknehmen
                    </button>
                  </div>
              )}

              {selectedTile.owner === 'free' &&
                !selectedIsPlayerOwned &&
                !selectedIsOpponentOwned &&
                !selectedPendingBid &&
                (pendingLandBid ||
                (landAuctionTie && !selectedAuctionTie) ? (
                  <button
                    className="field-button"
                    type="button"
                    disabled
                  >
                    {pendingLandBid
                      ? 'Bereits ein Gebot abgegeben'
                      : `Stichauktion auf Feld ${landAuctionTie?.tileId}`}
                  </button>
                ) : (
                  <div className="land-bid-panel">
                    {selectedAuctionTie && (
                      <div className="tie-notice">
                        <strong>
                          Gleichstand bei{' '}
                          {selectedAuctionTie.tiedBid} Credits
                        </strong>
                        <span>
                          Für die Stichauktion ist ein höheres Gebot
                          erforderlich.
                        </span>
                      </div>
                    )}

                    <label htmlFor="land-bid">
                      Dein verdecktes Gebot
                      <strong>{effectiveBidAmount} Credits</strong>
                    </label>

                    <input
                      id="land-bid"
                      type="range"
                      min={minimumBid}
                      max={Math.max(minimumBid, credits)}
                      step="1"
                      value={effectiveBidAmount}
                      disabled={credits < minimumBid}
                      onChange={(event) =>
                        setBidAmount(Number(event.target.value))
                      }
                    />

                    <button
                      className="field-button"
                      type="button"
                      disabled={credits < minimumBid}
                      onClick={() =>
                        onPlaceLandBid(
                          selectedTile.id,
                          effectiveBidAmount,
                        )
                      }
                    >
                      {credits < minimumBid
                        ? 'Nicht genügend Credits'
                        : selectedAuctionTie
                          ? 'Stichgebot abgeben'
                          : 'Gebot abgeben'}
                    </button>

                    <p className="bid-hint">
                      Mindestgebot: {minimumBid} Credits. Orions
                      Gebot bleibt bis zur Auswertung geheim.
                    </p>
                  </div>
                ))}
            </>
          )}
        </aside>
      </div>
    </section>
  )
}

export default HexMap
