import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { GameStage } from './index'
import { createRound, uid } from '../core/gameLogic'
import { FACES, SCENES, switchRule, OPPOSITE_PAIRS } from '../core/feelings'
import {
  DEFAULT_SETTINGS,
  type Bond,
  type Cue,
  type Interaction,
  type Round,
  type Settings,
} from '../core/types'
import type { AnswerOptions, ObservationInput } from './shared'

/** createRound returns null when a sound set cannot support a game. */
const mustRound = (...args: Parameters<typeof createRound>): Round => {
  const round = createRound(...args)
  if (!round) throw new Error('expected a round for ' + args[0])
  return round
}


afterEach(cleanup)

type Recorded = {
  answers: { answer: number; options?: AnswerOptions }[]
  observations: ObservationInput[]
  interactions: Omit<Interaction, 'game' | 'roundId'>[]
}

function mount(round: Round, cue?: Cue) {
  const log: Recorded = { answers: [], observations: [], interactions: [] }
  render(
    <GameStage
      round={round}
      nickname="Samaya"
      cue={cue}
      discoveries={{}}
      onAnswer={(answer, options) => log.answers.push({ answer, options })}
      onObserve={(input) => log.observations.push(input)}
      onInteraction={(patch) => log.interactions.push(patch)}
      onBond={() => undefined}
      onRoundChange={() => undefined}
    />,
  )
  return log
}

const settings = (patch: Partial<Settings>): Settings => ({
  ...DEFAULT_SETTINGS,
  ...patch,
})

const cue = (partial: Partial<Cue> & { headline: string }): Cue => ({
  id: uid(),
  roundId: 'r1',
  kind: 'opposite',
  sentAt: Date.now(),
  ...partial,
})

/* ------------------------------------------------------------------ */

describe('rounds carry no correct answer where none exists', () => {
  it('gives Feelings & Focus rounds no `expected` at all', () => {
    for (const game of [
      'feeling-thermometer',
      'mirror-faces',
      'scavenger-hunt',
      'rock-buddy',
      'freeze-dance',
    ] as const) {
      const round = mustRound(game, DEFAULT_SETTINGS)
      expect(round.expected).toBeUndefined()
    }
  })

  it('still gives maths rounds one', () => {
    expect(mustRound('flash-hide', DEFAULT_SETTINGS).expected).toBeDefined()
  })

  it('mounts all six without crashing', () => {
    for (const game of [
      'feeling-thermometer',
      'opposite-game',
      'mirror-faces',
      'scavenger-hunt',
      'rock-buddy',
      'freeze-dance',
    ] as const) {
      cleanup()
      expect(() => mount(mustRound(game, DEFAULT_SETTINGS))).not.toThrow()
    }
  })
})

/* ------------------------------------------------------------------ */

