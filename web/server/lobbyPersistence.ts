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
  payload: unknown
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

function assertLobbyId(
  lobbyId: unknown,
): asserts lobbyId is string {
  if (
    typeof lobbyId !== 'string' ||
    lobbyId.length === 0 ||
    lobbyId.length > 128
  ) {
    throw new Error('Invalid lobby id.')
  }
}

function assertFiniteTimestamp(
  value: unknown,
  label: string,
): asserts value is number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(`${label} must be a non-negative finite number.`)
  }
}

function isJsonValue(
  value: unknown,
  ancestors = new Set<object>(),
): value is JsonValue {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return true
  }

  if (typeof value === 'number') {
    return Number.isFinite(value)
  }

  if (typeof value !== 'object' || ancestors.has(value)) {
    return false
  }

  ancestors.add(value)
  const valid = Array.isArray(value)
    ? value.every((entry) => isJsonValue(entry, ancestors))
    : (Object.getPrototypeOf(value) === Object.prototype ||
        Object.getPrototypeOf(value) === null) &&
      Object.values(value).every((entry) =>
        isJsonValue(entry, ancestors),
      )
  ancestors.delete(value)
  return valid
}

function cloneJson(value: unknown): JsonValue {
  if (!isJsonValue(value)) {
    throw new Error(
      'Lobby persistence payload must be JSON-serializable.',
    )
  }

  const serialized = JSON.stringify(value)

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

function assertRecord(
  record: unknown,
): asserts record is PersistedLobbyRecord {
  if (
    typeof record !== 'object' ||
    record === null ||
    Array.isArray(record)
  ) {
    throw new Error('Invalid persisted lobby record.')
  }

  const candidate = record as Record<string, unknown>

  if (candidate.version !== LOBBY_PERSISTENCE_VERSION) {
    throw new Error('Unsupported lobby persistence version.')
  }

  assertLobbyId(candidate.lobbyId)
  assertFiniteTimestamp(candidate.savedAt, 'savedAt')
  assertFiniteTimestamp(candidate.expiresAt, 'expiresAt')

  if (candidate.expiresAt <= candidate.savedAt) {
    throw new Error('expiresAt must be later than savedAt.')
  }

  if (!('payload' in candidate)) {
    throw new Error(
      'Lobby persistence payload must be JSON-serializable.',
    )
  }

  cloneJson(candidate.payload)
}

export function parsePersistedLobbyRecord(
  input: unknown,
): PersistedLobbyRecord | null {
  try {
    assertRecord(input)
    return cloneRecord(input)
  } catch {
    return null
  }
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
