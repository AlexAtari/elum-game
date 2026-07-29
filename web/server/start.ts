import {
  createWebSocketGameServer,
  formatWebSocketUrl,
} from './websocketGameServer'

function readPort(value: string | undefined) {
  const port = Number(value ?? 8787)

  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new Error('ELUM_SERVER_PORT must be a valid TCP port.')
  }

  return port
}

function readSeed(value: string | undefined) {
  const seed = Number(value ?? 1)

  if (!Number.isFinite(seed)) {
    throw new Error('ELUM_MATCH_SEED must be a finite number.')
  }

  return Math.abs(Math.trunc(seed))
}

const server = createWebSocketGameServer({
  host: process.env.ELUM_SERVER_HOST ?? '127.0.0.1',
  port: readPort(process.env.ELUM_SERVER_PORT),
  lobbyId: process.env.ELUM_LOBBY_ID ?? 'mars-alpha',
  seed: readSeed(process.env.ELUM_MATCH_SEED),
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
