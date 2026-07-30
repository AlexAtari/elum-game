import {
  createWebSocketGameServer,
  formatWebSocketUrl,
} from './websocketGameServer'
import { createRedisLobbyPersistenceStore } from './redisLobbyPersistence'
import { readMultiplayerServerConfig } from './serverConfig'

const onError = (error: unknown) => {
  console.error(error)
}
const { redisUrl, ...serverConfig } =
  readMultiplayerServerConfig(process.env)
const lobbyPersistenceStore = redisUrl
  ? createRedisLobbyPersistenceStore(redisUrl, { onError })
  : undefined
const server = createWebSocketGameServer({
  ...serverConfig,
  lobbyPersistenceStore,
  onError,
})

const address = await server.listen()
const displayHost =
  address.host === '0.0.0.0' ? '127.0.0.1' : address.host

console.log(
  `E.L.U.M. multiplayer server: ${formatWebSocketUrl({
    ...address,
    host: displayHost,
  })}`,
)
console.log(
  `Health check: http://${displayHost}:${address.port}/health`,
)

let shuttingDown = false

async function shutdown() {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  try {
    await server.close()
  } finally {
    await lobbyPersistenceStore?.close()
  }
}

process.once('SIGINT', () => {
  void shutdown()
})
process.once('SIGTERM', () => {
  void shutdown()
})
