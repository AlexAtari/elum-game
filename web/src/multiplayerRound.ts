import {
  getColonyLocalEvent,
  runRound,
  type GameState,
  type HarvesterAssignment,
  type HarvesterAssignments,
  type LandAuctionResult,
  type RivalId,
  type RoundReport,
  type SupplyPlan,
} from './game'
import {
  getHumanParticipantIds,
  type ParticipantId,
} from './match'
import { applyAutonomousRivalLandPurchase } from './rivalAutonomousLand'

export type ParticipantRoundPlan = {
  supplyPlan: SupplyPlan
}

export type MultiplayerRoundResult = {
  nextState: GameState
  reports: Partial<Record<ParticipantId, RoundReport>>
}

export function applyAutonomousAiLandPurchases(
  state: GameState,
) {
  return (['orion', 'nova', 'vega'] as RivalId[]).reduce(
    (nextState, participantId) =>
      state.match.participants[participantId].controller.kind ===
      'ai'
        ? applyAutonomousRivalLandPurchase(
            nextState,
            participantId,
          )
        : nextState,
    state,
  )
}

function normalizeAssignments(
  state: GameState,
  participantId: ParticipantId,
): HarvesterAssignments {
  const assignments =
    state.colonies[participantId].harvesterAssignments

  return Object.fromEntries(
    Object.entries(assignments).map(([tileId, assignment]) => [
      tileId,
      typeof assignment === 'string'
        ? {
            production: assignment,
            isNew: false,
          }
        : ({ ...assignment } satisfies HarvesterAssignment),
    ]),
  )
}

function runParticipantEconomy(
  state: GameState,
  participantId: ParticipantId,
  plan: ParticipantRoundPlan,
) {
  if (participantId === 'agima') {
    return runRound(
      state,
      normalizeAssignments(state, participantId),
      plan.supplyPlan,
    )
  }

  const participantColony = state.colonies[participantId]
  const localEvent = getColonyLocalEvent(
    state,
    participantId,
  )
  const syntheticState: GameState = {
    ...state,
    activeLocalEvent: localEvent,
    activeLocalEvents: localEvent
      ? { agima: localEvent }
      : {},
    colonies: {
      ...state.colonies,
      agima: {
        ...participantColony,
        id: 'agima',
        harvesterAssignments: normalizeAssignments(
          state,
          participantId,
        ),
      },
    },
  }

  return runRound(
    syntheticState,
    normalizeAssignments(state, participantId),
    plan.supplyPlan,
  )
}

function createParticipantLandAuctionReport(
  state: GameState,
  participantId: ParticipantId,
): LandAuctionResult | null {
  const landBid = state.pendingLandBid

  if (!landBid) {
    return null
  }

  const bidEntries = Object.entries(landBid.bids) as Array<
    [ParticipantId, number]
  >
  const participantBid = landBid.bids[participantId]

  if (participantBid === undefined) {
    return null
  }

  const highestOtherBid = Math.max(
    0,
    ...bidEntries
      .filter(([bidderId]) => bidderId !== participantId)
      .map(([, amount]) => amount),
  )
  const winnerId =
    landBid.winnerId ??
    (bidEntries.length === 1 ? bidEntries[0][0] : undefined)

  return {
    tileId: landBid.tileId,
    playerBid: participantBid,
    rivalBid: highestOtherBid,
    outcome:
      winnerId === participantId
        ? 'won'
        : winnerId
          ? 'lost'
          : 'tie',
  }
}

export function runMultiplayerRound(
  state: GameState,
  plans: Partial<Record<ParticipantId, ParticipantRoundPlan>>,
): MultiplayerRoundResult {
  const humanParticipantIds = getHumanParticipantIds(state.match)

  if (
    humanParticipantIds.some(
      (participantId) => plans[participantId] === undefined,
    )
  ) {
    throw new Error('Missing human round plan.')
  }

  const agimaPlan = plans.agima

  if (!agimaPlan) {
    throw new Error('Agima must be human in the current match model.')
  }

  const participantResults = Object.fromEntries(
    humanParticipantIds.map((participantId) => [
      participantId,
      runParticipantEconomy(
        state,
        participantId,
        plans[participantId]!,
      ),
    ]),
  ) as Partial<
    Record<ParticipantId, ReturnType<typeof runRound>>
  >
  const agimaResult = participantResults.agima!
  let nextState = agimaResult.nextState
  const landBidEntries = Object.entries(
    state.pendingLandBid?.bids ?? {},
  ) as Array<[ParticipantId, number]>
  const landWinnerId =
    state.pendingLandBid?.winnerId ??
    (landBidEntries.length === 1
      ? landBidEntries[0][0]
      : undefined)

  for (const participantId of humanParticipantIds) {
    if (participantId === 'agima') {
      continue
    }

    const participantResult = participantResults[participantId]!
    const economy =
      participantResult.nextState.colonies.agima
    const sharedColony = nextState.colonies[participantId]
    const refundedCredits =
      participantId !== landWinnerId
        ? state.pendingLandBid?.reservedCredits[
            participantId
          ] ?? 0
        : 0

    nextState = {
      ...nextState,
      colonies: {
        ...nextState.colonies,
        [participantId]: {
          ...economy,
          id: participantId,
          name: sharedColony.name,
          icon: sharedColony.icon,
          credits:
            state.colonies[participantId].credits +
            refundedCredits,
          ownedTileIds: sharedColony.ownedTileIds,
          crystalDiscoveryRoundByTileId:
            sharedColony.crystalDiscoveryRoundByTileId,
          lastLandPurchaseRound:
            sharedColony.lastLandPurchaseRound,
        },
      },
    }
  }

  return {
    nextState,
    reports: Object.fromEntries(
      humanParticipantIds.map((participantId) => [
        participantId,
        {
          ...participantResults[participantId]!.report,
          landAuction: createParticipantLandAuctionReport(
            state,
            participantId,
          ),
        },
      ]),
    ),
  }
}
