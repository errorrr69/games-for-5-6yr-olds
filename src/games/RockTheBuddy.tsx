import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Buddy, NightSky } from '../components/FeelingsArt'
import { BREATH_PACE, REFLECTIONS } from '../core/feelings'
import { play } from '../core/sound'
import type { BuddyRound, Choice } from '../core/types'
import type { GameProps } from './shared'

type Phase = 'ready' | 'in' | 'hold' | 'out' | 'done'

/**
 * "Help your buddy fall asleep" — not "calm down because you misbehaved".
 *
 * No score, no perfect breath, and no promise that breathing will make
 * anyone feel calmer (spec §10).
 */
export function RockTheBuddy({
  round,
  onObserve,
  onInteraction,
}: GameProps<BuddyRound>) {
  const [started, setStarted] = useState(false)
  const [phase, setPhase] = useState<Phase>('ready')
  const [breath, setBreath] = useState(0)
  const [reflected, setReflected] = useState<Choice | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const pace = BREATH_PACE[round.pace]

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  useEffect(() => {
    setStarted(false)
    setPhase('ready')
    setBreath(0)
    setReflected(null)
    clearTimers()
  }, [round.id])

  useEffect(() => clearTimers, [])

  // One breath: rise, small pause, fall — then either loop or finish.
  useEffect(() => {
    if (!started || phase === 'done') return
    if (phase !== 'ready') return

    const runBreath = (n: number) => {
      setPhase('in')
      play('pop')
      onInteraction({
        kind: 'breath',
        value: n + 1,
        secondary: round.breaths,
        message: `Breath ${n + 1} of ${round.breaths}`,
      })
      timers.current.push(
        setTimeout(() => setPhase('hold'), pace.inMs),
        setTimeout(() => setPhase('out'), pace.inMs + pace.holdMs),
        setTimeout(
          () => {
            const next = n + 1
            setBreath(next)
            if (next >= round.breaths) {
              setPhase('done')
              play('chime')
              onObserve({
                field: 'breathing',
                choices: [
                  { id: 'completed', label: `${round.breaths} slow breaths` },
                ],
                level: round.breaths,
                label: `Completed ${round.breaths} slow breaths`,
              })
            } else {
              runBreath(next)
            }
          },
          pace.inMs + pace.holdMs + pace.outMs,
        ),
      )
    }

    runBreath(0)
    // Intentionally runs once per start; the chain schedules the rest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started])

  const reflect = (option: Choice) => {
    setReflected(option)
    play('click')
    onObserve({ field: 'reflection', choices: [option] })
  }

  const label =
    phase === 'in'
      ? 'Breathe in…'
      : phase === 'hold'
        ? 'Hold…'
        : phase === 'out'
          ? 'Breathe out…'
          : phase === 'done'
            ? 'Buddy looks sleepy 💤'
            : 'Ready when you are'

  return (
    <div className="stage theme-rock-buddy">
      <NightSky />

      <header className="stage-head">
        <p className="stage-eyebrow">Rock the Buddy</p>
        <h1>{started ? label : 'Find a buddy!'}</h1>
      </header>

      {!started ? (
        <>
          <div className="buddy-setup">
            <Buddy className="buddy-art" />
            <ul className="buddy-options">
              <li>A teddy</li>
              <li>A soft toy</li>
              <li>A small cushion</li>
              <li>Or just your hands</li>
            </ul>
          </div>
          <p className="buddy-note">
            No buddy? That’s okay — put your hands on your tummy.
          </p>
          <p className="buddy-note">
            {round.position === 'sit'
              ? 'Sit somewhere comfy.'
              : 'Lie down somewhere comfy, if you like.'}
          </p>
          <button
            type="button"
            className="button-primary"
            onClick={() => setStarted(true)}
          >
            I’ve got my buddy
          </button>
        </>
      ) : (
        <>
          <div
            className={`buddy-stage phase-${phase}`}
            style={
              {
                '--in': `${pace.inMs}ms`,
                '--out': `${pace.outMs}ms`,
              } as CSSProperties
            }
          >
            <Buddy asleep={phase === 'done'} className="buddy-art" />
          </div>

          <p className="breath-count" aria-live="polite">
            {phase === 'done'
              ? `${round.breaths} slow breaths, all done.`
              : `Breath ${Math.min(breath + 1, round.breaths)} of ${round.breaths}`}
          </p>

          {phase === 'done' && round.askReflection && (
            <>
              <p className="stage-question">What did you notice?</p>
              {!reflected ? (
                <ul className="word-grid">
                  {REFLECTIONS.map((option) => (
                    <li key={option.id}>
                      <button
                        type="button"
                        className="word-card"
                        onClick={() => reflect(option)}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="feedback feedback-success">
                  “{reflected.label}” — thank you for noticing.
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
