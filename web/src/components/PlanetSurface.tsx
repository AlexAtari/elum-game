import {
  useEffect,
  useRef,
  useState,
} from 'react'
import planetSurfaceUrl from '../assets/planet-surface-v3.webp'
import {
  GAME_ROUND_LIMIT,
  type Tile,
} from '../game'
import {
  targetPlanetMap,
} from '../planetMap'
import {
  unprojectPlanetViewPosition,
  type PlanetRotation,
} from '../planetProjection'
import { calculateResourceColorScale } from '../planetSurfaceTint'

type PlanetSurfaceProps = {
  radius: number
  rotation: PlanetRotation
  round: number
  tiles: Tile[]
  viewSize: number
}

type CanvasSize = {
  width: number
  height: number
}

type PlanetTexture = {
  base: ImageData
  tint: ImageData
}

const BASE_TEXTURE_WIDTH = 1024
const BASE_TEXTURE_HEIGHT = 512
const TINT_TEXTURE_WIDTH = 512
const TINT_TEXTURE_HEIGHT = 256
const TINT_NEUTRAL_VALUE = 128
const MAX_RENDER_SIZE = 620

function clampByte(value: number) {
  return Math.round(Math.min(255, Math.max(0, value)))
}

function createPlanetTexture(
  image: HTMLImageElement,
  tiles: Tile[],
  round: number,
) {
  const canvas = document.createElement('canvas')
  canvas.width = BASE_TEXTURE_WIDTH
  canvas.height = BASE_TEXTURE_HEIGHT
  const context = canvas.getContext('2d', {
    willReadFrequently: true,
  })

  if (!context || !targetPlanetMap.spherePositions) {
    return null
  }

  context.drawImage(
    image,
    0,
    0,
    BASE_TEXTURE_WIDTH,
    BASE_TEXTURE_HEIGHT,
  )
  const base = context.getImageData(
    0,
    0,
    BASE_TEXTURE_WIDTH,
    BASE_TEXTURE_HEIGHT,
  )
  const tint = context.createImageData(
    TINT_TEXTURE_WIDTH,
    TINT_TEXTURE_HEIGHT,
  )
  const resourceTiles = tiles.flatMap((tile) => {
    const position =
      targetPlanetMap.spherePositions?.[tile.id]

    return position
      ? [{ tile, position }]
      : []
  })

  for (let y = 0; y < TINT_TEXTURE_HEIGHT; y += 1) {
    const latitude =
      Math.PI / 2 -
      ((y + 0.5) / TINT_TEXTURE_HEIGHT) * Math.PI
    const latitudeRadius = Math.cos(latitude)

    for (let x = 0; x < TINT_TEXTURE_WIDTH; x += 1) {
      const longitude =
        ((x + 0.5) / TINT_TEXTURE_WIDTH - 0.5) *
        Math.PI *
        2
      const position = {
        x: latitudeRadius * Math.cos(longitude),
        y: Math.sin(latitude),
        z: latitudeRadius * Math.sin(longitude),
      }
      let food = 0
      let energy = 0
      let ore = 0
      let weightTotal = 0

      for (const resourceTile of resourceTiles) {
        const dot =
          position.x * resourceTile.position.x +
          position.y * resourceTile.position.y +
          position.z * resourceTile.position.z
        const weight = Math.exp((dot - 1) * 24)

        food += (resourceTile.tile.food ?? 0) * weight
        energy += (resourceTile.tile.energy ?? 0) * weight
        ore += (resourceTile.tile.ore ?? 0) * weight
        weightTotal += weight
      }

      const colorScale = calculateResourceColorScale(
        food,
        energy,
        ore,
        weightTotal,
        round,
        GAME_ROUND_LIMIT,
      )
      const offset =
        (y * TINT_TEXTURE_WIDTH + x) * 4

      tint.data[offset] = clampByte(
        colorScale.red * TINT_NEUTRAL_VALUE,
      )
      tint.data[offset + 1] = clampByte(
        colorScale.green * TINT_NEUTRAL_VALUE,
      )
      tint.data[offset + 2] = clampByte(
        colorScale.blue * TINT_NEUTRAL_VALUE,
      )
      tint.data[offset + 3] = 255
    }
  }

  return { base, tint }
}

