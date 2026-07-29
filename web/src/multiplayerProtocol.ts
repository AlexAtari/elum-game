import type {
  AuthoritativeCommandError,
  AuthoritativeMatchSnapshot,
} from './authoritativeMatch'
import {
  parseGameCommand,
  type GameCommand,
} from './gameCommands'
import type { ParticipantId } from './match'

export type LobbyPhase = 'waiting' | 'playing'

export type LobbySeatSnapshot =
  | {
      kind: 'open'
      participantId: ParticipantId
    }
  | {
      kind: 'human'
      participantId: ParticipantId
      displayName: string
      connected: boolean
      ready: boolean
      isHost: boolean
    }
  | {
      kind: 'ai'
      participantId: ParticipantId
    }

export type LobbySnapshot = {
  lobbyId: string
  revision: number
  phase: LobbyPhase
  hostParticipantId: ParticipantId | null
  seats: Record<ParticipantId, LobbySeatSnapshot>
}

type ClientMessageBase = {
  version: 1
  requestId: string
}

export type MultiplayerClientMessage =
  | (ClientMessageBase & {
      type: 'join-lobby'
      payload: {
        displayName: string
      }
    })
  | (ClientMessageBase & {
      type: 'resume-session'
      payload: {
        reconnectToken: string
      }
    })
  | (ClientMessageBase & {
      type: 'set-ready'
      payload: {
        ready: boolean
      }
    })
  | (ClientMessageBase & {
      type: 'start-match'
      payload: Record<string, never>
    })
  | (ClientMessageBase & {
      type: 'game-command'
      payload: {
        command: GameCommand
      }
    })

export type MultiplayerServerError =
  | 'invalid-message'
  | 'connection-already-bound'
  | 'lobby-full'
  | 'lobby-already-started'
  | 'unknown-session'
  | 'not-in-lobby'
  | 'not-host'
  | 'players-not-ready'
  | 'match-not-started'
  | 'seat-connection-failed'
  | AuthoritativeCommandError

export type MultiplayerServerMessage =
  | {
      version: 1
      type: 'session-established'
      payload: {
        participantId: ParticipantId
        reconnectToken: string
      }
    }
  | {
      version: 1
      type: 'lobby-snapshot'
      payload: LobbySnapshot
    }
  | {
      version: 1
      type: 'match-snapshot'
      payload: AuthoritativeMatchSnapshot
    }
  | {
      version: 1
      type: 'command-result'
      requestId: string
      payload:
        | {
            ok: true
            revision: number
          }
        | {
            ok: false
            error: MultiplayerServerError
            revision: number | null
          }
    }
  | {
      version: 1
      type: 'request-error'
      requestId: string | null
      payload: {
        error: MultiplayerServerError
      }
    }

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isValidIdentifier(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 128
  )
}

export function normalizeDisplayName(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const displayName = value.trim().replace(/\s+/g, ' ')

  return displayName.length > 0 && displayName.length <= 24
    ? displayName
    : null
}

export function parseMultiplayerClientMessage(
  input: unknown,
): MultiplayerClientMessage | null {
  if (
    !isRecord(input) ||
    input.version !== 1 ||
    !isValidIdentifier(input.requestId) ||
    !isRecord(input.payload)
  ) {
    return null
  }

  const base: ClientMessageBase = {
    version: 1,
    requestId: input.requestId,
  }

  if (input.type === 'join-lobby') {
    const displayName = normalizeDisplayName(
      input.payload.displayName,
    )

    return displayName
      ? {
          ...base,
          type: 'join-lobby',
          payload: { displayName },
        }
      : null
  }

  if (input.type === 'resume-session') {
    return isValidIdentifier(input.payload.reconnectToken)
      ? {
          ...base,
          type: 'resume-session',
          payload: {
            reconnectToken: input.payload.reconnectToken,
          },
        }
      : null
  }

  if (input.type === 'set-ready') {
    return typeof input.payload.ready === 'boolean'
      ? {
          ...base,
          type: 'set-ready',
          payload: {
            ready: input.payload.ready,
          },
        }
      : null
  }

  if (input.type === 'start-match') {
    return {
      ...base,
      type: 'start-match',
      payload: {},
    }
  }

  if (input.type === 'game-command') {
    const command = parseGameCommand(input.payload.command)

    return command
      ? {
          ...base,
          type: 'game-command',
          payload: { command },
        }
      : null
  }

  return null
}
