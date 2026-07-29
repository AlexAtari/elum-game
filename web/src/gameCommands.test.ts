import { describe, expect, it } from 'vitest'
import {
  createPlayableInitialGameState,
  HARVESTER_CREDIT_COST,
  HARVESTER_ORE_COST,
  selectOtherColonyTileIds,
  tiles,
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

  it('führt Grundstücksgebote für entfernte Sitze über dieselbe Grenze aus', () => {
    const state = createPlayableInitialGameState()
    const startTile = tiles.find(
      (tile) =>
        tile.id === state.colonies.orion.ownedTileIds[1],
    )!
    const tileId = startTile.neighborIds.find(
      (candidateId) =>
        !state.colonies.orion.ownedTileIds.includes(candidateId) &&
        !selectOtherColonyTileIds(state, 'orion').includes(
          candidateId,
        ) &&
        tiles.find((tile) => tile.id === candidateId)?.owner ===
          'free',
    )!
    const result = executeGameCommand(
      state,
      createCommand(
        {
          participantId: 'orion',
          type: 'place-land-bid',
          payload: {
            tileId,
            amount: 25,
          },
        },
        'remote-orion-land-1',
      ),
    )

    expect(result.ok).toBe(true)
    expect(result.state.pendingLandBid).toEqual({
      tileId,
      bids: { orion: 25 },
      reservedCredits: { orion: 25 },
      tieMinimum: undefined,
    })
    expect(result.state.colonies.orion.credits).toBe(
      state.colonies.orion.credits - 25,
    )
    expect(result.state.colonies.agima).toEqual(
      state.colonies.agima,
    )
  })

  it('erstattet beim Rücknahmekommando nur den handelnden Sitz', () => {
    const state = createPlayableInitialGameState()
    const tileId = state.colonies.agima.ownedTileIds[0]
    const reservedState = {
      ...state,
      colonies: {
        ...state.colonies,
        agima: {
          ...state.colonies.agima,
          credits: state.colonies.agima.credits - 25,
        },
        orion: {
          ...state.colonies.orion,
          credits: state.colonies.orion.credits - 27,
        },
      },
      pendingLandBid: {
        tileId,
        bids: { agima: 25, orion: 27 },
        reservedCredits: { agima: 25, orion: 27 },
      },
    }
    const result = executeGameCommand(
      reservedState,
      createCommand(
        {
          participantId: 'agima',
          type: 'cancel-land-bid',
          payload: {},
        },
        'cancel-agima-land-1',
      ),
    )

    expect(result.ok).toBe(true)
    expect(result.state.colonies.agima.credits).toBe(
      state.colonies.agima.credits,
    )
    expect(result.state.colonies.orion.credits).toBe(
      state.colonies.orion.credits - 27,
    )
    expect(result.state.pendingLandBid?.bids).toEqual({
      orion: 27,
    })
  })

  it('führt die grafische Grundstücksauktion vollständig über Kommandos', () => {
    const initialState = createPlayableInitialGameState()
    const tileId = initialState.colonies.agima.ownedTileIds[0]
    const auctionState = {
      ...initialState,
      landAuctionTie: {
        tileId,
        tiedBid: 30,
        minimumBid: 31,
        phase: 'announcement' as const,
        openingBids: { agima: 30, orion: 30 },
        initialLeaderId: null,
        liveBids: {
          bids: { agima: 30, orion: 30 },
          leaderId: null,
        },
      },
    }
    const started = executeGameCommand(
      auctionState,
      createCommand(
        {
          participantId: 'agima',
          type: 'advance-land-auction-phase',
          payload: {
            tileId,
            expectedPhase: 'announcement',
          },
        },
        'land-auction-start',
      ),
    )
    const raised = executeGameCommand(
      started.state,
      createCommand(
        {
          participantId: 'agima',
          type: 'move-land-auction-bid',
          payload: { tileId, direction: 'raise' },
        },
        'land-auction-raise',
      ),
    )
    const staleTransition = executeGameCommand(
      raised.state,
      createCommand(
        {
          participantId: 'agima',
          type: 'advance-land-auction-phase',
          payload: {
            tileId,
            expectedPhase: 'announcement',
          },
        },
        'land-auction-stale-phase',
      ),
    )
    const finished = executeGameCommand(
      raised.state,
      createCommand(
        {
          participantId: 'agima',
          type: 'advance-land-auction-phase',
          payload: {
            tileId,
            expectedPhase: 'auction',
          },
        },
        'land-auction-finish',
      ),
    )

    expect(started.state.landAuctionTie?.phase).toBe('auction')
    expect(raised.state.landAuctionTie?.liveBids).toEqual({
      bids: { agima: 31, orion: 30 },
      leaderId: 'agima',
    })
    expect(staleTransition).toMatchObject({
      ok: false,
      error: 'illegal-action',
      state: raised.state,
    })
    expect(finished.state.landAuctionTie?.phase).toBe(
      'finished',
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

  it('führt einen entfernten Ressourcenmarkt vollständig über Kommandos aus', () => {
    const initialState = createPlayableInitialGameState()
    const initiated = executeGameCommand(
      initialState,
      createCommand(
        {
          participantId: 'orion',
          type: 'initiate-resource-market',
          payload: { resource: 'food' },
        },
        'market-init-orion-1',
      ),
    )
    const withRole = executeGameCommand(
      executeGameCommand(
        initiated.state,
        createCommand(
          {
            participantId: 'orion',
            type: 'advance-resource-market-phase',
            payload: {
              resource: 'food',
              expectedPhase: 'announcement',
            },
          },
          'market-declaration-orion-1',
        ),
      ).state,
      createCommand(
        {
          participantId: 'orion',
          type: 'set-market-role',
          payload: {
            resource: 'food',
            role: 'buyer',
          },
        },
        'market-role-orion-1',
      ),
    )
    const belowWarehouseOffer = executeGameCommand(
      executeGameCommand(
        withRole.state,
        createCommand(
          {
            participantId: 'orion',
            type: 'advance-resource-market-phase',
            payload: {
              resource: 'food',
              expectedPhase: 'declaration',
            },
          },
          'market-auction-orion-1',
        ),
      ).state,
      createCommand(
        {
          participantId: 'orion',
          type: 'set-market-offer',
          payload: {
            resource: 'food',
            active: true,
            price: 10,
          },
        },
        'market-offer-orion-too-low',
      ),
    )
    const rejectedWarehouseTrade = executeGameCommand(
      belowWarehouseOffer.state,
      createCommand(
        {
          participantId: 'orion',
          type: 'execute-market-trade',
          payload: {
            resource: 'food',
            direction: 'buy',
            price: 11,
            counterparty: 'warehouse',
          },
        },
        'market-trade-orion-too-low',
      ),
    )
    const withOffer = executeGameCommand(
      belowWarehouseOffer.state,
      createCommand(
        {
          participantId: 'orion',
          type: 'set-market-offer',
          payload: {
            resource: 'food',
            active: true,
            price: 11,
          },
        },
        'market-offer-orion-1',
      ),
    )
    const traded = executeGameCommand(
      withOffer.state,
      createCommand(
        {
          participantId: 'orion',
          type: 'execute-market-trade',
          payload: {
            resource: 'food',
            direction: 'buy',
            price: 11,
            counterparty: 'warehouse',
          },
        },
        'market-trade-orion-1',
      ),
    )
    const rejectedCompletion = executeGameCommand(
      executeGameCommand(
        traded.state,
        createCommand(
          {
            participantId: 'orion',
            type: 'advance-resource-market-phase',
            payload: {
              resource: 'food',
              expectedPhase: 'auction',
            },
          },
          'market-finished-orion-1',
        ),
      ).state,
      createCommand(
        {
          participantId: 'nova',
          type: 'complete-resource-market',
          payload: { resource: 'food' },
        },
        'market-complete-nova-1',
      ),
    )
    const completed = executeGameCommand(
      rejectedCompletion.state,
      createCommand(
        {
          participantId: 'orion',
          type: 'complete-resource-market',
          payload: { resource: 'food' },
        },
        'market-complete-orion-1',
      ),
    )

    expect(initiated.ok).toBe(true)
    expect(initiated.state.activeResourceMarket).toMatchObject({
      resource: 'food',
      initiatorId: 'orion',
    })
    expect(withRole.ok).toBe(true)
    expect(rejectedWarehouseTrade).toMatchObject({
      ok: false,
      error: 'illegal-action',
      state: belowWarehouseOffer.state,
    })
    expect(withOffer.ok).toBe(true)
    expect(traded.ok).toBe(true)
    expect(traded.state.colonies.orion.credits).toBe(
      initialState.colonies.orion.credits - 11,
    )
    expect(traded.state.colonies.orion.resources.food).toBe(
      initialState.colonies.orion.resources.food + 1,
    )
    expect(traded.state.market.food.warehouseStock).toBe(19)
    expect(rejectedCompletion).toMatchObject({
      ok: false,
      error: 'illegal-action',
    })
    expect(
      rejectedCompletion.state.activeResourceMarket?.phase,
    ).toBe('finished')
    expect(completed.ok).toBe(true)
    expect(completed.state.activeResourceMarket).toBeNull()
  })

  it('validiert direkte Marktangebote beider Teilnehmer vor dem Handel', () => {
    const initialState = createPlayableInitialGameState()
    const commands: GameCommand[] = [
      createCommand(
        {
          participantId: 'orion',
          type: 'initiate-resource-market',
          payload: { resource: 'food' },
        },
        'direct-market-init',
      ),
      createCommand(
        {
          participantId: 'orion',
          type: 'advance-resource-market-phase',
          payload: {
            resource: 'food',
            expectedPhase: 'announcement',
          },
        },
        'direct-market-declaration',
      ),
      createCommand(
        {
          participantId: 'orion',
          type: 'set-market-role',
          payload: { resource: 'food', role: 'buyer' },
        },
        'direct-market-orion-role',
      ),
      createCommand(
        {
          participantId: 'nova',
          type: 'set-market-role',
          payload: { resource: 'food', role: 'seller' },
        },
        'direct-market-nova-role',
      ),
      createCommand(
        {
          participantId: 'orion',
          type: 'advance-resource-market-phase',
          payload: {
            resource: 'food',
            expectedPhase: 'declaration',
          },
        },
        'direct-market-auction',
      ),
      createCommand(
        {
          participantId: 'orion',
          type: 'set-market-offer',
          payload: {
            resource: 'food',
            active: true,
            price: 10,
          },
        },
        'direct-market-orion-offer',
      ),
      createCommand(
        {
          participantId: 'nova',
          type: 'set-market-offer',
          payload: {
            resource: 'food',
            active: true,
            price: 10,
          },
        },
        'direct-market-nova-offer',
      ),
    ]
    const preparedState = commands.reduce(
      (state, command) =>
        executeGameCommand(state, command).state,
      initialState,
    )
    const validTrade = createCommand(
      {
        participantId: 'orion',
        type: 'execute-market-trade',
        payload: {
          resource: 'food',
          direction: 'buy',
          price: 10,
          counterparty: 'nova',
        },
      },
      'direct-market-trade',
    )
    const invalidPrice = {
      ...validTrade,
      commandId: 'direct-market-invalid-price',
      payload: {
        ...validTrade.payload,
        price: 1,
      },
    }
    const rejected = executeGameCommand(
      preparedState,
      invalidPrice,
    )
    const traded = executeGameCommand(
      preparedState,
      validTrade,
    )

    expect(rejected).toMatchObject({
      ok: false,
      error: 'illegal-action',
      state: preparedState,
    })
    expect(traded.ok).toBe(true)
    expect(traded.state.colonies.orion.credits).toBe(
      initialState.colonies.orion.credits - 10,
    )
    expect(traded.state.colonies.nova.credits).toBe(
      initialState.colonies.nova.credits + 10,
    )
    expect(traded.state.colonies.orion.resources.food).toBe(
      initialState.colonies.orion.resources.food + 1,
    )
    expect(traded.state.colonies.nova.resources.food).toBe(
      initialState.colonies.nova.resources.food - 1,
    )
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

  it('wendet eine private lokale Sperre auch auf einen entfernten Sitz an', () => {
    const state = {
      ...createPlayableInitialGameState(),
      activeLocalEvents: {
        orion: 'labor-strike' as const,
      },
    }
    const agimaResult = executeGameCommand(
      state,
      createCommand(
        {
          participantId: 'agima',
          type: 'order-harvester-build',
          payload: {},
        },
        'agima-allowed-by-orion-event',
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
        'orion-blocked-by-own-event',
      ),
    )

    expect(agimaResult.ok).toBe(true)
    expect(orionResult).toMatchObject({
      ok: false,
      error: 'illegal-action',
    })
  })

  it('wendet die lokale Kommunikationssperre nur auf Agimas Marktstart an', () => {
    const state = {
      ...createPlayableInitialGameState(),
      activeLocalEvent: 'communications-outage' as const,
    }
    const agimaResult = executeGameCommand(
      state,
      createCommand(
        {
          participantId: 'agima',
          type: 'initiate-resource-market',
          payload: { resource: 'food' },
        },
        'agima-market-blocked',
      ),
    )
    const orionResult = executeGameCommand(
      state,
      createCommand(
        {
          participantId: 'orion',
          type: 'initiate-resource-market',
          payload: { resource: 'food' },
        },
        'orion-market-allowed',
      ),
    )

    expect(agimaResult).toMatchObject({
      ok: false,
      error: 'illegal-action',
    })
    expect(orionResult.ok).toBe(true)
    expect(
      orionResult.state.activeResourceMarket?.initiatorId,
    ).toBe('orion')
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
