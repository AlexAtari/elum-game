import {
  marketResourceTypes,
  playableMarketResources,
  type MarketResource,
} from '../game'
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
          ? 'Ein Ereignis verhindert in dieser Runde das Starten von Ressourcenauktionen.'
          : 'Starte bei Bedarf eine Auktion. Alle Spieler erhalten zehn Sekunden, um sich als Käufer, Verkäufer oder Zuschauer einzuordnen. Jede Ressource kann pro Runde genau einmal aufgerufen werden.'}
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
