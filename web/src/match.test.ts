import { describe, expect, it } from 'vitest'
import {
  createPlayableInitialGameState,
  runRound,
} from './game'
import {
  createMatchConfiguration,
  getHumanParticipantIds,
  participantIds,
} from './match'

describe('Match-Konfiguration', () => {
  it('erstellt vier gleichartige, deterministische Teilnehmersitze', () => {
    const first = createMatchConfiguration({ seed: 17 })
    const repeated = createMatchConfiguration({ seed: 17 })

    expect(repeated).toEqual(first)
    expect(Object.keys(first.participants)).toEqual([
      ...participantIds,
    ])

    const startTileIds = Object.values(
      first.participants,
    ).flatMap((participant) => participant.startTileIds)

    expect(startTileIds).toHaveLength(8)
    expect(new Set(startTileIds).size).toBe(8)
  })

  it('ändert mit dem Seed reproduzierbar die Startkorridore', () => {
    const first = createMatchConfiguration({ seed: 17 })
    const other = createMatchConfiguration({ seed: 18 })

    expect(other.participants).not.toEqual(first.participants)
  })

  it('unterstützt bis zu vier menschlich gesteuerte Sitze', () => {
    const configuration = createMatchConfiguration({
      controllers: Object.fromEntries(
        participantIds.map((participantId) => [
          participantId,
          {
            kind: 'human',
            input: 'remote',
          },
        ]),
      ),
    })

    expect(getHumanParticipantIds(configuration)).toEqual([
      ...participantIds,
    ])
  })

  it('füllt nicht überschriebene Sitze mit den bestehenden KI-Profilen', () => {
    const configuration = createMatchConfiguration({
      controllers: {
        agima: {
          kind: 'human',
          input: 'remote',
        },
        orion: {
          kind: 'human',
          input: 'remote',
        },
      },
    })

    expect(getHumanParticipantIds(configuration)).toEqual([
      'agima',
      'orion',
    ])
    expect(configuration.participants.nova.controller).toEqual({
      kind: 'ai',
      profile: 'expansion',
    })
    expect(configuration.participants.vega.controller).toEqual({
      kind: 'ai',
      profile: 'industry',
    })
  })

  it('ist vollständig als JSON serialisierbar', () => {
    const configuration = createMatchConfiguration({ seed: 23 })

    expect(
      JSON.parse(JSON.stringify(configuration)),
    ).toEqual(configuration)
  })

  it('bleibt als Partiemetadaten über die Rundenabrechnung erhalten', () => {
    const state = createPlayableInitialGameState(31)
    const completedRound = runRound(
      state,
      {},
      {
        foodLevel: 2,
        energyLevel: 2,
      },
    )

    expect(state.match).toEqual(createMatchConfiguration())
    expect(completedRound.nextState.match).toEqual(state.match)
  })
})
