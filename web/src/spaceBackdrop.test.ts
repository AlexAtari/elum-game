import { describe, expect, it } from 'vitest'
import { createSpaceBackdropStyle } from './spaceBackdrop'

describe('Weltraumhintergrund', () => {
  it('bewegt Sonne und Ringplanet deutlich mit der Planetendrehung', () => {
    const style = createSpaceBackdropStyle({
      yaw: Math.PI / 2,
      pitch: Math.PI / 10,
    })

    expect(style['--space-object-x']).toBe('130px')
    expect(style['--space-object-far-x']).toBe('110px')
    expect(style['--space-object-y']).toBe('10px')
    expect(style['--space-object-far-y']).toBe('8.2px')
  })

  it('wendet die Bewegungsrichtung bei umgekehrter Drehung', () => {
    const style = createSpaceBackdropStyle({
      yaw: -Math.PI / 2,
      pitch: -Math.PI / 10,
    })

    expect(style['--space-object-x']).toBe('-130px')
    expect(style['--space-object-far-x']).toBe('-110px')
    expect(style['--space-object-y']).toBe('-10px')
    expect(style['--space-object-far-y']).toBe('-8.2px')
  })
})
