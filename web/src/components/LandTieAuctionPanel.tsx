import { createLandAuctionDecision } from '../agents'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  tiles,
  type LandAuctionPhase,
  type LandAuctionTie,
  HARVESTER_CREDIT_COST,
  HARVESTER_ORE_COST,
  LAND_AUCTION_TIMING,
  MARKET_PRICES,
  type RivalColonyState,
} from '../game'
import { getPlanetTileName } from '../planetMap'
import AuctionPriceScale from './AuctionPriceScale'
import AuctionTimer from './AuctionTimer'
import './LandTieAuctionPanel.css'

const preparationSeconds =
  LAND_AUCTION_TIMING.announcementSeconds
const landTieSeconds = LAND_AUCTION_TIMING.auctionSeconds
const movementMilliseconds = 300
const orionMovementMilliseconds = 1100
const resultDisplayMilliseconds = 1200

type LandTieStage = 'preparation' | 'auction' | 'finished'

type LandTieAuctionPanelProps = {
  tie: LandAuctionTie
  credits: number
  orion: RivalColonyState
  roundPlayed: number
  onAdvancePhase: (
    tileId: string,
    expectedPhase: LandAuctionPhase,
  ) => void
  onMoveBid: (
    participantId: 'agima' | 'orion',
    tileId: string,
    direction: 'raise' | 'lower',
  ) => void
  onComplete: () => void
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
  orion,
  roundPlayed,
  onAdvancePhase,
  onMoveBid,
  onComplete,
}: LandTieAuctionPanelProps) {
  const tile = tiles.find((candidate) => candidate.id === tie.tileId)
  const orionLandDecision = tile
    ? createLandAuctionDecision(
        {
          round: roundPlayed,
          colony: orion,
          referencePrices: MARKET_PRICES,
          legalActions: {
            harvesterBuild: {
              creditCost: HARVESTER_CREDIT_COST,
              oreCost: HARVESTER_ORE_COST,
            },
          },
        },
        {
          tileId: tile.id,
          minimumBid: tie.minimumBid,
          food: tile.food ?? 0,
          energy: tile.energy ?? 0,
          ore: tile.ore ?? 0,
        },
      )
    : null
  const orionBidLimit = Math.max(
    tie.tiedBid,
    Math.min(
      orion.credits,
      orionLandDecision?.maximumBid ?? tie.tiedBid,
    ),
  )
  const maximumBid = Math.max(
    tie.minimumBid,
    Math.min(
      Math.max(credits, orionBidLimit),
      tie.tiedBid + 30,
    ),
  )
  const stage: LandTieStage =
    tie.phase === 'announcement'
      ? 'preparation'
      : tie.phase
  const phaseDuration =
    tie.phase === 'announcement'
      ? preparationSeconds
      : tie.phase === 'auction'
        ? landTieSeconds
        : 0
  const [countdown, setCountdown] = useState({
    phase: tie.phase,
    seconds: phaseDuration,
    advanceRequested: false,
  })
  const bids = tie.liveBids
  const [playerBehindStart, setPlayerBehindStart] =
    useState(tie.initialLeaderId !== 'agima')
  const nextPlayerMovementAt = useRef(0)
  if (countdown.phase !== tie.phase) {
    setCountdown({
      phase: tie.phase,
      seconds: phaseDuration,
      advanceRequested: false,
    })
  }
  const secondsLeft =
    countdown.phase === tie.phase
      ? countdown.seconds
      : phaseDuration

  const raisePlayerBid = useCallback(() => {
    if (
      stage !== 'auction' ||
      Date.now() < nextPlayerMovementAt.current
    ) {
      return
    }

    nextPlayerMovementAt.current =
      Date.now() + movementMilliseconds

    if (
      playerBehindStart &&
      (bids.bids.agima ?? 0) >= tie.minimumBid
    ) {
      setPlayerBehindStart(false)
      return
    }

    setPlayerBehindStart(false)
    onMoveBid('agima', tie.tileId, 'raise')
  }, [
    bids.bids.agima,
    onMoveBid,
    playerBehindStart,
    stage,
    tie.minimumBid,
    tie.tileId,
  ])

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
    const currentPlayerBid = bids.bids.agima ?? 0
    onMoveBid('agima', tie.tileId, 'lower')

    if (currentPlayerBid === tie.minimumBid) {
      setPlayerBehindStart(true)
    }
  }, [
    bids.bids.agima,
    onMoveBid,
    playerBehindStart,
    stage,
    tie.minimumBid,
    tie.tileId,
  ])

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
    if (
      tie.phase === 'finished' ||
      countdown.advanceRequested
    ) {
      return
    }

    const timer = window.setTimeout(() => {
      if (secondsLeft > 0) {
        setCountdown({
          phase: tie.phase,
          seconds: secondsLeft - 1,
          advanceRequested: false,
        })
        return
      }

      setCountdown({
        phase: tie.phase,
        seconds: 0,
        advanceRequested: true,
      })
      onAdvancePhase(tie.tileId, tie.phase)
    }, secondsLeft === 0 ? 300 : 1000)

    return () => window.clearTimeout(timer)
  }, [
    countdown.advanceRequested,
    onAdvancePhase,
    secondsLeft,
    tie.phase,
    tie.tileId,
  ])

  useEffect(() => {
    if (stage !== 'auction') {
      return
    }

    const orionMovement = window.setInterval(() => {
      const nextOrionBid = Math.max(
        (bids.bids.orion ?? 0) + 1,
        (bids.bids.agima ?? 0) + 1,
      )

      if (
        bids.leaderId !== 'orion' &&
        nextOrionBid <= orionBidLimit
      ) {
        onMoveBid('orion', tie.tileId, 'raise')
      }
    }, orionMovementMilliseconds)

    return () => window.clearInterval(orionMovement)
  }, [
    bids.bids.agima,
    bids.bids.orion,
    bids.leaderId,
    onMoveBid,
    orionBidLimit,
    stage,
    tie.tileId,
  ])

  useEffect(() => {
    if (stage !== 'finished') {
      return
    }

    const resultPause = window.setTimeout(
      onComplete,
      resultDisplayMilliseconds,
    )

    return () => window.clearTimeout(resultPause)
  }, [onComplete, stage])

  const highestBid = Math.max(
    tie.tiedBid,
    bids.bids.agima ?? 0,
    bids.bids.orion ?? 0,
  )
  const positionForPrice = useCallback(
    (price: number) =>
      bidPosition(price, tie.tiedBid, maximumBid),
    [maximumBid, tie.tiedBid],
  )
  const playerPosition = playerBehindStart
    ? '7%'
    : positionForPrice(bids.bids.agima ?? 0)
  const orionPosition =
    (bids.bids.orion ?? 0) < tie.tiedBid
      ? '7%'
      : positionForPrice(bids.bids.orion ?? 0)
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
          <p className="eyebrow">Grundstücksauktion</p>
          <h2>{getPlanetTileName(tie.tileId)}</h2>
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
              ? 'Start der Grundstücksauktion'
              : 'Restzeit Grundstücksauktion'
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
          <span>Höchstes Startgebot</span>
          <strong>{tie.tiedBid} Credits</strong>
        </div>
        <div>
          <span>Aktuelle Führung</span>
          <strong>
            {bids.leaderId === 'agima'
              ? `Du · ${bids.bids.agima ?? 0} Credits`
              : bids.leaderId === 'orion'
                ? `Orion · ${bids.bids.orion ?? 0} Credits`
                : 'Noch niemand'}
          </strong>
        </div>
      </div>

      <div className="land-tie-content">
        <div className="land-tie-arena">
          <AuctionPriceScale
            minimum={tie.tiedBid}
            maximum={maximumBid}
            positionForPrice={positionForPrice}
            ariaLabel={`Gebotsskala von ${tie.tiedBid} bis ${maximumBid} Credits`}
          />

          {stage === 'preparation' && (
            <div
              className="land-tie-announcement"
              role="status"
              aria-live="polite"
            >
              <p className="eyebrow">Grundstücksauktion angekündigt</p>
              <h3>{getPlanetTileName(tie.tileId)}</h3>
              <p>Agima und Orion treten gegeneinander an.</p>
              <strong>
                Startpreis: {tie.tiedBid} Credits
              </strong>
              <b>Beginn in {secondsLeft}</b>
              <small>Macht euch bereit.</small>
            </div>
          )}

          <div
            className={`land-tie-price-line ${
              bids.leaderId ? 'land-tie-line-active' : ''
            }`}
            style={{ bottom: positionForPrice(highestBid) }}
          />

          <div
            className={`land-tie-avatar land-tie-player ${
              bids.leaderId === 'agima'
                ? 'land-tie-leading-avatar'
                : ''
            }`}
            style={{ bottom: `calc(${playerPosition} - 34px)` }}
          >
            <span>🧑‍🚀</span>
            <strong>Du</strong>
            <b>
              {(bids.bids.agima ?? 0) >= tie.minimumBid
                ? `${bids.bids.agima ?? 0} Credits`
                : 'bereit'}
            </b>
          </div>

          <div
            className={`land-tie-avatar land-tie-orion ${
              bids.leaderId === 'orion'
                ? 'land-tie-leading-avatar'
                : ''
            }`}
            style={{ bottom: `calc(${orionPosition} - 34px)` }}
          >
            <span>🤖</span>
            <strong>Orion</strong>
            <b>
              {(bids.bids.orion ?? 0) >= tie.minimumBid
                ? `${bids.bids.orion ?? 0} Credits`
                : 'bereit'}
            </b>
          </div>

          <span className="land-tie-start-label">
            STARTPREIS · {tie.tiedBid} CREDITS
          </span>
        </div>

        <aside className="land-tie-controls">
          {stage === 'finished' ? (
            <div className="land-tie-result" aria-live="polite">
              <p className="eyebrow">Auktion beendet</p>
              <h3>
                {bids.leaderId === 'agima'
                  ? 'Du erhältst das Feld'
                  : bids.leaderId === 'orion'
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
                    ? tie.minimumBid > credits
                    : (bids.bids.agima ?? 0) >= credits
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
