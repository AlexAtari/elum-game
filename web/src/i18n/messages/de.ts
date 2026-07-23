export const de = {
  'app.colonyName': 'Kolonie Agima',
  'app.status': 'Status',
  'app.round': 'Runde {{round}}',
  'app.marketRound': 'Markt · Runde {{round}}',
  'app.tieAuctionRound': 'Stichauktion · Runde {{round}}',
  'app.leaderboardRound': 'Zwischenstand · Runde {{round}}',
  'app.backToStart': 'Zurück zum Start',

  'resource.population': 'Bevölkerung',
  'resource.credits': 'Credits',
  'resource.food': 'Nahrung',
  'resource.energy': 'Energie',
  'resource.ore': 'Erz',
  'resource.crystals': 'Kristalle',

  'supply.none': 'Keine Versorgung',
  'supply.minimum': 'Mindestversorgung',
  'supply.normal': 'Normalversorgung',
  'supply.extra': 'Überversorgung',
  'supply.plan': 'Versorgung planen',
  'supply.foodForPopulation': 'Nahrung für Bevölkerung:',
  'supply.energyForPopulation': 'Energie für Bevölkerung:',
  'supply.previewRound': 'Vorschau Runde {{round}}',
  'supply.supply': 'Versorgung',
  'supply.harvesterEnergy': 'Harvesterenergie',
  'supply.production': 'Produktion',
  'supply.stockAfterRound': 'Danach im Vorrat',
  'supply.expectedPopulation': 'Erwartete Bevölkerung',
  'supply.previewNote':
    'Vorschau vor der Rundenabrechnung. Bereits abgeschlossene Marktgeschäfte sind enthalten.',
  'supply.shortage':
    '⚠️ Die Vorräte reichen nicht für die gewählte Versorgung.',
  'supply.inactiveHarvesters':
    '⚠️ Wegen Energiemangels würden deaktiviert: {{ids}}',
  'supply.pausedRetooling':
    '⚠️ Einrichtung/Umrüstung würde pausieren: {{ids}}',

  'round.execute': 'Runde ausführen',
  'round.executeHint':
    'Die Runde wird jetzt ohne automatische Marktphase abgerechnet. Starte gewünschte Auktionen vorher. Gewählt: {{food}} Nahrung und {{energy}} Energie je zehn Einwohner.',
  'round.calculation': 'Abrechnung Runde {{round}}',
  'round.result': 'Rundenergebnis',
  'round.population': 'Bevölkerung',
  'round.inactiveHarvesters':
    'Wegen Energiemangels deaktiviert: {{ids}}',
  'round.completedRetooling':
    'Einrichtung/Umrüstung abgeschlossen: {{ids}}',
  'round.pausedRetooling':
    'Einrichtung/Umrüstung wegen Energiemangels pausiert: {{ids}}',
  'round.landWon':
    'Auktion gewonnen: Feld {{tile}} für {{playerBid}} Credits. Orion bot {{rivalBid}} Credits.',
  'round.landLost':
    'Orion erhält Feld {{tile}} für {{rivalBid}} Credits. Dein Gebot von {{playerBid}} Credits wurde erstattet.',
  'round.completedHarvesters':
    'Neue Harvester fertiggestellt: {{amount}}',

  'market.backToPlanning': 'Zurück zur Planung',

  'start.tagline': 'Exploration · Logistics · Utilization · Mining',
  'start.subtitle':
    'Errichte auf Agima die erfolgreichste Kolonie.',
  'start.newColony': 'Neue Kolonie',
  'start.version': 'Prototype 0.2',
} as const

export type TranslationKey = keyof typeof de
