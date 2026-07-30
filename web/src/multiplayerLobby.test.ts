import { describe, expect, it } from 'vitest'
import {
  createMultiplayerLobby,
  MULTIPLAYER_LOBBY_STATE_VERSION,
  parsePersistedWaitingLobbyState,
  restoreMultiplayerLobby,
  type MultiplayerLobbyOptions,
} from './multiplayerLobby'
import type { MultiplayerServerMessage } from './multiplayerProtocol'

type EmittedMessage = {
  connectionId: string
  message: MultiplayerServerMessage
}

function createLobbyHarness(
  overrides: Partial<MultiplayerLobbyOptions> = {},
) {
  const emitted: EmittedMessage[] = []
  let tokenSequence = 0
  const lobby = createMultiplayerLobby({
    lobbyId: 'mars-alpha',
    seed: 23,
    emit: (connectionId, message) => {
      emitted.push({
        connectionId,
        message: structuredClone(message),
      })
    },
    createReconnectToken: () => {
      tokenSequence += 1
      return `reconnect-${tokenSequence}`
    },
    ...overrides,
  })

  return { lobby, emitted }
}

function joinMessage(displayName: string, requestId: string) {
  return {
    version: 1,
    requestId,
    type: 'join-lobby',
    payload: { displayName },
  }
}

function readyMessage(ready: boolean, requestId: string) {
  return {
    version: 1,
    requestId,
    type: 'set-ready',
    payload: { ready },
  }
}

function startMessage(requestId: string) {
  return {
    version: 1,
    requestId,
    type: 'start-match',
    payload: {},
  }
}

function restartMessage(requestId: string) {
  return {
    version: 1,
    requestId,
    type: 'restart-match',
    payload: {},
  }
}

function roundPlanMessage(
  requestId: string,
  foodLevel = 2,
  energyLevel = 2,
) {
  return {
    version: 1,
    requestId,
    type: 'submit-round-plan',
    payload: {
      supplyPlan: { foodLevel, energyLevel },
    },
  }
}

function findMessages(
  emitted: EmittedMessage[],
  type: MultiplayerServerMessage['type'],
  connectionId?: string,
) {
  return emitted.filter(
    (entry) =>
      entry.message.type === type &&
      (connectionId === undefined ||
        entry.connectionId === connectionId),
  )
}

