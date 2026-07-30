import {
  createWebSocketGameServer,
  formatWebSocketUrl,
} from './websocketGameServer'
import { readMultiplayerServerConfig } from './serverConfig'

const server = createWebSocketGameServer({
  ...readMultiplayerServerConfig(process.env),
  onError: (error) => {
    console.error(error)
  },
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
  await server.close()
}

process.once('SIGINT', () => {
  void shutdown()
})
process.once('SIGTERM', () => {
  void shutdown()
})
