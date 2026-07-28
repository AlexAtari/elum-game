import { useEffect, useState } from 'react'
import type { LeaderboardEntry } from '../game'
import type { MeteorImpact } from '../meteor'
import { useI18n } from '../i18n/I18nContext'
import './LeaderboardPanel.css'

const leaderboardRevealStepSeconds = 1
const completeLeaderboardSeconds = 8

type LeaderboardPanelProps = {
  roundPlayed: number
  nextRound: number
  entries: LeaderboardEntry[]
  isFinal: boolean
  meteorImpact: MeteorImpact | null
  onContinue: () => void
  onRestart: () => void
}

function LeaderboardPanel({
  roundPlayed,
  nextRound,
  entries,
  isFinal,
  meteorImpact,
  onContinue,
  onRestart,
}: LeaderboardPanelProps) {
  const { number, t } = useI18n()
  const initialVisibleEntries = Math.min(entries.length, 1)
  const revealSeconds = Math.max(
    0,
    entries.length - initialVisibleEntries,
  )
  const leaderboardDisplaySeconds =
    revealSeconds * leaderboardRevealStepSeconds +
    completeLeaderboardSeconds
  const [visibleEntries, setVisibleEntries] = useState(
    initialVisibleEntries,
  )
  const [secondsLeft, setSecondsLeft] = useState(
    leaderboardDisplaySeconds,
  )
  const leaderboardComplete = visibleEntries >= entries.length
  const highestPopulation = Math.max(
    ...entries.map((entry) => entry.population),
    1,
  )
  const winner = entries[0]
  const playerRank =
    entries.findIndex((entry) => entry.isPlayer) + 1

  useEffect(() => {
    const revealCountdown = window.setInterval(() => {
      setVisibleEntries((currentVisibleEntries) => {
        if (currentVisibleEntries >= entries.length) {
          window.clearInterval(revealCountdown)
          return currentVisibleEntries
        }

        return currentVisibleEntries + 1
      })
    }, leaderboardRevealStepSeconds * 1000)
    const countdown = isFinal
      ? null
      : window.setInterval(() => {
          setSecondsLeft((currentSeconds) =>
            Math.max(0, currentSeconds - 1),
          )
        }, 1000)
    const automaticContinue = isFinal
      ? null
      : window.setTimeout(
          onContinue,
          leaderboardDisplaySeconds * 1000,
        )

    return () => {
      window.clearInterval(revealCountdown)
      if (countdown !== null) {
        window.clearInterval(countdown)
      }
      if (automaticContinue !== null) {
        window.clearTimeout(automaticContinue)
      }
    }
  }, [
    entries.length,
    isFinal,
    leaderboardDisplaySeconds,
    onContinue,
  ])

  return (
    <section className="leaderboard-panel">
      <div className="leaderboard-heading">
        <div>
          <p className="eyebrow">
            {t(
              isFinal
                ? 'leaderboard.finalEyebrow'
                : 'leaderboard.interimEyebrow',
              { round: roundPlayed },
            )}
          </p>
          <h2>
            {t(
              isFinal
                ? 'leaderboard.finalTitle'
                : 'leaderboard.title',
            )}
          </h2>
        </div>

        <p>{t('leaderboard.criteria')}</p>
      </div>

      {meteorImpact && (
        <div className="meteor-impact-banner" role="status">
          <span aria-hidden="true">☄️</span>
          <div>
            <strong>
              {t('meteor.impactTitle', {
                tileId: meteorImpact.centerTileId,
              })}
            </strong>
            <p>{t('meteor.impactDescription')}</p>
          </div>
        </div>
      )}

      <div
        className="leaderboard-mobile-list"
        role="list"
        aria-label={t('leaderboard.title')}
      >
        {entries.map((entry, index) => {
          const entryIsVisible =
            index >= entries.length - visibleEntries

          return (
            <article
              className={`leaderboard-mobile-card ${
                entry.isPlayer
                  ? 'leaderboard-mobile-player-card'
                  : ''
              } ${
                index === 0
                  ? 'leaderboard-mobile-winner-card'
                  : ''
              } ${
                entryIsVisible
                  ? 'leaderboard-mobile-card-visible'
                  : 'leaderboard-mobile-card-hidden'
              }`}
              key={`mobile-${entry.id}`}
              role="listitem"
              aria-hidden={!entryIsVisible}
            >
              <div className="leaderboard-mobile-card-top">
                <strong className="leaderboard-mobile-rank">
                  <span>{index + 1}.</span>
                  {index === 0 && (
                    <span
                      className="leaderboard-mobile-crown"
                      aria-label={t('leaderboard.firstPlace')}
                    >
                      👑
                    </span>
                  )}
                </strong>

                <div className="leaderboard-mobile-colony">
                  <span aria-hidden="true">{entry.icon}</span>
                  <strong>{entry.name}</strong>
                  {entry.isPlayer && (
                    <small>{t('leaderboard.you')}</small>
                  )}
                </div>
              </div>

              <div className="leaderboard-mobile-stats">
                <div>
                  <span>👥 {t('resource.population')}</span>
                  <strong>{number(entry.population)}</strong>
                </div>
                <div>
                  <span>💰 {t('resource.credits')}</span>
                  <strong>{number(entry.credits)}</strong>
                </div>
                <div>
                  <span>📦 {t('leaderboard.resources')}</span>
                  <strong>{number(entry.resources)}</strong>
                </div>
                <div>
                  <span>🚜 {t('leaderboard.harvesters')}</span>
                  <strong>{number(entry.harvesters)}</strong>
                </div>
              </div>

              <span
                className="leaderboard-mobile-population-bar"
                style={{
                  width: `${
                    (entry.population / highestPopulation) * 100
                  }%`,
                }}
                aria-hidden="true"
              />
            </article>
          )
        })}
      </div>

      <div className="leaderboard-scroll leaderboard-desktop-scroll">
        <div className="leaderboard-table" role="table">
          <div
            className="leaderboard-row leaderboard-header-row"
            role="row"
          >
            <span role="columnheader">
              {t('leaderboard.rank')}
            </span>
            <span role="columnheader">
              {t('leaderboard.colony')}
            </span>
            <span role="columnheader">
              👥 {t('resource.population')}
            </span>
            <span role="columnheader">
              💰 {t('resource.credits')}
            </span>
            <span role="columnheader">
              📦 {t('leaderboard.resources')}
            </span>
            <span role="columnheader">
              🚜 {t('leaderboard.harvesters')}
            </span>
          </div>

          {entries.map((entry, index) => {
            const entryIsVisible =
              index >= entries.length - visibleEntries

            return (
              <div
                className={`leaderboard-row ${
                  entry.isPlayer ? 'leaderboard-player-row' : ''
                } ${
                  index === 0 ? 'leaderboard-leading-row' : ''
                } ${
                  entryIsVisible
                    ? 'leaderboard-revealed-row'
                    : 'leaderboard-hidden-row'
                }`}
                key={entry.id}
                role="row"
                aria-hidden={!entryIsVisible}
              >
                <strong
                  className="leaderboard-rank"
                  role="cell"
                >
                  {index + 1}
                  {index === 0 && (
                    <span
                      className="leaderboard-crown"
                      aria-label={t('leaderboard.firstPlace')}
                    >
                      👑
                    </span>
                  )}
                </strong>
                <div className="leaderboard-colony" role="cell">
                  <span aria-hidden="true">{entry.icon}</span>
                  <strong>{entry.name}</strong>
                  {entry.isPlayer && (
                    <small>{t('leaderboard.you')}</small>
                  )}
                </div>
                <strong
                  className="leaderboard-stat leaderboard-population"
                  data-label={t('resource.population')}
                  role="cell"
                >
                  {number(entry.population)}
                </strong>
                <strong
                  className="leaderboard-stat leaderboard-credits"
                  data-label={t('resource.credits')}
                  role="cell"
                >
                  {number(entry.credits)}
                </strong>
                <strong
                  className="leaderboard-stat leaderboard-resources"
                  data-label={t('leaderboard.resources')}
                  role="cell"
                >
                  {number(entry.resources)}
                </strong>
                <strong
                  className="leaderboard-stat leaderboard-harvesters"
                  data-label={t('leaderboard.harvesters')}
                  role="cell"
                >
                  {number(entry.harvesters)}
                </strong>
                <span
                  className="leaderboard-population-bar"
                  style={{
                    width: `${
                      (entry.population / highestPopulation) * 100
                    }%`,
                  }}
                  aria-hidden="true"
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="leaderboard-footer">
        {isFinal ? (
          leaderboardComplete && winner ? (
            <div
              className="leaderboard-final-summary"
              aria-live="polite"
            >
              <div>
                <span>{t('leaderboard.winner')}</span>
                <strong>
                  <span aria-hidden="true">👑 {winner.icon}</span>{' '}
                  {winner.name}
                </strong>
                <p>
                  {t('leaderboard.winnerSummary', {
                    population: number(winner.population),
                    credits: number(winner.credits),
                    resources: number(winner.resources),
                    harvesters: number(winner.harvesters),
                  })}
                </p>
                <small>
                  {t('leaderboard.playerResult', {
                    rank: playerRank,
                    total: entries.length,
                  })}
                </small>
              </div>
              <button
                className="leaderboard-restart-button"
                type="button"
                onClick={onRestart}
              >
                {t('leaderboard.newGame')}
              </button>
            </div>
          ) : (
            <p className="leaderboard-reveal-status">
              {t('leaderboard.revealing')}
            </p>
          )
        ) : (
          <>
            <p>{t('leaderboard.aiNote')}</p>
            <div
              className="leaderboard-countdown"
              aria-live="polite"
            >
              <div>
                <span>
                  {leaderboardComplete
                    ? t('leaderboard.nextRound', {
                        round: nextRound,
                      })
                    : t('leaderboard.revealing')}
                </span>
                <strong>{secondsLeft}s</strong>
              </div>
              <div
                className="leaderboard-countdown-track"
                role="progressbar"
                aria-label={t('leaderboard.progressLabel')}
                aria-valuemin={0}
                aria-valuemax={leaderboardDisplaySeconds}
                aria-valuenow={secondsLeft}
              >
                <span
                  style={{
                    width: `${
                      (secondsLeft / leaderboardDisplaySeconds) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            {leaderboardComplete && (
              <button
                type="button"
                className="leaderboard-continue-button"
                onClick={onContinue}
              >
                {t('leaderboard.nextRound', {
                  round: nextRound,
                })}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default LeaderboardPanel
