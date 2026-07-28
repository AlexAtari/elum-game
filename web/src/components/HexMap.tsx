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
  type RivalColonies,
  type RivalColonyState,
} from '../game'
import {
  combineMeteorBonuses,
  type MeteorImpact,
} from '../meteor'
import { targetPlanetMap } from '../planetMap'
import {
  createPlanetSurfaceCells,
  projectPlanetMap,
  projectPlanetSurfaceCells,
  type PlanetRotation,
} from '../planetProjection'
import { PlanetSurface } from './PlanetSurface'
import './HexMap.css'

type HexMapProps = {
  round: number
  population: number
  credits: number
  ore: number
  ownedTileIds: string[]
  opponentTileIds: string[]
  rivals: RivalColonies
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

type MapCamera = PlanetRotation & {
  zoom: number
}

type MapGesture = {
  mode: 'pan' | 'pinch'
  camera: MapCamera
  midpoint: Point
  distance: number
}

const MAP_VIEW_SIZE = 720
const PLANET_RADIUS = 280
const MIN_MAP_ZOOM = 0.72
const MAX_MAP_ZOOM = 2.2
const MAX_MAP_PITCH = Math.PI * 0.48
const INITIAL_MAP_CAMERA: MapCamera = {
  yaw: 0,
  pitch: 0,
  zoom: 1,
}

const planetSurfaceCells =
  createPlanetSurfaceCells(targetPlanetMap)

function getRivalOwner(
  tileId: string,
  rivals: RivalColonies,
): RivalColonyState | null {
  return (
    Object.values(rivals).find((rival) =>
      rival.ownedTileIds?.includes(tileId),
    ) ?? null
  )
}

function getRivalMapLabel(rival: RivalColonyState | null) {
  if (!rival) {
    return 'RIVALE'
  }

  return rival.id.toUpperCase()
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function normalizeAngle(angle: number) {
  const fullTurn = Math.PI * 2

  return (
    ((angle + Math.PI) % fullTurn + fullTurn) %
      fullTurn -
    Math.PI
  )
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

function formatPolygonPoints(
  points: Array<{ x: number; y: number }>,
) {
  return points
    .map((point) => `${point.x},${point.y}`)
    .join(' ')
}

function formatStars(value = 0) {
  return `${'★'.repeat(value)}${'☆'.repeat(5 - value)}`
}

function HexMap({
  round,
  population,
  credits,
  ore,
  ownedTileIds,
  opponentTileIds,
  rivals,
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
  const projectedTiles = projectPlanetMap(
    targetPlanetMap,
    cameraState,
    PLANET_RADIUS * cameraState.zoom,
  )
  const projectedCells = projectPlanetSurfaceCells(
    targetPlanetMap,
    planetSurfaceCells,
    cameraState,
    PLANET_RADIUS * cameraState.zoom,
  )
  const hoveredCell = hoveredTile
    ? projectedCells[hoveredTile.id]
    : null
  const selectedCell = projectedCells[selectedTile.id]
  const visibleTiles = tiles
    .filter(
      (tile) =>
        projectedCells[tile.id].points.length >= 3,
    )
    .sort(
      (first, second) =>
        projectedTiles[first.id].depth -
          projectedTiles[second.id].depth ||
        first.id.localeCompare(second.id),
    )
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
  const selectedRivalOwner = getRivalOwner(
    selectedTile.id,
    rivals,
  )
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
      yaw: normalizeAngle(camera.yaw),
      pitch: clamp(
        camera.pitch,
        -MAX_MAP_PITCH,
        MAX_MAP_PITCH,
      ),
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

  const zoomMap = (zoomFactor: number) => {
    const currentCamera = cameraRef.current
    const nextZoom = clamp(
      currentCamera.zoom * zoomFactor,
      MIN_MAP_ZOOM,
      MAX_MAP_ZOOM,
    )

    updateCamera({
      yaw: currentCamera.yaw,
      pitch: currentCamera.pitch,
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

      updateCamera({
        yaw: currentGesture.camera.yaw,
        pitch: currentGesture.camera.pitch,
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
        yaw:
          currentGesture.camera.yaw +
          (points[0].x -
            currentGesture.midpoint.x) /
            (PLANET_RADIUS *
              currentGesture.camera.zoom),
        pitch:
          currentGesture.camera.pitch +
          (points[0].y -
            currentGesture.midpoint.y) /
            (PLANET_RADIUS *
              currentGesture.camera.zoom),
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
    zoomMap(event.deltaY < 0 ? 1.12 : 0.89)
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
            Ziehen zum Drehen · Scrollen oder Pinch zum Zoomen
          </span>
        </div>
      </div>

      <div className="map-layout">
        <div className="hex-map-viewport">
          <PlanetSurface
            radius={PLANET_RADIUS * cameraState.zoom}
            rotation={cameraState}
            round={round}
            tiles={tiles}
            viewSize={MAP_VIEW_SIZE}
          />

          <div
            className="map-controls"
            aria-label="Kartensteuerung"
          >
            <button
              type="button"
              aria-label="Planet vergrößern"
              onClick={() => zoomMap(1.16)}
            >
              +
            </button>
            <button
              type="button"
              aria-label="Planet verkleinern"
              onClick={() => zoomMap(0.86)}
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
            viewBox={`${-MAP_VIEW_SIZE / 2} ${
              -MAP_VIEW_SIZE / 2
            } ${MAP_VIEW_SIZE} ${MAP_VIEW_SIZE}`}
            aria-label="Drehbare Planetenkugel der Kolonie"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onWheel={handleWheel}
          >
            <defs>
              <radialGradient id="terrain-hq">
                <stop offset="0" stopColor="#638bd9" />
                <stop offset="1" stopColor="#24477f" />
              </radialGradient>
              <radialGradient
                id="planet-surface"
                cx="35%"
                cy="28%"
                r="72%"
              >
                <stop offset="0" stopColor="#274f75" />
                <stop offset="0.55" stopColor="#132e50" />
                <stop offset="1" stopColor="#07111f" />
              </radialGradient>
              <radialGradient
                id="planet-lighting"
                gradientUnits="userSpaceOnUse"
                cx={-PLANET_RADIUS * cameraState.zoom * 0.42}
                cy={-PLANET_RADIUS * cameraState.zoom * 0.46}
                r={PLANET_RADIUS * cameraState.zoom * 1.55}
              >
                <stop
                  offset="0"
                  stopColor="#e8f7ff"
                  stopOpacity="0.2"
                />
                <stop
                  offset="0.32"
                  stopColor="#b9ddf2"
                  stopOpacity="0.06"
                />
                <stop
                  offset="0.58"
                  stopColor="#09111e"
                  stopOpacity="0"
                />
                <stop
                  offset="0.82"
                  stopColor="#03070e"
                  stopOpacity="0.22"
                />
                <stop
                  offset="1"
                  stopColor="#010308"
                  stopOpacity="0.56"
                />
              </radialGradient>
              <clipPath id="planet-clip">
                <circle
                  r={PLANET_RADIUS * cameraState.zoom}
                />
              </clipPath>
            </defs>

            <circle
              className="planet-atmosphere"
              r={PLANET_RADIUS * cameraState.zoom + 10}
            />
            <circle
              className="planet-surface"
              r={PLANET_RADIUS * cameraState.zoom}
            />
            <circle
              className="planet-cell-lighting"
              r={PLANET_RADIUS * cameraState.zoom}
            />

            <g clipPath="url(#planet-clip)">
              {visibleTiles.map((tile) => {
                const position = projectedTiles[tile.id]
                const cell = projectedCells[tile.id]
                const polygonPoints = formatPolygonPoints(
                  cell.points,
                )
                const isSelected = tile.id === selectedId
                const harvester = harvesters[tile.id]
                const production = harvester?.production
                const isPlayerOwned = ownedTileIds.includes(tile.id)
                const isOpponentOwned = opponentTileIds.includes(
                  tile.id,
                )
                const rivalOwner = getRivalOwner(
                  tile.id,
                  rivals,
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
                      rivalOwner
                        ? `opponent-${rivalOwner.id}`
                        : '',
                      isMeteorCenter ? 'meteor-center' : '',
                      isSelected ? 'selected' : '',
                    ].join(' ')}
                    role="button"
                    aria-label={
                      tile.owner === 'hq'
                        ? 'Hauptquartier'
                        : `Feld ${tile.id}`
                    }
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
                      className="hex-landscape"
                      points={polygonPoints}
                    />
                    <polygon
                      className="hex-border"
                      points={polygonPoints}
                    />

                    {isMeteorCenter && (
                      <text
                        className="hex-meteor-label"
                        x={position.x + 11 * cameraState.zoom}
                        y={position.y - 9 * cameraState.zoom}
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
                        y={position.y + 14 * cameraState.zoom}
                        textAnchor="middle"
                      >
                        DEIN FELD
                      </text>
                    )}

                    {isOpponentOwned && (
                      <text
                        className={[
                          'hex-opponent-label',
                          rivalOwner
                            ? `rival-${rivalOwner.id}`
                            : '',
                        ].join(' ')}
                        x={position.x}
                        y={position.y + 14 * cameraState.zoom}
                        textAnchor="middle"
                      >
                        {getRivalMapLabel(rivalOwner)}
                      </text>
                    )}

                    {(hasPendingBid || hasAuctionTie) && (
                      <text
                        className="hex-pending-label"
                        x={position.x}
                        y={position.y + 14 * cameraState.zoom}
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
                        y={position.y + 18 * cameraState.zoom}
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
                hoveredCell &&
                hoveredCell.points.length >= 3 &&
                hoveredTile.id !== selectedTile.id && (
                  <polygon
                    className="hex-interaction-outline is-hovered"
                    points={formatPolygonPoints(
                      hoveredCell.points,
                    )}
                  />
                )}

              {selectedCell.points.length >= 3 && (
                <polygon
                  className="hex-interaction-outline is-selected"
                  points={formatPolygonPoints(
                    selectedCell.points,
                  )}
                />
              )}
            </g>
          </svg>

          <span className="map-gesture-hint">
            Kugel drehen und zoomen
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
                    ? selectedRivalOwner?.name ??
                      'Rivalenkolonie'
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
                      )
                        .filter(
                          (production) =>
                            production !== 'crystals' ||
                            selectedCrystalRating > 0,
                        )
                        .map((production) => (
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
                      )
                        .filter(
                          (production) =>
                            production !== 'crystals' ||
                            selectedCrystalRating > 0,
                        )
                        .map((production) => (
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
                  <strong>
                    Besitzer:{' '}
                    {selectedRivalOwner?.name ??
                      'Rivalenkolonie'}
                  </strong>
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
