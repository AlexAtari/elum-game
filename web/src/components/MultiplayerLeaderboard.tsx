import type { LeaderboardEntry } from '../game'
import { useI18n } from '../i18n/I18nContext'
import './MultiplayerLeaderboard.css'

type MultiplayerLeaderboardProps = {
  entries: LeaderboardEntry[]
  mode: 'interstitial' | 'headquarters'
  roundPlayed?: number
  isFinal?: boolean
  isHost?: boolean
  onContinue?: () => void
  onRestart?: () => void
}

function MultiplayerLeaderboard({
  entries,
  mode,
  roundPlayed,
  isFinal = false,
  isHost = false,
  onContinue,
  onRestart,
}: MultiplayerLeaderboardProps) {
  const { number, t } = useI18n()
  const winner = entries[0]
  const playerRank =
    entries.findIndex((entry) => entry.isPlayer) + 1

  return (
    <section
      className={`network-leaderboard network-leaderboard-${mode}`}
      aria-label={t('leaderboard.title')}
    >
      <header className="network-leaderboard-heading">
        <div>
          {roundPlayed !== undefined ? (
            <p className="eyebrow">
              {t(
                isFinal
                  ? 'leaderboard.finalEyebrow'
                  : 'leaderboard.interimEyebrow',
                { round: roundPlayed },
              )}
            </p>
          ) : null}
          <h2>
            {t(
              isFinal
                ? 'leaderboard.finalTitle'
                : 'leaderboard.title',
            )}
          </h2>
        </div>
        <p>{t('leaderboard.criteria')}</p>
      </header>

      <div className="network-leaderboard-list" role="list">
        {entries.map((entry, index) => (
          <article
            className={`network-leaderboard-entry ${
              entry.isPlayer ? 'is-player' : ''
            } ${index === 0 ? 'is-leading' : ''}`}
            key={entry.id}
            role="listitem"
          >
            <div className="network-leaderboard-identity">
              <strong className="network-leaderboard-rank">
                {index + 1}.
              </strong>
              <span aria-hidden="true">{entry.icon}</span>
              <div>
                <strong>{entry.name}</strong>
                {entry.isPlayer ? (
                  <small>{t('leaderboard.you')}</small>
                ) : null}
              </div>
              {index === 0 ? (
                <span
                  aria-label={t('leaderboard.firstPlace')}
                  title={t('leaderboard.firstPlace')}
                >
                  👑
                </span>
              ) : null}
            </div>

            <div className="network-leaderboard-stats">
              <span>
                <small>👥 {t('resource.population')}</small>
                <strong>{number(entry.population)}</strong>
              </span>
              <span>
                <small>💰 {t('leaderboard.wealth')}</small>
                <strong>{number(entry.wealth)}</strong>
              </span>
              <span>
                <small>📦 {t('leaderboard.resources')}</small>
                <strong>{number(entry.resources)}</strong>
              </span>
              <span>
                <small>🚜 {t('leaderboard.harvesters')}</small>
                <strong>{number(entry.harvesters)}</strong>
              </span>
            </div>
          </article>
        ))}
      </div>

      {isFinal && winner ? (
        <div className="network-leaderboard-final">
          <strong>
            {t('leaderboard.winner')}: {winner.icon}{' '}
            {winner.name}
          </strong>
          <span>
            {t('leaderboard.playerResult', {
              rank: playerRank,
              total: entries.length,
            })}
          </span>
        </div>
      ) : null}

      {mode === 'interstitial' && !isFinal && onContinue ? (
        <button
          className="network-primary-button"
          type="button"
          onClick={onContinue}
        >
          {t('multiplayerGame.toRoundBriefing')}
        </button>
      ) : null}

      {mode === 'interstitial' && isFinal ? (
        isHost && onRestart ? (
          <button
            className="network-primary-button"
            type="button"
            onClick={onRestart}
          >
            {t('multiplayerGame.prepareNewMatch')}
          </button>
        ) : (
          <p className="network-leaderboard-waiting">
            {t('multiplayerGame.waitForHostRestart')}
          </p>
        )
      ) : null}
    </section>
  )
}

export default MultiplayerLeaderboard
