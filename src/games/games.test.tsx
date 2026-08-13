import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { GameStage } from './index'
import { createRound } from '../core/gameLogic'
import {
  DEFAULT_SETTINGS,
  type Attempt,
  type Bond,
  type Interaction,
  type Cue,
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
  bonds: { target: number; bond: Bond }[]
}

function mount(
  round: Round,
  discoveries: Record<number, Bond[]> = {},
  cue?: Cue,
) {
  const log: Recorded = { answers: [], observations: [], interactions: [], bonds: [] }
  render(
    <GameStage
      round={round}
      nickname="Samaya"
      discoveries={discoveries}
      cue={cue}
      onAnswer={(answer, options) => log.answers.push({ answer, options })}
      onObserve={(input) => log.observations.push(input)}
      onInteraction={(patch) => log.interactions.push(patch)}
      onBond={(target, bond) => log.bonds.push({ target, bond })}
      onRoundChange={() => undefined}
    />,
  )
  return log
}

const settings = (patch: Partial<Settings>): Settings => ({
  ...DEFAULT_SETTINGS,
  ...patch,
})

/* ------------------------------------------------------------------ */

describe('every game renders', () => {
  it('mounts all five without crashing', () => {
    for (const game of [
      'flash-hide',
      'feed-monster',
      'bond-garden',
      'ten-frame',
      'number-line',
    ] as const) {
      cleanup()
      const round = mustRound(game, DEFAULT_SETTINGS)
      expect(() => mount(round)).not.toThrow()
    }
  })
})

