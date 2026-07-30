import { describe, expect, it } from 'vitest'
import { createMultiplayerLobby } from '../src/multiplayerLobby'
import {
  createPersistedLobbyRecord,
  InMemoryLobbyPersistenceStore,
  LOBBY_PERSISTENCE_VERSION,
  parsePersistedLobbyRecord,
  type JsonValue,
} from './lobbyPersistence'

function createRecord(
  lobbyId = 'mars-alpha',
  payload: JsonValue = {
    phase: 'waiting',
    seats: [{ participantId: 'agima' }],
  },
) {
  return createPersistedLobbyRecord({
    lobbyId,
    savedAt: 1_000,
    ttlMilliseconds: 5_000,
    payload,
  })
}

describe('Lobby-Persistenzgrenze', () => {
  it('speichert den exportierten Zustand einer wartenden Lobby', async () => {
    const lobby = createMultiplayerLobby({
      lobbyId: 'mars-alpha',
      seed: 23,
      emit: () => undefined,
      createReconnectToken: () => 'reconnect-host',
    })
    lobby.handleMessage('host-phone', {
      version: 1,
      requestId: 'join-host',
      type: 'join-lobby',
      payload: { displayName: 'Alex' },
    })
    const record = createPersistedLobbyRecord({
      lobbyId: 'mars-alpha',
      savedAt: 1_000,
      ttlMilliseconds: 5_000,
      payload: lobby.exportWaitingState(),
    })
    const store = new InMemoryLobbyPersistenceStore({
      now: () => 2_000,
    })

    await store.save(record)

    expect(await store.load('mars-alpha')).toMatchObject({
      payload: {
        version: 1,
        lobbyId: 'mars-alpha',
        seed: 23,
        revision: 1,
        phase: 'waiting',
        humanSeats: [
          {
            participantId: 'agima',
            displayName: 'Alex',
            reconnectToken: 'reconnect-host',
            ready: false,
            isHost: true,
          },
        ],
      },
    })
  })

  it('erzeugt einen versionierten Datensatz mit Ablaufzeit', () => {
    expect(createRecord()).toEqual({
      version: LOBBY_PERSISTENCE_VERSION,
      lobbyId: 'mars-alpha',
      savedAt: 1_000,
      expiresAt: 6_000,
      payload: {
        phase: 'waiting',
        seats: [{ participantId: 'agima' }],
      },
    })
  })

  it('speichert Lobbycodes getrennt und löscht gezielt', async () => {
    const store = new InMemoryLobbyPersistenceStore({
      now: () => 2_000,
    })
    const first = createRecord('mars-alpha')
    const second = createRecord('mars-beta', { phase: 'playing' })

    await store.save(first)
    await store.save(second)
    await store.delete(first.lobbyId)

    expect(await store.load(first.lobbyId)).toBeNull()
    expect(await store.load(second.lobbyId)).toEqual(second)
  })

  it('isoliert gespeicherte und geladene Nutzdaten von Mutationen', async () => {
    const store = new InMemoryLobbyPersistenceStore({
      now: () => 2_000,
    })
    const record = createRecord()

    await store.save(record)
    ;(
      record.payload as {
        seats: Array<{ participantId: string }>
      }
    ).seats[0].participantId = 'orion'

    const firstLoad = await store.load(record.lobbyId)
    ;(
      firstLoad?.payload as {
        seats: Array<{ participantId: string }>
      }
    ).seats[0].participantId = 'nova'

    expect(await store.load(record.lobbyId)).toEqual(createRecord())
  })

  it('entfernt abgelaufene Datensätze beim Laden', async () => {
    let now = 5_999
    const store = new InMemoryLobbyPersistenceStore({
      now: () => now,
    })
    const record = createRecord()
    await store.save(record)

    expect(await store.load(record.lobbyId)).toEqual(record)

    now = 6_000

    expect(await store.load(record.lobbyId)).toBeNull()
    expect(await store.load(record.lobbyId)).toBeNull()
  })

  it('weist ungültige IDs, Laufzeiten und Versionen zurück', async () => {
    expect(() =>
      createPersistedLobbyRecord({
        lobbyId: '',
        savedAt: 1_000,
        ttlMilliseconds: 5_000,
        payload: {},
      }),
    ).toThrow('Invalid lobby id')
    expect(() =>
      createPersistedLobbyRecord({
        lobbyId: 'mars-alpha',
        savedAt: 1_000,
        ttlMilliseconds: 0,
        payload: {},
      }),
    ).toThrow('ttlMilliseconds')

    const store = new InMemoryLobbyPersistenceStore()
    await expect(
      store.save({
        ...createRecord(),
        version: 2 as typeof LOBBY_PERSISTENCE_VERSION,
      }),
    ).rejects.toThrow('Unsupported lobby persistence version')
  })

  it('weist nicht serialisierbare Nutzdaten zurück', () => {
    const cyclicPayload: Record<string, JsonValue> = {}
    cyclicPayload.self = cyclicPayload

    expect(() =>
      createPersistedLobbyRecord({
        lobbyId: 'mars-alpha',
        savedAt: 1_000,
        ttlMilliseconds: 5_000,
        payload: cyclicPayload,
      }),
    ).toThrow()
    expect(() =>
      createPersistedLobbyRecord({
        lobbyId: 'mars-alpha',
        savedAt: 1_000,
        ttlMilliseconds: 5_000,
        payload: { invalidNumber: Number.NaN },
      }),
    ).toThrow('JSON-serializable')
  })

  it('validiert unbekannte Datensatzfelder vollständig', () => {
    expect(
      parsePersistedLobbyRecord({
        ...createRecord(),
        lobbyId: 23,
      }),
    ).toBeNull()
    expect(
      parsePersistedLobbyRecord({
        ...createRecord(),
        payload: { invalidNumber: Number.POSITIVE_INFINITY },
      }),
    ).toBeNull()
  })
})
