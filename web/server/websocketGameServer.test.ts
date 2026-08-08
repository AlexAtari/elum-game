import { describe, expect, it } from 'vitest'
import { WebSocket } from 'ws'
import {
  getMarketTiming,
  type MarketResource,
} from '../src/game'
import type { GameCommand } from '../src/gameCommands'
import { participantIds } from '../src/match'
import type { MultiplayerServerMessage } from '../src/multiplayerProtocol'
import { targetPlanetMap } from '../src/planetMap'
import type { MatchClock } from '../src/authoritativeMatch'
import { InMemoryLobbyPersistenceStore } from './lobbyPersistence'
import {
  createWebSocketGameServer,
  type LobbyCleanupClock,
  formatWebSocketUrl,
} from './websocketGameServer'

type TestClient = {
  socket: WebSocket
  waitFor: (
    predicate: (message: MultiplayerServerMessage) => boolean,
  ) => Promise<MultiplayerServerMessage>
}

type MatchSnapshotMessage = Extract<
  MultiplayerServerMessage,
  { type: 'match-snapshot' }
>

class FakeMatchClock implements MatchClock {
  private currentMilliseconds = 0
  private nextTimerId = 1
  private readonly timers = new Map<
    number,
    {
      callback: () => void
      dueMilliseconds: number
    }
  >()

  now = () => this.currentMilliseconds

  setTimeout = (
    callback: () => void,
    delayMilliseconds: number,
  ) => {
    const timerId = this.nextTimerId
    this.nextTimerId += 1
    this.timers.set(timerId, {
      callback,
      dueMilliseconds:
        this.currentMilliseconds + delayMilliseconds,
    })
    return timerId
  }

  clearTimeout = (timer: unknown) => {
    if (typeof timer === 'number') {
      this.timers.delete(timer)
    }
  }

  advanceBy(milliseconds: number) {
    const targetMilliseconds =
      this.currentMilliseconds + milliseconds

    while (true) {
      const nextTimer = [...this.timers.entries()]
        .filter(
          ([, timer]) =>
            timer.dueMilliseconds <= targetMilliseconds,
        )
        .sort(
          ([firstId, first], [secondId, second]) =>
            first.dueMilliseconds - second.dueMilliseconds ||
            firstId - secondId,
        )[0]

      if (!nextTimer) {
        break
      }

      const [timerId, timer] = nextTimer
      this.timers.delete(timerId)
      this.currentMilliseconds = timer.dueMilliseconds
      timer.callback()
    }

    this.currentMilliseconds = targetMilliseconds
  }
}

class FakeLobbyCleanupClock implements LobbyCleanupClock {
  private currentMilliseconds = 0
  private nextTimerId = 1
  private readonly timers = new Map<
    number,
    {
      callback: () => void
      dueMilliseconds: number
    }
  >()

  setTimeout(
    callback: () => void,
    delayMilliseconds: number,
  ) {
    const timerId = this.nextTimerId
    this.nextTimerId += 1
    this.timers.set(timerId, {
      callback,
      dueMilliseconds:
        this.currentMilliseconds + delayMilliseconds,
    })
    return timerId
  }

  clearTimeout(timer: unknown) {
    if (typeof timer === 'number') {
      this.timers.delete(timer)
    }
  }

  get pendingTimerCount() {
    return this.timers.size
  }

  advanceBy(milliseconds: number) {
    const targetMilliseconds =
      this.currentMilliseconds + milliseconds

    while (true) {
      const nextTimer = [...this.timers.entries()]
        .filter(
          ([, timer]) =>
            timer.dueMilliseconds <= targetMilliseconds,
        )
        .sort(
          ([firstId, first], [secondId, second]) =>
            first.dueMilliseconds - second.dueMilliseconds ||
            firstId - secondId,
        )[0]

      if (!nextTimer) {
        break
      }

      const [timerId, timer] = nextTimer
      this.timers.delete(timerId)
      this.currentMilliseconds = timer.dueMilliseconds
      timer.callback()
    }

    this.currentMilliseconds = targetMilliseconds
  }
}

async function waitForPendingCleanupTimer(
  clock: FakeLobbyCleanupClock,
) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (clock.pendingTimerCount > 0) {
      return
    }

    await new Promise<void>((resolve) =>
      setImmediate(resolve),
    )
  }

  throw new Error('Timed out waiting for lobby cleanup timer.')
}

