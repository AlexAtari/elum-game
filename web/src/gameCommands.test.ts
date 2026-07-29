import { describe, expect, it } from 'vitest'
import {
  createPlayableInitialGameState,
  HARVESTER_CREDIT_COST,
  HARVESTER_ORE_COST,
} from './game'
import {
  executeGameCommand,
  parseGameCommand,
  type GameCommand,
} from './gameCommands'

function createCommand(
  command: Omit<
    GameCommand,
    'version' | 'commandId' | 'expectedRound'
  >,
  commandId: string,
): GameCommand {
  return {
    ...command,
    version: 1,
    commandId,
    expectedRound: 1,
  } as GameCommand
}

describe('UI-unabhängige Spielkommandos', () => {
  it('parst vollständig serialisierbare Kommandos', () => {
    const command = createCommand(
      {
        participantId: 'agima',
        type: 'assign-harvester',
        payload: {
          tileId: 'P021',
          production: 'food',
        },
      },
      'command-1',
    )
    const serialized = JSON.parse(JSON.stringify(command))

    expect(parseGameCommand(serialized)).toEqual(command)
  })

  it('weist ungültige Netzwerkdaten ohne Zustandsänderung zurück', () => {
    const state = createPlayableInitialGameState()
    const result = executeGameCommand(state, {
      version: 1,
      commandId: 'broken',
      participantId: 'agima',
      expectedRound: 1,
      type: 'assign-harvester',
      payload: {
        tileId: state.colonies.agima.ownedTileIds[0],
        production: 'unknown',
      },
    })

    expect(result).toEqual({
      ok: false,
      error: 'invalid-command',
      state,
    })
  })

  it('führt lokale und entfernte menschliche Sitze identisch aus', () => {
    const initialState = createPlayableInitialGameState()
    const state = {
      ...initialState,
      match: {
        ...initialState.match,
        participants: {
          ...initialState.match.participants,
          orion: {
            ...initialState.match.participants.orion,
            controller: {
              kind: 'human',
              input: 'remote',
            } as const,
          },
        },
      },
    }
    const tileId = state.colonies.orion.ownedTileIds[0]
    const result = executeGameCommand(
      state,
      createCommand(
        {
          participantId: 'orion',
          type: 'assign-harvester',
          payload: {
            tileId,
            production: 'energy',
          },
        },
        'remote-orion-1',
      ),
    )

    expect(result.ok).toBe(true)
    expect(
      result.state.colonies.orion.harvesterAssignments[tileId],
    ).toEqual({
      production: 'energy',
      isNew: true,
    })
    expect(
      result.state.colonies.orion.freeHarvesterPool,
    ).toHaveLength(1)
    expect(result.state.colonies.agima).toEqual(
      state.colonies.agima,
    )
  })

  it('führt ein Baukommando atomar und nur einmal aus', () => {
    const state = createPlayableInitialGameState()
    const command = createCommand(
      {
        participantId: 'agima',
        type: 'order-harvester-build',
        payload: {},
      },
      'build-1',
    )
    const firstResult = executeGameCommand(state, command)
    const duplicateResult = executeGameCommand(
      firstResult.state,
      command,
    )

    expect(firstResult.ok).toBe(true)
    expect(firstResult.state.colonies.agima.credits).toBe(
      state.colonies.agima.credits - HARVESTER_CREDIT_COST,
    )
    expect(firstResult.state.colonies.agima.resources.ore).toBe(
      state.colonies.agima.resources.ore - HARVESTER_ORE_COST,
    )
    expect(
      firstResult.state.colonies.agima.harvestersInConstruction,
    ).toBe(1)
    expect(firstResult.state.processedCommandIds).toEqual([
      'build-1',
    ])
    expect(duplicateResult).toMatchObject({
      ok: false,
      error: 'duplicate-command',
      state: firstResult.state,
    })
  })

  it('wendet lokale Ereignissperren nur auf den betroffenen Sitz an', () => {
    const state = {
      ...createPlayableInitialGameState(),
      activeLocalEvent: 'labor-strike' as const,
    }
    const agimaResult = executeGameCommand(
      state,
      createCommand(
        {
          participantId: 'agima',
          type: 'order-harvester-build',
          payload: {},
        },
        'agima-blocked',
      ),
    )
    const orionResult = executeGameCommand(
      state,
      createCommand(
        {
          participantId: 'orion',
          type: 'order-harvester-build',
          payload: {},
        },
        'orion-allowed',
      ),
    )

    expect(agimaResult).toMatchObject({
      ok: false,
      error: 'illegal-action',
    })
    expect(orionResult.ok).toBe(true)
    expect(
      orionResult.state.colonies.orion.harvestersInConstruction,
    ).toBe(1)
  })

  it('weist veraltete und nach Regeln illegale Kommandos zurück', () => {
    const state = createPlayableInitialGameState()
    const staleCommand = {
      ...createCommand(
        {
          participantId: 'agima',
          type: 'order-harvester-build',
          payload: {},
        },
        'stale-1',
      ),
      expectedRound: 2,
    }
    const illegalCommand = createCommand(
      {
        participantId: 'agima',
        type: 'assign-harvester',
        payload: {
          tileId: 'P001',
          production: 'food',
        },
      },
      'illegal-1',
    )

    expect(
      executeGameCommand(state, staleCommand),
    ).toMatchObject({
      ok: false,
      error: 'round-mismatch',
      state,
    })
    expect(
      executeGameCommand(state, illegalCommand),
    ).toMatchObject({
      ok: false,
      error: 'illegal-action',
      state,
    })
  })
})
