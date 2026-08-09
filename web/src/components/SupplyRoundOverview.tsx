import type { Resources, RoundReport } from '../game'
import { useI18n } from '../i18n/I18nContext'
import './SupplyRoundOverview.css'

type SupplyRoundOverviewProps = {
  round: number
  currentResources: Resources
  nextResources: Resources
  report: RoundReport
  populationBefore: number
  populationAfter: number
  totalHarvesters: number
  assignedHarvesters: number
  supplyShortage: boolean
  harvesterEnergyShortage: boolean
}

function ResourceValues({ resources }: { resources: Resources }) {
  const { number } = useI18n()

  return (
    <strong className="supply-resource-values">
      <span>🌾 {number(resources.food)}</span>
      <span>⚡ {number(resources.energy)}</span>
      <span>⛏ {number(resources.ore)}</span>
      <span>💎 {number(resources.crystals)}</span>
    </strong>
  )
}

function SupplyRoundOverview({
  round,
  currentResources,
  nextResources,
  report,
  populationBefore,
  populationAfter,
  totalHarvesters,
  assignedHarvesters,
  supplyShortage,
  harvesterEnergyShortage,
}: SupplyRoundOverviewProps) {
  const { number, t } = useI18n()
  const energyConsumption =
    report.consumedEnergyByHq +
    report.consumedEnergyByHarvesters
  const totalConsumption =
    report.consumedFood + energyConsumption
  const activeHarvesters = report.consumedEnergyByHarvesters
  const pausedHarvesters = Math.max(
    0,
    assignedHarvesters - activeHarvesters,
  )

  return (
    <div className="supply-round-overview">
      <p className="eyebrow">
        {t('supply.previewRound', { round })}
      </p>

      <div className="supply-flow-grid">
        <article>
          <span>{t('supply.stockBeforeRound')}</span>
          <ResourceValues resources={currentResources} />
        </article>
        <article className="is-consumption">
          <span>{t('supply.roundConsumption')}</span>
          <strong className="supply-resource-values">
            <span>🌾 −{number(report.consumedFood)}</span>
            <span>⚡ −{number(energyConsumption)}</span>
            <span>Σ −{number(totalConsumption)}</span>
          </strong>
        </article>
        <article className="is-production">
          <span>{t('supply.production')}</span>
          <ResourceValues resources={report.produced} />
        </article>
        <article>
          <span>{t('supply.stockAfterRound')}</span>
          <ResourceValues resources={nextResources} />
        </article>
      </div>

      <div className="supply-operation-grid">
        <div>
          <span>{t('supply.expectedPopulation')}</span>
          <strong>
            {number(populationBefore)} → {number(populationAfter)}
          </strong>
        </div>
        <div>
          <span>{t('supply.harvesterOverview')}</span>
          <strong>
            {t('supply.harvesterCounts', {
              active: activeHarvesters,
              paused: pausedHarvesters,
              total: totalHarvesters,
            })}
          </strong>
        </div>
      </div>

      {(supplyShortage || harvesterEnergyShortage) && (
        <div className="supply-alerts" role="alert">
          {supplyShortage && <p>{t('supply.shortage')}</p>}
          {harvesterEnergyShortage && (
            <p>{t('supply.harvesterEnergyShortage')}</p>
          )}
        </div>
      )}

      {report.pausedRetoolingIds.length > 0 && (
        <p className="supply-warning">
          {t('supply.pausedRetooling', {
            ids: report.pausedRetoolingIds.join(', '),
          })}
        </p>
      )}

      <p className="supply-preview-note">
        {t('supply.previewNote')}
      </p>
    </div>
  )
}

export default SupplyRoundOverview
