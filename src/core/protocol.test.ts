import { describe, expect, it } from 'vitest'
import { applyEvent, isLiveEvent } from './protocol'
import { createRound } from './gameLogic'
import {
  DEFAULT_SETTINGS,
  type Attempt,
  type Round,
  type SessionSnapshot,
} from './types'
import { DEFAULT_PHONICS } from './phonics'

/** createRound returns null when a sound set cannot support a game. */
const mustRound = (...args: Parameters<typeof createRound>): Round => {
  const round = createRound(...args)
  if (!round) throw new Error('expected a round for ' + args[0])
  return round
}


const base = (): SessionSnapshot => ({
  id: 'session-1',
  code: 'K7PX4A',
  status: 'waiting',
  settings: DEFAULT_SETTINGS,
  phonics: DEFAULT_PHONICS,
  responses: [],
  discoveries: {},
  startedAt: 1000,
  updatedAt: 1000,
})

const attempt = (patch: Partial<Attempt> = {}): Attempt => ({
  id: 'a1',
  roundId: 'r1',
  game: 'flash-hide',
  outcome: 'objective',
  answer: 4,
  expected: 5,
  correct: false,
  attempt: 1,
  label: '4 → 5',
  at: 1000,
  ...patch,
})

describe('event guard', () => {
  it('accepts known events and rejects everything else', () => {
    expect(isLiveEvent({ type: 'student:ready', nickname: 'Samaya' })).toBe(true)
    expect(isLiveEvent({ type: 'not:a:real:event' })).toBe(false)
    expect(isLiveEvent({ hello: 'world' })).toBe(false)
    expect(isLiveEvent(null)).toBe(false)
    expect(isLiveEvent('round:start')).toBe(false)
  })
})

describe('applyEvent', () => {
  it('puts the child on the teacher’s screen', () => {
    const next = applyEvent(base(), {
      type: 'student:joined',
      nickname: 'Samaya',
    })
    expect(next.nickname).toBe('Samaya')
    expect(next.status).toBe('active')
  })

  it('carries a teacher game choice through to state', () => {
    const next = applyEvent(base(), {
      type: 'game:selected',
      game: 'flash-hide',
      settings: DEFAULT_SETTINGS,
    })
    expect(next.game).toBe('flash-hide')
    expect(next.round).toBeUndefined()
    expect(next.status).toBe('active')
  })

  it('records a student answer on the teacher side', () => {
    const answered = applyEvent(base(), {
      type: 'response:submitted',
      response: attempt(),
    })
    expect(answered.responses).toHaveLength(1)
    expect(answered.responses[0]).toMatchObject({
      outcome: 'objective',
      answer: 4,
      expected: 5,
    })
  })

  it('ignores a replayed answer so retries never double-count', () => {
    const once = applyEvent(base(), {
      type: 'response:submitted',
      response: attempt(),
    })
    const twice = applyEvent(once, {
      type: 'response:submitted',
      response: attempt(),
    })
    expect(twice.responses).toHaveLength(1)
    expect(twice).toBe(once)
  })

  it('keeps a second look as its own attempt', () => {
    const first = applyEvent(base(), {
      type: 'response:submitted',
      response: attempt(),
    })
    const second = applyEvent(first, {
      type: 'response:submitted',
      response: attempt({ id: 'a2', answer: 5, correct: true, attempt: 2 }),
    })
    expect(second.responses.map((a) => a.attempt)).toEqual([1, 2])
  })

  it('treats reversed bonds as one discovery', () => {
    let state = applyEvent(base(), {
      type: 'bond:discovered',
      target: 5,
      bond: [3, 2],
    })
    state = applyEvent(state, {
      type: 'bond:discovered',
      target: 5,
      bond: [2, 3],
    })
    expect(state.discoveries[5]).toEqual([[2, 3]])
  })

  it('never persists ephemeral interactions', () => {
    const state = base()
    const next = applyEvent(state, {
      type: 'interaction:update',
      interaction: {
        game: 'feed-monster',
        roundId: 'r1',
        kind: 'berry',
        value: 3,
        message: 'Bowl has 3 of 5',
      },
    })
    expect(next).toBe(state)
  })

  it('restores a reconnecting learner without wiping the teacher’s note', () => {
    const teacherSide: SessionSnapshot = { ...base(), note: 'private' }
    const live: SessionSnapshot = {
      ...base(),
      game: 'number-line',
      round: mustRound('number-line', DEFAULT_SETTINGS),
      status: 'active',
    }
    const next = applyEvent(teacherSide, { type: 'session:sync', snapshot: live })
    expect(next.game).toBe('number-line')
    expect(next.round).toBeDefined()
    expect(next.note).toBe('private')
  })

  it('ends the lesson', () => {
    expect(applyEvent(base(), { type: 'session:end' }).status).toBe('ended')
  })
})
