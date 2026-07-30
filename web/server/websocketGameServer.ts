import { randomUUID } from 'node:crypto'
import {
  createServer,
  type IncomingMessage,
  type Server as HttpServer,
} from 'node:http'
import {
  WebSocket,
  WebSocketServer,
  type RawData,
} from 'ws'
import {
  createMultiplayerLobby,
  restoreMultiplayerLobby,
  type MultiplayerLobby,
  type RestoreMultiplayerLobbyOptions,
} from '../src/multiplayerLobby'
import {
  createPersistedLobbyRecord,
  InMemoryLobbyPersistenceStore,
  type LobbyPersistenceClock,
  type LobbyPersistenceStore,
} from './lobbyPersistence'

export type WebSocketGameServerOptions = {
  host?: string
  port?: number
  lobbyId?: string
  seed?: number
  maxPayloadBytes?: number
  heartbeatIntervalMilliseconds?: number
  heartbeatClock?: ServerHeartbeatClock
  emptyLobbyGraceMilliseconds?: number
  lobbyCleanupClock?: LobbyCleanupClock
  lobbyPersistenceStore?: LobbyPersistenceStore
  lobbyPersistenceClock?: LobbyPersistenceClock
  activeLobbyPersistenceTtlMilliseconds?: number
  allowedOrigins?: string[]
  createConnectionId?: () => string
  onError?: (error: unknown) => void
}

export type LobbyCleanupClock = {
  setTimeout: (
    callback: () => void,
    delayMilliseconds: number,
  ) => unknown
  clearTimeout: (timer: unknown) => void
}

export type ServerHeartbeatClock = {
  setInterval: (
    callback: () => void,
    intervalMilliseconds: number,
  ) => unknown
  clearInterval: (timer: unknown) => void
}

export type WebSocketGameServerAddress = {
  host: string
  port: number
  lobbyId: string
  websocketPath: string
}

const WEBSOCKET_PATH = '/multiplayer'
const HEALTH_PATH = '/health'
const METRICS_PATH = '/metrics'
const DEFAULT_MAX_PAYLOAD_BYTES = 64 * 1024
export const DEFAULT_HEARTBEAT_INTERVAL_MILLISECONDS = 30_000
export const EMPTY_LOBBY_GRACE_MILLISECONDS =
  10 * 60 * 1_000
export const ACTIVE_LOBBY_PERSISTENCE_TTL_MILLISECONDS =
  24 * 60 * 60 * 1_000

const defaultLobbyCleanupClock: LobbyCleanupClock = {
  setTimeout: (callback, delayMilliseconds) =>
    setTimeout(callback, delayMilliseconds),
  clearTimeout: (timer) =>
    clearTimeout(timer as ReturnType<typeof setTimeout>),
}

const defaultHeartbeatClock: ServerHeartbeatClock = {
  setInterval: (callback, intervalMilliseconds) =>
    setInterval(callback, intervalMilliseconds),
  clearInterval: (timer) =>
    clearInterval(timer as ReturnType<typeof setInterval>),
}

const defaultLobbyPersistenceClock: LobbyPersistenceClock = {
  now: () => Date.now(),
}

function rejectUpgrade(
  request: IncomingMessage,
  statusCode: number,
  statusText: string,
) {
  request.socket.write(
    `HTTP/1.1 ${statusCode} ${statusText}\r\n` +
      'Connection: close\r\n' +
      'Content-Length: 0\r\n' +
      '\r\n',
  )
  request.socket.destroy()
}

function parseRequestUrl(request: IncomingMessage) {
  return new URL(request.url ?? '/', 'http://localhost')
}

function parseJsonMessage(data: RawData) {
  try {
    return JSON.parse(data.toString()) as unknown
  } catch {
    return null
  }
}

function parseLobbyId(request: IncomingMessage) {
  const lobbyId = parseRequestUrl(request).searchParams.get('lobby')

  return lobbyId !== null &&
    lobbyId.length > 0 &&
    lobbyId.length <= 128
    ? lobbyId
    : null
}

