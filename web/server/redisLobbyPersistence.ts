import Redis from 'ioredis'
import {
  parsePersistedLobbyRecord,
  type LobbyPersistenceClock,
  type LobbyPersistenceStore,
  type PersistedLobbyRecord,
} from './lobbyPersistence'

export type RedisLobbyPersistenceClient = {
  get(key: string): Promise<string | null>
  set(
    key: string,
    value: string,
    expirationMode: 'PX',
    ttlMilliseconds: number,
  ): Promise<unknown>
  del(key: string): Promise<unknown>
  quit(): Promise<unknown>
}

export type RedisLobbyPersistenceStoreOptions = {
  clock?: LobbyPersistenceClock
  keyPrefix?: string
}

export type CreateRedisLobbyPersistenceStoreOptions =
  RedisLobbyPersistenceStoreOptions & {
    onError?: (error: unknown) => void
  }

const defaultClock: LobbyPersistenceClock = {
  now: () => Date.now(),
}

const DEFAULT_KEY_PREFIX = 'elum:lobby:v1:'

function assertLobbyId(lobbyId: string) {
  if (lobbyId.length === 0 || lobbyId.length > 128) {
    throw new Error('Invalid lobby id.')
  }
}

function assertRedisUrl(redisUrl: string) {
  let url: URL

  try {
    url = new URL(redisUrl)
  } catch {
    throw new Error('REDIS_URL must be a valid Redis URL.')
  }

  if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') {
    throw new Error('REDIS_URL must use redis:// or rediss://.')
  }
}

export class RedisLobbyPersistenceStore
  implements LobbyPersistenceStore
{
  private readonly client: RedisLobbyPersistenceClient
  private readonly clock: LobbyPersistenceClock
  private readonly keyPrefix: string

  constructor(
    client: RedisLobbyPersistenceClient,
    options: RedisLobbyPersistenceStoreOptions = {},
  ) {
    this.client = client
    this.clock = options.clock ?? defaultClock
    this.keyPrefix = options.keyPrefix ?? DEFAULT_KEY_PREFIX

    if (this.keyPrefix.length === 0) {
      throw new Error('Redis lobby key prefix must not be empty.')
    }
  }

  async load(lobbyId: string) {
    const key = this.createKey(lobbyId)
    const serialized = await this.client.get(key)

    if (serialized === null) {
      return null
    }

    let input: unknown

    try {
      input = JSON.parse(serialized) as unknown
    } catch {
      throw new Error('Invalid persisted lobby JSON.')
    }

    const record = parsePersistedLobbyRecord(input)

    if (!record || record.lobbyId !== lobbyId) {
      throw new Error('Invalid persisted lobby record.')
    }

    if (record.expiresAt <= this.clock.now()) {
      await this.client.del(key)
      return null
    }

    return record
  }

  async save(record: PersistedLobbyRecord) {
    const validatedRecord = parsePersistedLobbyRecord(record)

    if (!validatedRecord) {
      throw new Error('Invalid persisted lobby record.')
    }

    const key = this.createKey(validatedRecord.lobbyId)
    const ttlMilliseconds = Math.ceil(
      validatedRecord.expiresAt - this.clock.now(),
    )

    if (ttlMilliseconds <= 0) {
      await this.client.del(key)
      return
    }

    await this.client.set(
      key,
      JSON.stringify(validatedRecord),
      'PX',
      ttlMilliseconds,
    )
  }

  async delete(lobbyId: string) {
    await this.client.del(this.createKey(lobbyId))
  }

  async close() {
    await this.client.quit()
  }

  private createKey(lobbyId: string) {
    assertLobbyId(lobbyId)
    return `${this.keyPrefix}${encodeURIComponent(lobbyId)}`
  }
}

export function createRedisLobbyPersistenceStore(
  redisUrl: string,
  options: CreateRedisLobbyPersistenceStoreOptions = {},
) {
  assertRedisUrl(redisUrl)
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 2,
  })
  client.on('error', options.onError ?? (() => undefined))

  return new RedisLobbyPersistenceStore(client, options)
}
