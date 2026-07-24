export type AgentPlayerId = 'agima' | 'orion' | 'nova' | 'vega'
export type AgentPersonality =
  | 'balanced'
  | 'expansionist'
  | 'industrial'
  | 'autopilot'

export type AgentProductionResource = 'food' | 'energy' | 'ore'
export type AgentMarketResource = AgentProductionResource | 'crystals'
export type AgentMarketRole = 'neutral' | 'buyer' | 'seller'

export type AgentResources = Record<AgentMarketResource, number>

export type AgentColonyState = {
  id: AgentPlayerId
  population: number
  credits: number
  resources: AgentResources
  harvesters: number
}

export type AgentProfile = {
  id: AgentPlayerId
  personality: AgentPersonality
  reserveRounds: number
  cashReserve: number
  expansionBias: number
  harvesterBias: number
  productionWeights: Record<AgentProductionResource, number>
  crystalReserve: number
  maximumLandBidShare: number
}

export type AgentLandCandidate = {
  tileId: string
  minimumBid: number
  food: number
  energy: number
  ore: number
  adjacencyBonus?: number
}

export type AgentLegalActions = {
  harvesterBuild?: {
    creditCost: number
    oreCost: number
  }
  harvesterEnergyCost?: number
  landCandidates?: AgentLandCandidate[]
}

export type AgentContext = {
  round: number
  colony: AgentColonyState
  referencePrices: Record<AgentMarketResource, number>
  legalActions?: AgentLegalActions
}

export type AgentSupplyPlan = {
  foodUnits: number
  energyUnits: number
  targetFoodReserve: number
  targetEnergyReserve: number
}

export type AgentProductionPriority = {
  resource: AgentProductionResource
  score: number
}

export type AgentMarketIntent = {
  resource: AgentMarketResource
  role: AgentMarketRole
  quantity: number
  limitPrice: number
  urgency: number
}

export type AgentHarvesterDecision = {
  build: boolean
  reason:
    | 'affordable'
    | 'insufficient-credits'
    | 'insufficient-ore'
    | 'unsafe-supply'
    | 'unavailable'
}

export type AgentLandDecision = {
  tileId: string
  maximumBid: number
  score: number
}

export type AgentPlan = {
  playerId: AgentPlayerId
  supply: AgentSupplyPlan
  productionPriorities: AgentProductionPriority[]
  marketIntents: AgentMarketIntent[]
  harvester: AgentHarvesterDecision
  landBid: AgentLandDecision | null
  targetCashReserve: number
}

export const agentProfiles: Record<AgentPlayerId, AgentProfile> = {
  agima: {
    id: 'agima',
    personality: 'autopilot',
    reserveRounds: 2,
    cashReserve: 35,
    expansionBias: 0.55,
    harvesterBias: 0.6,
    productionWeights: { food: 1, energy: 1, ore: 0.85 },
    crystalReserve: 1,
    maximumLandBidShare: 0.3,
  },
  orion: {
    id: 'orion',
    personality: 'balanced',
    reserveRounds: 2,
    cashReserve: 35,
    expansionBias: 0.5,
    harvesterBias: 0.55,
    productionWeights: { food: 1, energy: 1, ore: 0.8 },
    crystalReserve: 1,
    maximumLandBidShare: 0.28,
  },
  nova: {
    id: 'nova',
    personality: 'expansionist',
    reserveRounds: 1.5,
    cashReserve: 25,
    expansionBias: 0.9,
    harvesterBias: 0.8,
    productionWeights: { food: 1.2, energy: 1.05, ore: 0.7 },
    crystalReserve: 0,
    maximumLandBidShare: 0.4,
  },
  vega: {
    id: 'vega',
    personality: 'industrial',
    reserveRounds: 1.5,
    cashReserve: 30,
    expansionBias: 0.45,
    harvesterBias: 0.75,
    productionWeights: { food: 0.8, energy: 0.95, ore: 1.35 },
    crystalReserve: 2,
    maximumLandBidShare: 0.25,
  },
}

const productionResources: AgentProductionResource[] = [
  'food',
  'energy',
  'ore',
]

const marketResources: AgentMarketResource[] = [
  'food',
  'energy',
  'ore',
  'crystals',
]

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function getRoundDemand(population: number) {
  const populationGroups = Math.ceil(population / 10)
  return populationGroups * 2
}

function getHarvesterEnergyDemand(
  context: AgentContext,
) {
  const energyCost =
    context.legalActions?.harvesterEnergyCost ?? 1

  return (
    context.colony.harvesters *
    Math.max(0, energyCost)
  )
}

