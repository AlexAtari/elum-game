import {
  getGlobalEventAmount,
  type GlobalEventId,
  type RoundReport,
} from '../game'
import { useI18n } from '../i18n/I18nContext'
import { getPlanetTileName } from '../planetMap'
import './RoundBriefingPanel.css'

const globalEventTranslationKeys: Record<
  GlobalEventId,
  {
    title: Parameters<ReturnType<typeof useI18n>['t']>[0]
    description: Parameters<ReturnType<typeof useI18n>['t']>[0]
  }
> = {
  'fertile-season': {
    title: 'event.global.fertileSeason.title',
    description: 'event.global.fertileSeason.description',
  },
  'clear-skies': {
    title: 'event.global.clearSkies.title',
    description: 'event.global.clearSkies.description',
  },
  'rich-ore-vein': {
    title: 'event.global.richOreVein.title',
    description: 'event.global.richOreVein.description',
  },
  'crystal-rain': {
    title: 'event.global.crystalRain.title',
    description: 'event.global.crystalRain.description',
  },
  'colonial-grant': {
    title: 'event.global.colonialGrant.title',
    description: 'event.global.colonialGrant.description',
  },
  'technological-breakthrough': {
    title: 'event.global.technologicalBreakthrough.title',
    description:
      'event.global.technologicalBreakthrough.description',
  },
  drought: {
    title: 'event.global.drought.title',
    description: 'event.global.drought.description',
  },
  'solar-storm': {
    title: 'event.global.solarStorm.title',
    description: 'event.global.solarStorm.description',
  },
  'unstable-mines': {
    title: 'event.global.unstableMines.title',
    description: 'event.global.unstableMines.description',
  },
  'crystal-disruption': {
    title: 'event.global.crystalDisruption.title',
    description: 'event.global.crystalDisruption.description',
  },
  'trade-blockade': {
    title: 'event.global.tradeBlockade.title',
    description: 'event.global.tradeBlockade.description',
  },
  'surveying-stop': {
    title: 'event.global.surveyingStop.title',
    description: 'event.global.surveyingStop.description',
  },
  'supply-chain-disruption': {
    title: 'event.global.supplyChainDisruption.title',
    description:
      'event.global.supplyChainDisruption.description',
  },
  'ion-fog': {
    title: 'event.global.ionFog.title',
    description: 'event.global.ionFog.description',
  },
  'planetary-quake': {
    title: 'event.global.planetaryQuake.title',
    description: 'event.global.planetaryQuake.description',
  },
}

type RoundBriefingPanelProps = {
  round: number
  population: number
  report: RoundReport
  globalEvent: GlobalEventId | null
  onContinue: () => void
}

function RoundBriefingPanel({
  round,
  population,
  report,
  globalEvent,
  onContinue,
}: RoundBriefingPanelProps) {
  const { t } = useI18n()
  const previousPopulation = population - report.populationChange
  const globalEventKeys = globalEvent
    ? globalEventTranslationKeys[globalEvent]
    : null
  const globalEventAmount = globalEvent
    ? getGlobalEventAmount(globalEvent, round) ?? ''
    : ''

  return (
    <section className="round-briefing-panel">
      <div className="round-briefing-heading">
        <div>
          <p className="eyebrow">
            {t('briefing.eyebrow', { round })}
          </p>
          <h2>{t('briefing.title')}</h2>
        </div>

      </div>

      <div className="round-briefing-layout">
        <article className="round-briefing-event">
          <p className="eyebrow">{t('briefing.globalEvent')}</p>
          <span className="round-briefing-event-icon">
            {globalEvent ? '🪐' : '✨'}
          </span>
          <h3>
            {globalEventKeys
              ? t(globalEventKeys.title)
              : t('briefing.quietTitle')}
          </h3>
          <p>
            {globalEventKeys
              ? t(globalEventKeys.description, {
                  amount: globalEventAmount,
                })
              : t('briefing.quietDescription')}
          </p>
        </article>

        <article className="round-briefing-colony">
          <p className="eyebrow">
            {t('briefing.colonyReport', {
              round: report.roundPlayed,
            })}
          </p>
          <h3>{t('briefing.colonyTitle')}</h3>

          <div className="round-briefing-grid">
            <div>
              <span>{t('briefing.production')}</span>
              <strong>
                🌾 {report.produced.food} · ⚡{' '}
                {report.produced.energy} · ⛏ {report.produced.ore} ·
                💎 {report.produced.crystals}
              </strong>
            </div>

            <div>
              <span>{t('resource.population')}</span>
              <strong>
                {previousPopulation} → {population}{' '}
                <small>
                  ({report.populationChange > 0 ? '+' : ''}
                  {report.populationChange})
                </small>
              </strong>
            </div>

            <div>
              <span>{t('briefing.land')}</span>
              <strong>
                {report.landAuction?.outcome === 'won'
                  ? t('briefing.landWon', {
                      tile: getPlanetTileName(
                        report.landAuction.tileId,
                      ),
                    })
                  : report.landAuction?.outcome === 'lost'
                    ? t('briefing.landLost', {
                        tile: getPlanetTileName(
                          report.landAuction.tileId,
                        ),
                      })
                    : t('briefing.landUnchanged')}
              </strong>
            </div>

            <div>
              <span>{t('briefing.harvesters')}</span>
              <strong>
                {report.completedHarvesters > 0
                  ? t('briefing.harvestersCompleted', {
                      amount: report.completedHarvesters,
                    })
                  : t('briefing.harvestersNone')}
              </strong>
            </div>
          </div>

          {(report.inactiveHarvesterIds.length > 0 ||
            report.pausedRetoolingIds.length > 0) && (
            <div className="round-briefing-warning">
              <strong>{t('briefing.attention')}</strong>
              {report.inactiveHarvesterIds.length > 0 && (
                <span>
                  {t('briefing.inactiveHarvesters', {
                    ids: report.inactiveHarvesterIds.join(', '),
                  })}
                </span>
              )}
              {report.pausedRetoolingIds.length > 0 && (
                <span>
                  {t('briefing.pausedRetooling', {
                    ids: report.pausedRetoolingIds.join(', '),
                  })}
                </span>
              )}
            </div>
          )}
        </article>

        {report.completedExplorations.length > 0 && (
          <article className="round-briefing-exploration">
            <p className="eyebrow">Explorationsbericht</p>
            <h3>Kristallsuche abgeschlossen</h3>
            <div className="exploration-results">
              {report.completedExplorations.map(
                ({ tileId, crystalRating }) => (
                  <div
                    className="exploration-result"
                    key={tileId}
                  >
                    <span>💎 {getPlanetTileName(tileId)}</span>
                    <strong>
                      {crystalRating > 0
                        ? `${'★'.repeat(crystalRating)}${'☆'.repeat(
                            5 - crystalRating,
                          )}`
                        : 'Kein Vorkommen'}
                    </strong>
                  </div>
                ),
              )}
            </div>
            <p>
              Das Ergebnis ist ab jetzt auf dem Grundstück
              sichtbar. Bei einem Vorkommen kann dort ein Harvester
              auf Kristallproduktion umgerüstet werden.
            </p>
          </article>
        )}
      </div>

      <button
        className="round-briefing-button"
        type="button"
        onClick={onContinue}
      >
        {t('briefing.continue')}
      </button>
    </section>
  )
}

export default RoundBriefingPanel