export function PlanetSurface({
  radius,
  rotation,
  round,
  tiles,
  viewSize,
}: PlanetSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    width: 1,
    height: 1,
  })
  const [texture, setTexture] =
    useState<PlanetTexture | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const updateSize = () => {
      const bounds = canvas.getBoundingClientRect()
      const outputScale = Math.min(
        window.devicePixelRatio || 1,
        MAX_RENDER_SIZE /
          Math.max(bounds.width, bounds.height, 1),
      )

      setCanvasSize({
        width: Math.max(
          1,
          Math.round(bounds.width * outputScale),
        ),
        height: Math.max(
          1,
          Math.round(bounds.height * outputScale),
        ),
      })
    }
    const observer = new ResizeObserver(updateSize)

    observer.observe(canvas)
    updateSize()

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const image = new Image()
    let isActive = true

    const loadTexture = async () => {
      try {
        await image.decode()
      } catch {
        return
      }

      if (isActive) {
        setTexture(
          createPlanetTexture(image, tiles, round),
        )
      }
    }

    image.src = planetSurfaceUrl
    void loadTexture()

    return () => {
      isActive = false
    }
  }, [round, tiles])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !context || !texture) {
      return
    }

    canvas.width = canvasSize.width
    canvas.height = canvasSize.height
    const frame = context.createImageData(
      canvas.width,
      canvas.height,
    )
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const planetRadius =
      (Math.min(canvas.width, canvas.height) / viewSize) *
      radius
    const minimumX = Math.max(
      0,
      Math.floor(centerX - planetRadius),
    )
    const maximumX = Math.min(
      canvas.width - 1,
      Math.ceil(centerX + planetRadius),
    )
    const minimumY = Math.max(
      0,
      Math.floor(centerY - planetRadius),
    )
    const maximumY = Math.min(
      canvas.height - 1,
      Math.ceil(centerY + planetRadius),
    )

    for (let y = minimumY; y <= maximumY; y += 1) {
      const viewY = (y + 0.5 - centerY) / planetRadius

      for (let x = minimumX; x <= maximumX; x += 1) {
        const viewX =
          (x + 0.5 - centerX) / planetRadius
        const radialDistance =
          viewX * viewX + viewY * viewY

        if (radialDistance > 1) {
          continue
        }

        const world = unprojectPlanetViewPosition(
          targetPlanetMap,
          rotation,
          {
            x: viewX,
            y: viewY,
            depth: Math.sqrt(1 - radialDistance),
          },
        )
        const longitude = Math.atan2(world.z, world.x)
        const latitude = Math.asin(world.y)
        const horizontalPosition =
          (longitude / (Math.PI * 2) + 1.5) % 1
        const verticalPosition = Math.min(
          1,
          Math.max(0, 0.5 - latitude / Math.PI),
        )
        const baseOffset =
          (Math.min(
            BASE_TEXTURE_HEIGHT - 1,
            Math.floor(
              verticalPosition * BASE_TEXTURE_HEIGHT,
            ),
          ) *
            BASE_TEXTURE_WIDTH +
            Math.floor(
              horizontalPosition * BASE_TEXTURE_WIDTH,
            )) *
          4
        const tintOffset =
          (Math.min(
            TINT_TEXTURE_HEIGHT - 1,
            Math.floor(
              verticalPosition * TINT_TEXTURE_HEIGHT,
            ),
          ) *
            TINT_TEXTURE_WIDTH +
            Math.floor(
              horizontalPosition * TINT_TEXTURE_WIDTH,
            )) *
          4
        const frameOffset =
          (y * canvas.width + x) * 4

        frame.data[frameOffset] = clampByte(
          (texture.base.data[baseOffset] *
            texture.tint.data[tintOffset]) /
            TINT_NEUTRAL_VALUE,
        )
        frame.data[frameOffset + 1] = clampByte(
          (texture.base.data[baseOffset + 1] *
            texture.tint.data[tintOffset + 1]) /
            TINT_NEUTRAL_VALUE,
        )
        frame.data[frameOffset + 2] = clampByte(
          (texture.base.data[baseOffset + 2] *
            texture.tint.data[tintOffset + 2]) /
            TINT_NEUTRAL_VALUE,
        )
        frame.data[frameOffset + 3] = 255
      }
    }

    context.putImageData(frame, 0, 0)
  }, [canvasSize, radius, rotation, texture, viewSize])

  return (
    <canvas
      ref={canvasRef}
      className="planet-surface-canvas"
      aria-hidden="true"
    />
  )
}
