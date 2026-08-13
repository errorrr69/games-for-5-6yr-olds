import { DancingShapes, Snowflake } from '../components/FeelingsArt'
import type { FreezeRound } from '../core/types'
import type { GameProps } from './shared'

/**
 * Move, stop, and get going again. The teacher drives every switch from
 * their own screen, so this works perfectly with no audio at all (spec §11).
 *
 * The teacher's marks are never shown here — the child sees a game, not
 * an assessment.
 */
export function FreezeDance({ round, cue }: GameProps<FreezeRound>) {
  // Opposite mode flips the meaning of the words, which is the whole point.
  const flipped = round.mode === 'opposite'
  const commanded = cue?.state ?? 'dance'
  const shouldFreeze = flipped ? commanded === 'dance' : commanded === 'freeze'

  const headline = cue
    ? flipped
      ? commanded === 'freeze'
        ? 'FREEZE means… MOVE!'
        : 'MOVE means… FREEZE!'
      : commanded === 'freeze'
        ? 'FREEZE!'
        : 'DANCE!'
    : 'Get ready to dance…'

  return (
    <div
      className={`stage theme-freeze-dance ${shouldFreeze ? 'is-frozen' : 'is-dancing'}`}
    >
      <header className="stage-head">
        <p className="stage-eyebrow">Freeze Dance</p>
        <h1 className="freeze-headline">{headline}</h1>
        {cue?.detail && <p className="freeze-detail">{cue.detail}</p>}
      </header>

      <div className="freeze-floor">
        {shouldFreeze && <Snowflake className="freeze-flake" />}
        <DancingShapes frozen={shouldFreeze} />
      </div>

      {flipped && (
        <p className="freeze-rule">
          Remember — today the words mean the opposite!
        </p>
      )}

      {!cue && (
        <p className="feedback">Wait for Florie to start the music…</p>
      )}
    </div>
  )
}
