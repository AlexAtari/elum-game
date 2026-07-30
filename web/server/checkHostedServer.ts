import { checkHostedServer } from './hostedServerMonitor'

const baseUrl =
  process.env.ELUM_MONITOR_URL ??
  'https://elum-multiplayer.onrender.com'
const status = await checkHostedServer(baseUrl)

console.log(
  `E.L.U.M. multiplayer ready: ${status.lobbyCount} lobbies, ` +
    `${status.connectionCount} connections.`,
)
