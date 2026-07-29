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
    state.colonies.orion.resources.food = 20
    state.colonies.nova.resources.food = 0
    state.colonies.vega.resources.food = 20

    const selection = createRivalMarketSelection(
      state.colonies,
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
    state.colonies.vega.resources.ore = 0
    state.colonies.vega.credits = 100

    const selection = createRivalMarketSelection(
      state.colonies,
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
    state.colonies.orion.resources.energy = 0
    state.colonies.nova.resources.energy = 3
    state.colonies.vega.resources.energy = 20

    const selection = createRivalMarketSelection(
      state.colonies,
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
    state.colonies.agima.resources.food = 5
    state.colonies.agima.credits = 50
    state.colonies.nova.resources.food = 0
    state.colonies.nova.credits = 100

    const next = executeMarketTrade(
      state,
      'food',
      'sell',
      8,
      'nova',
    )

    expect(next.colonies.agima.resources.food).toBe(4)
    expect(next.colonies.agima.credits).toBe(58)
    expect(next.colonies.nova.resources.food).toBe(1)
    expect(next.colonies.nova.credits).toBe(92)
    expect(next.colonies.orion).toEqual(state.colonies.orion)
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

    expect(next.colonies.agima.resources.food).toBe(
      state.colonies.agima.resources.food + 1,
    )
    expect(next.colonies.agima.credits).toBe(state.colonies.agima.credits - 8)
    expect(next.colonies.orion.resources.food).toBe(
      state.colonies.orion.resources.food - 1,
    )
    expect(next.colonies.orion.credits).toBe(
      state.colonies.orion.credits + 8,
    )
  })

  it('verbucht einen Kauf von Vega in beiden Kolonien', () => {
    const state = createInitialGameState()
    state.colonies.agima.resources.ore = 0
    state.colonies.agima.credits = 100
    state.colonies.vega.resources.ore = 5
    state.colonies.vega.credits = 20

    const next = executeMarketTrade(
      state,
      'ore',
      'buy',
      15,
      'vega',
    )

    expect(next.colonies.agima.resources.ore).toBe(1)
    expect(next.colonies.agima.credits).toBe(85)
    expect(next.colonies.vega.resources.ore).toBe(4)
    expect(next.colonies.vega.credits).toBe(35)
    expect(next.colonies.orion).toEqual(state.colonies.orion)
  })

})
