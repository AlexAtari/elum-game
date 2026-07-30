import { describe, expect, it, vi } from 'vitest'
import {
  checkHostedServer,
  type HostedServerFetcher,
} from './hostedServerMonitor'

const validMetrics = `
elum_active_lobbies 2
elum_active_websocket_connections 3
elum_websocket_connections_total 8
elum_websocket_messages_total 21
elum_websocket_upgrade_rejections_total 1
`

function createFetcher(
  health: Record<string, unknown>,
  metrics = validMetrics,
) {
  return vi.fn<HostedServerFetcher>(async (input) => {
    if (input.endsWith('/health')) {
      return {
        ok: true,
        status: 200,
        json: async () => health,
        text: async () => '',
      }
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => metrics,
    }
  })
}

describe('Überwachung des gehosteten Multiplayer-Servers', () => {
  it('prüft Health und alle erwarteten Metriken', async () => {
    const fetcher = createFetcher({
      ok: true,
      status: 'ready',
      lobbyCount: 2,
      connectionCount: 3,
    })

    await expect(
      checkHostedServer(
        'https://elum-multiplayer.onrender.com',
        fetcher,
      ),
    ).resolves.toEqual({
      lobbyCount: 2,
      connectionCount: 3,
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('weist einen nicht bereiten Server zurück', async () => {
    const fetcher = createFetcher({
      ok: false,
      status: 'starting',
      lobbyCount: 0,
      connectionCount: 0,
    })

    await expect(
      checkHostedServer(
        'https://elum-multiplayer.onrender.com',
        fetcher,
      ),
    ).rejects.toThrow('not ready')
  })

  it('erkennt fehlende oder ungültige Metriken', async () => {
    const fetcher = createFetcher(
      {
        ok: true,
        status: 'ready',
        lobbyCount: 0,
        connectionCount: 0,
      },
      'elum_active_lobbies 0\n',
    )

    await expect(
      checkHostedServer(
        'https://elum-multiplayer.onrender.com',
        fetcher,
      ),
    ).rejects.toThrow(
      'Missing metric: elum_active_websocket_connections.',
    )
  })
})
