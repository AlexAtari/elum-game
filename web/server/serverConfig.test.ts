import { describe, expect, it } from 'vitest'
import { readMultiplayerServerConfig } from './serverConfig'

describe('Konfiguration des Multiplayer-Servers', () => {
  it('behält sichere lokale Standardwerte bei', () => {
    expect(readMultiplayerServerConfig({})).toEqual({
      host: '127.0.0.1',
      port: 8787,
      lobbyId: 'mars-alpha',
      seed: 1,
      allowedOrigins: undefined,
    })
  })

  it('verwendet den von Render bereitgestellten Port', () => {
    expect(
      readMultiplayerServerConfig({
        PORT: '10000',
        ELUM_SERVER_HOST: '0.0.0.0',
      }),
    ).toMatchObject({
      host: '0.0.0.0',
      port: 10_000,
    })
  })

  it('lässt den expliziten lokalen Port vor PORT gewinnen', () => {
    expect(
      readMultiplayerServerConfig({
        PORT: '10000',
        ELUM_SERVER_PORT: '8787',
      }).port,
    ).toBe(8787)
  })

  it('liest mehrere erlaubte Browser-Origins', () => {
    expect(
      readMultiplayerServerConfig({
        ELUM_ALLOWED_ORIGINS:
          'https://alexatari.github.io, http://localhost:5173',
      }).allowedOrigins,
    ).toEqual([
      'https://alexatari.github.io',
      'http://localhost:5173',
    ])
  })

  it('weist Pfade und Nicht-HTTP-Origins zurück', () => {
    expect(() =>
      readMultiplayerServerConfig({
        ELUM_ALLOWED_ORIGINS:
          'https://alexatari.github.io/elum-game/',
      }),
    ).toThrow('HTTP origins only')
    expect(() =>
      readMultiplayerServerConfig({
        ELUM_ALLOWED_ORIGINS: 'wss://example.test',
      }),
    ).toThrow('HTTP origins only')
  })
})
