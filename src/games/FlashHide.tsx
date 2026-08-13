import { useEffect, useState } from 'react'
import { Feedback, NumberPad } from '../components/common'
import { Fingers, Scene } from '../components/Illustrations'
import type { FlashRound } from '../core/types'
import { useRoundAnswer, type GameProps } from './shared'

type Phase = 'ready' | 'showing' | 'answer'

const READY_MS = 1100

/**
 * Subitising: a structured quantity appears briefly, then hides.
 * There is no timer on the answer — only on the looking.
 */
export function FlashHide({ round, onAnswer }: GameProps<FlashRound>) {
  const [phase, setPhase] = useState<Phase>('ready')
  const answer = useRoundAnswer(round, onAnswer)

  useEffect(() => {
    setPhase('ready')
    const toShowing = setTimeout(() => setPhase('showing'), READY_MS)
    const toAnswer = setTimeout(
      () => setPhase('answer'),
      READY_MS + round.duration,
    )
    return () => {
      clearTimeout(toShowing)
      clearTimeout(toAnswer)
    }
  }, [round.shownAt, round.duration])

  return (
    <div className="stage theme-flash-hide">
      <Scene variant="night" />

      <header className="stage-head">
        <p className="stage-eyebrow">Flash &amp; Hide</p>
        <h1>
          {phase === 'ready'
            ? 'Ready? Watch carefully!'
            : phase === 'showing'
              ? 'Look…'
              : 'How many did you see?'}
        </h1>
      </header>

      <div className={`flash-window is-${phase}`} aria-live="polite">
        {phase === 'ready' && (
          <p className="flash-countdown" aria-hidden="true">
            <span />
            <span />
            <span />
          </p>
        )}

        {phase === 'showing' &&
          (round.representation === 'dots' ? (
            <div
              className="flash-dots"
              role="img"
              aria-label={`${round.quantity} dots`}
            >
              {round.pattern.points.map(([x, y], i) => (
                <span key={i} style={{ left: `${x}%`, top: `${y}%` }} />
              ))}
            </div>
          ) : (
            <Fingers count={round.quantity} className="flash-fingers" />
          ))}

        {phase === 'answer' && (
          <p className="flash-hidden-note" aria-hidden="true">
            Hidden!
          </p>
        )}
      </div>

      {phase === 'answer' && (
        <>
          <NumberPad
            min={1}
            max={round.max}
            chosen={answer.chosen}
            onChoose={answer.submit}
            disabled={answer.solved}
          />
          <Feedback tone={answer.tone}>
            {answer.message || 'Take your time.'}
          </Feedback>
        </>
      )}
    </div>
  )
}