describe('Feeling Thermometer', () => {
  const round = () =>
    mustRound(
      'feeling-thermometer',
      settings({
        'feeling-thermometer': {
          mode: 'me',
          vocabulary: 'starter',
          askBody: true,
          askStrategy: true,
        },
      }),
    )

  it('walks intensity → feeling → body → strategy, observing each', () => {
    const log = mount(round())

    fireEvent.click(screen.getByRole('button', { name: /Big.*it fills me up/s }))
    expect(log.interactions.at(-1)!.message).toContain('Big')
    fireEvent.click(screen.getByRole('button', { name: /That’s the one/ }))

    const intensity = log.observations.find((o) => o.field === 'intensity')!
    expect(intensity.level).toBe(4)
    expect(intensity.label).toBe('Big (4/5)')

    fireEvent.click(screen.getByRole('button', { name: 'Worried' }))
    expect(log.observations.at(-1)).toMatchObject({ field: 'emotion' })

    fireEvent.click(screen.getByRole('button', { name: 'Busy legs' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hot face' }))
    fireEvent.click(screen.getByRole('button', { name: /That’s where/ }))
    const body = log.observations.find((o) => o.field === 'body-clue')!
    expect(body.choices.map((c) => c.id)).toEqual(['busy-legs', 'hot-face'])

    fireEvent.click(screen.getByRole('button', { name: 'Move my body' }))
    expect(log.observations.at(-1)).toMatchObject({ field: 'strategy' })

    // Not one marked answer anywhere in a whole thermometer round.
    expect(log.answers).toHaveLength(0)
    expect(log.observations.every((o) => !('correct' in o))).toBe(true)
  })

  it('always offers a way out of naming the feeling', () => {
    const log = mount(round())
    fireEvent.click(screen.getByRole('button', { name: /Calm.*settled/s }))
    fireEvent.click(screen.getByRole('button', { name: /That’s the one/ }))
    fireEvent.click(screen.getByRole('button', { name: 'I’m not sure' }))
    expect(log.observations.at(-1)!.choices.map((c) => c.id)).toEqual([
      'not-sure',
    ])
  })

  it('lets the child skip the body stage entirely', () => {
    const log = mount(round())
    fireEvent.click(screen.getByRole('button', { name: /Medium/s }))
    fireEvent.click(screen.getByRole('button', { name: /That’s the one/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Happy' }))
    fireEvent.click(screen.getByRole('button', { name: 'Skip this one' }))
    expect(log.observations.some((o) => o.field === 'body-clue')).toBe(false)
    expect(screen.getByText(/What does your body need next/)).toBeTruthy()
  })

  it('asks about a character instead of the child in Character Mode', () => {
    const characterRound = mustRound(
      'feeling-thermometer',
      settings({
        'feeling-thermometer': {
          ...DEFAULT_SETTINGS['feeling-thermometer'],
          mode: 'character',
        },
      }),
    )
    if (characterRound.game !== 'feeling-thermometer') throw new Error('wrong')
    expect(characterRound.scenario).toBeDefined()
    mount(characterRound)
    // The name appears in both the scene-setting line and the question.
    expect(
      screen.getAllByText(new RegExp(characterRound.scenario!.who)).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText(/Where might .*'s feeling be|Where might .*’s feeling be/)).toBeTruthy()
  })

  it('offers six words on starter and the full list on wider', () => {
    const starter = mustRound('feeling-thermometer', DEFAULT_SETTINGS)
    const wider = mustRound(
      'feeling-thermometer',
      settings({
        'feeling-thermometer': {
          ...DEFAULT_SETTINGS['feeling-thermometer'],
          vocabulary: 'wider',
        },
      }),
    )
    if (starter.game !== 'feeling-thermometer') throw new Error('wrong')
    if (wider.game !== 'feeling-thermometer') throw new Error('wrong')
    // Six words plus "I'm not sure".
    expect(starter.emotions).toHaveLength(7)
    expect(wider.emotions.length).toBeGreaterThan(starter.emotions.length)
    expect(starter.emotions.at(-1)!.id).toBe('not-sure')
    expect(wider.emotions.at(-1)!.id).toBe('not-sure')
  })
})

/* ------------------------------------------------------------------ */

describe('The Opposite Game', () => {
  const screenRound = () =>
    mustRound(
      'opposite-game',
      settings({ 'opposite-game': { level: 1, mode: 'screen' } }),
    )

  it('marks a tapped opposite correctly — this one does have a right answer', () => {
    const round = screenRound()
    if (round.game !== 'opposite-game') throw new Error('wrong game')
    const pair = round.pairs[0]

    const log = mount(
      round,
      cue({ headline: pair.command.label, expect: pair.opposite.id }),
    )

    fireEvent.click(screen.getByRole('button', { name: pair.opposite.label }))
    expect(log.answers.at(-1)!.options?.correct).toBe(true)
  })

  it('calls a wrong tap a wobble, never a failure', () => {
    const round = screenRound()
    if (round.game !== 'opposite-game') throw new Error('wrong game')
    const pair = round.pairs[0]

    const log = mount(
      round,
      cue({ headline: pair.command.label, expect: pair.opposite.id }),
    )

    fireEvent.click(screen.getByRole('button', { name: pair.command.label }))
    expect(log.answers.at(-1)!.options?.correct).toBe(false)
    expect(screen.getByText(/brain brakes wobbled/i)).toBeTruthy()
    expect(screen.queryByText(/wrong/i)).toBeNull()
    expect(screen.queryByText(/failed/i)).toBeNull()
    expect(screen.getByRole('button', { name: /Try that one again/ })).toBeTruthy()
  })

  it('never auto-marks a body round — the teacher decides', () => {
    const round = mustRound(
      'opposite-game',
      settings({ 'opposite-game': { level: 1, mode: 'observed' } }),
    )
    const log = mount(round, cue({ headline: 'JUMP' }))
    expect(screen.getByText(/Show Florie with your body/)).toBeTruthy()
    // No tappable answer cards exist at all in this mode.
    expect(document.querySelector('.opposite-choices')).toBeNull()
    expect(log.answers).toHaveLength(0)
  })

  it('keeps the command but changes its meaning on a rule switch', () => {
    const pairs = OPPOSITE_PAIRS.slice(0, 2)
    const switched = switchRule(pairs)
    expect(switched[0].command.id).toBe(pairs[0].command.id)
    expect(switched[0].opposite.id).not.toBe(pairs[0].opposite.id)
    expect(switched[1]).toEqual(pairs[1])
  })

  it('only offers tappable pairs in screen mode', () => {
    for (let i = 0; i < 20; i++) {
      const round = mustRound(
        'opposite-game',
        settings({ 'opposite-game': { level: 3, mode: 'screen' } }),
      )
      if (round.game !== 'opposite-game') throw new Error('wrong game')
      // "JUMP" cannot be answered by tapping a card.
      expect(round.pairs.some((p) => p.id === 'jump-sit')).toBe(false)
    }
  })
})

/* ------------------------------------------------------------------ */

describe('Mirror Face Charades', () => {
  it('records a reading without ever marking it', () => {
    const round = mustRound('mirror-faces', DEFAULT_SETTINGS)
    if (round.game !== 'mirror-faces') throw new Error('wrong game')

    const log = mount(round)
    fireEvent.click(screen.getByRole('button', { name: round.options[0].label }))

    const observation = log.observations.at(-1)!
    expect(observation.field).toBe('face-emotion')
    expect(observation.possible).toEqual(round.possible)
    expect(log.answers).toHaveLength(0)
  })

  it('keeps ambiguous faces genuinely open to several readings', () => {
    const ambiguous = FACES.filter((f) => f.ambiguous)
    expect(ambiguous.length).toBeGreaterThan(0)
    for (const face of ambiguous) {
      expect(face.possible.length).toBeGreaterThanOrEqual(3)
    }
    // And they are excluded unless the teacher opts in.
    for (let i = 0; i < 30; i++) {
      const round = mustRound('mirror-faces', DEFAULT_SETTINGS)
      if (round.game !== 'mirror-faces') throw new Error('wrong game')
      expect(round.ambiguous).toBe(false)
    }
  })

  it('lets the child correct a deliberately silly guess', () => {
    const round = mustRound(
      'mirror-faces',
      settings({
        'mirror-faces': { mode: 'silly', askClue: true, includeAmbiguous: false },
      }),
    )
    const log = mount(round, cue({ kind: 'silly-guess', headline: 'sleepy' }))
    fireEvent.click(screen.getByRole('button', { name: /NOOO/ }))
    expect(log.observations.at(-1)).toMatchObject({ field: 'protest' })
  })

  it('asks the child to pull a face without touching any camera', () => {
    const round = mustRound(
      'mirror-faces',
      settings({
        'mirror-faces': {
          mode: 'child-face',
          askClue: false,
          includeAmbiguous: false,
        },
      }),
    )
    mount(round, cue({ kind: 'face', headline: 'SURPRISED' }))
    expect(screen.getByText('SURPRISED')).toBeTruthy()
    expect(screen.getByText(/No camera is used by this game/)).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ */

describe('Character Scavenger Hunt', () => {
  it('syncs the chosen character and walks the follow-up prompts in order', () => {
    const round = mustRound(
      'scavenger-hunt',
      settings({
        'scavenger-hunt': { askWhy: true, askNext: true, askOther: true },
      }),
    )
    if (round.game !== 'scavenger-hunt') throw new Error('wrong game')
    expect(round.steps).toEqual(['find', 'why', 'next', 'other'])

    const log = mount(round)
    const figures = document.querySelectorAll('.hunt-figure')
    expect(figures.length).toBeGreaterThan(1)

    fireEvent.click(figures[0])
    expect(log.interactions.at(-1)!.message).toContain('Picked')
    const pick = log.observations.at(-1)!
    expect(pick.field).toBe('character')
    expect(pick.possible!.length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Their face' }))
    expect(log.observations.at(-1)).toMatchObject({ field: 'reason' })

    fireEvent.click(screen.getByRole('button', { name: 'Ask to join in' }))
    expect(log.observations.at(-1)).toMatchObject({ field: 'next-step' })

    expect(screen.getByText(/How might one of the others be feeling/)).toBeTruthy()
  })

  it('ships at least twelve original scenes, each with more than one reading', () => {
    expect(SCENES.length).toBeGreaterThanOrEqual(12)
    for (const scene of SCENES) {
      expect(scene.figures.length).toBeGreaterThanOrEqual(2)
      const readings = new Set(scene.figures.flatMap((f) => f.might))
      expect(readings.size).toBeGreaterThanOrEqual(3)
      for (const figure of scene.figures) {
        expect(figure.might.length).toBeGreaterThan(0)
      }
    }
  })

  it('only asks for a feeling the scene can actually show', () => {
    for (let i = 0; i < 40; i++) {
      const round = mustRound('scavenger-hunt', DEFAULT_SETTINGS)
      if (round.game !== 'scavenger-hunt') throw new Error('wrong game')
      const scene = SCENES.find((s) => s.id === round.scene)!
      const present = new Set(scene.figures.flatMap((f) => f.might))
      expect(present.has(round.looksFor.id)).toBe(true)
    }
  })
})

/* ------------------------------------------------------------------ */

describe('Rock the Buddy', () => {
  it('runs the breaths and finishes with no score', () => {
    vi.useFakeTimers()
    try {
      const round = mustRound(
        'rock-buddy',
        settings({
          'rock-buddy': {
            breaths: 3,
            pace: 'slow',
            position: 'sit',
            askReflection: true,
          },
        }),
      )
      const log = mount(round)

      fireEvent.click(screen.getByRole('button', { name: /I’ve got my buddy/ }))
      act(() => void vi.advanceTimersByTime(30000))

      expect(log.interactions.filter((i) => i.kind === 'breath')).toHaveLength(3)
      expect(screen.getByText(/3 slow breaths, all done/)).toBeTruthy()
      expect(log.answers).toHaveLength(0)

      const completion = log.observations.find((o) => o.field === 'breathing')!
      expect(completion.level).toBe(3)
    } finally {
      vi.useRealTimers()
    }
  })

  it('offers a seated option and never demands the child lies down', () => {
    const round = mustRound(
      'rock-buddy',
      settings({
        'rock-buddy': {
          breaths: 3,
          pace: 'slow',
          position: 'sit',
          askReflection: false,
        },
      }),
    )
    mount(round)
    expect(screen.getByText('Sit somewhere comfy.')).toBeTruthy()
    expect(screen.getByText(/No buddy\? That’s okay/)).toBeTruthy()
  })

  it('accepts every reflection, including "I feel the same"', () => {
    vi.useFakeTimers()
    try {
      const round = mustRound('rock-buddy', DEFAULT_SETTINGS)
      const log = mount(round)
      fireEvent.click(screen.getByRole('button', { name: /I’ve got my buddy/ }))
      act(() => void vi.advanceTimersByTime(30000))
      fireEvent.click(screen.getByRole('button', { name: 'I feel the same' }))
      expect(log.observations.at(-1)).toMatchObject({ field: 'reflection' })
      expect(screen.getByText(/thank you for noticing/)).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })
})

/* ------------------------------------------------------------------ */

describe('Freeze Dance', () => {
  const round = (mode: 'classic' | 'opposite' = 'classic') =>
    mustRound('freeze-dance', settings({ 'freeze-dance': { mode } }))

  it('switches the whole screen between dancing and frozen', () => {
    mount(round(), cue({ kind: 'freeze', state: 'dance', headline: 'DANCE!' }))
    expect(document.querySelector('.stage.is-dancing')).not.toBeNull()
    expect(screen.getByText('DANCE!')).toBeTruthy()

    cleanup()
    mount(round(), cue({ kind: 'freeze', state: 'freeze', headline: 'FREEZE!' }))
    expect(document.querySelector('.stage.is-frozen')).not.toBeNull()
    expect(screen.getByText('FREEZE!')).toBeTruthy()
  })

  it('inverts the commands in Opposite Freeze', () => {
    // "FREEZE" now means move, so the floor must keep dancing.
    mount(
      round('opposite'),
      cue({ kind: 'freeze', state: 'freeze', headline: 'FREEZE!' }),
    )
    expect(document.querySelector('.stage.is-dancing')).not.toBeNull()
    expect(screen.getByText('FREEZE means… MOVE!')).toBeTruthy()
  })

  it('works with no cue at all, so the teacher can use their own music', () => {
    mount(round())
    expect(screen.getByText(/Wait for Florie to start the music/)).toBeTruthy()
  })
})
