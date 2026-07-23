import type { TranslationKey } from './de'

export const en = {
  'app.colonyName': 'Agima Colony',
  'app.status': 'Status',
  'app.round': 'Round {{round}}',
  'app.marketRound': 'Market · Round {{round}}',
  'app.tieAuctionRound': 'Tie auction · Round {{round}}',
  'app.leaderboardRound': 'Standings · Round {{round}}',
  'app.backToStart': 'Back to start',

  'resource.population': 'Population',
  'resource.credits': 'Credits',
  'resource.food': 'Food',
  'resource.energy': 'Energy',
  'resource.ore': 'Ore',
  'resource.crystals': 'Crystals',

  'supply.none': 'No supply',
  'supply.minimum': 'Minimum supply',
  'supply.normal': 'Normal supply',
  'supply.extra': 'Extra supply',
  'supply.plan': 'Plan supplies',
  'supply.foodForPopulation': 'Food for population:',
  'supply.energyForPopulation': 'Energy for population:',
  'supply.previewRound': 'Round {{round}} preview',
  'supply.supply': 'Supply',
  'supply.harvesterEnergy': 'Harvester energy',
  'supply.production': 'Production',
  'supply.stockAfterRound': 'Stock after round',
  'supply.expectedPopulation': 'Expected population',
  'supply.previewNote':
    'Preview before round settlement. Completed market trades are included.',
  'supply.shortage':
    '⚠️ Your stock is insufficient for the selected supply.',
  'supply.inactiveHarvesters':
    '⚠️ Disabled due to insufficient energy: {{ids}}',
  'supply.pausedRetooling':
    '⚠️ Installation/retooling would pause: {{ids}}',

  'round.execute': 'Run round',
  'round.executeHint':
    'The round is settled without an automatic market phase. Start any auctions you need first. Selected: {{food}} food and {{energy}} energy per ten inhabitants.',
  'round.calculation': 'Round {{round}} settlement',
  'round.result': 'Round result',
  'round.population': 'Population',
  'round.inactiveHarvesters':
    'Disabled due to insufficient energy: {{ids}}',
  'round.completedRetooling':
    'Installation/retooling completed: {{ids}}',
  'round.pausedRetooling':
    'Installation/retooling paused due to insufficient energy: {{ids}}',
  'round.landWon':
    'Auction won: plot {{tile}} for {{playerBid}} credits. Orion bid {{rivalBid}} credits.',
  'round.landLost':
    'Orion receives plot {{tile}} for {{rivalBid}} credits. Your bid of {{playerBid}} credits was refunded.',
  'round.completedHarvesters':
    'New harvesters completed: {{amount}}',

  'market.backToPlanning': 'Back to planning',

  'start.tagline': 'Exploration · Logistics · Utilization · Mining',
  'start.subtitle': 'Build the most successful colony on Agima.',
  'start.newColony': 'New colony',
  'start.version': 'Prototype 0.2',
} satisfies Record<TranslationKey, string>
