export const LOBBY_PERSISTENCE_VERSION = 1 as const

export type JsonPrimitive = boolean | number | string | null

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue }

export type PersistedLobbyRecord = {
  version: typeof LOBBY_PERSISTENCE_VERSION
  lobbyId: string
  savedAt: number
  expiresAt: number
  payload: JsonValue
}

export type CreatePersistedLobbyRecordOptions = {
  lobbyId: string
  savedAt: number
  ttlMilliseconds: number
  payload: JsonValue
}

export type LobbyPersistenceClock = {
  now: () => number
}

export interface LobbyPersistenceStore {
  load(lobbyId: string): Promise<PersistedLobbyRecord | null>
  save(record: PersistedLobbyRecord): Promise<void>
  delete(lobbyId: string): Promise<void>
}

const defaultClock: LobbyPersistenceClock = {
  now: () => Date.now(),
}

function assertLobbyId(lobbyId: string) {
  if (lobbyId.length === 0 || lobbyId.length > 128) {
    throw new Error('Invalid lobby id.')
  }
}

function assertFiniteTimestamp(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number.`)
  }
}

function cloneJson(value: JsonValue): JsonValue {
  const serialized = JSON.stringify(value)

  if (serialized === undefined) {
    throw new Error('Lobby persistence payload must be JSON-serializable.')
  }

  return JSON.parse(serialized) as JsonValue
}

function cloneRecord(
  record: PersistedLobbyRecord,
): PersistedLobbyRecord {
  return {
    ...record,
    payload: cloneJson(record.payload),
  }
}

function assertRecord(record: PersistedLobbyRecord) {
  if (record.version !== LOBBY_PERSISTENCE_VERSION) {
    throw new Error('Unsupported lobby persistence version.')
  }

  assertLobbyId(record.lobbyId)
  assertFiniteTimestamp(record.savedAt, 'savedAt')
  assertFiniteTimestamp(record.expiresAt, 'expiresAt')

  if (record.expiresAt <= record.savedAt) {
    throw new Error('expiresAt must be later than savedAt.')
  }

  cloneJson(record.payload)
}

export function createPersistedLobbyRecord(
  options: CreatePersistedLobbyRecordOptions,
): PersistedLobbyRecord {
  assertLobbyId(options.lobbyId)
  assertFiniteTimestamp(options.savedAt, 'savedAt')

  if (
    !Number.isFinite(options.ttlMilliseconds) ||
    options.ttlMilliseconds <= 0
  ) {
    throw new Error(
      'ttlMilliseconds must be a positive finite number.',
    )
  }

  const expiresAt = options.savedAt + options.ttlMilliseconds
  assertFiniteTimestamp(expiresAt, 'expiresAt')

  return {
    version: LOBBY_PERSISTENCE_VERSION,
    lobbyId: options.lobbyId,
    savedAt: options.savedAt,
    expiresAt,
    payload: cloneJson(options.payload),
  }
}

export class InMemoryLobbyPersistenceStore
  implements LobbyPersistenceStore
{
  private readonly clock: LobbyPersistenceClock
  private readonly records = new Map<
    string,
    PersistedLobbyRecord
  >()

  constructor(clock: LobbyPersistenceClock = defaultClock) {
    this.clock = clock
  }

  async load(lobbyId: string) {
    assertLobbyId(lobbyId)
    const record = this.records.get(lobbyId)

    if (!record) {
      return null
    }

    if (record.expiresAt <= this.clock.now()) {
      this.records.delete(lobbyId)
      return null
    }

    return cloneRecord(record)
  }

  async save(record: PersistedLobbyRecord) {
    assertRecord(record)
    this.records.set(record.lobbyId, cloneRecord(record))
  }

  async delete(lobbyId: string) {
    assertLobbyId(lobbyId)
    this.records.delete(lobbyId)
  }
}
