import './AuctionTimer.css'

type AuctionTimerProps = {
  secondsLeft: number
  totalSeconds: number
  label: string
  ariaLabel: string
}

function AuctionTimer({
  secondsLeft,
  totalSeconds,
  label,
  ariaLabel,
}: AuctionTimerProps) {
  const progress = Math.max(
    0,
    (secondsLeft / Math.max(1, totalSeconds)) * 100,
  )

  return (
    <>
      <div className="auction-timer" aria-live="polite">
        {secondsLeft}s
      </div>

      <div className="auction-time-track">
        <div className="auction-time-label">
          <span>{label}</span>
          <strong>{secondsLeft} Sekunden</strong>
        </div>
        <div
          className="auction-time-bar"
          role="progressbar"
          aria-label={ariaLabel}
          aria-valuemin={0}
          aria-valuemax={totalSeconds}
          aria-valuenow={secondsLeft}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </>
  )
}

export default AuctionTimer
