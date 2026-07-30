import type { TranslationKey } from './de'

export const en = {
  'app.colonyName': 'Agima Colony',
  'app.status': 'Status',
  'app.round': 'Round {{round}}',
  'app.marketRound': 'Market · Round {{round}}',
  'app.tieAuctionRound': 'Land auction · Round {{round}}',
  'app.leaderboardRound': 'Standings · Round {{round}}',
  'app.finalResult': 'Final standings',
  'app.briefingRound': 'Round start · Round {{round}}',
  'app.backToStart': 'Back to start',
  'app.supplyShipCountdown':
    '🚀 {{rounds}} rounds until the supply ship',
  'app.supplyShipCountdownOne':
    '🚀 1 round until the supply ship',
  'app.supplyShipArrived': '🚀 Supply ship arrived',

  'resource.population': 'Population',
  'resource.credits': 'Credits',
  'resource.food': 'Food',
  'resource.energy': 'Energy',
  'resource.ore': 'Ore',
  'resource.crystals': 'Crystals',
  'meteor.impactTitle': 'Meteor impact on tile {{tileId}}',
  'meteor.impactDescription':
    'The crater is visible to everyone. Its exact crystal upgrade remains hidden.',

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
    '⚠️ Without production this round: {{ids}}',
  'supply.pausedRetooling':
    '⚠️ Installation/retooling would pause: {{ids}}',

  'round.execute': 'Run round',
  'round.executeHint':
    'The round is settled without an automatic market phase. Start any auctions you need first. Selected: {{food}} food and {{energy}} energy per ten inhabitants.',
  'round.calculation': 'Round {{round}} settlement',
  'round.result': 'Round result',
  'round.population': 'Population',
  'round.inactiveHarvesters':
    'Without production this round: {{ids}}',
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

  'leaderboard.interimEyebrow':
    'Standings after round {{round}}',
  'leaderboard.finalEyebrow':
    'Final standings after round {{round}}',
  'leaderboard.title': 'Colony standings',
  'leaderboard.finalTitle': 'Final colony standings',
  'leaderboard.criteria':
    'Population ranks first. Ties are decided by wealth, other resources and harvesters.',
  'leaderboard.rank': 'Rank',
  'leaderboard.colony': 'Colony',
  'leaderboard.resources': 'Resources',
  'leaderboard.harvesters': 'Harvesters',
  'leaderboard.wealth': 'Wealth',
  'leaderboard.firstPlace': 'First place',
  'leaderboard.you': 'You',
  'leaderboard.aiNote':
    'AI colonies maintain their own stocks and develop with every round settlement.',
  'leaderboard.revealing': 'Revealing standings',
  'leaderboard.nextRound':
    'Round {{round}} starts automatically',
  'leaderboard.progressLabel': 'Time until the next round',
  'leaderboard.winner': 'Winning colony',
  'leaderboard.winnerSummary':
    '{{population}} population · {{wealth}} wealth · {{resources}} other resources · {{harvesters}} harvesters',
  'leaderboard.playerResult':
    'Your colony finishes in place {{rank}} of {{total}}.',
  'leaderboard.newGame': 'New game',
  'leaderboard.supplyShipTitle':
    'The supply ship has arrived',
  'leaderboard.supplyShipDescription':
    'Supplies, spare parts and new personnel reach Agima. Your replacement takes command of the colony.',

  'briefing.eyebrow': 'Start of round {{round}}',
  'briefing.title': 'Events & your colony',
  'briefing.globalEvent': 'Global conditions',
  'briefing.quietTitle': 'Calm conditions',
  'briefing.quietDescription':
    'No unusual planetary changes have been reported on Agima.',
  'briefing.colonyReport': 'Your colony · Round {{round}}',
  'briefing.colonyTitle': 'What happened last round',
  'briefing.production': 'Produced',
  'briefing.land': 'Plots',
  'briefing.landWon': 'Plot {{tile}} won',
  'briefing.landLost': 'Plot {{tile}} lost',
  'briefing.landUnchanged': 'No change',
  'briefing.harvesters': 'Harvesters',
  'briefing.harvestersCompleted': '{{amount}} newly operational',
  'briefing.harvestersNone': 'No new harvester',
  'briefing.attention': 'Attention',
  'briefing.inactiveHarvesters':
    'Without production: {{ids}}',
  'briefing.pausedRetooling':
    'Retooling paused: {{ids}}',
  'briefing.continue': 'Start round now',
  'briefing.explorationReport': 'Exploration report',
  'briefing.explorationComplete': 'Crystal survey completed',
  'briefing.showOnMap': 'Show on map',
  'briefing.showOnMapLabel': 'Show {{tile}} on the map',
  'briefing.noCrystalDeposit': 'No deposit',
  'briefing.explorationHint':
    'The result is now visible on the plot. If a deposit was found, a harvester can be retooled there for crystal production.',

  'event.global.fertileSeason.title': 'Fertile season',
  'event.global.fertileSeason.description':
    'Every active food harvester produces {{amount}} additional food this round.',
  'event.global.clearSkies.title': 'Clear skies',
  'event.global.clearSkies.description':
    'Every active energy harvester produces {{amount}} additional energy this round.',
  'event.global.richOreVein.title': 'Rich ore veins',
  'event.global.richOreVein.description':
    'Every active ore harvester produces {{amount}} additional ore this round.',
  'event.global.crystalRain.title': 'Crystal rain',
  'event.global.crystalRain.description':
    'Every colony receives {{amount}} crystals.',
  'event.global.colonialGrant.title': 'Colonial grant fund',
  'event.global.colonialGrant.description':
    'Every colony receives {{amount}} credits.',
  'event.global.technologicalBreakthrough.title':
    'Technological breakthrough',
  'event.global.technologicalBreakthrough.description':
    'Building a harvester costs {{amount}} fewer credits this round.',
  'event.global.drought.title': 'Drought',
  'event.global.drought.description':
    'Every active food harvester produces {{amount}} less food this round.',
  'event.global.solarStorm.title': 'Solar storm',
  'event.global.solarStorm.description':
    'Every active energy harvester produces {{amount}} less energy this round.',
  'event.global.unstableMines.title': 'Unstable mines',
  'event.global.unstableMines.description':
    'Every active ore harvester produces {{amount}} less ore this round.',
  'event.global.crystalDisruption.title': 'Crystal disruption',
  'event.global.crystalDisruption.description':
    'Every colony loses up to {{amount}} crystals.',
  'event.global.tradeBlockade.title': 'Trade blockade',
  'event.global.tradeBlockade.description':
    'No resource auctions can be initiated this round.',
  'event.global.surveyingStop.title': 'Surveying stop',
  'event.global.surveyingStop.description':
    'No land bids can be submitted this round.',
  'event.global.supplyChainDisruption.title':
    'Supply-chain disruption',
  'event.global.supplyChainDisruption.description':
    'No new harvesters can be ordered this round.',
  'event.global.ionFog.title': 'Ion fog',
  'event.global.ionFog.description':
    'Harvesters cannot be retooled or relocated this round.',
  'event.global.planetaryQuake.title': 'Planetary quake',
  'event.global.planetaryQuake.description':
    'Up to {{amount}} harvesters fail in every colony this round.',

  'event.local.eyebrow': 'Local event',
  'event.local.dismiss': 'Dismiss event',
  'event.local.foodCache.title': 'Forgotten supply cache',
  'event.local.foodCache.description':
    'Exploration teams discover preserved food in an abandoned outpost.',
  'event.local.foodCache.effect': '+{{amount}} food',
  'event.local.energyCache.title': 'Charged energy cells',
  'event.local.energyCache.description':
    'Technicians recover several energy cells that are still functional.',
  'event.local.energyCache.effect': '+{{amount}} energy',
  'event.local.oreCache.title': 'Ore discovery',
  'event.local.oreCache.description':
    'Construction work uncovers a small stockpile of previously mined ore.',
  'event.local.oreCache.effect': '+{{amount}} ore',
  'event.local.crystalFragment.title': 'Crystal fragment',
  'event.local.crystalFragment.description':
    'A prospecting team recovers a valuable crystal deposit.',
  'event.local.crystalFragment.effect': '+{{amount}} crystals',
  'event.local.creditGrant.title': 'Colony grant',
  'event.local.creditGrant.description':
    'The planetary development office approves a short-term grant.',
  'event.local.creditGrant.effect': '+{{amount}} credits',
  'event.local.newSettlers.title': 'New settlers',
  'event.local.newSettlers.description':
    'A small transport brings volunteer settlers to Agima.',
  'event.local.newSettlers.effect':
    '+{{amount}} population',
  'event.local.spoiledFood.title': 'Spoiled supplies',
  'event.local.spoiledFood.description':
    'A faulty cooling module ruins part of the food stock.',
  'event.local.spoiledFood.effect': '−{{amount}} food',
  'event.local.energyLeak.title': 'Energy grid leak',
  'event.local.energyLeak.description':
    'A damaged conduit drains part of the stored energy.',
  'event.local.energyLeak.effect': '−{{amount}} energy',
  'event.local.oreTheft.title': 'Ore theft',
  'event.local.oreTheft.description':
    'Unknown thieves steal part of the ore stock.',
  'event.local.oreTheft.effect': '−{{amount}} ore',
  'event.local.creditFraud.title': 'Accounting fraud',
  'event.local.creditFraud.description':
    'A manipulated invoice drains the colony treasury.',
  'event.local.creditFraud.effect': '−{{amount}} credits',
  'event.local.harvesterBreakdown.title': 'Harvester breakdown',
  'event.local.harvesterBreakdown.description':
    'A technical fault disables part of the harvester fleet for this round.',
  'event.local.harvesterBreakdown.effect':
    'Up to {{amount}} harvesters fail',
  'event.local.laborStrike.title': 'Labor strike',
  'event.local.laborStrike.description':
    'The assembly crew accepts no new construction orders this round.',
  'event.local.laborStrike.effect': 'Harvester construction blocked',
  'event.local.communicationsOutage.title':
    'Communications outage',
  'event.local.communicationsOutage.description':
    'Headquarters temporarily loses its market connection.',
  'event.local.communicationsOutage.effect':
    'Resource auctions blocked',
  'event.local.landRegistryError.title': 'Land registry error',
  'event.local.landRegistryError.description':
    'A data error prevents legally valid land bids.',
  'event.local.landRegistryError.effect': 'Land bids blocked',
  'event.local.wrongSpareParts.title': 'Wrong spare parts',
  'event.local.wrongSpareParts.description':
    'The delivered batch does not fit the retooling modules.',
  'event.local.wrongSpareParts.effect':
    'Harvester retooling blocked',

  'market.backToPlanning': 'Back to planning',

  'start.tagline': 'Exploration · Logistics · Utilization · Mining',
  'start.subtitle': 'Build the most successful colony on Agima.',
  'start.newColony': 'New colony',
  'start.multiplayer': 'Multiplayer',
  'start.version': 'Prototype 0.2',

  'multiplayer.eyebrow': 'Joint expedition',
  'multiplayer.title': 'Multiplayer lobby',
  'multiplayer.description':
    'Up to four colonies connect to the same authoritative match. AI takes over open seats when the match starts.',
  'multiplayer.status.idle': 'Not connected',
  'multiplayer.status.connecting': 'Connecting …',
  'multiplayer.status.connected': 'Connected',
  'multiplayer.status.disconnected': 'Disconnected',
  'multiplayer.name': 'Your name',
  'multiplayer.namePlaceholder': 'Colony commander',
  'multiplayer.server': 'Server',
  'multiplayer.lobby': 'Lobby',
  'multiplayer.connect': 'Join lobby',
  'multiplayer.reconnect': 'Reconnect',
  'multiplayer.localServerHint':
    'The multiplayer server must be running for local tests. Smartphones use the computer’s Wi-Fi address.',
  'multiplayer.yourColony': 'Your colony',
  'multiplayer.seatOpen': 'Open seat',
  'multiplayer.seatAi': 'AI colony',
  'multiplayer.computer': 'Computer',
  'multiplayer.seatDisconnected': 'Disconnected',
  'multiplayer.seatReady': 'Ready',
  'multiplayer.seatPlanning': 'Not ready yet',
  'multiplayer.host': 'Host',
  'multiplayer.ready': 'I am ready',
  'multiplayer.notReady': 'Withdraw readiness',
  'multiplayer.startMatch': 'Start match',
  'multiplayer.waitForHost':
    'The host starts once everyone is ready.',
  'multiplayer.matchStarted': 'The expedition has started',
  'multiplayer.matchStartedHint':
    'The shared server state is ready in round {{round}}. The game view will be connected to these snapshots next.',
  'multiplayer.back': 'Back to start',
  'multiplayer.errorConnectionData':
    'Please check name, server and lobby.',
  'multiplayer.errorConnection':
    'The multiplayer server cannot be reached.',
  'multiplayer.errorInvalidResponse':
    'The server sent an unreadable response.',
  'multiplayer.errorLobbyFull': 'This lobby is already full.',
  'multiplayer.errorAlreadyStarted':
    'This match has already started.',
  'multiplayer.errorPlayersNotReady':
    'Not all connected players are ready yet.',
  'multiplayer.errorNotHost':
    'Only the host can perform this action.',
  'multiplayer.errorMatchNotFinished':
    'The current match has not finished yet.',
  'multiplayer.errorMatchFinished':
    'The match is over. The host can prepare a new one.',
  'multiplayer.errorUnknownSession':
    'The stored session is no longer valid.',
  'multiplayer.errorRequest':
    'The server rejected this action.',

  'multiplayerGame.connectedAs':
    'Connected as {{colony}}',
  'multiplayerGame.readyWaiting':
    'Ready · Waiting for other colonies',
  'multiplayerGame.serverStateHint':
    'Every change is confirmed by the shared server.',
  'multiplayerGame.toHeadquarters': 'Go to headquarters',
  'multiplayerGame.toColony': 'Back to colony overview',
  'multiplayerGame.networkPlanning': 'Network planning',
  'multiplayerGame.headquarters': 'Headquarters',
  'multiplayerGame.headquartersHint':
    'Plan supplies, markets and construction orders for your own colony.',
  'multiplayerGame.headquartersImageAlt':
    'Shared central dome with four colony headquarters',
  'multiplayerGame.resourceMarkets': 'Resource markets',
  'multiplayerGame.finishPlanning': 'Finish planning',
  'multiplayerGame.place': 'Place',
  'multiplayerGame.toRoundBriefing':
    'Continue to events and colony report',
  'multiplayerGame.prepareNewMatch': 'Prepare new match',
  'multiplayerGame.waitForHostRestart':
    'The host can return everyone to the lobby.',
  'multiplayerGame.leave': 'Leave connection',
  'multiplayerGame.landAuction': 'Land auction',
  'multiplayerGame.resourceMarket': 'Resource market',
  'multiplayerGame.serverControlled': 'Server controlled',
  'multiplayerGame.auctionPhase': 'Phase: {{phase}}',
  'multiplayerGame.phase.announcement': 'Announcement',
  'multiplayerGame.phase.declaration': 'Declaration',
  'multiplayerGame.phase.auction': 'Auction',
  'multiplayerGame.phase.finished': 'Finished',
  'multiplayerGame.yourBid': 'Your current bid',
  'multiplayerGame.waitForServer':
    'The server advances the phase automatically.',
  'multiplayerGame.waitForInitiator':
    'The initiator closes the market.',
  'multiplayerGame.marketReference':
    'Reference price: {{price}} credits',
  'multiplayerGame.role.neutral': 'Pass',
  'multiplayerGame.role.buyer': 'Buy',
  'multiplayerGame.role.seller': 'Sell',
  'multiplayerGame.limitPrice': 'Personal limit',
  'multiplayerGame.activateOffer': 'Activate offer',
  'multiplayerGame.updateOffer': 'Update offer',
  'multiplayerGame.buyWarehouse':
    'Buy 1 unit from warehouse · {{price}} credits',
  'multiplayerGame.sellWarehouse':
    'Sell 1 unit to warehouse · {{price}} credits',
  'multiplayerGame.closeMarket': 'Close market',
} satisfies Record<TranslationKey, string>
