export type AgentPlayerId = 'agima' | 'orion' | 'nova' | 'vega'
export type AgentPersonality =
  | 'balanced'
  | 'expansionist'
  | 'industrial'
  | 'autopilot'

export type AgentProductionResource =
  | 'food'
  | 'energy'
  | 'ore'
  | 'crystals'
export type AgentMarketResource = AgentProductionResource
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
  oreReserveBuilds?: number
  maximumLandBidShare: number
}

export type AgentLandCandidate = {
  tileId: string
  minimumBid: number
  food: number
  energy: number
  ore: number
  adjacencyBonus?: number
  distanceFromHq?: number
}

export type AgentLegalActions = {
  harvesterBuild?: {
    creditCost: number
    oreCost: number
  }
  harvesterEnergyCost?: number
  normalSupplyDemand?: number
  hasIdleHarvester?: boolean
  canExpandFrontier?: boolean
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

export type AgentEmergencyLevel =
  | 'normal'
  | 'warning'
  | 'critical'

export type AgentEmergencyAssessment = {
  level: AgentEmergencyLevel
  foodShortage: number
  energyShortage: number
  suspendInvestments: boolean
  emergencyCashReserve: number
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
  emergency: AgentEmergencyAssessment
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
    productionWeights: {
      food: 1,
      energy: 1,
      ore: 0.85,
      crystals: 0.6,
    },
    crystalReserve: 1,
    oreReserveBuilds: 1,
    maximumLandBidShare: 0.3,
  },
  orion: {
    id: 'orion',
    personality: 'balanced',
    reserveRounds: 2,
    cashReserve: 35,
    expansionBias: 0.5,
    harvesterBias: 0.55,
    productionWeights: {
      food: 1,
      energy: 1,
      ore: 0.8,
      crystals: 0.6,
    },
    crystalReserve: 1,
    oreReserveBuilds: 1,
    maximumLandBidShare: 0.28,
  },
  nova: {
    id: 'nova',
    personality: 'expansionist',
    reserveRounds: 2.5,
    cashReserve: 5,
    expansionBias: 1.1,
    harvesterBias: 1.2,
    productionWeights: {
      food: 1.3,
      energy: 1.25,
      ore: 1.0,
      crystals: 0.45,
    },
    crystalReserve: 0,
    oreReserveBuilds: 1.5,
    maximumLandBidShare: 0.6,
  },
  vega: {
    id: 'vega',
    personality: 'industrial',
    reserveRounds: 2.5,
    cashReserve: 45,
    expansionBias: 0.25,
    harvesterBias: 1.2,
    productionWeights: {
      food: 1.1,
      energy: 1.25,
      ore: 0.95,
      crystals: 0.7,
    },
    crystalReserve: 0,
    oreReserveBuilds: 2,
    maximumLandBidShare: 0.25,
  },
}

const productionResources: AgentProductionResource[] = [
  'food',
  'energy',
  'ore',
  'crystals',
]

const marketResources: AgentMarketResource[] = [
  'food',
  'energy',
  'ore',
  'crystals',
]

const INITIAL_EXPANSION_CASH_RESERVE = 20
const FRONTIER_EXPANSION_CASH_RESERVE = 10

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function getRoundDemand(context: AgentContext) {
  const configuredDemand =
    context.legalActions?.normalSupplyDemand

  if (
    Number.isFinite(configuredDemand) &&
    configuredDemand !== undefined
  ) {
    return Math.max(0, Math.trunc(configuredDemand))
  }

  const populationGroups = Math.ceil(
    context.colony.population / 10,
  )
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
    const oreCost =
      context.legalActions?.harvesterBuild?.oreCost ?? 0

    return Math.ceil(
      oreCost * (profile.oreReserveBuilds ?? 1),
    )
  }

  return profile.crystalReserve
}