export class WebSocketGameServer {
  private readonly host: string
  private readonly port: number
  private readonly defaultLobbyId: string
  private readonly seed: number | undefined
  private readonly allowedOrigins: Set<string> | null
  private readonly createConnectionId: () => string
  private readonly onError: (error: unknown) => void
  private readonly emptyLobbyGraceMilliseconds: number
  private readonly lobbyCleanupClock: LobbyCleanupClock
  private readonly lobbyPersistenceStore: LobbyPersistenceStore
  private readonly lobbyPersistenceClock: LobbyPersistenceClock
  private readonly activeLobbyPersistenceTtlMilliseconds: number
  private readonly heartbeatIntervalMilliseconds: number
  private readonly heartbeatClock: ServerHeartbeatClock
  private readonly sockets = new Map<
    string,
    {
      socket: WebSocket
      lobbyId: string
      alive: boolean
    }
  >()
  private readonly lobbies = new Map<string, MultiplayerLobby>()
  private readonly lobbyLoads = new Map<
    string,
    Promise<MultiplayerLobby>
  >()
  private readonly lobbyPersistenceOperations = new Map<
    string,
    Promise<void>
  >()
  private readonly lobbyCleanupTimers = new Map<string, unknown>()
  private readonly httpServer: HttpServer
  private readonly webSocketServer: WebSocketServer
  private listening = false
  private closing = false
  private heartbeatTimer: unknown
  private acceptedConnectionTotal = 0
  private receivedMessageTotal = 0
  private rejectedUpgradeTotal = 0

