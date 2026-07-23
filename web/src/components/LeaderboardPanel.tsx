import { useEffect, useState } from 'react'
import type { LeaderboardEntry } from '../game'
import './LeaderboardPanel.css'

const leaderboardRevealStepSeconds = 1
const completeLeaderboardSeconds = 3

type LeaderboardPanelProps = {
  roundPlayed: number
  nextRound: number
  entries: LeaderboardEntry[]
  onContinue: () => void
}

function LeaderboardPanel({
  roundPlayed,
  nextRound,
  entries,
  onContinue,
}: LeaderboardPanelProps) {
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
    const countdown = window.setInterval(() => {
      setSecondsLeft((currentSeconds) =>
        Math.max(0, currentSeconds - 1),
      )
    }, 1000)
    const automaticContinue = window.setTimeout(
      onContinue,
      leaderboardDisplaySeconds * 1000,
    )

    return () => {
      window.clearInterval(revealCountdown)
      window.clearInterval(countdown)
      window.clearTimeout(automaticContinue)
    }
  }, [entries.length, leaderboardDisplaySeconds, onContinue])

  return (
    <section className="leaderboard-panel">
      <div className="leaderboard-heading">
        <div>
          <p className="eyebrow">
            Zwischenstand nach Runde {roundPlayed}
          </p>
          <h2>Kolonie-Rangliste</h2>
        </div>

        <p>
          Entscheidend ist zuerst die Bevölkerung. Bei
          Gleichstand folgen Credits, Ressourcen und Harvester.
        </p>
      </div>

      <div className="leaderboard-scroll">
        <div className="leaderboard-table" role="table">
          <div
            className="leaderboard-row leaderboard-header-row"
            role="row"
          >
            <span role="columnheader">Rang</span>
            <span role="columnheader">Kolonie</span>
            <span role="columnheader">👥 Bevölkerung</span>
            <span role="columnheader">💰 Credits</span>
            <span role="columnheader">📦 Ressourcen</span>
            <span role="columnheader">🚜 Harvester</span>
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
                      aria-label="Erster Platz"
                    >
                      👑
                    </span>
                  )}
                </strong>
                <div className="leaderboard-colony" role="cell">
                  <span aria-hidden="true">{entry.icon}</span>
                  <strong>{entry.name}</strong>
                  {entry.isPlayer && <small>Du</small>}
                </div>
                <strong role="cell">{entry.population}</strong>
                <strong role="cell">{entry.credits}</strong>
                <strong role="cell">{entry.resources}</strong>
                <strong role="cell">{entry.harvesters}</strong>
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
        <p>
          Die KI-Kolonien besitzen eigene Vorräte und entwickeln
          sich mit jeder Rundenabrechnung weiter.
        </p>
        <div className="leaderboard-countdown" aria-live="polite">
          <div>
            <span>
              {leaderboardComplete
                ? `Runde ${nextRound} startet automatisch`
                : 'Rangliste wird aufgedeckt'}
            </span>
            <strong>{secondsLeft}s</strong>
          </div>
          <div
            className="leaderboard-countdown-track"
            role="progressbar"
            aria-label="Zeit bis zur nächsten Runde"
            aria-valuemin={0}
            aria-valuemax={leaderboardDisplaySeconds}
            aria-valuenow={secondsLeft}
          >
            <span
              style={{
                width: `${
                  (secondsLeft / leaderboardDisplaySeconds) * 100
                }%`,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default LeaderboardPanel
