import {
  marketResourceTypes,
  playableMarketResources,
  type MarketResource,
} from '../game'
import { useI18n } from '../i18n/I18nContext'
import './MarketLauncher.css'

type MarketLauncherProps = {
  initiatedResources: MarketResource[]
  isBlocked: boolean
  onInitiate: (resource: MarketResource) => void
}

function MarketLauncher({
  initiatedResources,
  isBlocked,
  onInitiate,
}: MarketLauncherProps) {
  const { t } = useI18n()

  return (
    <section className="market-launcher">
      <div className="market-launcher-heading">
        <div>
          <p className="eyebrow">Freiwilliger Handel</p>
          <h2>Ressourcenauktionen</h2>
        </div>

        <strong>
          {initiatedResources.length}/
          {playableMarketResources.length} genutzt
        </strong>
      </div>

      <p className="market-launcher-copy">
        {isBlocked
          ? t('market.launcherBlocked')
          : t('market.launcherHint')}
      </p>

      <div className="market-launcher-grid">
        {playableMarketResources.map((resource) => {
          const resourceType = marketResourceTypes[resource]
          const wasInitiated =
            initiatedResources.includes(resource)

          return (
            <button
              key={resource}
              className={wasInitiated ? 'used' : ''}
              type="button"
              disabled={wasInitiated || isBlocked}
              onClick={() => onInitiate(resource)}
            >
              <span>
                {resourceType.icon} {resourceType.label}
              </span>
              <small>
                {wasInitiated
                  ? 'In dieser Runde durchgeführt'
                  : isBlocked
                    ? 'Durch Ereignis gesperrt'
                  : 'Auktion initiieren'}
              </small>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default MarketLauncher
