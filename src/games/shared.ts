import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  Bond,
  Choice,
  Cue,
  Interaction,
  ObservationField,
  Round,
} from '../core/types'
import { play } from '../core/sound'

export type AnswerOptions = {
  kind?: 'prediction' | 'final'
  label?: string
  /** Override the equality check (used where "correct" is a state, not a number). */
  correct?: boolean
  responseTimeMs?: number
}

/** What the child noticed or chose — recorded, never marked. */
export type ObservationInput = {
  field: ObservationField
  choices: Choice[]
  level?: number
  possible?: string[]
  /** Overrides the generated teacher label. */
  label?: string
}

export type GameProps<R extends Round> = {
  round: R
  nickname: string
  /** The teacher's live instruction, if one is open. */
  cue?: Cue
  /**
   * Who is calling the game, when that is someone the child can name.
   *
   *   'Florie'   — a live lesson: the child is on a call and the teacher drives.
   *   undefined  — together mode: the grown-up is in the room, so the copy speaks
   *                to them directly rather than naming anyone.
   *
   * Deliberately family-shape neutral when absent — "your grown-up" reads right
   * whether it is a mother, a grandmother, or an aunt playing.
   */
  driver?: string
  /** Discovered bonds so far, keyed by target. */
  discoveries: Record<number, Bond[]>
  /** For games with a right answer. */
  onAnswer: (answer: number, options?: AnswerOptions) => void
  /** For everything else — feelings, clues, choices, reflections. */
  onObserve: (input: ObservationInput) => void
  onInteraction: (patch: Omit<Interaction, 'game' | 'roundId'>) => void
  onBond: (target: number, bond: Bond) => void
  /**
   * Replaces the open round, keeping its id. For state that moves inside a
   * round: a story page turn, a ladder rung, a monster growing horns.
   */
  onRoundChange: (round: Round) => void
}

export type Tone = 'idle' | 'try-again' | 'success'

const TRY_AGAIN = [
  'Almost! Let’s look again.',
  'Hmm… let’s try that one once more.',
  'Close one. Have another look.',
]

/**
 * Attempt bookkeeping for games that *do* have a right answer.
 *
 * Feelings & Focus games mostly do not, and use `onObserve` instead —
 * there is no version of this hook that marks a feeling.
 */
export function useRoundAnswer(
  round: Round,
  onAnswer: GameProps<Round>['onAnswer'],
) {
  const [attempt, setAttempt] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [tone, setTone] = useState<Tone>('idle')
  const [message, setMessage] = useState('')
  const startedAt = useRef(Date.now())

  // A new question, or the teacher replaying this one, resets the clock.
  useEffect(() => {
    startedAt.current = Date.now()
  }, [round.shownAt])

  useEffect(() => {
    setAttempt(0)
    setChosen(null)
    setTone('idle')
    setMessage('')
  }, [round.id])

  const submit = useCallback(
    (answer: number, options?: AnswerOptions) => {
      const correct = options?.correct ?? answer === round.expected
      const next = attempt + 1
      setAttempt(next)
      setChosen(answer)

      if (options?.kind === 'prediction') {
        setTone('idle')
        setMessage('Good thinking. Now let’s find out!')
      } else if (correct) {
        setTone('success')
        setMessage('You found it!')
        play('chime')
      } else {
        setTone('try-again')
        setMessage(TRY_AGAIN[(next - 1) % TRY_AGAIN.length])
        play('pop')
      }

      onAnswer(answer, {
        ...options,
        correct,
        responseTimeMs: Date.now() - startedAt.current,
      })
    },
    [attempt, onAnswer, round.expected],
  )

  return {
    attempt,
    chosen,
    tone,
    message,
    submit,
    solved: tone === 'success',
    responseTime: () => Date.now() - startedAt.current,
  }
}

/**
 * Stage progression for the multi-step Feelings games, resetting whenever
 * the teacher opens a new round.
 */
export function useStages<T extends string>(round: Round, stages: T[]) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [round.id])

  const stage = stages[Math.min(index, stages.length - 1)]
  const done = index >= stages.length

  return {
    stage,
    index,
    done,
    next: () => setIndex((i) => i + 1),
    goTo: (target: T) => setIndex(Math.max(0, stages.indexOf(target))),
    total: stages.length,
  }
}
