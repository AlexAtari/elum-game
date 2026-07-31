import { describe, expect, it, vi } from 'vitest'
import {
  buildMultiplayerHealthUrl,
  buildMultiplayerWebSocketUrl,
  createDefaultMultiplayerServerUrl,
  createMultiplayerInviteUrl,
  readMultiplayerInvite,
  wakeMultiplayerServer,
} from './multiplayerClient'

describe('Multiplayer-Clientadresse', () => {
  it('verwendet auf GitHub Pages den öffentlichen Render-Dienst', () => {
    expect(
      createDefaultMultiplayerServerUrl({
        protocol: 'https:',
        hostname: 'alexatari.github.io',
      }),
    ).toBe('wss://elum-multiplayer.onrender.com')
  })

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

  it('leitet den Health-Endpunkt aus der WebSocket-Adresse ab', () => {
    expect(
      buildMultiplayerHealthUrl(
        'wss://elum-multiplayer.onrender.com/old?lobby=mars',
      ),
    ).toBe('https://elum-multiplayer.onrender.com/health')
    expect(
      buildMultiplayerHealthUrl('ws://192.168.1.20:8787'),
    ).toBe('http://192.168.1.20:8787/health')
  })

  it('weckt den Server und prüft seine Bereitschaft', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      type: 'basic' as ResponseType,
      json: async () => ({ ok: true, status: 'ready' }),
    }))

    await expect(
      wakeMultiplayerServer(
        'wss://elum-multiplayer.onrender.com',
        fetcher,
      ),
    ).resolves.toBe(true)
    expect(fetcher).toHaveBeenCalledWith(
      'https://elum-multiplayer.onrender.com/health',
      expect.objectContaining({ cache: 'no-store' }),
    )
  })

  it('sendet bei alter CORS-Konfiguration einen reinen Aufweckaufruf', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: false,
        type: 'opaque' as ResponseType,
        json: async () => ({}),
      })

    await expect(
      wakeMultiplayerServer(
        'wss://elum-multiplayer.onrender.com',
        fetcher,
      ),
    ).resolves.toBe(true)
    expect(fetcher).toHaveBeenLastCalledWith(
      'https://elum-multiplayer.onrender.com/health',
      expect.objectContaining({ mode: 'no-cors' }),
    )
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