async function openClient(
  url: string,
  origin?: string,
): Promise<TestClient> {
  const socket = new WebSocket(url, { origin })
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

async function readRejectedStatus(
  url: string,
  origin?: string,
) {
  const socket = new WebSocket(url, { origin })
  socket.on('error', () => undefined)

  return new Promise<number | undefined>((resolve) => {
    socket.once('unexpected-response', (_, response) => {
      response.resume()
      resolve(response.statusCode)
    })
  })
}

function send(
  client: TestClient,
  message: Record<string, unknown>,
) {
  client.socket.send(JSON.stringify(message))
}

async function submitGameCommand(
  client: TestClient,
  requestId: string,
  command: GameCommand,
) {
  send(client, {
    version: 1,
    requestId,
    type: 'game-command',
    payload: { command },
  })
  const result = await client.waitFor(
    (message) =>
      message.type === 'command-result' &&
      message.requestId === requestId,
  )

  expect(result).toMatchObject({
    type: 'command-result',
    payload: { ok: true },
  })

  if (
    result.type !== 'command-result' ||
    !result.payload.ok
  ) {
    throw new Error(`Command ${requestId} was rejected.`)
  }

  const snapshot = await client.waitFor(
    (message) =>
      message.type === 'match-snapshot' &&
      message.payload.revision === result.payload.revision,
  )

  if (snapshot.type !== 'match-snapshot') {
    throw new Error(`Command ${requestId} has no snapshot.`)
  }

  return snapshot
}

async function submitRoundPlan(
  client: TestClient,
  requestId: string,
) {
  send(client, {
    version: 1,
    requestId,
    type: 'submit-round-plan',
    payload: {
      supplyPlan: { foodLevel: 2, energyLevel: 2 },
    },
  })
  const result = await client.waitFor(
    (message) =>
      message.type === 'command-result' &&
      message.requestId === requestId,
  )

  expect(result).toMatchObject({
    type: 'command-result',
    payload: { ok: true },
  })

  if (
    result.type !== 'command-result' ||
    !result.payload.ok
  ) {
    throw new Error(`Round plan ${requestId} was rejected.`)
  }

  const snapshot = await client.waitFor(
    (message) =>
      message.type === 'match-snapshot' &&
      message.payload.revision === result.payload.revision,
  )

  if (snapshot.type !== 'match-snapshot') {
    throw new Error(`Round plan ${requestId} has no snapshot.`)
  }

  return snapshot
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
      expect(
        healthResponse.headers.get('access-control-allow-origin'),
      ).toBe('*')
      expect(await healthResponse.json()).toEqual({
        ok: true,
        status: 'ready',
        defaultLobbyId: 'integration',
        lobbyCount: 1,
        connectionCount: 2,
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

  it('spielt mit zwei Clients eine vollständige Multiplayer-Smoke-Runde', async () => {
    const matchClock = new FakeMatchClock()
    const server = createWebSocketGameServer({
      host: '127.0.0.1',
      port: 0,
      lobbyId: 'smoke-round',
      seed: 23,
      matchOptions: { clock: matchClock },
    })
    const address = await server.listen()
    const url = formatWebSocketUrl(address)
    const host = await openClient(url)
    const guest = await openClient(url)
    let resumedGuest: TestClient | null = null

    try {
      send(host, {
        version: 1,
        requestId: 'smoke-join-host',
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
        requestId: 'smoke-join-guest',
        type: 'join-lobby',
        payload: { displayName: 'Bea' },
      })
      const guestSession = await guest.waitFor(
        (message) => message.type === 'session-established',
      )

      if (guestSession.type !== 'session-established') {
        throw new Error('Expected an established guest session.')
      }

      expect(guestSession.payload.participantId).toBe('orion')
      const guestReconnectToken =
        guestSession.payload.reconnectToken

      send(host, {
        version: 1,
        requestId: 'smoke-ready-host',
        type: 'set-ready',
        payload: { ready: true },
      })
      send(guest, {
        version: 1,
        requestId: 'smoke-ready-guest',
        type: 'set-ready',
        payload: { ready: true },
      })
      await host.waitFor(
        (message) =>
          message.type === 'lobby-snapshot' &&
          message.payload.seats.agima.kind === 'human' &&
          message.payload.seats.agima.ready &&
          message.payload.seats.orion.kind === 'human' &&
          message.payload.seats.orion.ready,
      )

      send(host, {
        version: 1,
        requestId: 'smoke-start',
        type: 'start-match',
        payload: {},
      })
      let latestSnapshot = await host.waitFor(
        (message) => message.type === 'match-snapshot',
      )
      await guest.waitFor(
        (message) => message.type === 'match-snapshot',
      )

      if (latestSnapshot.type !== 'match-snapshot') {
        throw new Error('Expected the initial match snapshot.')
      }

      expect(latestSnapshot.payload.state.round).toBe(1)
      expect(
        latestSnapshot.payload.state.match.participants,
      ).toMatchObject({
        agima: {
          controller: { kind: 'human', input: 'remote' },
        },
        orion: {
          controller: { kind: 'human', input: 'remote' },
        },
        nova: { controller: { kind: 'ai' } },
        vega: { controller: { kind: 'ai' } },
      })

      const hostColony =
        latestSnapshot.payload.state.colonies.agima
      const harvesterTileId = hostColony.ownedTileIds.find(
        (tileId) =>
          hostColony.harvesterAssignments[tileId] === undefined,
      )

      if (!harvesterTileId) {
        throw new Error('Expected a free host harvester tile.')
      }

      latestSnapshot = await submitGameCommand(
        host,
        'smoke-assign-harvester',
        {
          version: 1,
          commandId: 'smoke-assign-harvester',
          participantId: 'agima',
          expectedRound: 1,
          type: 'assign-harvester',
          payload: {
            tileId: harvesterTileId,
            production: 'food',
          },
        },
      )
      expect(
        latestSnapshot.payload.state.colonies.agima
          .harvesterAssignments[harvesterTileId],
      ).toMatchObject({ production: 'food' })
      const stateAfterHarvester = latestSnapshot.payload.state

      const allOwnedTileIds = new Set(
        participantIds.flatMap(
          (participantId) =>
            stateAfterHarvester.colonies[participantId]
              .ownedTileIds,
        ),
      )
      const opponentOwnedTileIds = new Set(
        participantIds
          .filter((participantId) => participantId !== 'agima')
          .flatMap(
            (participantId) =>
              stateAfterHarvester.colonies[participantId]
                .ownedTileIds,
          ),
      )
      const landTile = targetPlanetMap.tiles.find(
        (tile) =>
          tile.id !== targetPlanetMap.hqTileId &&
          !allOwnedTileIds.has(tile.id) &&
          tile.neighborIds.some((tileId) =>
            hostColony.ownedTileIds.includes(tileId),
          ) &&
          !tile.neighborIds.some((tileId) =>
            opponentOwnedTileIds.has(tileId),
          ),
      )

      if (!landTile) {
        throw new Error('Expected a legal uncontested land tile.')
      }

      latestSnapshot = await submitGameCommand(
        host,
        'smoke-place-land-bid',
        {
          version: 1,
          commandId: 'smoke-place-land-bid',
          participantId: 'agima',
          expectedRound: 1,
          type: 'place-land-bid',
          payload: { tileId: landTile.id, amount: 25 },
        },
      )
      expect(latestSnapshot.payload.state.pendingLandBid).toMatchObject({
        tileId: landTile.id,
        bids: { agima: 25 },
      })

      const marketResources: MarketResource[] = [
        'food',
        'energy',
        'ore',
        'crystals',
      ]
      const marketTiming = getMarketTiming(1)

      for (const resource of marketResources) {
        latestSnapshot = await submitGameCommand(
          host,
          `smoke-${resource}-initiate`,
          {
            version: 1,
            commandId: `smoke-${resource}-initiate`,
            participantId: 'agima',
            expectedRound: 1,
            type: 'initiate-resource-market',
            payload: { resource },
          },
        )
        expect(
          Object.keys(
            latestSnapshot.payload.state.activeResourceMarket
              ?.roles ?? {},
          ),
        ).toEqual([...participantIds])

        matchClock.advanceBy(
          marketTiming.introductionSeconds * 1000,
        )
        latestSnapshot = (await host.waitFor(
          (message) =>
            message.type === 'match-snapshot' &&
            message.payload.state.activeResourceMarket
              ?.resource === resource &&
            message.payload.state.activeResourceMarket.phase ===
              'declaration',
        )) as MatchSnapshotMessage

        await submitGameCommand(
          host,
          `smoke-${resource}-host-role`,
          {
            version: 1,
            commandId: `smoke-${resource}-host-role`,
            participantId: 'agima',
            expectedRound: 1,
            type: 'set-market-role',
            payload: { resource, role: 'seller' },
          },
        )
        await submitGameCommand(
          guest,
          `smoke-${resource}-guest-role`,
          {
            version: 1,
            commandId: `smoke-${resource}-guest-role`,
            participantId: 'orion',
            expectedRound: 1,
            type: 'set-market-role',
            payload: { resource, role: 'buyer' },
          },
        )

        matchClock.advanceBy(
          marketTiming.declarationSeconds * 1000,
        )
        latestSnapshot = (await host.waitFor(
          (message) =>
            message.type === 'match-snapshot' &&
            message.payload.state.activeResourceMarket
              ?.resource === resource &&
            message.payload.state.activeResourceMarket.phase ===
              'auction',
        )) as MatchSnapshotMessage
        const tradePrice =
          latestSnapshot.payload.state.market[resource]
            .referencePrice

        await submitGameCommand(
          host,
          `smoke-${resource}-host-offer`,
          {
            version: 1,
            commandId: `smoke-${resource}-host-offer`,
            participantId: 'agima',
            expectedRound: 1,
            type: 'set-market-offer',
            payload: {
              resource,
              active: true,
              price: tradePrice,
            },
          },
        )
        const beforeTrade = await submitGameCommand(
          guest,
          `smoke-${resource}-guest-offer`,
          {
            version: 1,
            commandId: `smoke-${resource}-guest-offer`,
            participantId: 'orion',
            expectedRound: 1,
            type: 'set-market-offer',
            payload: {
              resource,
              active: true,
              price: tradePrice,
            },
          },
        )
        const hostResourceBefore =
          beforeTrade.payload.state.colonies.agima.resources[
            resource
          ]
        const guestResourceBefore =
          beforeTrade.payload.state.colonies.orion.resources[
            resource
          ]

        const afterTrade = await submitGameCommand(
          guest,
          `smoke-${resource}-trade`,
          {
            version: 1,
            commandId: `smoke-${resource}-trade`,
            participantId: 'orion',
            expectedRound: 1,
            type: 'execute-market-trade',
            payload: {
              resource,
              direction: 'buy',
              price: tradePrice,
              counterparty: 'agima',
            },
          },
        )
        expect(
          afterTrade.payload.state.colonies.agima.resources[
            resource
          ],
        ).toBe(hostResourceBefore - 1)
        expect(
          afterTrade.payload.state.colonies.orion.resources[
            resource
          ],
        ).toBe(guestResourceBefore + 1)

        matchClock.advanceBy(
          marketTiming.auctionSeconds * 1000,
        )
        latestSnapshot = (await host.waitFor(
          (message) =>
            message.type === 'match-snapshot' &&
            message.payload.state.activeResourceMarket
              ?.resource === resource &&
            message.payload.state.activeResourceMarket.phase ===
              'finished',
        )) as MatchSnapshotMessage
        latestSnapshot = await submitGameCommand(
          host,
          `smoke-${resource}-complete`,
          {
            version: 1,
            commandId: `smoke-${resource}-complete`,
            participantId: 'agima',
            expectedRound: 1,
            type: 'complete-resource-market',
            payload: { resource },
          },
        )
        expect(
          latestSnapshot.payload.state.activeResourceMarket,
        ).toBeNull()
      }

      expect(
        latestSnapshot.payload.state.initiatedMarketResources,
      ).toEqual(marketResources)

      await submitRoundPlan(host, 'smoke-host-round-plan')
      latestSnapshot = await submitRoundPlan(
        guest,
        'smoke-guest-round-plan',
      )
      expect(latestSnapshot.payload.state.round).toBe(2)
      expect(
        latestSnapshot.payload.state.colonies.agima.ownedTileIds,
      ).toContain(landTile.id)
      expect(
        latestSnapshot.payload.state.colonies.agima
          .harvesterAssignments[harvesterTileId],
      ).toBeDefined()

      await closeClient(guest)
      resumedGuest = await openClient(url)
      send(resumedGuest, {
        version: 1,
        requestId: 'smoke-resume-guest',
        type: 'resume-session',
        payload: { reconnectToken: guestReconnectToken },
      })
      await resumedGuest.waitFor(
        (message) =>
          message.type === 'session-established' &&
          message.payload.participantId === 'orion',
      )
      const resumedSnapshot = await resumedGuest.waitFor(
        (message) => message.type === 'match-snapshot',
      )
      expect(resumedSnapshot).toMatchObject({
        payload: {
          state: {
            round: 2,
            colonies: {
              agima: {
                ownedTileIds: expect.arrayContaining([
                  landTile.id,
                ]),
              },
            },
          },
        },
      })
    } finally {
      await closeClient(host)
      await closeClient(guest)
      if (resumedGuest) {
        await closeClient(resumedGuest)
      }
      await server.close()
    }
  })

  it('isoliert dynamisch erzeugte Lobbys und ihre Reconnect-Tokens', async () => {
    let connectionSequence = 0
    const server = createWebSocketGameServer({
      host: '127.0.0.1',
      port: 0,
      lobbyId: 'default-room',
      seed: 31,
      createConnectionId: () => {
        connectionSequence += 1
        return `isolated-${connectionSequence}`
      },
    })
    const address = await server.listen()
    const alphaUrl = formatWebSocketUrl({
      ...address,
      lobbyId: 'alpha-room',
    })
    const betaUrl = formatWebSocketUrl({
      ...address,
      lobbyId: 'beta-room',
    })
    const alphaHost = await openClient(alphaUrl)
    const betaHost = await openClient(betaUrl)
    const betaGuest = await openClient(betaUrl)
    const betaIntruder = await openClient(betaUrl)

    try {
      send(alphaHost, {
        version: 1,
        requestId: 'join-alpha',
        type: 'join-lobby',
        payload: { displayName: 'Alpha' },
      })
      const alphaSession = await alphaHost.waitFor(
        (message) => message.type === 'session-established',
      )
      const alphaToken =
        alphaSession.type === 'session-established'
          ? alphaSession.payload.reconnectToken
          : ''
      expect(alphaSession).toMatchObject({
        payload: { participantId: 'agima' },
      })
      await expect(
        alphaHost.waitFor(
          (message) =>
            message.type === 'lobby-snapshot' &&
            message.payload.lobbyId === 'alpha-room',
        ),
      ).resolves.toBeDefined()

      send(betaHost, {
        version: 1,
        requestId: 'join-beta-host',
        type: 'join-lobby',
        payload: { displayName: 'Beta Host' },
      })
      const betaHostSession = await betaHost.waitFor(
        (message) => message.type === 'session-established',
      )
      expect(betaHostSession).toMatchObject({
        payload: { participantId: 'agima' },
      })
      await expect(
        betaHost.waitFor(
          (message) =>
            message.type === 'lobby-snapshot' &&
            message.payload.lobbyId === 'beta-room',
        ),
      ).resolves.toBeDefined()

      send(betaGuest, {
        version: 1,
        requestId: 'join-beta-guest',
        type: 'join-lobby',
        payload: { displayName: 'Beta Guest' },
      })
      await expect(
        betaGuest.waitFor(
          (message) =>
            message.type === 'session-established' &&
            message.payload.participantId === 'orion',
        ),
      ).resolves.toBeDefined()

      send(alphaHost, {
        version: 1,
        requestId: 'ready-alpha',
        type: 'set-ready',
        payload: { ready: true },
      })
      await alphaHost.waitFor(
        (message) =>
          message.type === 'lobby-snapshot' &&
          message.payload.seats.agima.kind === 'human' &&
          message.payload.seats.agima.ready,
      )
      send(alphaHost, {
        version: 1,
        requestId: 'start-alpha',
        type: 'start-match',
        payload: {},
      })
      await alphaHost.waitFor(
        (message) => message.type === 'match-snapshot',
      )

      send(betaHost, {
        version: 1,
        requestId: 'ready-beta-after-alpha-start',
        type: 'set-ready',
        payload: { ready: true },
      })
      await expect(
        betaHost.waitFor(
          (message) =>
            message.type === 'lobby-snapshot' &&
            message.payload.phase === 'waiting' &&
            message.payload.seats.agima.kind === 'human' &&
            message.payload.seats.agima.ready,
        ),
      ).resolves.toBeDefined()

      send(betaIntruder, {
        version: 1,
        requestId: 'cross-lobby-resume',
        type: 'resume-session',
        payload: { reconnectToken: alphaToken },
      })
      await expect(
        betaIntruder.waitFor(
          (message) =>
            message.type === 'request-error' &&
            message.payload.error === 'unknown-session',
        ),
      ).resolves.toBeDefined()

      const healthResponse = await fetch(
        `http://127.0.0.1:${address.port}/health`,
      )
      expect(await healthResponse.json()).toEqual({
        ok: true,
        status: 'ready',
        defaultLobbyId: 'default-room',
        lobbyCount: 2,
        connectionCount: 4,
      })
    } finally {
      await closeClient(alphaHost)
      await closeClient(betaHost)
      await closeClient(betaGuest)
      await closeClient(betaIntruder)
      await server.close()
    }
  })

  it('bereinigt verlassene Lobbys nach einer abbrechbaren Schonfrist', async () => {
    const cleanupClock = new FakeLobbyCleanupClock()
    const server = createWebSocketGameServer({
      host: '127.0.0.1',
      port: 0,
      lobbyId: 'default-room',
      emptyLobbyGraceMilliseconds: 600_000,
      lobbyCleanupClock: cleanupClock,
    })
    const address = await server.listen()
    const lobbyUrl = formatWebSocketUrl({
      ...address,
      lobbyId: 'returning-room',
    })
    const host = await openClient(lobbyUrl)

    try {
      send(host, {
        version: 1,
        requestId: 'join-before-cleanup',
        type: 'join-lobby',
        payload: { displayName: 'Alex' },
      })
      const hostSession = await host.waitFor(
        (message) => message.type === 'session-established',
      )
      const reconnectToken =
        hostSession.type === 'session-established'
          ? hostSession.payload.reconnectToken
          : ''

      await closeClient(host)
      await waitForPendingCleanupTimer(cleanupClock)
      cleanupClock.advanceBy(599_999)
      expect(
        await (
          await fetch(
            `http://127.0.0.1:${address.port}/health`,
          )
        ).json(),
      ).toMatchObject({ lobbyCount: 1 })

      const resumedHost = await openClient(lobbyUrl)

      send(resumedHost, {
        version: 1,
        requestId: 'resume-during-grace',
        type: 'resume-session',
        payload: { reconnectToken },
      })
      await expect(
        resumedHost.waitFor(
          (message) =>
            message.type === 'session-established' &&
            message.payload.participantId === 'agima',
        ),
      ).resolves.toBeDefined()

      cleanupClock.advanceBy(1)
      expect(
        await (
          await fetch(
            `http://127.0.0.1:${address.port}/health`,
          )
        ).json(),
      ).toMatchObject({ lobbyCount: 1 })

      await closeClient(resumedHost)
      await waitForPendingCleanupTimer(cleanupClock)
      cleanupClock.advanceBy(600_000)
      expect(
        await (
          await fetch(
            `http://127.0.0.1:${address.port}/health`,
          )
        ).json(),
      ).toMatchObject({ lobbyCount: 0 })

      const replacementHost = await openClient(lobbyUrl)

      try {
        send(replacementHost, {
          version: 1,
          requestId: 'resume-after-cleanup',
          type: 'resume-session',
          payload: { reconnectToken },
        })
        await expect(
          replacementHost.waitFor(
            (message) =>
              message.type === 'request-error' &&
              message.payload.error === 'unknown-session',
          ),
        ).resolves.toBeDefined()
      } finally {
        await closeClient(replacementHost)
      }
    } finally {
      await closeClient(host)
      await server.close()
    }
  })

  it('lädt eine wartende Lobby nach einem Serverneustart aus dem Speicher', async () => {
    const persistenceStore =
      new InMemoryLobbyPersistenceStore()
    const firstServer = createWebSocketGameServer({
      host: '127.0.0.1',
      port: 0,
      lobbyId: 'restart-room',
      seed: 41,
      lobbyPersistenceStore: persistenceStore,
    })
    const firstAddress = await firstServer.listen()
    const firstHost = await openClient(
      formatWebSocketUrl(firstAddress),
    )
    let reconnectToken: string | undefined

    try {
      send(firstHost, {
        version: 1,
        requestId: 'join-before-restart',
        type: 'join-lobby',
        payload: { displayName: 'Alex' },
      })
      const session = await firstHost.waitFor(
        (message) => message.type === 'session-established',
      )

      if (session.type !== 'session-established') {
        throw new Error('Expected an established host session.')
      }

      reconnectToken = session.payload.reconnectToken
      send(firstHost, {
        version: 1,
        requestId: 'ready-before-restart',
        type: 'set-ready',
        payload: { ready: true },
      })
      await firstHost.waitFor(
        (message) =>
          message.type === 'lobby-snapshot' &&
          message.payload.seats.agima.kind === 'human' &&
          message.payload.seats.agima.ready,
      )
    } finally {
      await closeClient(firstHost)
      await firstServer.close()
    }

    if (!reconnectToken) {
      throw new Error('Expected a reconnect token before restart.')
    }

    const secondServer = createWebSocketGameServer({
      host: '127.0.0.1',
      port: 0,
      lobbyId: 'restart-room',
      lobbyPersistenceStore: persistenceStore,
    })
    const secondAddress = await secondServer.listen()
    const restoredHost = await openClient(
      formatWebSocketUrl(secondAddress),
    )

    try {
      send(restoredHost, {
        version: 1,
        requestId: 'resume-after-restart',
        type: 'resume-session',
        payload: { reconnectToken },
      })
      await expect(
        restoredHost.waitFor(
          (message) =>
            message.type === 'session-established' &&
            message.payload.participantId === 'agima',
        ),
      ).resolves.toBeDefined()
      await expect(
        restoredHost.waitFor(
          (message) =>
            message.type === 'lobby-snapshot' &&
            message.payload.seats.agima.kind === 'human' &&
            message.payload.seats.agima.connected &&
            message.payload.seats.agima.ready,
        ),
      ).resolves.toBeDefined()
    } finally {
      await closeClient(restoredHost)
      await secondServer.close()
    }
  })

  it('stellt eine laufende Partie nach einem Serverneustart wieder her', async () => {
    const persistenceStore =
      new InMemoryLobbyPersistenceStore()
    const firstServer = createWebSocketGameServer({
      host: '127.0.0.1',
      port: 0,
      lobbyId: 'playing-room',
      lobbyPersistenceStore: persistenceStore,
    })
    const firstAddress = await firstServer.listen()
    const host = await openClient(
      formatWebSocketUrl(firstAddress),
    )
    let reconnectToken: string | undefined

    try {
      send(host, {
        version: 1,
        requestId: 'join-playing-room',
        type: 'join-lobby',
        payload: { displayName: 'Alex' },
      })
      const session = await host.waitFor(
        (message) => message.type === 'session-established',
      )

      if (session.type !== 'session-established') {
        throw new Error('Expected an established host session.')
      }

      reconnectToken = session.payload.reconnectToken
      send(host, {
        version: 1,
        requestId: 'ready-playing-room',
        type: 'set-ready',
        payload: { ready: true },
      })
      await host.waitFor(
        (message) =>
          message.type === 'lobby-snapshot' &&
          message.payload.seats.agima.kind === 'human' &&
          message.payload.seats.agima.ready,
      )
      send(host, {
        version: 1,
        requestId: 'start-playing-room',
        type: 'start-match',
        payload: {},
      })
      await host.waitFor(
        (message) => message.type === 'match-snapshot',
      )
      send(host, {
        version: 1,
        requestId: 'build-before-restart',
        type: 'game-command',
        payload: {
          command: {
            version: 1,
            commandId: 'persisted-harvester-build',
            participantId: 'agima',
            expectedRound: 1,
            type: 'order-harvester-build',
            payload: {},
          },
        },
      })
      await host.waitFor(
        (message) =>
          message.type === 'command-result' &&
          message.requestId === 'build-before-restart' &&
          message.payload.ok,
      )
      send(host, {
        version: 1,
        requestId: 'round-before-restart',
        type: 'submit-round-plan',
        payload: {
          supplyPlan: { foodLevel: 2, energyLevel: 2 },
        },
      })
      await host.waitFor(
        (message) =>
          message.type === 'command-result' &&
          message.requestId === 'round-before-restart' &&
          message.payload.ok,
      )
    } finally {
      await closeClient(host)
      await firstServer.close()
    }

    const persistedRecord =
      await persistenceStore.load('playing-room')

    expect(persistedRecord?.payload).toMatchObject({
      phase: 'playing',
      match: {
        revision: 2,
        state: {
          round: 2,
        },
        localEventSchedules: [
          {
            participantId: 'agima',
            round: 2,
          },
        ],
      },
    })

    if (!reconnectToken) {
      throw new Error('Expected a reconnect token before restart.')
    }

    const secondServer = createWebSocketGameServer({
      host: '127.0.0.1',
      port: 0,
      lobbyId: 'playing-room',
      lobbyPersistenceStore: persistenceStore,
    })
    const secondAddress = await secondServer.listen()
    const restoredHost = await openClient(
      formatWebSocketUrl(secondAddress),
    )

    try {
      send(restoredHost, {
        version: 1,
        requestId: 'resume-playing-room',
        type: 'resume-session',
        payload: { reconnectToken },
      })
      await restoredHost.waitFor(
        (message) =>
          message.type === 'session-established' &&
          message.payload.participantId === 'agima',
      )
      const restoredMatch = await restoredHost.waitFor(
        (message) => message.type === 'match-snapshot',
      )

      expect(restoredMatch).toMatchObject({
        payload: {
          revision: 2,
          state: {
            round: 2,
          },
        },
      })
    } finally {
      await closeClient(restoredHost)
      await secondServer.close()
    }
  })

  it('weist Binärnachrichten und ungültige Lobby-Pfade zurück', async () => {
    const server = createWebSocketGameServer({
      host: '127.0.0.1',
      port: 0,
      lobbyId: 'expected',
    })
    const address = await server.listen()
    const missingLobby = new WebSocket(
      `ws://127.0.0.1:${address.port}/multiplayer`,
    )
    missingLobby.on('error', () => undefined)

    try {
      const statusCode = await new Promise<number | undefined>(
        (resolve) => {
          missingLobby.once(
            'unexpected-response',
            (_, response) => {
              response.resume()
              resolve(response.statusCode)
            },
          )
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

  it('hält aktive WebSockets mit Ping und Pong lebendig', async () => {
    const server = createWebSocketGameServer({
      host: '127.0.0.1',
      port: 0,
      lobbyId: 'heartbeat',
      heartbeatIntervalMilliseconds: 10,
    })
    const address = await server.listen()
    const client = await openClient(formatWebSocketUrl(address))

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Timed out waiting for heartbeat.')),
          2_000,
        )

        client.socket.once('ping', () => {
          clearTimeout(timeout)
          resolve()
        })
      })
      expect(client.socket.readyState).toBe(WebSocket.OPEN)
    } finally {
      await closeClient(client)
      await server.close()
    }
  })

  it('veröffentlicht nur aggregierte Prometheus-Metriken', async () => {
    const server = createWebSocketGameServer({
      host: '127.0.0.1',
      port: 0,
      lobbyId: 'metrics-default',
    })
    const address = await server.listen()
    const baseUrl = `http://127.0.0.1:${address.port}`
    const rejectedSocket = new WebSocket(
      `ws://127.0.0.1:${address.port}/multiplayer`,
    )
    rejectedSocket.on('error', () => undefined)

    try {
      await new Promise<void>((resolve) => {
        rejectedSocket.once('unexpected-response', (_, response) => {
          response.resume()
          resolve()
        })
      })
      const client = await openClient(
        formatWebSocketUrl({
          ...address,
          lobbyId: 'private-lobby-name',
        }),
      )

      try {
        send(client, {
          version: 1,
          requestId: 'metrics-message',
          type: 'join-lobby',
          payload: { displayName: 'Private Player' },
        })
        await client.waitFor(
          (message) => message.type === 'session-established',
        )

        const response = await fetch(`${baseUrl}/metrics`)
        const metrics = await response.text()

        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toBe(
          'text/plain; version=0.0.4; charset=utf-8',
        )
        expect(metrics).toContain('elum_active_lobbies 1')
        expect(metrics).toContain(
          'elum_active_websocket_connections 1',
        )
        expect(metrics).toContain(
          'elum_websocket_connections_total 1',
        )
        expect(metrics).toContain('elum_websocket_messages_total 1')
        expect(metrics).toContain(
          'elum_websocket_upgrade_rejections_total 1',
        )
        expect(metrics).not.toContain('private-lobby-name')
        expect(metrics).not.toContain('Private Player')
      } finally {
        await closeClient(client)
      }
    } finally {
      rejectedSocket.close()
      await server.close()
    }
  })

  it('erlaubt ausschließlich konfigurierte Browser-Origins', async () => {
    const server = createWebSocketGameServer({
      host: '127.0.0.1',
      port: 0,
      lobbyId: 'origin-check',
      allowedOrigins: ['https://alexatari.github.io'],
    })
    const address = await server.listen()
    const url = formatWebSocketUrl(address)

    try {
      const allowed = await openClient(
        url,
        'https://alexatari.github.io',
      )

      await closeClient(allowed)
      await expect(
        readRejectedStatus(url, 'https://example.test'),
      ).resolves.toBe(403)
      await expect(readRejectedStatus(url)).resolves.toBe(403)
    } finally {
      await server.close()
    }
  })
})
