import { describe, expect, it } from 'vitest'
import {
  normalizeDisplayName,
  parseMultiplayerClientMessage,
} from './multiplayerProtocol'

describe('Multiplayer-Nachrichtenprotokoll', () => {
  it('normalisiert Lobby- und Bereitschaftsnachrichten', () => {
    expect(
      parseMultiplayerClientMessage({
        version: 1,
        requestId: 'join-1',
        type: 'join-lobby',
        payload: {
          displayName: '  Alex   Mars  ',
        },
      }),
    ).toEqual({
      version: 1,
      requestId: 'join-1',
      type: 'join-lobby',
      payload: {
        displayName: 'Alex Mars',
      },
    })
    expect(
      parseMultiplayerClientMessage({
        version: 1,
        requestId: 'ready-1',
        type: 'set-ready',
        payload: {
          ready: true,
        },
      }),
    ).toEqual({
      version: 1,
      requestId: 'ready-1',
      type: 'set-ready',
      payload: {
        ready: true,
      },
    })
  })

  it('akzeptiert den leeren Neustartbefehl', () => {
    expect(
      parseMultiplayerClientMessage({
        version: 1,
        requestId: 'restart-1',
        type: 'restart-match',
        payload: {},
      }),
    ).toEqual({
      version: 1,
      requestId: 'restart-1',
      type: 'restart-match',
      payload: {},
    })
  })

  it('prüft eingebettete Spielkommandos vollständig', () => {
    const message = {
      version: 1,
      requestId: 'command-1',
      type: 'game-command',
      payload: {
        command: {
          version: 1,
          commandId: 'build-1',
          participantId: 'agima',
          expectedRound: 1,
          type: 'order-harvester-build',
          payload: {},
        },
      },
    }

    expect(parseMultiplayerClientMessage(message)).toEqual(message)
    expect(
      parseMultiplayerClientMessage({
        ...message,
        payload: {
          command: {
            ...message.payload.command,
            participantId: 'unknown',
          },
        },
      }),
    ).toBeNull()
  })

  it('validiert Versorgungspläne für die Rundenbarriere', () => {
    const message = {
      version: 1,
      requestId: 'round-plan-1',
      type: 'submit-round-plan',
      payload: {
        supplyPlan: {
          foodLevel: 2,
          energyLevel: 3,
        },
      },
    }

    expect(parseMultiplayerClientMessage(message)).toEqual(message)
    expect(
      parseMultiplayerClientMessage({
        ...message,
        payload: {
          supplyPlan: {
            foodLevel: 2,
            energyLevel: 3.5,
          },
        },
      }),
    ).toBeNull()
    expect(
      parseMultiplayerClientMessage({
        ...message,
        payload: {
          supplyPlan: null,
        },
      }),
    ).toBeNull()
  })

  it('weist unbekannte Versionen und unbrauchbare Namen zurück', () => {
    expect(normalizeDisplayName('')).toBeNull()
    expect(normalizeDisplayName('x'.repeat(25))).toBeNull()
    expect(
      parseMultiplayerClientMessage({
        version: 2,
        requestId: 'join-1',
        type: 'join-lobby',
        payload: {
          displayName: 'Alex',
        },
      }),
    ).toBeNull()
  })
})
