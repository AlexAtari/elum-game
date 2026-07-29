import { describe, expect, it } from 'vitest'
import {
  createRivalMarketSelection,
  getRivalMarketOrder,
} from './rivalMarket'
import {
  createInitialGameState,
  executeMarketTrade,
} from './game'

describe('Marktteilnahme aller Rivalen', () => {
  it('lässt Nova bei Nahrungsmangel als Käufer teilnehmen', () => {
    const state = createInitialGameState()
    state.rivals.orion.resources.food = 20
    state.rivals.nova.resources.food = 0
    state.rivals.vega.resources.food = 20

    const selection = createRivalMarketSelection(
      state.rivals,
      3,
      'food',
      'seller',
      8,
    )

    const nova = selection.participants.find(
      (participant) => participant.rivalId === 'nova',
    )

    expect(nova?.decision.role).toBe('buyer')
    expect(selection.active?.rivalId).toBe('nova')
  })

  it('lässt Vega industriellen Erzbedarf selbst bewerten', () => {
    const state = createInitialGameState()
    state.rivals.vega.resources.ore = 0
    state.rivals.vega.credits = 100

    const selection = createRivalMarketSelection(
      state.rivals,
      3,
      'ore',
      'seller',
      15,
    )
    const vega = selection.participants.find(
      (participant) => participant.rivalId === 'vega',
    )

    expect(vega?.decision.role).toBe('buyer')
    expect(vega?.decision.quantity).toBeGreaterThan(0)
  })

  it('wählt beim Verkauf den Rivalen mit dem besten Kaufpreis', () => {
    const state = createInitialGameState()
    state.rivals.orion.resources.energy = 0
    state.rivals.nova.resources.energy = 3
    state.rivals.vega.resources.energy = 20

    const selection = createRivalMarketSelection(
      state.rivals,
      4,
      'energy',
      'seller',
      8,
    )

    expect(selection.active?.rivalId).toBe('orion')
  })

  it('rotiert die Reihenfolge bei gleichwertigen Angeboten', () => {
    expect(getRivalMarketOrder(1, 'food')).toEqual([
      'orion',
      'nova',
      'vega',
    ])
    expect(getRivalMarketOrder(2, 'food')).toEqual([
      'nova',
      'vega',
      'orion',
    ])
    expect(getRivalMarketOrder(1, 'energy')).toEqual([
      'nova',
      'vega',
      'orion',
    ])
  })

  it('verbucht einen Verkauf an Nova in beiden Kolonien', () => {
    const state = createInitialGameState()
    state.resources.food = 5
    state.credits = 50
    state.rivals.nova.resources.food = 0
    state.rivals.nova.credits = 100

    const next = executeMarketTrade(
      state,
      'food',
      'sell',
      8,
      'nova',
    )

    expect(next.resources.food).toBe(4)
    expect(next.credits).toBe(58)
    expect(next.rivals.nova.resources.food).toBe(1)
    expect(next.rivals.nova.credits).toBe(92)
    expect(next.rivals.orion).toEqual(state.rivals.orion)
  })

  it('verbucht auch den bisherigen Standardhandel mit Orion beidseitig', () => {
    const state = createInitialGameState()
    const next = executeMarketTrade(
      state,
      'food',
      'buy',
      8,
      'orion',
    )

    expect(next.resources.food).toBe(
      state.resources.food + 1,
    )
    expect(next.credits).toBe(state.credits - 8)
    expect(next.rivals.orion.resources.food).toBe(
      state.rivals.orion.resources.food - 1,
    )
    expect(next.rivals.orion.credits).toBe(
      state.rivals.orion.credits + 8,
    )
  })

  it('verbucht einen Kauf von Vega in beiden Kolonien', () => {
    const state = createInitialGameState()
    state.resources.ore = 0
    state.credits = 100
    state.rivals.vega.resources.ore = 5
    state.rivals.vega.credits = 20

    const next = executeMarketTrade(
      state,
      'ore',
      'buy',
      15,
      'vega',
    )

    expect(next.resources.ore).toBe(1)
    expect(next.credits).toBe(85)
    expect(next.rivals.vega.resources.ore).toBe(4)
    expect(next.rivals.vega.credits).toBe(35)
    expect(next.rivals.orion).toEqual(state.rivals.orion)
  })

})