function getImmediateNeed(
  resource: AgentMarketResource,
  demand: number,
  context: AgentContext,
) {
  if (resource === 'food') {
    return demand
  }

  if (resource === 'energy') {
    return demand + getHarvesterEnergyDemand(context)
  }

  return 0
}

function getTargetStock(
  resource: AgentMarketResource,
  demand: number,
  profile: AgentProfile,
  context: AgentContext,
) {
  if (resource === 'food') {
    return Math.ceil(demand * profile.reserveRounds)
  }

  if (resource === 'energy') {
    return Math.ceil(
      (demand + getHarvesterEnergyDemand(context)) *
        profile.reserveRounds,
    )
  }

  if (resource === 'ore') {
    return context.legalActions?.harvesterBuild?.oreCost ?? 0
  }

  return profile.crystalReserve
}

function getUrgency(stock: number, target: number, immediateNeed: number) {
  if (target <= 0) {
    return 0
  }

  if (stock < immediateNeed) {
    return 100
  }

  return Math.round(clamp(((target - stock) / target) * 80, 0, 80))
}

function createMarketIntent(
  resource: AgentMarketResource,
  context: AgentContext,
  profile: AgentProfile,
  demand: number,
): AgentMarketIntent {
  const stock = context.colony.resources[resource]
  const target = getTargetStock(resource, demand, profile, context)
  const immediateNeed = getImmediateNeed(
    resource,
    demand,
    context,
  )
  const urgency = getUrgency(stock, target, immediateNeed)
  const referencePrice = context.referencePrices[resource]

  if (stock < target) {
    const affordableQuantity = Math.max(
      0,
      Math.floor(
        (context.colony.credits - profile.cashReserve) /
          Math.max(1, referencePrice),
      ),
    )
    const quantity = Math.min(target - stock, affordableQuantity)

    if (quantity > 0) {
      return {
        resource,
        role: 'buyer',
        quantity,
        limitPrice: Math.max(
          1,
          Math.round(referencePrice * (1 + urgency / 250)),
        ),
        urgency,
      }
    }
  }

  const sellThreshold = target + Math.max(1, immediateNeed)
  if (stock > sellThreshold) {
    const quantity = stock - sellThreshold
    const surplusUrgency = Math.round(
      clamp(
        ((stock - sellThreshold) / Math.max(1, target + 1)) * 60,
        10,
        60,
      ),
    )

    return {
      resource,
      role: 'seller',
      quantity,
      limitPrice: Math.max(
        1,
        Math.round(referencePrice * (1 - surplusUrgency / 400)),
      ),
      urgency: surplusUrgency,
    }
  }

  return {
    resource,
    role: 'neutral',
    quantity: 0,
    limitPrice: referencePrice,
    urgency: 0,
  }
}

function createProductionPriorities(
  context: AgentContext,
  profile: AgentProfile,
  demand: number,
): AgentProductionPriority[] {
  return productionResources
    .map((resource) => {
      const stock = context.colony.resources[resource]
      const target = getTargetStock(resource, demand, profile, context)
      const immediateNeed =
        resource === 'food' || resource === 'energy' ? demand : 0
      const urgency = getUrgency(stock, target, immediateNeed)

      return {
        resource,
        score: Math.round(profile.productionWeights[resource] * 20 + urgency),
      }
    })
    .sort(
      (first, second) =>
        second.score - first.score ||
        productionResources.indexOf(first.resource) -
          productionResources.indexOf(second.resource),
    )
}

function decideHarvesterBuild(
  context: AgentContext,
  profile: AgentProfile,
  targetFoodReserve: number,
  targetEnergyReserve: number,
): AgentHarvesterDecision {
  const build = context.legalActions?.harvesterBuild
  if (!build) {
    return { build: false, reason: 'unavailable' }
  }

  if (
    context.colony.resources.food < targetFoodReserve ||
    context.colony.resources.energy <
      targetEnergyReserve +
        Math.ceil(
          profile.reserveRounds *
            (context.legalActions?.harvesterEnergyCost ?? 1),
        )
  ) {
    return { build: false, reason: 'unsafe-supply' }
  }

  if (context.colony.resources.ore < build.oreCost) {
    return { build: false, reason: 'insufficient-ore' }
  }

  const requiredCredits =
    profile.cashReserve + Math.ceil(build.creditCost / profile.harvesterBias)

  if (context.colony.credits < requiredCredits) {
    return { build: false, reason: 'insufficient-credits' }
  }

  return { build: true, reason: 'affordable' }
}