describe('Multiplayer-Lobby', () => {
  it('stellt wartende Sitze getrennt wieder her und erhält ihre Tokens', () => {
    const { lobby } = createLobbyHarness()
    lobby.handleMessage('old-host', joinMessage('Alex', 'join-host'))
    lobby.handleMessage(
      'old-guest',
      joinMessage('Bea', 'join-guest'),
    )
    lobby.handleMessage(
      'old-guest',
      readyMessage(true, 'ready-guest'),
    )
    const persistedState = lobby.exportWaitingState()
    const emitted: EmittedMessage[] = []
    const restoredLobby = restoreMultiplayerLobby(persistedState, {
      emit: (connectionId, message) => {
        emitted.push({ connectionId, message })
      },
      createReconnectToken: () => 'reconnect-new',
    })

    expect(restoredLobby.getSnapshot()).toMatchObject({
      lobbyId: 'mars-alpha',
      revision: 3,
      phase: 'waiting',
      hostParticipantId: 'agima',
      seats: {
        agima: {
          displayName: 'Alex',
          connected: false,
          ready: false,
          isHost: true,
        },
        orion: {
          displayName: 'Bea',
          connected: false,
          ready: true,
          isHost: false,
        },
      },
    })
    expect(restoredLobby.exportWaitingState()).toEqual(
      persistedState,
    )

    restoredLobby.handleMessage('new-host', {
      version: 1,
      requestId: 'resume-host',
      type: 'resume-session',
      payload: { reconnectToken: 'reconnect-1' },
    })
    restoredLobby.handleMessage('new-guest', {
      version: 1,
      requestId: 'resume-guest',
      type: 'resume-session',
      payload: { reconnectToken: 'reconnect-2' },
    })
    restoredLobby.handleMessage(
      'new-host',
      readyMessage(true, 'ready-host'),
    )
    restoredLobby.handleMessage(
      'new-host',
      startMessage('start-restored'),
    )

    expect(restoredLobby.getSnapshot().phase).toBe('playing')
    expect(restoredLobby.getMatchSnapshot()?.state.match.seed).toBe(
      23,
    )
    expect(
      findMessages(emitted, 'session-established'),
    ).toHaveLength(2)
  })

  it('weist beschädigte oder nicht kanonische Lobbyzustände zurück', () => {
    const validState = {
      version: MULTIPLAYER_LOBBY_STATE_VERSION,
      lobbyId: 'mars-alpha',
      seed: 23,
      revision: 2,
      phase: 'waiting',
      humanSeats: [
        {
          participantId: 'agima',
          displayName: 'Alex',
          reconnectToken: 'reconnect-1',
          ready: false,
          isHost: true,
        },
        {
          participantId: 'orion',
          displayName: 'Bea',
          reconnectToken: 'reconnect-2',
          ready: false,
          isHost: false,
        },
      ],
    }

    expect(parsePersistedWaitingLobbyState(validState)).toEqual(
      validState,
    )

    const invalidStates = [
      { ...validState, version: 2 },
      { ...validState, phase: 'playing' },
      { ...validState, revision: -1 },
      {
        ...validState,
        humanSeats: [
          {
            ...validState.humanSeats[0],
            participantId: 'orion',
          },
        ],
      },
      {
        ...validState,
        humanSeats: validState.humanSeats.map((seat) => ({
          ...seat,
          reconnectToken: 'duplicate',
        })),
      },
      {
        ...validState,
        humanSeats: [
          {
            ...validState.humanSeats[0],
            displayName: ' Alex ',
          },
        ],
      },
    ]

    for (const invalidState of invalidStates) {
      expect(
        parsePersistedWaitingLobbyState(invalidState),
      ).toBeNull()
      expect(() =>
        restoreMultiplayerLobby(invalidState, {
          emit: () => undefined,
        }),
      ).toThrow('Invalid persisted waiting lobby state')
    }
  })

  it('exportiert den vollständigen wartenden Zustand ohne Verbindungs-IDs', () => {
    const { lobby } = createLobbyHarness()

    lobby.handleMessage('host-phone', joinMessage('Alex', 'join-host'))
    lobby.handleMessage(
      'guest-phone',
      joinMessage('Bea', 'join-guest'),
    )
    lobby.handleMessage(
      'guest-phone',
      readyMessage(true, 'ready-guest'),
    )
    lobby.disconnect('guest-phone')

    const state = lobby.exportWaitingState()

    expect(state).toEqual({
      version: MULTIPLAYER_LOBBY_STATE_VERSION,
      lobbyId: 'mars-alpha',
      seed: 23,
      revision: 4,
      phase: 'waiting',
      humanSeats: [
        {
          participantId: 'agima',
          displayName: 'Alex',
          reconnectToken: 'reconnect-1',
          ready: false,
          isHost: true,
        },
        {
          participantId: 'orion',
          displayName: 'Bea',
          reconnectToken: 'reconnect-2',
          ready: true,
          isHost: false,
        },
      ],
    })
    expect(JSON.stringify(state)).not.toContain('connectionId')

    state.humanSeats[0].displayName = 'Verändert'

    expect(
      lobby.exportWaitingState().humanSeats[0].displayName,
    ).toBe('Alex')
  })

  it('verhindert einen unvollständigen Export laufender Matches', () => {
    const { lobby } = createLobbyHarness()

    lobby.handleMessage('host', joinMessage('Alex', 'join'))
    lobby.handleMessage('host', readyMessage(true, 'ready'))
    lobby.handleMessage('host', startMessage('start'))

    expect(() => lobby.exportWaitingState()).toThrow(
      'Only a waiting lobby can be exported',
    )
  })

  it('leitet Rundenpläne weiter und veröffentlicht die gemeinsame Abrechnung', () => {
    const { lobby, emitted } = createLobbyHarness()

    lobby.handleMessage('host', joinMessage('Alex', 'join-host'))
    lobby.handleMessage('guest', joinMessage('Bea', 'join-guest'))
    lobby.handleMessage('host', readyMessage(true, 'ready-host'))
    lobby.handleMessage('guest', readyMessage(true, 'ready-guest'))
    lobby.handleMessage('host', startMessage('start-match'))

    lobby.handleMessage(
      'host',
      roundPlanMessage('plan-host'),
    )
    expect(lobby.getMatchSnapshot()).toMatchObject({
      state: { round: 1 },
      roundReadiness: {
        readyParticipantIds: ['agima'],
      },
    })

    lobby.handleMessage(
      'guest',
      roundPlanMessage('plan-guest', 0, 0),
    )

    expect(lobby.getMatchSnapshot()).toMatchObject({
      state: {
        round: 2,
        activeGlobalEvent: 'colonial-grant',
        colonies: {
          agima: { credits: 165 },
          orion: { credits: 165 },
          nova: { credits: 165 },
          vega: { credits: 165 },
        },
      },
      roundReadiness: {
        readyParticipantIds: [],
      },
    })
    expect(
      findMessages(emitted, 'command-result', 'guest').at(-1)
        ?.message,
    ).toMatchObject({
      requestId: 'plan-guest',
      payload: { ok: true, revision: 2 },
    })

    const hostSnapshot = findMessages(
      emitted,
      'match-snapshot',
      'host',
    ).at(-1)?.message
    const guestSnapshot = findMessages(
      emitted,
      'match-snapshot',
      'guest',
    ).at(-1)?.message

    expect(hostSnapshot).toMatchObject({
      payload: {
        lastRoundReport: {
          roundPlayed: 1,
          populationChange: 1,
        },
      },
    })
    expect(guestSnapshot).toMatchObject({
      payload: {
        lastRoundReport: {
          roundPlayed: 1,
          populationChange: -1,
        },
      },
    })
  })

  it('bleibt bei einem abgebrochenen Transport funktionsfähig', () => {
    const transportErrors: unknown[] = []
    let tokenSequence = 0
    const lobby = createMultiplayerLobby({
      lobbyId: 'transport-failure',
      emit: () => {
        throw new Error('socket closed')
      },
      onEmitError: (error) => {
        transportErrors.push(error)
      },
      createReconnectToken: () => {
        tokenSequence += 1
        return `safe-token-${tokenSequence}`
      },
    })

    lobby.handleMessage(
      'connection-1',
      joinMessage('Alex', 'join-1'),
    )

    expect(lobby.getSnapshot().seats.agima).toMatchObject({
      kind: 'human',
      displayName: 'Alex',
      connected: true,
    })
    expect(transportErrors.length).toBeGreaterThan(0)
  })

  it('vergibt vier Sitze und hält Reconnect-Tokens privat', () => {
    const { lobby, emitted } = createLobbyHarness()

    lobby.handleMessage('connection-1', joinMessage('Alex', 'join-1'))
    lobby.handleMessage('connection-2', joinMessage('Bea', 'join-2'))
    lobby.handleMessage('connection-3', joinMessage('Cem', 'join-3'))
    lobby.handleMessage('connection-4', joinMessage('Dana', 'join-4'))
    lobby.handleMessage('connection-5', joinMessage('Eli', 'join-5'))

    const snapshot = lobby.getSnapshot()
    expect(snapshot.hostParticipantId).toBe('agima')
    expect(snapshot.seats).toMatchObject({
      agima: {
        kind: 'human',
        displayName: 'Alex',
        isHost: true,
      },
      orion: {
        kind: 'human',
        displayName: 'Bea',
      },
      nova: {
        kind: 'human',
        displayName: 'Cem',
      },
      vega: {
        kind: 'human',
        displayName: 'Dana',
      },
    })
    expect(
      findMessages(emitted, 'request-error', 'connection-5').at(
        -1,
      )?.message,
    ).toMatchObject({
      payload: {
        error: 'lobby-full',
      },
    })

    const serializedSnapshots = JSON.stringify(
      findMessages(emitted, 'lobby-snapshot'),
    )
    expect(serializedSnapshots).not.toContain('reconnect-')
    expect(
      findMessages(
        emitted,
        'session-established',
        'connection-1',
      )[0]?.message,
    ).toMatchObject({
      payload: {
        participantId: 'agima',
        reconnectToken: 'reconnect-1',
      },
    })
  })

  it('startet nur durch den bereiten Host und füllt freie Sitze mit KI', () => {
    const { lobby, emitted } = createLobbyHarness()

    lobby.handleMessage('host', joinMessage('Alex', 'join-host'))
    lobby.handleMessage('guest', joinMessage('Bea', 'join-guest'))
    lobby.handleMessage(
      'guest',
      readyMessage(true, 'ready-guest'),
    )
    lobby.handleMessage(
      'guest',
      startMessage('start-by-guest'),
    )
    lobby.handleMessage('host', startMessage('start-too-early'))

    expect(
      findMessages(emitted, 'request-error', 'guest').at(-1)
        ?.message,
    ).toMatchObject({
      payload: { error: 'not-host' },
    })
    expect(
      findMessages(emitted, 'request-error', 'host').at(-1)
        ?.message,
    ).toMatchObject({
      payload: { error: 'players-not-ready' },
    })

    lobby.handleMessage('host', readyMessage(true, 'ready-host'))
    lobby.handleMessage('host', startMessage('start-match'))

    expect(lobby.getSnapshot()).toMatchObject({
      phase: 'playing',
      seats: {
        agima: { kind: 'human', displayName: 'Alex' },
        orion: { kind: 'human', displayName: 'Bea' },
        nova: { kind: 'ai' },
        vega: { kind: 'ai' },
      },
    })
    expect(lobby.getMatchSnapshot()?.state.match).toMatchObject({
      seed: 23,
      participants: {
        agima: {
          controller: { kind: 'human', input: 'remote' },
        },
        orion: {
          controller: { kind: 'human', input: 'remote' },
        },
        nova: {
          controller: { kind: 'ai', profile: 'expansion' },
        },
        vega: {
          controller: { kind: 'ai', profile: 'industry' },
        },
      },
    })
    expect(
      findMessages(emitted, 'match-snapshot', 'host'),
    ).toHaveLength(1)
    expect(
      findMessages(emitted, 'match-snapshot', 'guest'),
    ).toHaveLength(1)
  })

  it('nimmt eine laufende Sitzung wieder auf und akzeptiert danach Kommandos', () => {
    const { lobby, emitted } = createLobbyHarness()

    lobby.handleMessage('old-phone', joinMessage('Alex', 'join'))
    lobby.handleMessage(
      'old-phone',
      readyMessage(true, 'ready'),
    )
    lobby.handleMessage('old-phone', startMessage('start'))
    expect(lobby.disconnect('old-phone')).toBe(true)
    expect(lobby.getSnapshot().seats.agima).toMatchObject({
      connected: false,
    })

    lobby.handleMessage('new-phone', {
      version: 1,
      requestId: 'resume',
      type: 'resume-session',
      payload: {
        reconnectToken: 'reconnect-1',
      },
    })
    expect(lobby.getSnapshot().seats.agima).toMatchObject({
      connected: true,
    })
    expect(
      findMessages(
        emitted,
        'match-snapshot',
        'new-phone',
      ),
    ).toHaveLength(1)

    lobby.handleMessage('new-phone', {
      version: 1,
      requestId: 'build',
      type: 'game-command',
      payload: {
        command: {
          version: 1,
          commandId: 'build-after-reconnect',
          participantId: 'agima',
          expectedRound: 1,
          type: 'order-harvester-build',
          payload: {},
        },
      },
    })

    expect(
      findMessages(
        emitted,
        'command-result',
        'new-phone',
      ).at(-1)?.message,
    ).toMatchObject({
      requestId: 'build',
      payload: {
        ok: true,
        revision: 1,
      },
    })
    expect(
      lobby.getMatchSnapshot()?.state.colonies.agima
        .harvestersInConstruction,
    ).toBe(1)
  })

  it('führt nach Runde 20 alle Sitze in dieselbe wartende Lobby zurück', () => {
    const { lobby, emitted } = createLobbyHarness()

    lobby.handleMessage('host', joinMessage('Alex', 'join-host'))
    lobby.handleMessage('guest', joinMessage('Bea', 'join-guest'))
    lobby.handleMessage('host', readyMessage(true, 'ready-host'))
    lobby.handleMessage('guest', readyMessage(true, 'ready-guest'))
    lobby.handleMessage('host', startMessage('start-match'))

    lobby.handleMessage(
      'host',
      restartMessage('restart-too-early'),
    )
    expect(
      findMessages(emitted, 'request-error', 'host').at(-1)
        ?.message,
    ).toMatchObject({
      payload: { error: 'match-not-finished' },
    })

    for (let round = 1; round <= 20; round += 1) {
      lobby.handleMessage(
        'host',
        roundPlanMessage(`plan-host-${round}`),
      )
      lobby.handleMessage(
        'guest',
        roundPlanMessage(`plan-guest-${round}`),
      )
    }

    expect(lobby.getMatchSnapshot()).toMatchObject({
      finished: true,
      state: { round: 20 },
    })

    lobby.handleMessage(
      'guest',
      restartMessage('restart-by-guest'),
    )
    expect(
      findMessages(emitted, 'request-error', 'guest').at(-1)
        ?.message,
    ).toMatchObject({
      payload: { error: 'not-host' },
    })

    lobby.handleMessage('host', restartMessage('restart-match'))

    expect(lobby.getMatchSnapshot()).toBeNull()
    expect(lobby.getSnapshot()).toMatchObject({
      phase: 'waiting',
      hostParticipantId: 'agima',
      seats: {
        agima: {
          kind: 'human',
          displayName: 'Alex',
          connected: true,
          ready: false,
          isHost: true,
        },
        orion: {
          kind: 'human',
          displayName: 'Bea',
          connected: true,
          ready: false,
          isHost: false,
        },
      },
    })
    expect(
      findMessages(emitted, 'lobby-snapshot', 'host').at(-1)
        ?.message,
    ).toMatchObject({
      payload: {
        phase: 'waiting',
      },
    })
  })
})
