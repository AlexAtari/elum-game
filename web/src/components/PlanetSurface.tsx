import {
  useEffect,
  useRef,
  useState,
} from 'react'
import planetSurfaceUrl from '../assets/planet-surface-v2.webp'
import type { Tile } from '../game'
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
  tiles: Tile[]
  viewSize: number
}

type CanvasSize = {
  width: number
  height: number
}

const TEXTURE_WIDTH = 512
const TEXTURE_HEIGHT = 256
const MAX_RENDER_SIZE = 620

function clampByte(value: number) {
  return Math.round(Math.min(255, Math.max(0, value)))
}

function createResourceTexture(
  image: HTMLImageElement,
  tiles: Tile[],
) {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_WIDTH
  canvas.height = TEXTURE_HEIGHT
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
    TEXTURE_WIDTH,
    TEXTURE_HEIGHT,
  )
  const texture = context.getImageData(
    0,
    0,
    TEXTURE_WIDTH,
    TEXTURE_HEIGHT,
  )
  const resourceTiles = tiles.flatMap((tile) => {
    const position =
      targetPlanetMap.spherePositions?.[tile.id]

    return position
      ? [{ tile, position }]
      : []
  })

  for (let y = 0; y < TEXTURE_HEIGHT; y += 1) {
    const latitude =
      Math.PI / 2 -
      ((y + 0.5) / TEXTURE_HEIGHT) * Math.PI
    const latitudeRadius = Math.cos(latitude)

    for (let x = 0; x < TEXTURE_WIDTH; x += 1) {
      const longitude =
        ((x + 0.5) / TEXTURE_WIDTH - 0.5) *
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

      const resourceTotal = food + energy + ore

      if (weightTotal === 0 || resourceTotal === 0) {
        continue
      }

      const colorScale = calculateResourceColorScale(
        food,
        energy,
        ore,
        weightTotal,
      )
      const offset = (y * TEXTURE_WIDTH + x) * 4

      texture.data[offset] = clampByte(
        texture.data[offset] * colorScale.red,
      )
      texture.data[offset + 1] = clampByte(
        texture.data[offset + 1] * colorScale.green,
      )
      texture.data[offset + 2] = clampByte(
        texture.data[offset + 2] * colorScale.blue,
      )
    }
  }

  return texture
}

export function PlanetSurface({
  radius,
  rotation,
  tiles,
  viewSize,
}: PlanetSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    width: 1,
    height: 1,
  })
  const [texture, setTexture] =
    useState<ImageData | null>(null)

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
        setTexture(createResourceTexture(image, tiles))
      }
    }

    image.src = planetSurfaceUrl
    void loadTexture()

    return () => {
      isActive = false
    }
  }, [tiles])

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
        const textureX =
          ((longitude / (Math.PI * 2) + 0.5) *
            TEXTURE_WIDTH +
            TEXTURE_WIDTH) %
          TEXTURE_WIDTH
        const textureY = Math.min(
          TEXTURE_HEIGHT - 1,
          Math.max(
            0,
            (0.5 - latitude / Math.PI) *
              TEXTURE_HEIGHT,
          ),
        )
        const textureOffset =
          (Math.floor(textureY) * TEXTURE_WIDTH +
            Math.floor(textureX)) *
          4
        const frameOffset =
          (y * canvas.width + x) * 4

        frame.data[frameOffset] =
          texture.data[textureOffset]
        frame.data[frameOffset + 1] =
          texture.data[textureOffset + 1]
        frame.data[frameOffset + 2] =
          texture.data[textureOffset + 2]
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