export function createAgentEmergencyAssessment(
  context: AgentContext,
  profile: AgentProfile = agentProfiles[context.colony.id],
): AgentEmergencyAssessment {
  const demand = getRoundDemand(context)
  const immediateFoodNeed = demand
  const immediateEnergyNeed =
    demand + getHarvesterEnergyDemand(context)
  const targetFoodStock = Math.ceil(
    immediateFoodNeed * profile.reserveRounds,
  )
  const targetEnergyStock = Math.ceil(
    immediateEnergyNeed * profile.reserveRounds,
  )
  const foodShortage = Math.max(
    0,
    immediateFoodNeed - context.colony.resources.food,
  )
  const energyShortage = Math.max(
    0,
    immediateEnergyNeed - context.colony.resources.energy,
  )
  const isCritical =
    foodShortage > 0 || energyShortage > 0
  const isWarning =
    context.colony.resources.food < targetFoodStock ||
    context.colony.resources.energy < targetEnergyStock
  const level: AgentEmergencyLevel = isCritical
    ? 'critical'
    : isWarning
    ? 'warning'
    : 'normal'
  const emergencyCashReserve =
    level === 'critical'
      ? 0
      : level === 'warning'
      ? Math.floor(profile.cashReserve / 2)
      : profile.cashReserve

  return {
    level,
    foodShortage,
    energyShortage,
    suspendInvestments: level !== 'normal',
    emergencyCashReserve,
  }
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
  emergency: AgentEmergencyAssessment,
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

  const cashReserve =
    resource === 'food' || resource === 'energy'
      ? emergency.emergencyCashReserve
      : profile.cashReserve
  if (stock < target) {
    const affordableQuantity = Math.max(
      0,
      Math.floor(
        (context.colony.credits - cashReserve) /
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

  const sellThreshold =
    resource === 'crystals'
      ? target
      : target + Math.max(1, immediateNeed)
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
      const immediateNeed = getImmediateNeed(
        resource,
        demand,
        context,
      )
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
  emergency: AgentEmergencyAssessment,
): AgentHarvesterDecision {
  const isInitialExpansion =
    context.colony.harvesters === 2
  const isSupplyCritical =
    emergency.level === 'critical'

  if (
    isSupplyCritical ||
    (emergency.suspendInvestments &&
      !isInitialExpansion)
  ) {
    return { build: false, reason: 'unsafe-supply' }
  }

  const build = context.legalActions?.harvesterBuild
  if (!build) {
    return { build: false, reason: 'unavailable' }
  }

  const harvesterEnergyCost = Math.max(
    0,
    context.legalActions?.harvesterEnergyCost ?? 1,
  )
  const immediateFoodNeed = getRoundDemand(context)
  const immediateEnergyNeed =
    immediateFoodNeed +
    getHarvesterEnergyDemand(context) +
    harvesterEnergyCost
  const requiredFood = isInitialExpansion
    ? immediateFoodNeed
    : targetFoodReserve
  const requiredEnergy = isInitialExpansion
    ? immediateEnergyNeed
    : targetEnergyReserve +
      Math.ceil(
        profile.reserveRounds * harvesterEnergyCost,
      )

  if (
    context.colony.resources.food < requiredFood ||
    context.colony.resources.energy < requiredEnergy
  ) {
    return { build: false, reason: 'unsafe-supply' }
  }

  if (context.colony.resources.ore < build.oreCost) {
    return { build: false, reason: 'insufficient-ore' }
  }

  const requiredCredits = isInitialExpansion
    ? build.creditCost +
      INITIAL_EXPANSION_CASH_RESERVE
    : profile.cashReserve +
      Math.ceil(
        build.creditCost / profile.harvesterBias,
      )

  if (context.colony.credits < requiredCredits) {
    return { build: false, reason: 'insufficient-credits' }
  }

  return { build: true, reason: 'affordable' }
}

function scoreLandCandidate(
  candidate: AgentLandCandidate,
  profile: AgentProfile,
  prioritizeFrontier: boolean,
) {
  const productionScore =
    candidate.food * profile.productionWeights.food +
    candidate.energy * profile.productionWeights.energy +
    candidate.ore * profile.productionWeights.ore
  const frontierScore = prioritizeFrontier
    ? Math.max(
        0,
        (candidate.distanceFromHq ?? 0) - 2,
      ) *
      3
    : 0

  return (
    productionScore +
    (candidate.adjacencyBonus ?? 0) * profile.expansionBias +
    frontierScore
  )
}

function decideLandBid(
  context: AgentContext,
  profile: AgentProfile,
  emergency: AgentEmergencyAssessment,
): AgentLandDecision | null {
  const canUseInitialExpansionWindow =
    context.legalActions?.hasIdleHarvester === true
  const canExpandFrontier =
    context.legalActions?.canExpandFrontier === true
  const canUseInfrastructureWindow =
    canUseInitialExpansionWindow || canExpandFrontier

  if (
    (emergency.level === 'critical' &&
      !canUseInitialExpansionWindow) ||
    (emergency.suspendInvestments &&
      !canUseInfrastructureWindow)
  ) {
    return null
  }

  const candidates = context.legalActions?.landCandidates ?? []
  const cashReserve = canUseInitialExpansionWindow
    ? INITIAL_EXPANSION_CASH_RESERVE
    : canExpandFrontier
    ? FRONTIER_EXPANSION_CASH_RESERVE
    : profile.cashReserve
  const availableCredits = Math.max(
    0,
    context.colony.credits - cashReserve,
  )
  const initialExpansionBidLimit =
    candidates.length > 0
      ? Math.min(
          ...candidates.map(
            (candidate) => candidate.minimumBid,
          ),
        )
      : 0
  const absoluteBidLimit = Math.floor(
    canUseInfrastructureWindow
      ? initialExpansionBidLimit
      : context.colony.credits *
          profile.maximumLandBidShare,
  )
  const bidLimit = Math.min(availableCredits, absoluteBidLimit)

  return (
    candidates
      .filter((candidate) => candidate.minimumBid <= bidLimit)
      .map((candidate) => {
        const score = scoreLandCandidate(
          candidate,
          profile,
          canUseInfrastructureWindow,
        )
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
  const demand = getRoundDemand(context)
  const emergency = createAgentEmergencyAssessment(context, profile)
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
    emergency,
    productionPriorities: createProductionPriorities(
      context,
      profile,
      demand,
    ),
    marketIntents: marketResources.map((resource) =>
      createMarketIntent(resource, context, profile, demand, emergency),
    ),
    harvester: decideHarvesterBuild(
      context,
      profile,
      targetFoodReserve,
      targetEnergyReserve,
      emergency,
    ),
    landBid: decideLandBid(context, profile, emergency),
    targetCashReserve: emergency.emergencyCashReserve,
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
