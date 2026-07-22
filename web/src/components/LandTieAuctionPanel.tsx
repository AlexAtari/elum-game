import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  lowerLandTieBid,
  raiseLandTieBid,
  tiles,
  type LandAuctionTie,
  type LandTieBidState,
} from '../game'
import AuctionPriceScale from './AuctionPriceScale'
import AuctionTimer from './AuctionTimer'
import './LandTieAuctionPanel.css'

const preparationSeconds = 5
const landTieSeconds = 10
const movementMilliseconds = 300
const orionMovementMilliseconds = 1100
const resultDisplayMilliseconds = 1200

type LandTieStage = 'preparation' | 'auction' | 'finished'

type LandTieAuctionPanelProps = {
  tie: LandAuctionTie
  credits: number
  orionCredits: number
  onComplete: (bids: LandTieBidState) => void
}

function bidPosition(
  bid: number,
  minimum: number,
  maximum: number,
) {
  if (maximum === minimum) {
    return '12%'
  }

  const relative = (bid - minimum) / (maximum - minimum)

  return `${12 + Math.max(0, Math.min(1, relative)) * 76}%`
}

function LandTieAuctionPanel({
  tie,
  credits,
  orionCredits,
  onComplete,
}: LandTieAuctionPanelProps) {
  const tile = tiles.find((candidate) => candidate.id === tie.tileId)
  const highestRating = Math.max(
    tile?.food ?? 0,
    tile?.energy ?? 0,
    tile?.ore ?? 0,
  )
  const orionBidLimit = Math.min(
    orionCredits,
    tie.minimumBid + Math.max(1, highestRating - 2),
  )
  const maximumBid = Math.max(
    tie.minimumBid,
    Math.min(
      Math.max(credits, orionBidLimit),
      tie.tiedBid + 30,
    ),
  )
  const [stage, setStage] =
    useState<LandTieStage>('preparation')
  const [secondsLeft, setSecondsLeft] =
    useState(preparationSeconds)
  const [bids, setBids] = useState<LandTieBidState>({
    playerBid: tie.tiedBid,
    orionBid: tie.tiedBid,
    leader: null,
  })
  const [playerBehindStart, setPlayerBehindStart] =
    useState(true)
  const bidsRef = useRef(bids)
  const nextPlayerMovementAt = useRef(0)

  useEffect(() => {
    bidsRef.current = bids
  }, [bids])

  const raisePlayerBid = useCallback(() => {
    if (
      stage !== 'auction' ||
      Date.now() < nextPlayerMovementAt.current
    ) {
      return
    }

    nextPlayerMovementAt.current =
      Date.now() + movementMilliseconds

    if (playerBehindStart && bidsRef.current.playerBid >= tie.minimumBid) {
      setPlayerBehindStart(false)
      return
    }

    setPlayerBehindStart(false)
    setBids((currentBids) =>
      raiseLandTieBid(currentBids, 'player', credits),
    )
  }, [credits, playerBehindStart, stage, tie.minimumBid])

  const lowerPlayerBid = useCallback(() => {
    if (
      stage !== 'auction' ||
      playerBehindStart ||
      Date.now() < nextPlayerMovementAt.current
    ) {
      return
    }

    nextPlayerMovementAt.current =
      Date.now() + movementMilliseconds
    const currentPlayerBid = bidsRef.current.playerBid

    setBids((currentBids) =>
      lowerLandTieBid(
        currentBids,
        'player',
        tie.minimumBid,
      ),
    )

    if (currentPlayerBid === tie.minimumBid) {
      setPlayerBehindStart(true)
    }
  }, [playerBehindStart, stage, tie.minimumBid])

  useEffect(() => {
    if (stage !== 'auction') {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        raisePlayerBid()
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        lowerPlayerBid()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lowerPlayerBid, raisePlayerBid, stage])

  useEffect(() => {
    if (stage === 'finished') {
      return
    }

    const timer = window.setTimeout(
      () => {
        if (secondsLeft > 0) {
          setSecondsLeft(secondsLeft - 1)
          return
        }

        if (stage === 'preparation') {
          setStage('auction')
          setSecondsLeft(landTieSeconds)
          return
        }

        setStage('finished')
      },
      secondsLeft === 0 ? 300 : 1000,
    )

    return () => window.clearTimeout(timer)
  }, [secondsLeft, stage])

  useEffect(() => {
    if (stage !== 'auction') {
      return
    }

    const orionMovement = window.setInterval(() => {
      setBids((currentBids) =>
        raiseLandTieBid(
          currentBids,
          'orion',
          orionBidLimit,
        ),
      )
    }, orionMovementMilliseconds)

    return () => window.clearInterval(orionMovement)
  }, [orionBidLimit, stage])

  useEffect(() => {
    if (stage !== 'finished') {
      return
    }

    const resultPause = window.setTimeout(
      () => onComplete(bidsRef.current),
      resultDisplayMilliseconds,
    )

    return () => window.clearTimeout(resultPause)
  }, [onComplete, stage])

  const highestBid = Math.max(
    tie.minimumBid,
    bids.playerBid,
    bids.orionBid,
  )
  const positionForPrice = useCallback(
    (price: number) =>
      bidPosition(price, tie.minimumBid, maximumBid),
    [maximumBid, tie.minimumBid],
  )
  const playerPosition = playerBehindStart
    ? '7%'
    : positionForPrice(bids.playerBid)
  const orionPosition =
    bids.orionBid < tie.minimumBid
      ? '7%'
      : positionForPrice(bids.orionBid)
  const fieldRatings = useMemo(
    () => [
      `🌾 ${tile?.food ?? 0}`,
      `⚡ ${tile?.energy ?? 0}`,
      `⛏ ${tile?.ore ?? 0}`,
    ],
    [tile],
  )

  return (
    <section className="land-tie-panel">
      <div className="land-tie-heading">
        <div>
          <p className="eyebrow">Grundstücks-Stichauktion</p>
          <h2>Feld {tie.tileId}</h2>
        </div>

        <AuctionTimer
          secondsLeft={secondsLeft}
          totalSeconds={
            stage === 'preparation'
              ? preparationSeconds
              : landTieSeconds
          }
          label={
            stage === 'preparation'
              ? 'Start der Stichauktion'
              : 'Restzeit Stichauktion'
          }
          ariaLabel="Verbleibende Zeit der Grundstücksauktion"
        />
      </div>

      <div className="land-tie-summary">
        <div>
          <span>Feldwerte</span>
          <strong>{fieldRatings.join(' · ')}</strong>
        </div>
        <div>
          <span>Deine verfügbaren Credits</span>
          <strong>💰 {credits}</strong>
        </div>
        <div>
          <span>Ausgangsgleichstand</span>
          <strong>{tie.tiedBid} Credits</strong>
        </div>
        <div>
          <span>Aktuelle Führung</span>
          <strong>
            {bids.leader === 'player'
              ? `Du · ${bids.playerBid} Credits`
              : bids.leader === 'orion'
                ? `Orion · ${bids.orionBid} Credits`
                : 'Noch niemand'}
          </strong>
        </div>
      </div>

      <div className="land-tie-content">
        <div className="land-tie-arena">
          <AuctionPriceScale
            minimum={tie.minimumBid}
            maximum={maximumBid}
            positionForPrice={positionForPrice}
            ariaLabel={`Gebotsskala von ${tie.minimumBid} bis ${maximumBid} Credits`}
          />

          {stage === 'preparation' && (
            <div
              className="land-tie-announcement"
              role="status"
              aria-live="polite"
            >
              <p className="eyebrow">Stichauktion angekündigt</p>
              <h3>Feld {tie.tileId}</h3>
              <p>Agima und Orion treten gegeneinander an.</p>
              <strong>
                Startpreis: {tie.minimumBid} Credits
              </strong>
              <b>Beginn in {secondsLeft}</b>
              <small>Macht euch bereit.</small>
            </div>
          )}

          <div
            className={`land-tie-price-line ${
              bids.leader ? 'land-tie-line-active' : ''
            }`}
            style={{ bottom: positionForPrice(highestBid) }}
          />

          <div
            className={`land-tie-avatar land-tie-player ${
              bids.leader === 'player'
                ? 'land-tie-leading-avatar'
                : ''
            }`}
            style={{ bottom: `calc(${playerPosition} - 34px)` }}
          >
            <span>🧑‍🚀</span>
            <strong>Du</strong>
            <b>
              {bids.playerBid >= tie.minimumBid
                ? `${bids.playerBid} Credits`
                : 'bereit'}
            </b>
          </div>

          <div
            className={`land-tie-avatar land-tie-orion ${
              bids.leader === 'orion'
                ? 'land-tie-leading-avatar'
                : ''
            }`}
            style={{ bottom: `calc(${orionPosition} - 34px)` }}
          >
            <span>🤖</span>
            <strong>Orion</strong>
            <b>
              {bids.orionBid >= tie.minimumBid
                ? `${bids.orionBid} Credits`
                : 'bereit'}
            </b>
          </div>

          <span className="land-tie-start-label">
            STARTPREIS · {tie.minimumBid} CREDITS
          </span>
        </div>

        <aside className="land-tie-controls">
          {stage === 'finished' ? (
            <div className="land-tie-result" aria-live="polite">
              <p className="eyebrow">Auktion beendet</p>
              <h3>
                {bids.leader === 'player'
                  ? 'Du erhältst das Feld'
                  : bids.leader === 'orion'
                    ? 'Orion erhält das Feld'
                    : 'Das Feld bleibt frei'}
              </h3>
              <p>Die Runde wird automatisch fortgesetzt.</p>
            </div>
          ) : stage === 'preparation' ? (
            <div className="land-tie-ready">
              <p className="eyebrow">Bereit machen</p>
              <strong>{secondsLeft}</strong>
              <small>
                Danach kannst du den Gebotsbalken mit den
                Pfeiltasten bewegen.
              </small>
            </div>
          ) : (
            <div className="land-tie-control-buttons">
              <button
                type="button"
                disabled={
                  playerBehindStart
                    ? bids.playerBid < tie.minimumBid &&
                      tie.minimumBid > credits
                    : bids.playerBid >= credits
                }
                onClick={raisePlayerBid}
              >
                <span aria-hidden="true">↑ Gebot</span>
                <span aria-hidden="true">erhöhen</span>
              </button>
              <button
                type="button"
                disabled={playerBehindStart}
                onClick={lowerPlayerBid}
              >
                <span aria-hidden="true">↓ Gebot</span>
                <span aria-hidden="true">senken</span>
              </button>
              <small>
                Gleiche Gebote ändern die Führung nicht. Nur ein
                höheres Gebot übernimmt den Balken.
              </small>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}

export default LandTieAuctionPanel
