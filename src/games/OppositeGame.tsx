import { useEffect, useState } from 'react'
import { BrainBrakes } from '../components/FeelingsArt'
import { play } from '../core/sound'
import type { Choice, OppositeRound } from '../core/types'
import type { GameProps } from './shared'

/**
 * Inhibitory control: hear the instruction, hold the rule in mind, and do
 * the other thing.
 *
 * Physical commands are marked by the grown-up watching — there is deliberately
 * no body tracking anywhere in this app (spec §7).
 */
export function OppositeGame({
  round,
  cue,
  driver,
  onAnswer,
  onInteraction,
}: GameProps<OppositeRound>) {
  const [answered, setAnswered] = useState<string | null>(null)
  const [wobbled, setWobbled] = useState(false)

  /**
   * The instruction currently on the table.
   *
   * In a live lesson the teacher pushes a cue. In together mode nobody is
   * pushing anything, so the ROUND supplies it: pairs are shuffled per round,
   * so the first one is the instruction and the rest stand as distractors.
   * Same game, one fewer person required.
   */
  const lead = round.pairs[0]
  const active = cue
    ? { id: cue.id, headline: cue.headline, detail: cue.detail, expect: cue.expect }
    : lead
      ? { id: round.id, headline: lead.command.label, detail: undefined, expect: lead.opposite.id }
      : null

  // Each new instruction is a clean slate. Keyed on the round too, because in
  // together mode a new round IS the new instruction.
  useEffect(() => {
    setAnswered(null)
    setWobbled(false)
  }, [cue?.id, round.id])

  const screenMode = round.mode === 'screen'
  const options: Choice[] = round.pairs.flatMap((pair) => [
    pair.command,
    pair.opposite,
  ])

  const choose = (option: Choice) => {
    if (answered) return
    const correct = option.id === active?.expect
    setAnswered(option.id)
    if (correct) {
      play('chime')
    } else {
      setWobbled(true)
      play('pop')
    }
    onInteraction({
      kind: 'stage',
      value: correct ? 1 : 0,
      message: `Chose ${option.label} — ${correct ? 'the opposite ✓' : 'brain brakes wobbled'}`,
    })
    onAnswer(correct ? 1 : 0, {
      correct,
      label: `${active?.headline ?? '?'} → ${option.label}${correct ? ' ✓' : ''}`,
    })
  }

  const tryAgain = () => {
    setAnswered(null)
    setWobbled(false)
  }

  return (
    <div className="stage theme-opposite-game">
      <header className="stage-head">
        <p className="stage-eyebrow">The Opposite Game</p>
        <h1>Do the opposite!</h1>
      </header>

      <ul className="rule-list">
        {round.pairs.map((pair) => (
          <li key={pair.id} className="rule-card">
            <span className="rule-said">
              <small>{driver ? `If ${driver} says` : 'If you hear'}</small>
              <strong>{pair.command.label}</strong>
            </span>
            <span className="rule-arrow" aria-hidden="true">
              ↓
            </span>
            <span className="rule-do">
              <small>you do</small>
              <strong>{pair.opposite.label}</strong>
            </span>
          </li>
        ))}
      </ul>

      {active ? (
        <div className={`command-card ${wobbled ? 'is-wobble' : ''}`}>
          <p className="command-said">{driver ? `${driver} says` : 'Do the opposite of'}</p>
          <p className="command-word">{active.headline}</p>
          {active.detail && <p className="command-detail">{active.detail}</p>}
        </div>
      ) : (
        <div className="command-card is-waiting">
          <p className="command-said">Get ready…</p>
          <p className="command-word">?</p>
        </div>
      )}

      <BrainBrakes engaged={!!active && !wobbled} />

      {screenMode && active && (
        <>
          <ul className="opposite-choices">
            {options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className="opposite-card"
                  disabled={!!answered}
                  aria-pressed={answered === option.id}
                  onClick={() => choose(option)}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>

          {answered && (
            <p className={`feedback ${wobbled ? 'feedback-try-again' : 'feedback-success'}`}>
              {wobbled
                ? 'Oops — our brain brakes wobbled! Let’s try that one again.'
                : 'You did the opposite! Great braking.'}
            </p>
          )}

          {wobbled && (
            <button type="button" className="button-primary" onClick={tryAgain}>
              Try that one again
            </button>
          )}
        </>
      )}

      {!screenMode && (
        <p className="feedback">
          {active
            ? `Show ${driver ?? 'your grown-up'} with your body!`
            : 'Watch and listen…'}
        </p>
      )}
    </div>
  )
}