describe('Flash & Hide', () => {
  it('shows the pattern, hides it, then offers the answer pad', () => {
    vi.useFakeTimers()
    try {
      const round = mustRound('flash-hide', DEFAULT_SETTINGS)
      const log = mount(round)

      expect(screen.getByText(/Ready\? Watch carefully!/)).toBeTruthy()
      expect(document.querySelector('.flash-dots')).toBeNull()

      act(() => void vi.advanceTimersByTime(1200))
      expect(document.querySelector('.flash-dots')).not.toBeNull()

      act(() => void vi.advanceTimersByTime(round.game === 'flash-hide' ? round.duration : 0))
      expect(document.querySelector('.flash-dots')).toBeNull()

      const keys = screen.getAllByRole('button', { name: /^\d$/ })
      expect(keys.length).toBe(round.game === 'flash-hide' ? round.max : 0)
      fireEvent.click(keys[0])
      expect(log.answers).toHaveLength(1)
      expect(log.answers[0].answer).toBe(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('never offers a button above the configured maximum', () => {
    const round = mustRound(
      'flash-hide',
      settings({ 'flash-hide': { ...DEFAULT_SETTINGS['flash-hide'], max: 3 } }),
    )
    if (round.game !== 'flash-hide') throw new Error('wrong game')
    expect(round.max).toBe(3)
  })
})

describe('Feed the Monster', () => {
  it('reports each berry to the teacher and completes at the target', () => {
    const round = mustRound(
      'feed-monster',
      settings({
        'feed-monster': {
          ...DEFAULT_SETTINGS['feed-monster'],
          target: 5,
          start: 2,
          randomStart: false,
        },
      }),
    )
    if (round.game !== 'feed-monster') throw new Error('wrong game')
    const log = mount(round)

    const bowl = document.querySelector('[data-dropzone="bowl"]')!
    const berry = () => document.querySelector('.tray-item')!

    for (let i = 0; i < 3; i++) {
      fireEvent.pointerDown(berry(), { clientX: 0, clientY: 0 })
      fireEvent.pointerUp(berry(), { clientX: 0, clientY: 0 })
      fireEvent.click(bowl)
    }

    expect(log.interactions.map((i) => i.value)).toEqual([3, 4, 5])
    expect(log.interactions[0].message).toContain('Samaya added a berry')
    expect(log.answers).toHaveLength(1)
    expect(log.answers[0].answer).toBe(3)
    expect(log.answers[0].options?.correct).toBe(true)
    expect(screen.getByText(/2 and 3 make 5/)).toBeTruthy()
  })

  it('lets a child overfill and says something kind about it', () => {
    const round = mustRound(
      'feed-monster',
      settings({
        'feed-monster': {
          ...DEFAULT_SETTINGS['feed-monster'],
          target: 5,
          start: 4,
          randomStart: false,
        },
      }),
    )
    mount(round)
    const bowl = document.querySelector('[data-dropzone="bowl"]')!
    const berry = () => document.querySelector('.tray-item')!

    for (let i = 0; i < 2; i++) {
      fireEvent.pointerDown(berry(), { clientX: 0, clientY: 0 })
      fireEvent.pointerUp(berry(), { clientX: 0, clientY: 0 })
      fireEvent.click(bowl)
    }

    expect(screen.getByText(/only has room for 5/)).toBeTruthy()
    expect(screen.queryByText(/Wrong/i)).toBeNull()
  })
})

describe('Number Bond Garden', () => {
  it('reports every drop and records the bond once all are planted', () => {
    const round = mustRound(
      'bond-garden',
      settings({
        'bond-garden': {
          ...DEFAULT_SETTINGS['bond-garden'],
          target: 3,
          challenge: false,
        },
      }),
    )
    const log = mount(round)

    const left = document.querySelector('[data-dropzone="left"]')!
    const right = document.querySelector('[data-dropzone="right"]')!
    const flower = () => document.querySelector('.tray-item')!

    const drop = (zone: Element) => {
      fireEvent.pointerDown(flower(), { clientX: 0, clientY: 0 })
      fireEvent.pointerUp(flower(), { clientX: 0, clientY: 0 })
      fireEvent.click(zone)
    }

    drop(left)
    drop(left)
    drop(right)

    expect(log.interactions).toHaveLength(3)
    expect(log.interactions.at(-1)!.message).toBe(
      'Left pot 2 · right pot 1 · unplaced 0',
    )
    expect(log.bonds).toEqual([{ target: 3, bond: [1, 2] }])
    expect(screen.getByText(/2 and 1 make 3/)).toBeTruthy()
  })

  it('hides bonds the child has not found yet', () => {
    const round = mustRound(
      'bond-garden',
      settings({
        'bond-garden': { ...DEFAULT_SETTINGS['bond-garden'], target: 5 },
      }),
    )
    mount(round, { 5: [[2, 3]] })
    expect(screen.getByText('2 + 3')).toBeTruthy()
    expect(screen.queryByText('0 + 5')).toBeNull()
    expect(document.querySelectorAll('.discoveries li.is-hidden')).toHaveLength(2)
  })
})

describe('Ten-Frame Builder', () => {
  it('fills canonically and asks about the empty spaces', () => {
    const round = mustRound(
      'ten-frame',
      settings({
        'ten-frame': {
          ...DEFAULT_SETTINGS['ten-frame'],
          mode: 'build',
          target: 7,
          randomTarget: false,
        },
      }),
    )
    const log = mount(round)

    const frame = document.querySelector('[data-dropzone="frame"]')!
    const counter = () => document.querySelector('.tray-item')!

    for (let i = 0; i < 7; i++) {
      fireEvent.pointerDown(counter(), { clientX: 0, clientY: 0 })
      fireEvent.pointerUp(counter(), { clientX: 0, clientY: 0 })
      fireEvent.click(frame)
    }

    expect(log.interactions.map((i) => i.value)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(document.querySelectorAll('.ten-frame-cell svg')).toHaveLength(7)
    expect(screen.getByText('How many spaces are empty?')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '3' }))
    expect(log.answers.at(-1)!.options?.correct).toBe(true)
    expect(screen.getByText(/7 and 3 make 10/)).toBeTruthy()
  })

  it('flashes then hides the frame', () => {
    vi.useFakeTimers()
    try {
      const round = mustRound(
        'ten-frame',
        settings({
          'ten-frame': {
            ...DEFAULT_SETTINGS['ten-frame'],
            mode: 'flash',
            target: 6,
            randomTarget: false,
          },
        }),
      )
      mount(round)
      expect(document.querySelector('.ten-frame-grid.is-hidden')).toBeNull()
      act(() => void vi.advanceTimersByTime(1400))
      expect(document.querySelector('.ten-frame-grid.is-hidden')).not.toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('Number-Line Adventure', () => {
  it('reports every jump and then asks where the character landed', () => {
    const round = mustRound(
      'number-line',
      settings({
        'number-line': {
          ...DEFAULT_SETTINGS['number-line'],
          start: 3,
          amount: 2,
          operation: '+',
          randomStart: false,
          predict: false,
        },
      }),
    )
    if (round.game !== 'number-line') throw new Error('wrong game')
    expect(round.start).toBe(3)
    expect(round.expected).toBe(5)

    const log = mount(round)
    const jump = screen.getByRole('button', { name: /JUMP/ })
    fireEvent.click(jump)
    fireEvent.click(screen.getByRole('button', { name: /JUMP/ }))

    expect(log.interactions.map((i) => i.message)).toEqual([
      'Samaya jumped 3 → 4 (1 of 2)',
      'Samaya jumped 4 → 5 (2 of 2)',
    ])

    fireEvent.click(screen.getByRole('button', { name: '5' }))
    expect(log.answers.at(-1)!.options?.correct).toBe(true)
    expect(screen.getByText(/landed on 5/)).toBeTruthy()
  })

  it('takes a prediction before any jumping in predict mode', () => {
    const round = mustRound(
      'number-line',
      settings({
        'number-line': {
          ...DEFAULT_SETTINGS['number-line'],
          start: 2,
          amount: 3,
          operation: '+',
          randomStart: false,
          predict: true,
        },
      }),
    )
    const log = mount(round)

    expect(screen.queryByRole('button', { name: /JUMP/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '4' }))

    expect(log.answers).toHaveLength(1)
    expect(log.answers[0].options?.kind).toBe('prediction')
    expect(screen.getByRole('button', { name: /JUMP/ })).toBeTruthy()
  })
})

describe('Number Bond Garden — What’s Missing?', () => {
  it('can always be answered, even once every flower is planted', () => {
    const round = mustRound(
      'bond-garden',
      settings({
        'bond-garden': {
          ...DEFAULT_SETTINGS['bond-garden'],
          target: 5,
          challenge: true,
        },
      }),
    )
    if (round.game !== 'bond-garden') throw new Error('wrong game')
    expect(round.fixedLeft).toBeGreaterThan(0)
    expect(round.expected).toBe(round.target - round.fixedLeft)

    const log = mount(round)
    const right = document.querySelector('[data-dropzone="right"]')!
    const flower = () => document.querySelector('.tray-item')

    // Plant every remaining flower, which used to hide the confirm button.
    while (flower()) {
      const f = flower()!
      fireEvent.pointerDown(f, { clientX: 0, clientY: 0 })
      fireEvent.pointerUp(f, { clientX: 0, clientY: 0 })
      fireEvent.click(right)
    }

    const confirm = screen.getByRole('button', { name: /That’s how many!/ })
    fireEvent.click(confirm)

    expect(log.answers).toHaveLength(1)
    expect(log.answers[0].answer).toBe(round.expected)
    expect(log.answers[0].options?.correct).toBe(true)
  })
})
