import {
  assignColonyHarvester,
  changeColonyHarvesterProduction,
  cancelColonyLandBid,
  orderColonyHarvesterBuild,
  placeColonyLandBid,
  removeColonyHarvester,
  type GameState,
  type ProductionType,
} from './game'
import {
  participantIds,
  type ParticipantId,
} from './match'

type GameCommandBase = {
  version: 1
  commandId: string
  participantId: ParticipantId
  expectedRound: number
}

export type GameCommand =
  | (GameCommandBase & {
      type: 'assign-harvester'
      payload: {
        tileId: string
        production: ProductionType
      }
    })
  | (GameCommandBase & {
      type: 'change-harvester-production'
      payload: {
        tileId: string
        production: ProductionType
      }
    })
  | (GameCommandBase & {
      type: 'remove-harvester'
      payload: {
        tileId: string
      }
    })
  | (GameCommandBase & {
      type: 'order-harvester-build'
      payload: Record<string, never>
    })
  | (GameCommandBase & {
      type: 'place-land-bid'
      payload: {
        tileId: string
        amount: number
      }
    })
  | (GameCommandBase & {
      type: 'cancel-land-bid'
      payload: Record<string, never>
    })

export type GameCommandAction =
  GameCommand extends infer Command
    ? Command extends GameCommand
      ? Omit<
          Command,
          | 'version'
          | 'commandId'
          | 'participantId'
          | 'expectedRound'
        >
      : never
    : never

export type GameCommandErrorCode =
  | 'invalid-command'
  | 'round-mismatch'
  | 'duplicate-command'
  | 'illegal-action'

export type GameCommandResult =
  | {
      ok: true
      command: GameCommand
      state: GameState
    }
  | {
      ok: false
      command?: GameCommand
      error: GameCommandErrorCode
      state: GameState
    }

const productionTypes: ProductionType[] = [
  'food',
  'energy',
  'ore',
  'crystals',
]
const maximumRememberedCommandIds = 512

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isParticipantId(value: unknown): value is ParticipantId {
  return (
    typeof value === 'string' &&
    participantIds.includes(value as ParticipantId)
  )
}

function isProductionType(
  value: unknown,
): value is ProductionType {
  return (
    typeof value === 'string' &&
    productionTypes.includes(value as ProductionType)
  )
}

function hasValidBase(
  input: Record<string, unknown>,
): input is Record<string, unknown> & GameCommandBase {
  return (
    input.version === 1 &&
    typeof input.commandId === 'string' &&
    input.commandId.length > 0 &&
    input.commandId.length <= 128 &&
    isParticipantId(input.participantId) &&
    Number.isInteger(input.expectedRound) &&
    Number(input.expectedRound) > 0
  )
}

export function parseGameCommand(
  input: unknown,
): GameCommand | null {
  if (!isRecord(input) || !hasValidBase(input)) {
    return null
  }

  const payload = input.payload

  if (!isRecord(payload)) {
    return null
  }

  const base: GameCommandBase = {
    version: 1,
    commandId: input.commandId,
    participantId: input.participantId,
    expectedRound: Number(input.expectedRound),
  }

  if (
    input.type === 'assign-harvester' ||
    input.type === 'change-harvester-production'
  ) {
    if (
      typeof payload.tileId !== 'string' ||
      payload.tileId.length === 0 ||
      !isProductionType(payload.production)
    ) {
      return null
    }

    return {
      ...base,
      type: input.type,
      payload: {
        tileId: payload.tileId,
        production: payload.production,
      },
    }
  }

  if (input.type === 'remove-harvester') {
    if (
      typeof payload.tileId !== 'string' ||
      payload.tileId.length === 0
    ) {
      return null
    }

    return {
      ...base,
      type: 'remove-harvester',
      payload: {
        tileId: payload.tileId,
      },
    }
  }

  if (input.type === 'place-land-bid') {
    if (
      typeof payload.tileId !== 'string' ||
      payload.tileId.length === 0 ||
      !Number.isInteger(payload.amount) ||
      Number(payload.amount) <= 0
    ) {
      return null
    }

    return {
      ...base,
      type: 'place-land-bid',
      payload: {
        tileId: payload.tileId,
        amount: Number(payload.amount),
      },
    }
  }

  if (input.type === 'order-harvester-build') {
    return {
      ...base,
      type: 'order-harvester-build',
      payload: {},
    }
  }

  if (input.type === 'cancel-land-bid') {
    return {
      ...base,
      type: 'cancel-land-bid',
      payload: {},
    }
  }

  return null
}

function applyGameCommand(
  currentState: GameState,
  command: GameCommand,
) {
  switch (command.type) {
    case 'assign-harvester':
      return assignColonyHarvester(
        currentState,
        command.participantId,
        command.payload.tileId,
        command.payload.production,
      )
    case 'change-harvester-production':
      return changeColonyHarvesterProduction(
        currentState,
        command.participantId,
        command.payload.tileId,
        command.payload.production,
      )
    case 'remove-harvester':
      return removeColonyHarvester(
        currentState,
        command.participantId,
        command.payload.tileId,
      )
    case 'order-harvester-build':
      return orderColonyHarvesterBuild(
        currentState,
        command.participantId,
      )
    case 'place-land-bid':
      return placeColonyLandBid(
        currentState,
        command.participantId,
        command.payload.tileId,
        command.payload.amount,
      )
    case 'cancel-land-bid':
      return cancelColonyLandBid(
        currentState,
        command.participantId,
      )
  }
}

export function executeGameCommand(
  currentState: GameState,
  input: unknown,
): GameCommandResult {
  const command = parseGameCommand(input)

  if (!command) {
    return {
      ok: false,
      error: 'invalid-command',
      state: currentState,
    }
  }

  if (command.expectedRound !== currentState.round) {
    return {
      ok: false,
      command,
      error: 'round-mismatch',
      state: currentState,
    }
  }

  if (
    (currentState.processedCommandIds ?? []).includes(
      command.commandId,
    )
  ) {
    return {
      ok: false,
      command,
      error: 'duplicate-command',
      state: currentState,
    }
  }

  const nextState = applyGameCommand(currentState, command)

  if (nextState === currentState) {
    return {
      ok: false,
      command,
      error: 'illegal-action',
      state: currentState,
    }
  }

  return {
    ok: true,
    command,
    state: {
      ...nextState,
      processedCommandIds: [
        ...(currentState.processedCommandIds ?? []).slice(
          -(maximumRememberedCommandIds - 1),
        ),
        command.commandId,
      ],
    },
  }
}
