import {
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from 'react'
import {
  HARVESTER_ORE_COST,
  LAND_MINIMUM_BID,
  PLAYER_START_TILE_IDS,
  productionTypes,
  tiles,
  type HarvesterAssignments,
  type LandAuctionTie,
  type LandBid,
  type ProductionType,
} from '../game'
import {
  combineMeteorBonuses,
  type MeteorImpact,
} from '../meteor'
import { targetPlanetMap } from '../planetMap'
import './HexMap.css'

type HexMapProps = {
  population: number
  credits: number
  ore: number
  ownedTileIds: string[]
  opponentTileIds: string[]
  meteorImpacts: MeteorImpact[]
  pendingLandBid: LandBid | null
  landAuctionTie: LandAuctionTie | null
  freeHarvesters: number
  harvestersInConstruction: number
  harvesters: HarvesterAssignments
  harvesterCreditCost: number
  isHarvesterBuildBlocked: boolean
  isLandBidBlocked: boolean
  isRetoolingBlocked: boolean
  isRelocationBlocked: boolean
  onBuildHarvester: () => void
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

type Point = {
  x: number
  y: number
}

type MapCamera = Point & {
  zoom: number
}

type MapGesture = {
  mode: 'pan' | 'pinch'
  camera: MapCamera
  midpoint: Point
  distance: number
}

const HEX_RADIUS = 24
const MAP_VIEW_WIDTH = 960
const MAP_VIEW_HEIGHT = 640
const MIN_MAP_ZOOM = 0.62
const MAX_MAP_ZOOM = 1.8
const MAP_PAN_LIMIT = 700
const INITIAL_MAP_CAMERA: MapCamera = {
  x: 0,
  y: 0,
  zoom: 1,
}

function createTilePoints(
  x: number,
  y: number,
  radius: number,
  sides: number,
) {
  return Array.from({ length: sides }, (_, index) => {
    const angle =
      ((360 / sides) * index * Math.PI) / 180 -
      Math.PI / 2

    return `${x + radius * Math.cos(angle)},${
      y + radius * Math.sin(angle)
    }`
  }).join(' ')
}

function getTilePixelPosition(tileId: string) {
  const position = targetPlanetMap.displayPositions?.[tileId]

  if (!position) {
    throw new Error(`missing display position for ${tileId}`)
  }

  return position
}

const mapNeighborLinks = tiles.flatMap((tile) =>
  tile.neighborIds
    .filter((neighborId) => tile.id < neighborId)
    .map((neighborId) => ({
      id: `${tile.id}:${neighborId}`,
      first: getTilePixelPosition(tile.id),
      second: getTilePixelPosition(neighborId),
    })),
)

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function getDistance(first: Point, second: Point) {
  return Math.hypot(
    first.x - second.x,
    first.y - second.y,
  )
}

function getMidpoint(first: Point, second: Point) {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  }
}

function getTerrainClass(
  tile: (typeof tiles)[number],
) {
  if (tile.owner === 'hq') {
    return 'terrain-hq terrain-strength-5'
  }

  const dominantResource = [
    { resource: 'food', rating: tile.food ?? 0 },
    { resource: 'energy', rating: tile.energy ?? 0 },
    { resource: 'ore', rating: tile.ore ?? 0 },
  ].reduce((strongest, resource) =>
    resource.rating > strongest.rating
      ? resource
      : strongest,
  )

  return `terrain-${dominantResource.resource} terrain-strength-${dominantResource.rating}`
}

function formatStars(value = 0) {
  return `${'★'.repeat(value)}${'☆'.repeat(5 - value)}`
}

function HexMap({
  population,
  credits,
  ore,
  ownedTileIds,
  opponentTileIds,
  meteorImpacts,
  pendingLandBid,
  landAuctionTie,
  freeHarvesters,
  harvestersInConstruction,
  harvesters,
  harvesterCreditCost,
  isHarvesterBuildBlocked,
  isLandBidBlocked,
  isRetoolingBlocked,
  isRelocationBlocked,
  onBuildHarvester,
  onPlaceLandBid,
  onCancelLandOrder,
  onAssignHarvester,
  onChangeHarvesterProduction,
  onRemoveHarvester,
}: HexMapProps) {
  const [selectedId, setSelectedId] = useState(
    PLAYER_START_TILE_IDS[0],
  )
  const [isChoosingProduction, setIsChoosingProduction] =
    useState(false)
  const [bidAmount, setBidAmount] = useState(LAND_MINIMUM_BID)
  const [cameraState, setCameraState] =
    useState<MapCamera>(INITIAL_MAP_CAMERA)
  const [hoveredId, setHoveredId] = useState<string | null>(
    null,
  )
  const cameraRef = useRef(cameraState)
  const pointerPositions = useRef(new Map<number, Point>())
  const gesture = useRef<MapGesture | null>(null)
  const didMoveMap = useRef(false)

  const selectedTile =
    tiles.find((tile) => tile.id === selectedId) ?? tiles[0]!
  const hoveredTile = tiles.find(
    (tile) => tile.id === hoveredId,
  )
  const hoveredPosition = hoveredTile
    ? getTilePixelPosition(hoveredTile.id)
    : null
  const selectedPosition = getTilePixelPosition(selectedTile.id)
  const meteorBonuses = combineMeteorBonuses(meteorImpacts)
  const meteorCenterIds = new Set(
    meteorImpacts.map((impact) => impact.centerTileId),
  )
  const selectedCrystalRating = Math.min(
    5,
    (selectedTile.crystals ?? 0) +
      (meteorBonuses[selectedTile.id] ?? 0),
  )

  const selectedHarvester = harvesters[selectedTile.id]
  const selectedProduction = selectedHarvester?.production
  const selectedIsPlayerOwned = ownedTileIds.includes(
    selectedTile.id,
  )
  const selectedIsOpponentOwned = opponentTileIds.includes(
    selectedTile.id,
  )
  const selectedIsAdjacentToPlayer = ownedTileIds.some(
    (tileId) =>
      tiles
        .find((tile) => tile.id === tileId)
        ?.neighborIds.includes(selectedTile.id) ?? false,
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
  const canBuildHarvester =
    !isHarvesterBuildBlocked &&
    credits >= harvesterCreditCost &&
    ore >= HARVESTER_ORE_COST

  const updateCamera = (camera: MapCamera) => {
    const nextCamera = {
      x: clamp(camera.x, -MAP_PAN_LIMIT, MAP_PAN_LIMIT),
      y: clamp(camera.y, -MAP_PAN_LIMIT, MAP_PAN_LIMIT),
      zoom: clamp(camera.zoom, MIN_MAP_ZOOM, MAX_MAP_ZOOM),
    }

    cameraRef.current = nextCamera
    setCameraState(nextCamera)
  }

  const clientToMapPoint = (
    element: SVGSVGElement,
    clientX: number,
    clientY: number,
  ) => {
    const screenMatrix = element.getScreenCTM()

    if (!screenMatrix) {
      return { x: 0, y: 0 }
    }

    const point = element.createSVGPoint()
    point.x = clientX
    point.y = clientY

    const mapPoint = point.matrixTransform(
      screenMatrix.inverse(),
    )

    return { x: mapPoint.x, y: mapPoint.y }
  }

  const zoomAtPoint = (point: Point, zoomFactor: number) => {
    const currentCamera = cameraRef.current
    const nextZoom = clamp(
      currentCamera.zoom * zoomFactor,
      MIN_MAP_ZOOM,
      MAX_MAP_ZOOM,
    )
    const scaleDifference = nextZoom / currentCamera.zoom

    updateCamera({
      x:
        point.x -
        scaleDifference * (point.x - currentCamera.x),
      y:
        point.y -
        scaleDifference * (point.y - currentCamera.y),
      zoom: nextZoom,
    })
  }

  const handlePointerDown = (
    event: PointerEvent<SVGSVGElement>,
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId)

    const point = clientToMapPoint(
      event.currentTarget,
      event.clientX,
      event.clientY,
    )

    if (pointerPositions.current.size === 0) {
      didMoveMap.current = false
    }

    pointerPositions.current.set(event.pointerId, point)
    const points = [...pointerPositions.current.values()]

    if (points.length >= 2) {
      gesture.current = {
        mode: 'pinch',
        camera: cameraRef.current,
        midpoint: getMidpoint(points[0]!, points[1]!),
        distance: getDistance(points[0]!, points[1]!),
      }
      didMoveMap.current = true
      return
    }

    gesture.current = {
      mode: 'pan',
      camera: cameraRef.current,
      midpoint: point,
      distance: 0,
    }
  }

  const handlePointerMove = (
    event: PointerEvent<SVGSVGElement>,
  ) => {
    if (!pointerPositions.current.has(event.pointerId)) {
      return
    }

    const point = clientToMapPoint(
      event.currentTarget,
      event.clientX,
      event.clientY,
    )
    pointerPositions.current.set(event.pointerId, point)

    const currentGesture = gesture.current
    const points = [...pointerPositions.current.values()]

    if (!currentGesture) {
      return
    }

    if (points.length >= 2) {
      const midpoint = getMidpoint(points[0]!, points[1]!)
      const distance = getDistance(points[0]!, points[1]!)
      const zoomFactor =
        currentGesture.distance > 0
          ? distance / currentGesture.distance
          : 1
      const nextZoom = clamp(
        currentGesture.camera.zoom * zoomFactor,
        MIN_MAP_ZOOM,
        MAX_MAP_ZOOM,
      )
      const effectiveScale =
        nextZoom / currentGesture.camera.zoom

      updateCamera({
        x:
          midpoint.x -
          effectiveScale *
            (currentGesture.midpoint.x -
              currentGesture.camera.x),
        y:
          midpoint.y -
          effectiveScale *
            (currentGesture.midpoint.y -
              currentGesture.camera.y),
        zoom: nextZoom,
      })
      didMoveMap.current = true
      return
    }

    if (currentGesture.mode === 'pan' && points[0]) {
      const distanceMoved = getDistance(
        points[0],
        currentGesture.midpoint,
      )

      if (distanceMoved > 4) {
        didMoveMap.current = true
      }

      updateCamera({
        x:
          currentGesture.camera.x +
          points[0].x -
          currentGesture.midpoint.x,
        y:
          currentGesture.camera.y +
          points[0].y -
          currentGesture.midpoint.y,
        zoom: currentGesture.camera.zoom,
      })
    }
  }

  const handlePointerEnd = (
    event: PointerEvent<SVGSVGElement>,
  ) => {
    pointerPositions.current.delete(event.pointerId)

    if (
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const remainingPoint = [
      ...pointerPositions.current.values(),
    ][0]

    gesture.current = remainingPoint
      ? {
          mode: 'pan',
          camera: cameraRef.current,
          midpoint: remainingPoint,
          distance: 0,
        }
      : null
  }

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault()
    const point = clientToMapPoint(
      event.currentTarget,
      event.clientX,
      event.clientY,
    )

    zoomAtPoint(point, event.deltaY < 0 ? 1.12 : 0.89)
  }

  const selectTile = (tileId: string) => {
    if (didMoveMap.current) {
      didMoveMap.current = false
      return
    }

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

        <div className="map-heading-meta">
          <strong>{tiles.length - 1} Felder</strong>
          <span className="map-hint">
            Ziehen · Scrollen oder Pinch zum Zoomen
          </span>
        </div>
      </div>

      <div className="map-layout">
        <div className="hex-map-viewport">
          <div
            className="map-controls"
            aria-label="Kartensteuerung"
          >
            <button
              type="button"
              aria-label="Karte vergrößern"
              onClick={() => zoomAtPoint({ x: 0, y: 0 }, 1.2)}
            >
              +
            </button>
            <button
              type="button"
              aria-label="Karte verkleinern"
              onClick={() => zoomAtPoint({ x: 0, y: 0 }, 0.8)}
            >
              −
            </button>
            <button
              className="map-center-button"
              type="button"
              onClick={() => updateCamera(INITIAL_MAP_CAMERA)}
            >
              HQ
            </button>
          </div>

          <svg
            className="hex-map"
            viewBox={`${-MAP_VIEW_WIDTH / 2} ${
              -MAP_VIEW_HEIGHT / 2
            } ${MAP_VIEW_WIDTH} ${MAP_VIEW_HEIGHT}`}
            aria-label="Bewegbare Planetengraph-Karte der Kolonie"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onWheel={handleWheel}
          >
            <defs>
              <pattern
                id="terrain-food"
                width="30"
                height="30"
                patternUnits="userSpaceOnUse"
              >
                <rect width="30" height="30" fill="#174839" />
                <path
                  d="M3 29 Q7 15 15 4 M13 30 Q18 17 27 8"
                  fill="none"
                  stroke="#59b889"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                <circle
                  cx="22"
                  cy="23"
                  r="3"
                  fill="#8fd39a"
                  opacity="0.55"
                />
              </pattern>

              <pattern
                id="terrain-energy"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <rect width="32" height="32" fill="#4b4720" />
                <path
                  d="M19 1 9 15h8l-5 16 12-19h-8z"
                  fill="#e6c75c"
                  opacity="0.55"
                />
                <path
                  d="M0 27 32 5"
                  stroke="#8fcbca"
                  strokeWidth="2"
                  opacity="0.35"
                />
              </pattern>

              <pattern
                id="terrain-ore"
                width="34"
                height="30"
                patternUnits="userSpaceOnUse"
              >
                <rect width="34" height="30" fill="#403c3a" />
                <path
                  d="m1 28 8-13 7 8 6-16 11 21z"
                  fill="#73665d"
                  stroke="#a08c78"
                  strokeWidth="1.5"
                  opacity="0.78"
                />
                <circle
                  cx="8"
                  cy="7"
                  r="3"
                  fill="#b9a184"
                  opacity="0.5"
                />
              </pattern>

              <radialGradient id="terrain-hq">
                <stop offset="0" stopColor="#638bd9" />
                <stop offset="1" stopColor="#24477f" />
              </radialGradient>
            </defs>

            <g
              transform={`translate(${cameraState.x} ${cameraState.y}) scale(${cameraState.zoom})`}
            >
              <g className="map-neighbor-links" aria-hidden="true">
                {mapNeighborLinks.map((link) => (
                  <line
                    key={link.id}
                    x1={link.first.x}
                    y1={link.first.y}
                    x2={link.second.x}
                    y2={link.second.y}
                  />
                ))}
              </g>

              {tiles.map((tile) => {
                const position = getTilePixelPosition(tile.id)
                const polygonPoints = createTilePoints(
                  position.x,
                  position.y,
                  HEX_RADIUS,
                  tile.shape === 'pentagon' ? 5 : 6,
                )
                const isSelected = tile.id === selectedId
                const harvester = harvesters[tile.id]
                const production = harvester?.production
                const isPlayerOwned = ownedTileIds.includes(tile.id)
                const isOpponentOwned = opponentTileIds.includes(
                  tile.id,
                )
                const hasPendingBid =
                  pendingLandBid?.tileId === tile.id
                const hasAuctionTie =
                  landAuctionTie?.tileId === tile.id
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
                const isMeteorCenter = meteorCenterIds.has(tile.id)

                return (
                  <g
                    key={tile.id}
                    className={[
                      'hex-tile',
                      tile.shape,
                      ownershipClass,
                      isMeteorCenter ? 'meteor-center' : '',
                      isSelected ? 'selected' : '',
                    ].join(' ')}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectTile(tile.id)}
                    onPointerEnter={() => setHoveredId(tile.id)}
                    onPointerLeave={() =>
                      setHoveredId((currentId) =>
                        currentId === tile.id
                          ? null
                          : currentId,
                      )
                    }
                    onFocus={() => setHoveredId(tile.id)}
                    onBlur={() =>
                      setHoveredId((currentId) =>
                        currentId === tile.id
                          ? null
                          : currentId,
                      )
                    }
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
                      className={`hex-landscape ${getTerrainClass(
                        tile,
                      )}`}
                      points={polygonPoints}
                    />
                    <polygon
                      className="hex-border"
                      points={polygonPoints}
                    />

                    <text
                      className="hex-label"
                      x={position.x}
                      y={position.y + 5}
                      textAnchor="middle"
                    >
                      {tile.id}
                    </text>

                    {isMeteorCenter && (
                      <text
                        className="hex-meteor-label"
                        x={position.x + 11}
                        y={position.y - 9}
                        textAnchor="middle"
                        aria-label="Meteoritenkrater"
                      >
                        ☄
                      </text>
                    )}

                    {isPlayerOwned && !production && (
                      <text
                        className="hex-owner-label"
                        x={position.x}
                        y={position.y + 14}
                        textAnchor="middle"
                      >
                        DEIN FELD
                      </text>
                    )}

                    {isOpponentOwned && (
                      <text
                        className="hex-opponent-label"
                        x={position.x}
                        y={position.y + 14}
                        textAnchor="middle"
                      >
                        ORION
                      </text>
                    )}

                    {(hasPendingBid || hasAuctionTie) && (
                      <text
                        className="hex-pending-label"
                        x={position.x}
                        y={position.y + 14}
                        textAnchor="middle"
                      >
                        {hasAuctionTie
                          ? 'STICHAUKTION'
                          : 'GEBOT'}
                      </text>
                    )}

                    {harvester && (
                      <text
                        className="hex-production-label"
                        x={position.x}
                        y={position.y + 18}
                        textAnchor="middle"
                      >
                        {harvester.pendingProduction
                          ? '🔧'
                          : '🚜'}{' '}
                        {
                          productionTypes[
                            harvester.pendingProduction ??
                              production!
                          ].icon
                        }
                      </text>
                    )}
                  </g>
                )
              })}

              {hoveredTile &&
                hoveredPosition &&
                hoveredTile.id !== selectedTile.id && (
                  <polygon
                    className="hex-interaction-outline is-hovered"
                    points={createTilePoints(
                      hoveredPosition.x,
                      hoveredPosition.y,
                      HEX_RADIUS - 1.5,
                      hoveredTile.shape === 'pentagon' ? 5 : 6,
                    )}
                  />
                )}

              <polygon
                className="hex-interaction-outline is-selected"
                points={createTilePoints(
                  selectedPosition.x,
                  selectedPosition.y,
                  HEX_RADIUS - 1.5,
                  selectedTile.shape === 'pentagon' ? 5 : 6,
                )}
              />
            </g>
          </svg>

          <span className="map-gesture-hint">
            Karte verschieben und zoomen
          </span>
        </div>

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

              <div className="detail-row">
                <span>🏗️ Harvester im Bau</span>
                <strong>{harvestersInConstruction}</strong>
              </div>

              <button
                className="build-harvester-button"
                type="button"
                disabled={!canBuildHarvester}
                onClick={onBuildHarvester}
              >
                {isHarvesterBuildBlocked
                  ? 'Harvesterbau gesperrt'
                  : canBuildHarvester
                    ? 'Harvester bauen'
                    : 'Ressourcen reichen nicht'}
              </button>

              <p className="build-cost">
                Kosten: {harvesterCreditCost} Credits +{' '}
                {HARVESTER_ORE_COST} Erz. Fertig zu Beginn der
                nächsten Runde.
              </p>

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

              <div className="resource-rating crystal-rating">
                <span>💎 Kristalle</span>
                <strong>
                  {selectedIsPlayerOwned
                    ? selectedCrystalRating
                      ? formatStars(selectedCrystalRating)
                      : 'Kein Vorkommen'
                    : 'Unbekannt'}
                </strong>
              </div>

              {meteorCenterIds.has(selectedTile.id) && (
                <div className="meteor-crater-notice">
                  <strong>☄ Meteoritenkrater</strong>
                  <span>
                    Der Einschlagsort ist öffentlich. Seine genaue
                    Kristallaufwertung bleibt verdeckt.
                  </span>
                </div>
              )}

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
                      disabled={isRetoolingBlocked}
                      onClick={() => setIsChoosingProduction(true)}
                    >
                      {isRetoolingBlocked
                        ? 'Umrüstung gesperrt'
                        : 'Produktion ändern'}
                    </button>

                    <button
                      className="remove-harvester-button"
                      type="button"
                      disabled={
                        !selectedHarvester.isNew &&
                        isRelocationBlocked
                      }
                      onClick={() =>
                        onRemoveHarvester(selectedTile.id)
                      }
                    >
                      {!selectedHarvester.isNew &&
                      isRelocationBlocked
                        ? 'Versetzung gesperrt'
                        : 'Harvester entfernen'}
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
                      disabled={
                        isLandBidBlocked ||
                        !selectedIsAdjacentToPlayer ||
                        credits < minimumBid
                      }
                      onChange={(event) =>
                        setBidAmount(Number(event.target.value))
                      }
                    />

                    <button
                      className="field-button"
                      type="button"
                      disabled={
                        isLandBidBlocked ||
                        !selectedIsAdjacentToPlayer ||
                        credits < minimumBid
                      }
                      onClick={() =>
                        onPlaceLandBid(
                          selectedTile.id,
                          effectiveBidAmount,
                        )
                      }
                    >
                      {isLandBidBlocked
                        ? 'Grundstückserwerb gesperrt'
                        : !selectedIsAdjacentToPlayer
                          ? 'Nicht angrenzend'
                        : credits < minimumBid
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
