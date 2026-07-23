import { useEffect } from 'react'
import {
  getLocalEventAmount,
  type LocalEventId,
} from '../game'
import { useI18n } from '../i18n/I18nContext'
import './LocalEventNotice.css'

const localEventTranslationKeys: Record<
  LocalEventId,
  {
    title: Parameters<ReturnType<typeof useI18n>['t']>[0]
    description: Parameters<ReturnType<typeof useI18n>['t']>[0]
    effect: Parameters<ReturnType<typeof useI18n>['t']>[0]
  }
> = {
  'food-cache': {
    title: 'event.local.foodCache.title',
    description: 'event.local.foodCache.description',
    effect: 'event.local.foodCache.effect',
  },
  'energy-cache': {
    title: 'event.local.energyCache.title',
    description: 'event.local.energyCache.description',
    effect: 'event.local.energyCache.effect',
  },
  'ore-cache': {
    title: 'event.local.oreCache.title',
    description: 'event.local.oreCache.description',
    effect: 'event.local.oreCache.effect',
  },
  'crystal-fragment': {
    title: 'event.local.crystalFragment.title',
    description: 'event.local.crystalFragment.description',
    effect: 'event.local.crystalFragment.effect',
  },
  'credit-grant': {
    title: 'event.local.creditGrant.title',
    description: 'event.local.creditGrant.description',
    effect: 'event.local.creditGrant.effect',
  },
  'new-settlers': {
    title: 'event.local.newSettlers.title',
    description: 'event.local.newSettlers.description',
    effect: 'event.local.newSettlers.effect',
  },
  'spoiled-food': {
    title: 'event.local.spoiledFood.title',
    description: 'event.local.spoiledFood.description',
    effect: 'event.local.spoiledFood.effect',
  },
  'energy-leak': {
    title: 'event.local.energyLeak.title',
    description: 'event.local.energyLeak.description',
    effect: 'event.local.energyLeak.effect',
  },
  'ore-theft': {
    title: 'event.local.oreTheft.title',
    description: 'event.local.oreTheft.description',
    effect: 'event.local.oreTheft.effect',
  },
  'credit-fraud': {
    title: 'event.local.creditFraud.title',
    description: 'event.local.creditFraud.description',
    effect: 'event.local.creditFraud.effect',
  },
  'harvester-breakdown': {
    title: 'event.local.harvesterBreakdown.title',
    description: 'event.local.harvesterBreakdown.description',
    effect: 'event.local.harvesterBreakdown.effect',
  },
  'labor-strike': {
    title: 'event.local.laborStrike.title',
    description: 'event.local.laborStrike.description',
    effect: 'event.local.laborStrike.effect',
  },
  'communications-outage': {
    title: 'event.local.communicationsOutage.title',
    description: 'event.local.communicationsOutage.description',
    effect: 'event.local.communicationsOutage.effect',
  },
  'land-registry-error': {
    title: 'event.local.landRegistryError.title',
    description: 'event.local.landRegistryError.description',
    effect: 'event.local.landRegistryError.effect',
  },
  'wrong-spare-parts': {
    title: 'event.local.wrongSpareParts.title',
    description: 'event.local.wrongSpareParts.description',
    effect: 'event.local.wrongSpareParts.effect',
  },
}

type LocalEventNoticeProps = {
  event: LocalEventId
  round: number
  onDismiss: () => void
}

function LocalEventNotice({
  event,
  round,
  onDismiss,
}: LocalEventNoticeProps) {
  const { t } = useI18n()
  const keys = localEventTranslationKeys[event]
  const amount = getLocalEventAmount(event, round) ?? ''

  useEffect(() => {
    const automaticDismiss = window.setTimeout(onDismiss, 6000)

    return () => window.clearTimeout(automaticDismiss)
  }, [onDismiss])

  return (
    <aside
      className="local-event-notice"
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        aria-label={t('event.local.dismiss')}
        onClick={onDismiss}
      >
        ×
      </button>
      <p className="eyebrow">{t('event.local.eyebrow')}</p>
      <h2>{t(keys.title)}</h2>
      <p>{t(keys.description, { amount })}</p>
      <strong>{t(keys.effect, { amount })}</strong>
    </aside>
  )
}

export default LocalEventNotice
