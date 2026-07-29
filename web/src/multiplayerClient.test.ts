import { describe, expect, it } from 'vitest'
import {
  buildMultiplayerWebSocketUrl,
  createDefaultMultiplayerServerUrl,
} from './multiplayerClient'

describe('Multiplayer-Clientadresse', () => {
  it('leitet für lokale Seiten denselben Host ab', () => {
    expect(
      createDefaultMultiplayerServerUrl({
        protocol: 'http:',
        hostname: '192.168.1.20',
      }),
    ).toBe('ws://192.168.1.20:8787')
    expect(
      createDefaultMultiplayerServerUrl({
        protocol: 'https:',
        hostname: 'example.test',
      }),
    ).toBe('wss://example.test:8787')
  })

  it('normalisiert Pfad und Lobbyparameter', () => {
    expect(
      buildMultiplayerWebSocketUrl(
        'ws://localhost:8787/old?x=1',
        ' mars alpha ',
      ),
    ).toBe(
      'ws://localhost:8787/multiplayer?lobby=mars+alpha',
    )
    expect(() =>
      buildMultiplayerWebSocketUrl(
        'https://localhost:8787',
        'mars',
      ),
    ).toThrow('WebSocket URL required.')
  })
})
