import { describe, expect, it } from 'vitest'
import {
  buildMultiplayerWebSocketUrl,
  createDefaultMultiplayerServerUrl,
  createMultiplayerInviteUrl,
  readMultiplayerInvite,
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

  it('erzeugt einen Einladungslink für die aktuelle Seite', () => {
    const inviteUrl = new URL(
      createMultiplayerInviteUrl(
        'https://example.test/elum-game/?language=de#map',
        'wss://games.example.test:8787/old?x=1',
        ' mars alpha ',
      ),
    )

    expect(inviteUrl.origin + inviteUrl.pathname).toBe(
      'https://example.test/elum-game/',
    )
    expect(inviteUrl.hash).toBe('')
    expect(inviteUrl.searchParams.get('language')).toBe('de')
    expect(inviteUrl.searchParams.get('multiplayer')).toBe('1')
    expect(inviteUrl.searchParams.get('server')).toBe(
      'wss://games.example.test:8787',
    )
    expect(inviteUrl.searchParams.get('lobby')).toBe(
      'mars alpha',
    )
  })

  it('liest gültige Einladungen und verwirft ungültige Parameter', () => {
    expect(
      readMultiplayerInvite(
        '?multiplayer=1&server=ws%3A%2F%2F192.168.1.20%3A8787&lobby=mars-alpha',
      ),
    ).toEqual({
      serverUrl: 'ws://192.168.1.20:8787',
      lobbyId: 'mars-alpha',
    })
    expect(
      readMultiplayerInvite(
        '?server=ws%3A%2F%2Flocalhost%3A8787&lobby=mars-alpha',
      ),
    ).toBeNull()
    expect(
      readMultiplayerInvite(
        '?multiplayer=1&server=https%3A%2F%2Fexample.test&lobby=mars-alpha',
      ),
    ).toBeNull()
    expect(
      readMultiplayerInvite(
        `?multiplayer=1&server=ws%3A%2F%2Flocalhost%3A8787&lobby=${'x'.repeat(129)}`,
      ),
    ).toBeNull()
  })
})
