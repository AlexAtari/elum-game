import {
  assignStartCorridors,
  targetStartConfiguration,
} from './planetMap'

export const participantIds = [
  'agima',
  'orion',
  'nova',
  'vega',
] as const

export type ParticipantId = (typeof participantIds)[number]
export type AiProfile = 'balanced' | 'expansion' | 'industry'

export type ParticipantController =
  | {
      kind: 'human'
      input: 'local' | 'remote'
    }
  | {
      kind: 'ai'
      profile: AiProfile
    }

export type MatchParticipant = {
  id: ParticipantId
  controller: ParticipantController
  startTileIds: [string, string]
}

export type MatchConfiguration = {
  version: 1
  seed: number
  participants: Record<ParticipantId, MatchParticipant>
}

export type MatchConfigurationOptions = {
  seed?: number
  controllers?: Partial<
    Record<ParticipantId, ParticipantController>
  >
}

const defaultControllers: Record<
  ParticipantId,
  ParticipantController
> = {
  agima: {
    kind: 'human',
    input: 'local',
  },
  orion: {
    kind: 'ai',
    profile: 'balanced',
  },
  nova: {
    kind: 'ai',
    profile: 'expansion',
  },
  vega: {
    kind: 'ai',
    profile: 'industry',
  },
}

function normalizeMatchSeed(seed: number | undefined) {
  const finiteSeed =
    seed !== undefined && Number.isFinite(seed) ? seed : 1

  return Math.abs(Math.trunc(finiteSeed))
}

function copyController(
  controller: ParticipantController,
): ParticipantController {
  return { ...controller }
}

export function createMatchConfiguration(
  options: MatchConfigurationOptions = {},
): MatchConfiguration {
  const seed = normalizeMatchSeed(options.seed)
  const assignments = assignStartCorridors(
    targetStartConfiguration.corridors,
    [...participantIds],
    seed,
  )

  const participants = Object.fromEntries(
    assignments.map(({ participantId, corridor }) => {
      const id = participantId as ParticipantId

      return [
        id,
        {
          id,
          controller: copyController(
            options.controllers?.[id] ??
              defaultControllers[id],
          ),
          startTileIds: [
            corridor.innerTileId,
            corridor.outerTileId,
          ],
        } satisfies MatchParticipant,
      ]
    }),
  ) as Record<ParticipantId, MatchParticipant>

  return {
    version: 1,
    seed,
    participants,
  }
}

export function getHumanParticipantIds(
  configuration: MatchConfiguration,
) {
  return participantIds.filter(
    (participantId) =>
      configuration.participants[participantId].controller
        .kind === 'human',
  )
}