  constructor(options: WebSocketGameServerOptions = {}) {
    this.host = options.host ?? '127.0.0.1'
    this.port = options.port ?? 8787
    this.defaultLobbyId = options.lobbyId ?? 'mars-alpha'
    this.seed = options.seed
    this.emptyLobbyGraceMilliseconds =
      options.emptyLobbyGraceMilliseconds ??
      EMPTY_LOBBY_GRACE_MILLISECONDS
    this.lobbyCleanupClock =
      options.lobbyCleanupClock ?? defaultLobbyCleanupClock
    this.lobbyPersistenceClock =
      options.lobbyPersistenceClock ??
      defaultLobbyPersistenceClock
    this.lobbyPersistenceStore =
      options.lobbyPersistenceStore ??
      new InMemoryLobbyPersistenceStore(
        this.lobbyPersistenceClock,
      )
    this.activeLobbyPersistenceTtlMilliseconds =
      options.activeLobbyPersistenceTtlMilliseconds ??
      ACTIVE_LOBBY_PERSISTENCE_TTL_MILLISECONDS
    this.heartbeatIntervalMilliseconds =
      options.heartbeatIntervalMilliseconds ??
      DEFAULT_HEARTBEAT_INTERVAL_MILLISECONDS
    this.heartbeatClock =
      options.heartbeatClock ?? defaultHeartbeatClock
    if (
      !Number.isFinite(this.emptyLobbyGraceMilliseconds) ||
      this.emptyLobbyGraceMilliseconds < 0
    ) {
      throw new Error(
        'Empty lobby grace period must be a non-negative finite number.',
      )
    }
    if (
      !Number.isFinite(this.heartbeatIntervalMilliseconds) ||
      this.heartbeatIntervalMilliseconds <= 0
    ) {
      throw new Error(
        'Heartbeat interval must be a positive finite number.',
      )
    }
    if (
      !Number.isFinite(
        this.activeLobbyPersistenceTtlMilliseconds,
      ) ||
      this.activeLobbyPersistenceTtlMilliseconds <= 0
    ) {
      throw new Error(
        'Active lobby persistence TTL must be a positive finite number.',
      )
    }
    this.allowedOrigins = options.allowedOrigins
      ? new Set(options.allowedOrigins)
      : null
    this.createConnectionId =
      options.createConnectionId ?? randomUUID
    this.onError = options.onError ?? (() => undefined)
    this.httpServer = createServer((request, response) => {
      const url = parseRequestUrl(request)

      if (request.method === 'GET' && url.pathname === HEALTH_PATH) {
        response.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        })
        response.end(
          JSON.stringify({
            ok: true,
            status: 'ready',
            defaultLobbyId: this.defaultLobbyId,
            lobbyCount: this.lobbies.size,
            connectionCount: this.sockets.size,
          }),
        )
        return
      }

      if (request.method === 'GET' && url.pathname === METRICS_PATH) {
        response.writeHead(200, {
          'Content-Type':
            'text/plain; version=0.0.4; charset=utf-8',
          'Cache-Control': 'no-store',
        })
        response.end(this.createMetrics())
        return
      }

      response.writeHead(404, {
        'Content-Type': 'application/json; charset=utf-8',
      })
      response.end(JSON.stringify({ error: 'not-found' }))
    })
    this.webSocketServer = new WebSocketServer({
      noServer: true,
      maxPayload:
        options.maxPayloadBytes ?? DEFAULT_MAX_PAYLOAD_BYTES,
    })
    this.httpServer.on('upgrade', (request, socket, head) => {
      const url = parseRequestUrl(request)
      const origin = request.headers.origin
      const lobbyId = parseLobbyId(request)

      if (
        url.pathname !== WEBSOCKET_PATH ||
        lobbyId === null
      ) {
        this.rejectedUpgradeTotal += 1
        rejectUpgrade(request, 404, 'Not Found')
        return
      }

      if (
        this.allowedOrigins !== null &&
        (origin === undefined || !this.allowedOrigins.has(origin))
      ) {
        this.rejectedUpgradeTotal += 1
        rejectUpgrade(request, 403, 'Forbidden')
        return
      }

      void this.getOrLoadLobby(lobbyId)
        .then(() => {
          if (this.closing || request.socket.destroyed) {
            request.socket.destroy()
            return
          }

          this.webSocketServer.handleUpgrade(
            request,
            socket,
            head,
            (webSocket) => {
              this.webSocketServer.emit(
                'connection',
                webSocket,
                request,
              )
            },
          )
        })
        .catch((error: unknown) => {
          this.onError(error)

          if (!request.socket.destroyed) {
            rejectUpgrade(
              request,
              503,
              'Service Unavailable',
            )
          }
        })
    })

    this.webSocketServer.on('connection', (socket, request) => {
      const lobbyId = parseLobbyId(request)

      if (lobbyId === null) {
        socket.close(1008, 'Valid lobby id required')
        return
      }

      this.cancelLobbyCleanup(lobbyId)
      const lobby = this.lobbies.get(lobbyId)

      if (!lobby) {
        socket.close(1011, 'Lobby unavailable')
        return
      }

      const connectionId = this.createUniqueConnectionId()
      const connection = { socket, lobbyId, alive: true }
      this.sockets.set(connectionId, connection)
      this.acceptedConnectionTotal += 1

      socket.on('pong', () => {
        connection.alive = true
      })
      socket.on('message', (data, isBinary) => {
        this.receivedMessageTotal += 1

        if (isBinary) {
          socket.close(1003, 'JSON text messages required')
          return
        }

        const previousRevision = lobby.getSnapshot().revision
        lobby.handleMessage(
          connectionId,
          parseJsonMessage(data),
        )
        this.persistLobbyIfChanged(
          lobbyId,
          lobby,
          previousRevision,
        )
      })
      socket.on('error', this.onError)
      socket.once('close', () => {
        this.sockets.delete(connectionId)
        const previousRevision = lobby.getSnapshot().revision
        lobby.disconnect(connectionId)
        this.persistLobbyIfChanged(
          lobbyId,
          lobby,
          previousRevision,
        )
        this.scheduleLobbyCleanupIfEmpty(lobbyId, lobby)
      })
    })
    this.httpServer.on('clientError', (error, socket) => {
      this.onError(error)

      if (socket.writable) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
      }
    })
    this.httpServer.on('error', this.onError)
    this.webSocketServer.on('error', this.onError)
  }

  async listen(): Promise<WebSocketGameServerAddress> {
    if (this.listening) {
      return this.getAddress()
    }

    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => {
        this.httpServer.off('listening', onListening)
        reject(error)
      }
      const onListening = () => {
        this.httpServer.off('error', onError)
        resolve()
      }

      this.httpServer.once('error', onError)
      this.httpServer.once('listening', onListening)
      this.httpServer.listen(this.port, this.host)
    })
    this.listening = true
    this.heartbeatTimer = this.heartbeatClock.setInterval(
      () => this.checkHeartbeats(),
      this.heartbeatIntervalMilliseconds,
    )
    return this.getAddress()
  }

  getAddress(): WebSocketGameServerAddress {
    const address = this.httpServer.address()

    if (!address || typeof address === 'string') {
      throw new Error('WebSocket game server is not listening.')
    }

    return {
      host: address.address,
      port: address.port,
      lobbyId: this.defaultLobbyId,
      websocketPath: WEBSOCKET_PATH,
    }
  }

  async close() {
    if (this.closing) {
      return
    }

    this.closing = true
    if (this.heartbeatTimer !== undefined) {
      this.heartbeatClock.clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }
    for (const timer of this.lobbyCleanupTimers.values()) {
      this.lobbyCleanupClock.clearTimeout(timer)
    }
    this.lobbyCleanupTimers.clear()
    await Promise.allSettled(this.lobbyLoads.values())
    await Promise.all(this.lobbyPersistenceOperations.values())

    for (const lobby of this.lobbies.values()) {
      lobby.dispose()
    }
    this.lobbies.clear()

    for (const { socket } of this.sockets.values()) {
      socket.close(1001, 'Server shutting down')
    }
    this.sockets.clear()

    await Promise.all([
      new Promise<void>((resolve) => {
        this.webSocketServer.close(() => resolve())
      }),
      this.closeHttpServer(),
    ])
    this.listening = false
  }

  private createUniqueConnectionId() {
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const connectionId = this.createConnectionId()

      if (
        connectionId.length > 0 &&
        connectionId.length <= 128 &&
        !this.sockets.has(connectionId)
      ) {
        return connectionId
      }
    }

    throw new Error('Unable to create a unique connection id.')
  }

  private createMetrics() {
    return [
      '# HELP elum_active_lobbies Current in-memory lobby count.',
      '# TYPE elum_active_lobbies gauge',
      `elum_active_lobbies ${this.lobbies.size}`,
      '# HELP elum_active_websocket_connections Current WebSocket connection count.',
      '# TYPE elum_active_websocket_connections gauge',
      `elum_active_websocket_connections ${this.sockets.size}`,
      '# HELP elum_websocket_connections_total Accepted WebSocket connections since process start.',
      '# TYPE elum_websocket_connections_total counter',
      `elum_websocket_connections_total ${this.acceptedConnectionTotal}`,
      '# HELP elum_websocket_messages_total Received WebSocket messages since process start.',
      '# TYPE elum_websocket_messages_total counter',
      `elum_websocket_messages_total ${this.receivedMessageTotal}`,
      '# HELP elum_websocket_upgrade_rejections_total Rejected WebSocket upgrades since process start.',
      '# TYPE elum_websocket_upgrade_rejections_total counter',
      `elum_websocket_upgrade_rejections_total ${this.rejectedUpgradeTotal}`,
      '',
    ].join('\n')
  }

  private checkHeartbeats() {
    for (const connection of this.sockets.values()) {
      if (!connection.alive) {
        connection.socket.terminate()
        continue
      }

      connection.alive = false
      connection.socket.ping((error?: Error) => {
        if (error) {
          this.onError(error)
        }
      })
    }
  }

  private getOrLoadLobby(lobbyId: string) {
    const existingLobby = this.lobbies.get(lobbyId)

    if (existingLobby) {
      return Promise.resolve(existingLobby)
    }

    const existingLoad = this.lobbyLoads.get(lobbyId)

    if (existingLoad) {
      return existingLoad
    }

    const load = this.loadLobby(lobbyId).finally(() => {
      if (this.lobbyLoads.get(lobbyId) === load) {
        this.lobbyLoads.delete(lobbyId)
      }
    })
    this.lobbyLoads.set(lobbyId, load)
    return load
  }

  private async loadLobby(lobbyId: string) {
    await this.lobbyPersistenceOperations.get(lobbyId)
    const record = await this.lobbyPersistenceStore.load(lobbyId)
    const lobbyOptions: RestoreMultiplayerLobbyOptions = {
      emit: (connectionId, message) => {
        const connection = this.sockets.get(connectionId)

        if (
          connection?.lobbyId === lobbyId &&
          connection.socket.readyState === WebSocket.OPEN
        ) {
          connection.socket.send(
            JSON.stringify(message),
            (error) => {
              if (error) {
                this.onError(error)
              }
            },
          )
        }
      },
      onEmitError: this.onError,
    }
    const lobby = record
      ? restoreMultiplayerLobby(record.payload, lobbyOptions)
      : createMultiplayerLobby({
          ...lobbyOptions,
          lobbyId,
          seed: this.seed,
        })

    if (lobby.getSnapshot().lobbyId !== lobbyId) {
      lobby.dispose()
      throw new Error(
        'Persisted lobby id does not match its storage key.',
      )
    }

    this.lobbies.set(lobbyId, lobby)
    lobby.subscribePersistenceChanges(() => {
      this.persistLobbyState(lobbyId, lobby)
    })
    return lobby
  }

  private persistLobbyIfChanged(
    lobbyId: string,
    lobby: MultiplayerLobby,
    previousRevision: number,
  ) {
    const snapshot = lobby.getSnapshot()

    if (snapshot.revision === previousRevision) {
      return
    }

    this.persistLobbyState(lobbyId, lobby)
  }

  private persistLobbyState(
    lobbyId: string,
    lobby: MultiplayerLobby,
  ) {
    if (
      this.closing ||
      this.lobbies.get(lobbyId) !== lobby
    ) {
      return
    }

    const hasConnections = this.hasLobbyConnections(lobbyId)

    if (
      !hasConnections &&
      this.emptyLobbyGraceMilliseconds === 0
    ) {
      this.queueLobbyPersistence(lobbyId, () =>
        this.lobbyPersistenceStore.delete(lobbyId),
      )
      return
    }

    try {
      const record = createPersistedLobbyRecord({
        lobbyId,
        savedAt: this.lobbyPersistenceClock.now(),
        ttlMilliseconds: hasConnections
          ? this.activeLobbyPersistenceTtlMilliseconds
          : this.emptyLobbyGraceMilliseconds,
        payload: lobby.exportPersistenceState(),
      })
      this.queueLobbyPersistence(lobbyId, () =>
        this.lobbyPersistenceStore.save(record),
      )
    } catch (error) {
      this.onError(error)
    }
  }

  private queueLobbyPersistence(
    lobbyId: string,
    operation: () => Promise<void>,
  ) {
    const previous =
      this.lobbyPersistenceOperations.get(lobbyId) ??
      Promise.resolve()
    const next = previous
      .then(operation)
      .catch((error: unknown) => {
        this.onError(error)
      })

    this.lobbyPersistenceOperations.set(lobbyId, next)
    void next.finally(() => {
      if (
        this.lobbyPersistenceOperations.get(lobbyId) === next
      ) {
        this.lobbyPersistenceOperations.delete(lobbyId)
      }
    })
  }

  private cancelLobbyCleanup(lobbyId: string) {
    const timer = this.lobbyCleanupTimers.get(lobbyId)

    if (timer === undefined) {
      return
    }

    this.lobbyCleanupClock.clearTimeout(timer)
    this.lobbyCleanupTimers.delete(lobbyId)
  }

  private scheduleLobbyCleanupIfEmpty(
    lobbyId: string,
    lobby: MultiplayerLobby,
  ) {
    if (
      this.closing ||
      this.hasLobbyConnections(lobbyId) ||
      this.lobbies.get(lobbyId) !== lobby ||
      this.lobbyCleanupTimers.has(lobbyId)
    ) {
      return
    }

    const timer = this.lobbyCleanupClock.setTimeout(() => {
      this.lobbyCleanupTimers.delete(lobbyId)

      if (
        this.closing ||
        this.hasLobbyConnections(lobbyId) ||
        this.lobbies.get(lobbyId) !== lobby
      ) {
        return
      }

      lobby.dispose()
      this.lobbies.delete(lobbyId)
      this.queueLobbyPersistence(lobbyId, () =>
        this.lobbyPersistenceStore.delete(lobbyId),
      )
    }, this.emptyLobbyGraceMilliseconds)
    this.lobbyCleanupTimers.set(lobbyId, timer)
  }

  private hasLobbyConnections(lobbyId: string) {
    for (const connection of this.sockets.values()) {
      if (connection.lobbyId === lobbyId) {
        return true
      }
    }

    return false
  }

  private async closeHttpServer() {
    if (!this.listening) {
      return
    }

    await new Promise<void>((resolve, reject) => {
      this.httpServer.close((error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }
}

export function createWebSocketGameServer(
  options: WebSocketGameServerOptions = {},
) {
  return new WebSocketGameServer(options)
}

export function formatWebSocketUrl(
  address: Pick<
    WebSocketGameServerAddress,
    'host' | 'port' | 'lobbyId' | 'websocketPath'
  >,
) {
  const host =
    address.host.includes(':') &&
    !address.host.startsWith('[')
      ? `[${address.host}]`
      : address.host

  return (
    `ws://${host}:${address.port}${address.websocketPath}` +
    `?lobby=${encodeURIComponent(address.lobbyId)}`
  )
}
