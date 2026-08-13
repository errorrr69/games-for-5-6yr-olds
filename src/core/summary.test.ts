import { describe, expect, it } from 'vitest'
import { formatDuration, summarise } from './summary'
import type { Attempt } from './types'

const make = (patch: Partial<Attempt>): Attempt => ({
  id: Math.random().toString(36),
  roundId: 'r1',
  game: 'flash-hide',
  outcome: 'objective',
  answer: 5,
  expected: 5,
  correct: true,
  attempt: 1,
  label: '5 ✓',
  at: 0,
  ...patch,
})

describe('session summary', () => {
  it('separates first-attempt correct from needing another look', () => {
    const [flash] = summarise([
      make({ roundId: 'r1' }),
      make({ roundId: 'r2', answer: 4, correct: false, attempt: 1 }),
      make({ roundId: 'r2', attempt: 2 }),
      make({ roundId: 'r3' }),
    ])
    expect(flash.rounds).toBe(3)
    expect(flash.firstTime).toBe(2)
    expect(flash.anotherLook).toBe(1)
    expect(flash.stillExploring).toBe(0)
  })

  it('counts an unfinished question as still exploring, not as a failure', () => {
    const [flash] = summarise([
      make({ roundId: 'r1', answer: 3, correct: false }),
      make({ roundId: 'r1', answer: 2, correct: false, attempt: 2 }),
    ])
    expect(flash.stillExploring).toBe(1)
    expect(flash.firstTime).toBe(0)
  })

  it('does not count a prediction as a question', () => {
    const [line] = summarise([
      make({ game: 'number-line', roundId: 'r1', kind: 'prediction' }),
      make({ game: 'number-line', roundId: 'r1', kind: 'final' }),
    ])
    expect(line.rounds).toBe(1)
    expect(line.firstTime).toBe(1)
  })

  it('groups by game', () => {
    const report = summarise([
      make({ game: 'flash-hide', roundId: 'a' }),
      make({ game: 'feed-monster', roundId: 'b' }),
      make({ game: 'feed-monster', roundId: 'c' }),
    ])
    expect(report).toHaveLength(2)
    expect(report.find((r) => r.game === 'feed-monster')?.rounds).toBe(2)
  })
})

describe('formatDuration', () => {
  it('reads naturally', () => {
    expect(formatDuration(0)).toBe('just started')
    expect(formatDuration(60_000)).toBe('1 minute')
    expect(formatDuration(32 * 60_000)).toBe('32 minutes')
  })
})
