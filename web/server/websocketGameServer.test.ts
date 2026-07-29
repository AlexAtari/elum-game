import { describe, expect, it } from 'vitest'
import { WebSocket } from 'ws'
import type { MultiplayerServerMessage } from '../src/multiplayerProtocol'
import {
  createWebSocketGameServer,
  formatWebSocketUrl,
} from './websocketGameServer'

type TestClient = {
  socket: WebSocket
  waitFor: (
    predicate: (message: MultiplayerServerMessage) => boolean,
  ) => Promise<MultiplayerServerMessage>
}

async function openClient(url: string): Promise<TestClient> {
  const socket = new WebSocket(url)
  const messages: MultiplayerServerMessage[] = []
  const waiters: Array<{
    predicate: (message: MultiplayerServerMessage) => boolean
    resolve: (message: MultiplayerServerMessage) => void
  }> = []

  socket.on('message', (data) => {
    const message = JSON.parse(
      data.toString(),
    ) as MultiplayerServerMessage
    const waiterIndex = waiters.findIndex(({ predicate }) =>
      predicate(message),
    )

    if (waiterIndex >= 0) {
      const [waiter] = waiters.splice(waiterIndex, 1)
      waiter.resolve(message)
    } else {
      messages.push(message)
    }
  })

  await new Promise<void>((resolve, reject) => {
    socket.once('open', () => resolve())
    socket.once('error', reject)
  })

  return {
    socket,
    waitFor: (predicate) => {
      const messageIndex = messages.findIndex(predicate)

      if (messageIndex >= 0) {
        const [message] = messages.splice(messageIndex, 1)
        return Promise.resolve(message)
      }

      return new Promise<MultiplayerServerMessage>(
        (resolve, reject) => {
          const wrappedResolve = (
            message: MultiplayerServerMessage,
          ) => {
            clearTimeout(timeout)
            resolve(message)
          }
          const timeout = setTimeout(() => {
            const waiterIndex = waiters.findIndex(
              (waiter) => waiter.resolve === wrappedResolve,
            )

            if (waiterIndex >= 0) {
              waiters.splice(waiterIndex, 1)
            }
            reject(new Error('Timed out waiting for server message.'))
          }, 2_000)
          waiters.push({
            predicate,
            resolve: wrappedResolve,
          })
        },
      )
    },
  }
}

function send(
  client: TestClient,
  message: Record<string, unknown>,
) {
  client.socket.send(JSON.stringify(message))
}

function closeClient(client: TestClient) {
  if (
    client.socket.readyState === WebSocket.CLOSED ||
    client.socket.readyState === WebSocket.CLOSING
  ) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    client.socket.once('close', () => resolve())
    client.socket.close()
  })
}

describe('Lokaler WebSocket-Spielserver', () => {
  it('verbindet zwei Clients mit Lobby, Match und Reconnect', async () => {
    let connectionSequence = 0
    const server = createWebSocketGameServer({
      host: '127.0.0.1',
      port: 0,
      lobbyId: 'integration',
      seed: 17,
      createConnectionId: () => {
        connectionSequence += 1
        return `connection-${connectionSequence}`
      },
    })
    const address = await server.listen()
    const url = formatWebSocketUrl(address)
    const host = await openClient(url)
    const guest = await openClient(url)

    try {
      const healthResponse = await fetch(
        `http://127.0.0.1:${address.port}/health`,
      )
      expect(healthResponse.status).toBe(200)
      expect(await healthResponse.json()).toEqual({
        ok: true,
        lobbyId: 'integration',
      })

      send(host, {
        version: 1,
        requestId: 'join-host',
        type: 'join-lobby',
        payload: { displayName: 'Alex' },
      })
      const hostSession = await host.waitFor(
        (message) => message.type === 'session-established',
      )
      expect(hostSession).toMatchObject({
        payload: { participantId: 'agima' },
      })

      send(guest, {
        version: 1,
        requestId: 'join-guest',
        type: 'join-lobby',
        payload: { displayName: 'Bea' },
      })
      const guestSession = await guest.waitFor(
        (message) => message.type === 'session-established',
      )
      expect(guestSession).toMatchObject({
        payload: { participantId: 'orion' },
      })
      const reconnectToken =
        guestSession.type === 'session-established'
          ? guestSession.payload.reconnectToken
          : ''

      send(host, {
        version: 1,
        requestId: 'ready-host',
        type: 'set-ready',
        payload: { ready: true },
      })
      send(guest, {
        version: 1,
        requestId: 'ready-guest',
        type: 'set-ready',
        payload: { ready: true },
      })
      await host.waitFor(
        (message) =>
          message.type === 'lobby-snapshot' &&
          message.payload.seats.orion.kind === 'human' &&
          message.payload.seats.orion.ready,
      )

      send(host, {
        version: 1,
        requestId: 'start',
        type: 'start-match',
        payload: {},
      })
      await guest.waitFor(
        (message) => message.type === 'match-snapshot',
      )

      const guestDisconnected = host.waitFor(
        (message) =>
          message.type === 'lobby-snapshot' &&
          message.payload.seats.orion.kind === 'human' &&
          !message.payload.seats.orion.connected,
      )
      await closeClient(guest)
      await guestDisconnected

      const resumedGuest = await openClient(url)

      try {
        send(resumedGuest, {
          version: 1,
          requestId: 'resume-guest',
          type: 'resume-session',
          payload: { reconnectToken },
        })
        await resumedGuest.waitFor(
          (message) =>
            message.type === 'session-established' &&
            message.payload.participantId === 'orion',
        )
        const resumedMatch = await resumedGuest.waitFor(
          (message) => message.type === 'match-snapshot',
        )
        expect(resumedMatch).toMatchObject({
          payload: {
            state: {
              round: 1,
              match: {
                seed: 17,
              },
            },
          },
        })
      } finally {
        await closeClient(resumedGuest)
      }
    } finally {
      await closeClient(host)
      await closeClient(guest)
      await server.close()
    }
  })

  it('weist Binärnachrichten und falsche Lobby-Pfade zurück', async () => {
    const server = createWebSocketGameServer({
      host: '127.0.0.1',
      port: 0,
      lobbyId: 'expected',
    })
    const address = await server.listen()
    const wrongLobby = new WebSocket(
      `ws://127.0.0.1:${address.port}/multiplayer?lobby=wrong`,
    )
    wrongLobby.on('error', () => undefined)

    try {
      const statusCode = await new Promise<number | undefined>(
        (resolve) => {
          wrongLobby.once('unexpected-response', (_, response) => {
            response.resume()
            resolve(response.statusCode)
          })
        },
      )
      expect(statusCode).toBe(404)

      const client = await openClient(formatWebSocketUrl(address))
      const closeCode = new Promise<number>((resolve) => {
        client.socket.once('close', (code) => resolve(code))
      })
      client.socket.send(Buffer.from([1, 2, 3]))
      expect(await closeCode).toBe(1003)
    } finally {
      await server.close()
    }
  })
})