function scoreLandCandidate(
  candidate: AgentLandCandidate,
  profile: AgentProfile,
) {
  const productionScore =
    candidate.food * profile.productionWeights.food +
    candidate.energy * profile.productionWeights.energy +
    candidate.ore * profile.productionWeights.ore

  return (
    productionScore +
    (candidate.adjacencyBonus ?? 0) * profile.expansionBias
  )
}

function decideLandBid(
  context: AgentContext,
  profile: AgentProfile,
): AgentLandDecision | null {
  const candidates = context.legalActions?.landCandidates ?? []
  const availableCredits = Math.max(
    0,
    context.colony.credits - profile.cashReserve,
  )
  const absoluteBidLimit = Math.floor(
    context.colony.credits * profile.maximumLandBidShare,
  )
  const bidLimit = Math.min(availableCredits, absoluteBidLimit)

  return (
    candidates
      .filter((candidate) => candidate.minimumBid <= bidLimit)
      .map((candidate) => {
        const score = scoreLandCandidate(candidate, profile)
        const valuePremium = 1 + profile.expansionBias * 0.5

        return {
          tileId: candidate.tileId,
          maximumBid: Math.min(
            bidLimit,
            Math.max(
              candidate.minimumBid,
              Math.round(candidate.minimumBid * valuePremium),
            ),
          ),
          score: Math.round(score * 100) / 100,
        }
      })
      .sort(
        (first, second) =>
          second.score - first.score ||
          first.tileId.localeCompare(second.tileId),
      )[0] ?? null
  )
}

export function createAgentPlan(
  context: AgentContext,
  profile: AgentProfile = agentProfiles[context.colony.id],
): AgentPlan {
  const demand = getRoundDemand(context.colony.population)
  const targetFoodReserve = Math.ceil(demand * profile.reserveRounds)
  const energyUnits =
    demand + getHarvesterEnergyDemand(context)
  const targetEnergyReserve = Math.ceil(
    energyUnits * profile.reserveRounds,
  )

  return {
    playerId: profile.id,
    supply: {
      foodUnits: demand,
      energyUnits,
      targetFoodReserve,
      targetEnergyReserve,
    },
    productionPriorities: createProductionPriorities(
      context,
      profile,
      demand,
    ),
    marketIntents: marketResources.map((resource) =>
      createMarketIntent(resource, context, profile, demand),
    ),
    harvester: decideHarvesterBuild(
      context,
      profile,
      targetFoodReserve,
      targetEnergyReserve,
    ),
    landBid: decideLandBid(context, profile),
    targetCashReserve: profile.cashReserve,
  }
}

export function getAgentMarketIntent(
  plan: AgentPlan,
  resource: AgentMarketResource,
) {
  return plan.marketIntents.find((intent) => intent.resource === resource)
}

export function createComplementaryMarketDecision(
  context: AgentContext,
  resource: AgentMarketResource,
  opposingRole: AgentMarketRole,
): AgentMarketIntent {
  const neutralDecision: AgentMarketIntent = {
    resource,
    role: 'neutral',
    quantity: 0,
    limitPrice: context.referencePrices[resource],
    urgency: 0,
  }

  if (opposingRole === 'neutral') {
    return neutralDecision
  }

  const intent = getAgentMarketIntent(
    createAgentPlan(context),
    resource,
  )

  if (!intent) {
    return neutralDecision
  }

  const isComplementary =
    (opposingRole === 'seller' && intent.role === 'buyer') ||
    (opposingRole === 'buyer' && intent.role === 'seller')

  return isComplementary ? intent : neutralDecision
}

export function createLandAuctionDecision(
  context: AgentContext,
  candidate: AgentLandCandidate,
): AgentLandDecision | null {
  return createAgentPlan({
    ...context,
    legalActions: {
      ...(context.legalActions ?? {}),
      landCandidates: [candidate],
    },
  }).landBid
}

export type AgentSealedLandBidDecision = AgentLandDecision & {
  bid: number
}

export function createSealedLandBidDecision(
  context: AgentContext,
  candidate: AgentLandCandidate,
): AgentSealedLandBidDecision | null {
  const decision = createLandAuctionDecision(context, candidate)

  if (!decision) {
    return null
  }

  const bidRange = Math.max(
    0,
    decision.maximumBid - candidate.minimumBid,
  )
  const bid = Math.min(
    decision.maximumBid,
    candidate.minimumBid + Math.floor(bidRange * 0.67),
  )

  return {
    ...decision,
    bid,
  }
}
