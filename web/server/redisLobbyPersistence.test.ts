import { describe, expect, it } from 'vitest'
import { createPersistedLobbyRecord } from './lobbyPersistence'
import {
  createRedisLobbyPersistenceStore,
  RedisLobbyPersistenceStore,
  type RedisLobbyPersistenceClient,
} from './redisLobbyPersistence'

class FakeRedisClient implements RedisLobbyPersistenceClient {
  readonly values = new Map<string, string>()
  readonly setCalls: Array<{
    key: string
    value: string
    expirationMode: 'PX'
    ttlMilliseconds: number
  }> = []
  quitCalls = 0

  async get(key: string) {
    return this.values.get(key) ?? null
  }

  async set(
    key: string,
    value: string,
    expirationMode: 'PX',
    ttlMilliseconds: number,
  ) {
    this.values.set(key, value)
    this.setCalls.push({
      key,
      value,
      expirationMode,
      ttlMilliseconds,
    })
  }

  async del(key: string) {
    this.values.delete(key)
  }

  async quit() {
    this.quitCalls += 1
  }
}

function createRecord(lobbyId = 'mars/alpha') {
  return createPersistedLobbyRecord({
    lobbyId,
    savedAt: 1_000,
    ttlMilliseconds: 5_000,
    payload: {
      version: 1,
      phase: 'waiting',
      humanSeats: [],
    },
  })
}

describe('Redis-Lobby-Persistenz', () => {
  it('speichert Datensatz und Ablaufzeit unter einem isolierten Schlüssel', async () => {
    const client = new FakeRedisClient()
    const store = new RedisLobbyPersistenceStore(client, {
      clock: { now: () => 2_000 },
      keyPrefix: 'test:lobby:',
    })
    const record = createRecord()

    await store.save(record)

    expect(client.setCalls).toEqual([
      {
        key: 'test:lobby:mars%2Falpha',
        value: JSON.stringify(record),
        expirationMode: 'PX',
        ttlMilliseconds: 4_000,
      },
    ])
    expect(await store.load(record.lobbyId)).toEqual(record)
  })

  it('löscht bereits abgelaufene Datensätze statt sie zu speichern', async () => {
    const client = new FakeRedisClient()
    const store = new RedisLobbyPersistenceStore(client, {
      clock: { now: () => 6_000 },
    })
    const record = createRecord()
    client.values.set(
      'elum:lobby:v1:mars%2Falpha',
      JSON.stringify(record),
    )

    await store.save(record)

    expect(client.setCalls).toHaveLength(0)
    expect(client.values.size).toBe(0)
  })

  it('verwirft abgelaufene geladene Datensätze defensiv', async () => {
    const client = new FakeRedisClient()
    const store = new RedisLobbyPersistenceStore(client, {
      clock: { now: () => 6_000 },
    })
    const record = createRecord()
    client.values.set(
      'elum:lobby:v1:mars%2Falpha',
      JSON.stringify(record),
    )

    expect(await store.load(record.lobbyId)).toBeNull()
    expect(client.values.size).toBe(0)
  })

  it('weist beschädigtes JSON und falsche Lobbyzuordnung zurück', async () => {
    const client = new FakeRedisClient()
    const store = new RedisLobbyPersistenceStore(client, {
      clock: { now: () => 2_000 },
    })
    const key = 'elum:lobby:v1:mars-alpha'
    client.values.set(key, '{')

    await expect(store.load('mars-alpha')).rejects.toThrow(
      'Invalid persisted lobby JSON',
    )

    client.values.set(
      key,
      JSON.stringify(createRecord('other-room')),
    )

    await expect(store.load('mars-alpha')).rejects.toThrow(
      'Invalid persisted lobby record',
    )
  })

  it('löscht gezielt und beendet die Redis-Verbindung', async () => {
    const client = new FakeRedisClient()
    const store = new RedisLobbyPersistenceStore(client, {
      clock: { now: () => 2_000 },
    })
    const record = createRecord()
    await store.save(record)

    await store.delete(record.lobbyId)
    await store.close()

    expect(client.values.size).toBe(0)
    expect(client.quitCalls).toBe(1)
  })

  it('akzeptiert ausschließlich Redis-Verbindungs-URLs', () => {
    expect(() =>
      createRedisLobbyPersistenceStore('https://example.test'),
    ).toThrow('redis:// or rediss://')
    expect(() =>
      createRedisLobbyPersistenceStore('not a url'),
    ).toThrow('valid Redis URL')
  })
})
