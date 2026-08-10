import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type WheelEvent,
} from 'react'
import headquartersImage from '../assets/hq-four-colonies.webp'
import {
  HARVESTER_ORE_COST,
  LAND_MINIMUM_BID,
  getLandBidAmount,
  isColonyCrystalDiscovered,
  productionTypes,
  tiles,
  type HarvesterAssignments,
  type LandAuctionTie,
  type LandBid,
  type ProductionType,
  type ColoniesState,
  type ColonyState,
} from '../game'
import {
  participantIds,
  type ParticipantId,
} from '../match'
import { getHarvesterProductionOptions } from '../harvesterProductionOptions'
import {
  combineMeteorBonuses,
  type MeteorImpact,
} from '../meteor'
import {
  getPlanetTileName,
  targetPlanetMap,
} from '../planetMap'
import { useI18n } from '../i18n/I18nContext'
import { createFieldHologramLayout } from '../fieldHologramLayout'
import {
  createCelestialPositions,
  createSpaceBackdropStyle,
} from '../spaceBackdrop'
import {
  createPlanetSurfaceCells,
  createRotationForTile,
  projectPlanetMap,
  projectPlanetSurfaceCells,
  type PlanetRotation,
} from '../planetProjection'
import { PlanetSurface } from './PlanetSurface'
import './HexMap.css'

type HexMapProps = {
  participantId: ParticipantId
  round: number
  population: number
  credits: number
  ore: number
  ownedTileIds: string[]
  revealedTileIds: string[]
  opponentTileIds: string[]
  colonies: ColoniesState
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
  onOpenHeadquarters: () => void
  focusTileId?: string | null
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

type MobileMapAction = 'harvester' | 'land-bid' | null

const MAP_VIEW_SIZE = 720
const PLANET_RADIUS = 340
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
  colonies: ColoniesState,
  participantId: ParticipantId,
): ColonyState | null {
  return (
    participantIds
      .filter((candidateId) => candidateId !== participantId)
      .map((candidateId) => colonies[candidateId])
      .find((colony) =>
        colony.ownedTileIds.includes(tileId),
      ) ?? null
  )
}

