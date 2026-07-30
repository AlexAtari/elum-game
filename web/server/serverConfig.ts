export type MultiplayerServerEnvironment = {
  ELUM_ALLOWED_ORIGINS?: string
  ELUM_LOBBY_ID?: string
  ELUM_MATCH_SEED?: string
  ELUM_SERVER_HOST?: string
  ELUM_SERVER_PORT?: string
  PORT?: string
  REDIS_URL?: string
}

function readPort(value: string | undefined) {
  const port = Number(value ?? 8787)

  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new Error('Server port must be a valid TCP port.')
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

function readAllowedOrigins(value: string | undefined) {
  if (value === undefined) {
    return undefined
  }

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)

  if (origins.length === 0) {
    throw new Error(
      'ELUM_ALLOWED_ORIGINS must contain at least one origin.',
    )
  }

  return origins.map((origin) => {
    const url = new URL(origin)

    if (
      (url.protocol !== 'http:' &&
        url.protocol !== 'https:') ||
      url.origin !== origin
    ) {
      throw new Error(
        'ELUM_ALLOWED_ORIGINS must contain HTTP origins only.',
      )
    }

    return url.origin
  })
}

function readRedisUrl(value: string | undefined) {
  if (value === undefined) {
    return undefined
  }

  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw new Error('REDIS_URL must be a valid Redis URL.')
  }

  if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') {
    throw new Error('REDIS_URL must use redis:// or rediss://.')
  }

  return value
}

export function readMultiplayerServerConfig(
  environment: MultiplayerServerEnvironment,
) {
  return {
    host: environment.ELUM_SERVER_HOST ?? '127.0.0.1',
    port: readPort(
      environment.ELUM_SERVER_PORT ?? environment.PORT,
    ),
    lobbyId: environment.ELUM_LOBBY_ID ?? 'mars-alpha',
    seed: readSeed(environment.ELUM_MATCH_SEED),
    allowedOrigins: readAllowedOrigins(
      environment.ELUM_ALLOWED_ORIGINS,
    ),
    redisUrl: readRedisUrl(environment.REDIS_URL),
  }
}
