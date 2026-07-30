type FetchResponse = Pick<Response, 'json' | 'ok' | 'status' | 'text'>

export type HostedServerFetcher = (
  input: string,
  init?: RequestInit,
) => Promise<FetchResponse>

export type HostedServerStatus = {
  connectionCount: number
  lobbyCount: number
}

const REQUIRED_METRICS = [
  'elum_active_lobbies',
  'elum_active_websocket_connections',
  'elum_websocket_connections_total',
  'elum_websocket_messages_total',
  'elum_websocket_upgrade_rejections_total',
] as const

function readNonNegativeInteger(
  value: unknown,
  fieldName: string,
) {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(`${fieldName} must be a non-negative integer.`)
  }

  return value
}

export async function checkHostedServer(
  baseUrl: string,
  fetcher: HostedServerFetcher = fetch,
): Promise<HostedServerStatus> {
  const normalizedBaseUrl = new URL(baseUrl)
  const healthUrl = new URL('/health', normalizedBaseUrl).toString()
  const metricsUrl = new URL('/metrics', normalizedBaseUrl).toString()
  const requestOptions = {
    signal: AbortSignal.timeout(60_000),
  }
  const healthResponse = await fetcher(healthUrl, requestOptions)

  if (!healthResponse.ok) {
    throw new Error(
      `Health check failed with HTTP ${healthResponse.status}.`,
    )
  }

  const health = (await healthResponse.json()) as {
    ok?: unknown
    status?: unknown
    lobbyCount?: unknown
    connectionCount?: unknown
  }

  if (health.ok !== true || health.status !== 'ready') {
    throw new Error('Hosted server is not ready.')
  }

  const lobbyCount = readNonNegativeInteger(
    health.lobbyCount,
    'lobbyCount',
  )
  const connectionCount = readNonNegativeInteger(
    health.connectionCount,
    'connectionCount',
  )
  const metricsResponse = await fetcher(
    metricsUrl,
    requestOptions,
  )

  if (!metricsResponse.ok) {
    throw new Error(
      `Metrics check failed with HTTP ${metricsResponse.status}.`,
    )
  }

  const metrics = await metricsResponse.text()

  for (const metricName of REQUIRED_METRICS) {
    if (!new RegExp(`^${metricName} \\d+$`, 'm').test(metrics)) {
      throw new Error(`Missing metric: ${metricName}.`)
    }
  }

  return { lobbyCount, connectionCount }
}