function getRivalMapLabel(
  rival: ColonyState | null,
) {
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

function formatPolygonPath(
  points: Array<{ x: number; y: number }>,
) {
  if (points.length < 3) {
    return ''
  }

  return `M ${points
    .map((point) => `${point.x} ${point.y}`)
    .join(' L ')} Z`
}

function formatStars(value = 0) {
  return `${'★'.repeat(value)}${'☆'.repeat(5 - value)}`
}

function getPrimaryResource(tile: (typeof tiles)[number]) {
  return (
    [
      { icon: '🌾', value: tile.food ?? 0 },
      { icon: '⚡', value: tile.energy ?? 0 },
      { icon: '⛏', value: tile.ore ?? 0 },
    ] as const
  ).reduce((best, candidate) =>
    candidate.value > best.value ? candidate : best,
  )
}

function HexMap({
  participantId,
  round,
  population,
  credits,
  ore,
  ownedTileIds,
  revealedTileIds,
  opponentTileIds,
  colonies,
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
  onOpenHeadquarters,
  focusTileId,
  onPlaceLandBid,
  onCancelLandOrder,
  onAssignHarvester,
  onChangeHarvesterProduction,
  onRemoveHarvester,
}: HexMapProps) {
  const { t } = useI18n()
  const initialTileId = focusTileId ?? ownedTileIds[0]
  const [selectedId, setSelectedId] = useState(initialTileId)
  const [isChoosingProduction, setIsChoosingProduction] =
    useState(false)
  const [mobileMapAction, setMobileMapAction] =
    useState<MobileMapAction>(null)
  const [bidAmount, setBidAmount] = useState(LAND_MINIMUM_BID)
  const [cameraState, setCameraState] = useState<MapCamera>(() => {
    if (!initialTileId) {
      return INITIAL_MAP_CAMERA
    }

    return {
      ...createRotationForTile(targetPlanetMap, initialTileId),
      zoom: INITIAL_MAP_CAMERA.zoom,
    }
  })
  const [hoveredId, setHoveredId] = useState<string | null>(
    null,
  )
  const cameraRef = useRef(cameraState)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [viewportSize, setViewportSize] = useState({
    width: 0,
    height: 0,
  })
  const [selectedRenderedPoint, setSelectedRenderedPoint] =
    useState<Point | null>(null)
  const pointerPositions = useRef(new Map<number, Point>())
  const gesture = useRef<MapGesture | null>(null)
  const didMoveMap = useRef(false)

  useEffect(() => {
    const viewport = viewportRef.current

    if (!viewport) {
      return
    }

    const updateViewportSize = () => {
      const bounds = viewport.getBoundingClientRect()

      setViewportSize({
        width: bounds.width,
        height: bounds.height,
      })
    }
    const observer = new ResizeObserver(updateViewportSize)

    updateViewportSize()
    observer.observe(viewport)

    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const selectedField = viewport?.querySelector(
      '.hex-tile.selected',
    )

    if (!viewport || !selectedField) {
      setSelectedRenderedPoint(null)
      return
    }

    const viewportBounds = viewport.getBoundingClientRect()
    const fieldBounds = selectedField.getBoundingClientRect()
    const nextPoint = {
      x:
        fieldBounds.left -
        viewportBounds.left +
        fieldBounds.width / 2,
      y:
        fieldBounds.top -
        viewportBounds.top +
        fieldBounds.height / 2,
    }

    setSelectedRenderedPoint((currentPoint) =>
      currentPoint &&
      Math.abs(currentPoint.x - nextPoint.x) < 0.5 &&
      Math.abs(currentPoint.y - nextPoint.y) < 0.5
        ? currentPoint
        : nextPoint,
    )
  }, [cameraState, selectedId, viewportSize])
  const cultivatedTileIds = useMemo(
    () =>
      participantIds.flatMap((participantId) =>
        Object.keys(
          colonies[participantId].harvesterAssignments,
        ),
      ),
    [colonies],
  )
  const revealedTileIdSet = useMemo(
    () => new Set(revealedTileIds),
    [revealedTileIds],
  )

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
  const unexploredFogPath = visibleTiles
    .filter((tile) => !revealedTileIdSet.has(tile.id))
    .map((tile) =>
      formatPolygonPath(projectedCells[tile.id].points),
    )
    .join(' ')
  const meteorBonuses = combineMeteorBonuses(meteorImpacts)
  const meteorCenterIds = new Set(
    meteorImpacts.map((impact) => impact.centerTileId),
  )
  const selectedCrystalRating = Math.min(
    5,
    (selectedTile.crystals ?? 0) +
      (meteorBonuses[selectedTile.id] ?? 0),
  )
  const selectedCrystalDiscovered =
    isColonyCrystalDiscovered(
      { round, colonies },
      participantId,
      selectedTile.id,
    )

  const selectedHarvester = harvesters[selectedTile.id]
  const selectedProduction = selectedHarvester?.production
  const selectedRivalOwner = getRivalOwner(
    selectedTile.id,
    colonies,
    participantId,
  )
  const selectedIsPlayerOwned = ownedTileIds.includes(
    selectedTile.id,
  )
  const selectedIsRevealed = revealedTileIdSet.has(
    selectedTile.id,
  )
  const selectedIsOpponentOwned = opponentTileIds.includes(
    selectedTile.id,
  )
  const canProduceSelectedCrystals =
    selectedIsPlayerOwned &&
    selectedCrystalDiscovered &&
    selectedCrystalRating > 0
  const availableProductionTypes =
    getHarvesterProductionOptions(
      canProduceSelectedCrystals,
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
  const canOpenHarvesterMenu =
    selectedIsPlayerOwned &&
    !selectedHarvester &&
    freeHarvesters > 0
  const canOpenLandBidMenu =
    selectedTile.owner === 'free' &&
    !selectedIsPlayerOwned &&
    !selectedIsOpponentOwned &&
    !selectedPendingBid &&
    !pendingLandBid &&
    (!landAuctionTie || Boolean(selectedAuctionTie)) &&
    !isLandBidBlocked &&
    selectedIsAdjacentToPlayer &&
    credits >= minimumBid
  const selectedFieldIsVisible =
    selectedIsRevealed &&
    selectedTile.owner !== 'hq' &&
    selectedCell.points.length >= 3 &&
    viewportSize.width > 0 &&
    viewportSize.height > 0
  const viewportScale =
    Math.min(viewportSize.width, viewportSize.height) /
    MAP_VIEW_SIZE
  const planetVerticalOffset = Math.min(
    52,
    Math.max(24, viewportSize.height * 0.05),
  )
  const projectedSelectedFieldPoint = {
    x:
      viewportSize.width / 2 +
      projectedTiles[selectedTile.id].x * viewportScale,
    y:
      viewportSize.height / 2 +
      projectedTiles[selectedTile.id].y * viewportScale +
      planetVerticalOffset,
  }
  const selectedFieldPoint =
    selectedRenderedPoint ?? projectedSelectedFieldPoint
  const isCompactViewport = viewportSize.width <= 820
  const hologramWidth = isCompactViewport ? 230 : 280
  const hologramHeight = isCompactViewport ? 230 : 330
  const hologramLayout = createFieldHologramLayout({
    fieldPoint: selectedFieldPoint,
    viewport: viewportSize,
    hologram: {
      width: hologramWidth,
      height: hologramHeight,
    },
    topInset: isCompactViewport ? 118 : 132,
    bottomInset: isCompactViewport ? 45 : 82,
  })
  const hologramConnectorPoint = hologramLayout.connectorPoint
  const hologramStyle = {
    '--hologram-left': `${hologramLayout.left}px`,
    '--hologram-top': `${hologramLayout.top}px`,
    '--hologram-width': `${hologramWidth}px`,
  } as CSSProperties
  const spaceBackgroundStyle = createSpaceBackdropStyle(
    cameraState,
  ) as CSSProperties
  const celestialPositions = createCelestialPositions(
    cameraState,
    cameraState.zoom,
    PLANET_RADIUS,
  )

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

    if (!revealedTileIdSet.has(tileId)) {
      return
    }

    setSelectedId(tileId)
    setIsChoosingProduction(false)
    setMobileMapAction(null)
    if (tileId === targetPlanetMap.hqTileId) {
      onOpenHeadquarters()
    }
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
    setMobileMapAction(null)
  }

  const changeHarvesterProduction = (
    production: ProductionType,
  ) => {
    if (!selectedHarvester) {
      return
    }

    onChangeHarvesterProduction(selectedTile.id, production)
    setIsChoosingProduction(false)
    setMobileMapAction(null)
  }

  const toggleMobileHarvesterMenu = () => {
    const nextIsOpen = mobileMapAction !== 'harvester'

    setMobileMapAction(nextIsOpen ? 'harvester' : null)
    setIsChoosingProduction(nextIsOpen)
  }

  const toggleMobileLandBidMenu = () => {
    setMobileMapAction(
      mobileMapAction === 'land-bid' ? null : 'land-bid',
    )
    setIsChoosingProduction(false)
  }

  const closeProductionMenu = () => {
    setIsChoosingProduction(false)
    setMobileMapAction(null)
  }

  const placeLandBid = () => {
    onPlaceLandBid(selectedTile.id, effectiveBidAmount)
    setMobileMapAction(null)
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
        <div className="hex-map-viewport" ref={viewportRef}>
          <div
            className="space-backdrop"
            style={spaceBackgroundStyle}
            aria-hidden="true"
          />
          <svg
            className="space-celestial-layer"
            viewBox={`${-MAP_VIEW_SIZE / 2} ${
              -MAP_VIEW_SIZE / 2
            } ${MAP_VIEW_SIZE} ${MAP_VIEW_SIZE}`}
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="space-sun-surface">
                <stop offset="0" stopColor="#fffbd0" />
                <stop offset="0.38" stopColor="#ffd769" />
                <stop offset="0.72" stopColor="#f28a32" />
                <stop offset="1" stopColor="#b53a19" />
              </radialGradient>
              <linearGradient
                id="space-ringed-planet-surface"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0" stopColor="#ead59c" />
                <stop offset="0.45" stopColor="#c69e70" />
                <stop offset="0.7" stopColor="#8d6657" />
                <stop offset="1" stopColor="#382b36" />
              </linearGradient>
            </defs>
            <g
              className="space-sun"
              transform={`translate(${celestialPositions.sun.x} ${celestialPositions.sun.y})`}
            >
              <circle className="space-sun-glow" r="24" />
              <circle
                className="space-sun-body"
                r="14"
                fill="url(#space-sun-surface)"
              />
            </g>
            <g
              className="space-ringed-planet"
              transform={`translate(${celestialPositions.ringedPlanet.x} ${celestialPositions.ringedPlanet.y}) rotate(-15)`}
            >
              <ellipse
                className="space-ring-outer"
                rx="38"
                ry="10"
              />
              <ellipse
                className="space-ring-inner"
                rx="32"
                ry="6"
              />
              <circle
                className="space-ringed-planet-body"
                r="17"
                fill="url(#space-ringed-planet-surface)"
              />
              <path
                className="space-ring-front"
                d="M -37 2 Q 0 16 37 -2"
              />
            </g>
          </svg>
          <PlanetSurface
            cultivatedTileIds={cultivatedTileIds}
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
              aria-label={t('map.centerPlanet')}
              onClick={() => updateCamera(INITIAL_MAP_CAMERA)}
            >
              ◎
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
              <linearGradient
                id="unexplored-fog-surface"
                gradientUnits="userSpaceOnUse"
                x1={-PLANET_RADIUS * cameraState.zoom}
                y1={-PLANET_RADIUS * cameraState.zoom}
                x2={PLANET_RADIUS * cameraState.zoom}
                y2={PLANET_RADIUS * cameraState.zoom}
              >
                <stop offset="0" stopColor="#dbe9ed" />
                <stop offset="0.42" stopColor="#94adb8" />
                <stop offset="0.72" stopColor="#506b7b" />
                <stop offset="1" stopColor="#233746" />
              </linearGradient>
              <filter
                id="unexplored-cloud-filter"
                x="-8%"
                y="-8%"
                width="116%"
                height="116%"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.014 0.022"
                  numOctaves="3"
                  seed="23"
                  result="cloud-noise"
                />
                <feColorMatrix
                  in="cloud-noise"
                  type="matrix"
                  values="1 0 0 0 0.18  0 1 0 0 0.24  0 0 1 0 0.28  0 0 0 0.72 0"
                  result="cloud-color"
                />
                <feComposite
                  in="cloud-color"
                  in2="SourceGraphic"
                  operator="in"
                  result="clipped-clouds"
                />
                <feBlend
                  in="SourceGraphic"
                  in2="clipped-clouds"
                  mode="screen"
                />
              </filter>
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
                const isRevealed = revealedTileIdSet.has(
                  tile.id,
                )

                if (!isRevealed) {
                  return (
                    <g
                      key={tile.id}
                      className="hex-tile unexplored"
                      aria-hidden="true"
                    >
                      <polygon
                        className="hex-landscape"
                        points={polygonPoints}
                      />
                    </g>
                  )
                }

                const cellXs = cell.points.map((point) => point.x)
                const cellYs = cell.points.map((point) => point.y)
                const cellBounds = {
                  minX: Math.min(...cellXs),
                  maxX: Math.max(...cellXs),
                  minY: Math.min(...cellYs),
                  maxY: Math.max(...cellYs),
                }
                const isSelected = tile.id === selectedId
                const harvester = harvesters[tile.id]
                const production = harvester?.production
                const isPlayerOwned = ownedTileIds.includes(tile.id)
                const isOpponentOwned = opponentTileIds.includes(
                  tile.id,
                )
                const rivalOwner = getRivalOwner(
                  tile.id,
                  colonies,
                  participantId,
                )
                const rivalAssignment =
                  rivalOwner?.harvesterAssignments[tile.id]
                const rivalProduction =
                  typeof rivalAssignment === 'string'
                    ? rivalAssignment
                    : rivalAssignment?.production
                const visibleProduction =
                  production ?? rivalProduction
                const hasVisibleHarvester =
                  harvester !== undefined ||
                  rivalProduction !== undefined
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
                const primaryResource = getPrimaryResource(tile)
                const showFullResourceReadout =
                  cameraState.zoom >= 1.24 || isSelected
                const resourceReadoutScale = Math.max(
                  1,
                  cameraState.zoom,
                )
                const detailedResourceFontSize =
                  12 * resourceReadoutScale
                const overviewResourceFontSize =
                  13 * resourceReadoutScale
                const crystalResourceFontSize =
                  11 * resourceReadoutScale
                const detailedResourceCenterY =
                  position.y -
                  (isPlayerOwned || isOpponentOwned
                    ? 5 * cameraState.zoom
                    : 0)
                const tileCrystalDiscovered =
                  isPlayerOwned &&
                  isColonyCrystalDiscovered(
                    { round, colonies },
                    participantId,
                    tile.id,
                  )
                const tileCrystalRating = Math.min(
                  5,
                  (tile.crystals ?? 0) +
                    (meteorBonuses[tile.id] ?? 0),
                )

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
                      hasVisibleHarvester ? 'has-harvester' : '',
                      isMeteorCenter ? 'meteor-center' : '',
                      isSelected ? 'selected' : '',
                    ].join(' ')}
                    role="button"
                    aria-label={
                      tile.owner === 'hq'
                        ? 'Hauptquartier'
                        : `${getPlanetTileName(tile.id)}, Sektor ${tile.id}`
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

                    {tile.owner === 'hq' && (
                      <g
                        className="hex-hq-marker"
                        aria-label="Zentrales Hauptquartier"
                      >
                        <defs>
                          <clipPath id="hq-marker-clip">
                            <polygon points={polygonPoints} />
                          </clipPath>
                        </defs>
                        <image
                          href={headquartersImage}
                          x={cellBounds.minX}
                          y={cellBounds.minY}
                          width={cellBounds.maxX - cellBounds.minX}
                          height={cellBounds.maxY - cellBounds.minY}
                          preserveAspectRatio="xMidYMid slice"
                          clipPath="url(#hq-marker-clip)"
                        />
                        <text
                          className="hex-hq-label"
                          x={position.x}
                          y={position.y + 5 * cameraState.zoom}
                          textAnchor="middle"
                        >
                          HQ
                        </text>
                      </g>
                    )}

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

                    {tile.owner !== 'hq' &&
                      !hasVisibleHarvester && (
                        <g className="hex-resource-readout">
                          {showFullResourceReadout ? (
                            <>
                              <text
                                className="is-detailed"
                                x={position.x}
                                y={
                                  detailedResourceCenterY -
                                  13 * cameraState.zoom
                                }
                                textAnchor="middle"
                                style={{
                                  fontSize: `${detailedResourceFontSize}px`,
                                }}
                              >
                                🌾{tile.food}
                              </text>
                              <text
                                className="is-detailed"
                                x={position.x}
                                y={detailedResourceCenterY}
                                textAnchor="middle"
                                style={{
                                  fontSize: `${detailedResourceFontSize}px`,
                                }}
                              >
                                ⚡{tile.energy}
                              </text>
                              <text
                                className="is-detailed"
                                x={position.x}
                                y={
                                  detailedResourceCenterY +
                                  13 * cameraState.zoom
                                }
                                textAnchor="middle"
                                style={{
                                  fontSize: `${detailedResourceFontSize}px`,
                                }}
                              >
                                ⛏{tile.ore}
                              </text>
                            </>
                          ) : (
                            <text
                              x={position.x}
                              y={
                                position.y -
                                (isPlayerOwned || isOpponentOwned
                                  ? 5
                                  : 0) *
                                  cameraState.zoom
                              }
                              textAnchor="middle"
                              style={{
                                fontSize: `${overviewResourceFontSize}px`,
                              }}
                            >
                              {primaryResource.icon}
                              {primaryResource.value}
                            </text>
                          )}
                          {tileCrystalDiscovered &&
                            tileCrystalRating > 0 && (
                              <text
                                className="hex-crystal-readout"
                                x={
                                  position.x +
                                  (showFullResourceReadout
                                    ? 17 * cameraState.zoom
                                    : 0)
                                }
                                y={
                                  position.y +
                                  (showFullResourceReadout
                                    ? -18
                                    : 10) * cameraState.zoom
                                }
                                textAnchor="middle"
                                style={{
                                  fontSize: `${crystalResourceFontSize}px`,
                                }}
                              >
                                💎{tileCrystalRating}
                              </text>
                            )}
                        </g>
                      )}

                    {isPlayerOwned && hasVisibleHarvester && (
                      <rect
                        className="hex-owner-badge player-badge"
                        x={position.x - 24 * cameraState.zoom}
                        y={position.y + 10 * cameraState.zoom}
                        width={48 * cameraState.zoom}
                        height={17 * cameraState.zoom}
                        rx={5 * cameraState.zoom}
                      />
                    )}

                    {isOpponentOwned && hasVisibleHarvester && (
                      <rect
                        className={[
                          'hex-owner-badge',
                          rivalOwner
                            ? `rival-${rivalOwner.id}`
                            : '',
                        ].join(' ')}
                        x={position.x - 24 * cameraState.zoom}
                        y={position.y + 10 * cameraState.zoom}
                        width={48 * cameraState.zoom}
                        height={17 * cameraState.zoom}
                        rx={5 * cameraState.zoom}
                      />
                    )}

                    {isPlayerOwned && (
                      <text
                        className="hex-owner-label"
                        x={position.x}
                        y={position.y + 21 * cameraState.zoom}
                        textAnchor="middle"
                      >
                        {participantId.toUpperCase()}
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
                        y={position.y + 21 * cameraState.zoom}
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

                    {hasVisibleHarvester &&
                      visibleProduction && (
                      <g className="hex-harvester-marker">
                        <circle
                          cx={position.x}
                          cy={position.y - 5 * cameraState.zoom}
                          r={15 * cameraState.zoom}
                        />
                        <text
                          className="hex-production-label"
                          x={position.x}
                          y={position.y + 1 * cameraState.zoom}
                          textAnchor="middle"
                        >
                          {harvester?.pendingProduction
                            ? '🔧'
                            : '🚜'}
                        </text>
                        <text
                          className="hex-production-resource"
                          x={position.x + 13 * cameraState.zoom}
                          y={position.y - 12 * cameraState.zoom}
                          textAnchor="middle"
                        >
                          {
                            productionTypes[
                              harvester?.pendingProduction ??
                                visibleProduction
                            ].icon
                          }
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}

              {unexploredFogPath && (
                <g
                  className="planet-fog-layer"
                  aria-hidden="true"
                >
                  <path
                    className="planet-fog-base"
                    d={unexploredFogPath}
                  />
                  <path
                    className="planet-fog-sheen"
                    d={unexploredFogPath}
                  />
                </g>
              )}

              {visibleTiles
                .filter(
                  (tile) =>
                    !revealedTileIdSet.has(tile.id) &&
                    meteorCenterIds.has(tile.id),
                )
                .map((tile) => (
                  <text
                    key={`fog-meteor-${tile.id}`}
                    className="hex-meteor-label"
                    x={projectedTiles[tile.id].x}
                    y={projectedTiles[tile.id].y}
                    textAnchor="middle"
                    aria-label="Meteoritenkrater in den Wolken"
                  >
                    ☄
                  </text>
                ))}

              {hoveredTile &&
                revealedTileIdSet.has(hoveredTile.id) &&
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

              {selectedIsRevealed &&
                selectedCell.points.length >= 3 && (
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

        {selectedFieldIsVisible && (
          <svg
            className="field-hologram-connectors"
            viewBox={`0 0 ${viewportSize.width} ${viewportSize.height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line
              className="field-detail-connector"
              x1={selectedFieldPoint.x}
              y1={selectedFieldPoint.y}
              x2={hologramConnectorPoint.x}
              y2={hologramConnectorPoint.y}
            />
            <circle
              cx={selectedFieldPoint.x}
              cy={selectedFieldPoint.y}
              r="3"
            />
          </svg>
        )}

        <aside
          className={`tile-details ${
            selectedFieldIsVisible
              ? 'is-field-hologram'
              : 'is-field-hidden'
          } ${
            mobileMapAction !== null || isChoosingProduction
              ? 'is-action-open'
              : ''
          }`}
          style={hologramStyle}
        >
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

              <h3>{getPlanetTileName(selectedTile.id)}</h3>

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
                    ? !selectedCrystalDiscovered
                      ? 'Exploration läuft'
                      : selectedCrystalRating
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

              {(canOpenHarvesterMenu ||
                canOpenLandBidMenu ||
                (selectedIsPlayerOwned && selectedHarvester)) && (
                <div
                  className="field-overview-actions"
                  aria-label={t('map.mobileActions')}
                >
                  {canOpenHarvesterMenu && (
                    <button
                      className="field-overview-action-button"
                      type="button"
                      aria-expanded={
                        mobileMapAction === 'harvester'
                      }
                      aria-controls="harvester-production-menu"
                      onClick={toggleMobileHarvesterMenu}
                    >
                      {t('map.deployHarvester', {
                        count: freeHarvesters,
                      })}
                    </button>
                  )}

                  {canOpenLandBidMenu && (
                    <button
                      className="field-overview-action-button"
                      type="button"
                      aria-expanded={
                        mobileMapAction === 'land-bid'
                      }
                      aria-controls="land-bid-menu"
                      onClick={toggleMobileLandBidMenu}
                    >
                      {t('map.placeBid')}
                    </button>
                  )}

                  {selectedIsPlayerOwned &&
                    selectedHarvester && (
                      <button
                        className="field-overview-action-button"
                        type="button"
                        aria-expanded={isChoosingProduction}
                        aria-controls="harvester-production-menu"
                        disabled={isRetoolingBlocked}
                        onClick={() => {
                          setMobileMapAction(null)
                          setIsChoosingProduction(
                            (current) => !current,
                          )
                        }}
                      >
                        {t('map.manageHarvester')}
                      </button>
                    )}
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
                  <div
                    className="production-picker"
                    id="harvester-production-menu"
                  >
                    <p>Neue Produktion wählen:</p>

                    <div
                      className={`production-options${
                        canProduceSelectedCrystals
                          ? ' has-crystal-production'
                          : ''
                      }`}
                    >
                      {availableProductionTypes.map(
                        (production) => (
                        <button
                          key={production}
                          className={`production-button${
                            production === 'crystals'
                              ? ' crystal-production-button'
                              : ''
                          }`}
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
                        ),
                      )}
                    </div>

                    <button
                      className="cancel-button"
                      type="button"
                      onClick={closeProductionMenu}
                    >
                      Abbrechen
                    </button>
                  </div>
                )}

              {selectedIsPlayerOwned &&
                !selectedProduction &&
                !selectedHarvester &&
                isChoosingProduction && (
                  <div
                    className="production-picker"
                    id="harvester-production-menu"
                  >
                    <p>
                      Was soll der Harvester produzieren?
                    </p>

                    <div
                      className={`production-options${
                        canProduceSelectedCrystals
                          ? ' has-crystal-production'
                          : ''
                      }`}
                    >
                      {availableProductionTypes.map(
                        (production) => (
                        <button
                          key={production}
                          className={`production-button${
                            production === 'crystals'
                              ? ' crystal-production-button'
                              : ''
                          }`}
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
                        ),
                      )}
                    </div>

                    <button
                      className="cancel-button"
                      type="button"
                      onClick={closeProductionMenu}
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
                      {getLandBidAmount(
                        selectedPendingBid,
                        participantId,
                      )}{' '}
                      Credits reserviert
                    </strong>
                    <p>
                      Weitere Gebote werden beim Ausführen der Runde
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
                      : `Stichauktion auf ${
                          landAuctionTie
                            ? getPlanetTileName(
                                landAuctionTie.tileId,
                              )
                            : ''
                        }`}
                  </button>
                ) : (
                  <div
                    className={`land-bid-panel ${
                      mobileMapAction === 'land-bid'
                        ? 'is-mobile-open'
                        : ''
                    }`}
                    id="land-bid-menu"
                  >
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
                      onClick={placeLandBid}
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
                      Mindestgebot: {minimumBid} Credits. Weitere
                      Gebote bleiben bis zur Auswertung geheim.
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
