import { useEffect, useRef, useState } from 'react'
import introSequenceOneUrl from '../assets/intro-sequence-01.mp4'
import introSequenceTwoUrl from '../assets/intro-sequence-02.mp4'
import { useI18n } from '../i18n/I18nContext'
import './IntroSequence.css'

const introVideoUrls = [
  introSequenceOneUrl,
  introSequenceTwoUrl,
] as const

type IntroSequenceProps = {
  onComplete: () => void
}

function IntroSequence({ onComplete }: IntroSequenceProps) {
  const { t } = useI18n()
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([])
  const [activeVideoIndex, setActiveVideoIndex] = useState(0)

  useEffect(() => {
    const activeVideo = videoRefs.current[activeVideoIndex]

    if (!activeVideo) {
      return
    }

    activeVideo.currentTime = 0
    void activeVideo.play().catch(() => undefined)
  }, [activeVideoIndex])

  const advanceSequence = (videoIndex: number) => {
    if (videoIndex !== activeVideoIndex) {
      return
    }

    if (videoIndex === introVideoUrls.length - 1) {
      onComplete()
      return
    }

    setActiveVideoIndex(videoIndex + 1)
  }

  return (
    <main className="intro-screen">
      {introVideoUrls.map((videoUrl, videoIndex) => (
        <video
          key={videoUrl}
          ref={(video) => {
            videoRefs.current[videoIndex] = video
          }}
          className={[
            'intro-video',
            videoIndex === activeVideoIndex ? 'active' : '',
          ].join(' ')}
          src={videoUrl}
          autoPlay={videoIndex === 0}
          muted
          playsInline
          preload="auto"
          aria-hidden={videoIndex !== activeVideoIndex}
          onEnded={() => advanceSequence(videoIndex)}
          onError={() => advanceSequence(videoIndex)}
        />
      ))}

      <div className="intro-controls">
        <span aria-live="polite">
          {t('intro.progress', {
            current: activeVideoIndex + 1,
            total: introVideoUrls.length,
          })}
        </span>
        <button type="button" onClick={onComplete}>
          {t('intro.skip')}
        </button>
      </div>
    </main>
  )
}

export default IntroSequence
