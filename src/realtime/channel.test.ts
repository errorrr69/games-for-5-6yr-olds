import { afterEach, describe, expect, it } from 'vitest'
import { connect, type Connection, type Peer } from './channel'
import { applyEvent, type LiveEvent } from '../core/protocol'
import { createRound, uid } from '../core/gameLogic'
import {
  DEFAULT_SETTINGS,
  type Attempt,
  type Round,
  type SessionSnapshot,
} from '../core/types'
import { DEFAULT_PHONICS } from '../core/phonics'

/** createRound returns null when a sound set cannot support a game. */
const mustRound = (...args: Parameters<typeof createRound>): Round => {
  const round = createRound(...args)
  if (!round) throw new Error('expected a round for ' + args[0])
  return round
}


/**
 * The whole product depends on one loop: teacher commands reach the child,
 * child actions reach the teacher. These tests drive both ends through the
 * real transport used in demo mode.
 */

const open: Connection[] = []
afterEach(() => {
  while (open.length) open.pop()!.close()
})

/**
 * Peer discovery takes two hops: a newcomer says hello, and everyone
 * already present answers. Give the channel a few macrotasks to settle.
 */
const flush = async () => {
  for (let i = 0; i < 4; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

const blank = (id: string): SessionSnapshot => ({
  id,
  code: 'K7PX4A',
  status: 'waiting',
  settings: DEFAULT_SETTINGS,
  phonics: DEFAULT_PHONICS,
  responses: [],
  discoveries: {},
  startedAt: Date.now(),
  updatedAt: Date.now(),
})

type Side = {
  state: SessionSnapshot
  peers: Peer[]
  send: (event: LiveEvent) => void
}

function join(sessionId: string, role: 'teacher' | 'student', nickname?: string): Side {
  const side: Side = {
    state: blank(sessionId),
    peers: [],
    send: () => undefined,
  }
  const connection = connect(sessionId, {
    role,
    nickname,
    onEvent: (event) => {
      side.state = applyEvent(side.state, event)
    },
    onPeers: (peers) => {
      side.peers = peers
    },
  })
  open.push(connection)
  side.send = (event) => {
    side.state = applyEvent(side.state, event)
    connection.send(event)
  }
  return side
}

describe('the live lesson loop', () => {
  it('carries a game choice from teacher to child', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    const student = join(id, 'student', 'Samaya')
    await flush()

    teacher.send({
      type: 'game:selected',
      game: 'flash-hide',
      settings: DEFAULT_SETTINGS,
    })
    await flush()

    expect(student.state.game).toBe('flash-hide')
    expect(student.state.status).toBe('active')
  })

  it('carries a round to the child and the answer back to the teacher', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    const student = join(id, 'student', 'Samaya')
    await flush()

    const round = mustRound('flash-hide', DEFAULT_SETTINGS)
    teacher.send({ type: 'round:start', round })
    await flush()
    expect(student.state.round?.id).toBe(round.id)

    const expected = round.expected ?? 0
    const wrong: Attempt = {
      id: uid(),
      roundId: round.id,
      game: 'flash-hide',
      outcome: 'objective',
      answer: expected + 1,
      expected,
      correct: false,
      attempt: 1,
      label: `${expected + 1} → ${expected}`,
      at: Date.now(),
    }
    student.send({ type: 'response:submitted', response: wrong })
    await flush()

    // This is the exact behaviour that was broken before.
    expect(teacher.state.responses).toHaveLength(1)
    expect(teacher.state.responses[0]).toMatchObject({ answer: expected + 1 })
    expect(teacher.state.responses[0]).toMatchObject({ correct: false })

    teacher.send({ type: 'round:repeat', round: { ...round, shownAt: Date.now() } })
    await flush()
    expect(student.state.round?.id).toBe(round.id)

    const right: Attempt = { ...wrong, id: uid(), answer: expected, correct: true, attempt: 2, label: `${expected} ✓` }
    student.send({ type: 'response:submitted', response: right })
    await flush()

    expect(teacher.state.responses).toHaveLength(2)
    expect(teacher.state.responses[1]).toMatchObject({ correct: true })
  })

  it('shows the teacher who is connected, and who has gone', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    await flush()
    expect(teacher.peers).toHaveLength(0)

    const student = join(id, 'student', 'Samaya')
    await flush()

    expect(teacher.peers.map((p) => p.role)).toEqual(['student'])
    expect(teacher.peers[0].nickname).toBe('Samaya')
    expect(student.peers.map((p) => p.role)).toEqual(['teacher'])

    open.pop()!.close() // the child closes their laptop
    await flush()
    expect(teacher.peers).toHaveLength(0)
  })

  it('restores the current game and round for a child who reconnects', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    const first = join(id, 'student', 'Samaya')
    await flush()

    const round = mustRound('feed-monster', DEFAULT_SETTINGS)
    teacher.send({
      type: 'game:selected',
      game: 'feed-monster',
      settings: DEFAULT_SETTINGS,
    })
    teacher.send({ type: 'round:start', round })
    await flush()
    expect(first.state.round?.id).toBe(round.id)

    // The child's connection drops and a fresh page loads with nothing.
    open.splice(open.indexOf(open[1]), 1)[0].close()
    const reconnected = join(id, 'student', 'Samaya')
    await flush()
    expect(reconnected.state.round).toBeUndefined()

    // Announcing themselves is what triggers the teacher to resend state.
    reconnected.send({ type: 'student:ready', nickname: 'Samaya' })
    await flush()
    teacher.send({ type: 'session:sync', snapshot: teacher.state })
    await flush()

    expect(reconnected.state.game).toBe('feed-monster')
    expect(reconnected.state.round?.id).toBe(round.id)
    expect(reconnected.state.nickname).toBe('Samaya')
  })

  it('streams a child’s working to the teacher without touching stored state', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    const student = join(id, 'student', 'Samaya')
    await flush()

    const seen: string[] = []
    const watcher = connect(id, {
      role: 'teacher',
      onEvent: (event) => {
        if (event.type === 'interaction:update') seen.push(event.interaction.message)
      },
      onPeers: () => undefined,
    })
    open.push(watcher)
    await flush()

    for (const value of [3, 4, 5]) {
      student.send({
        type: 'interaction:update',
        interaction: {
          game: 'feed-monster',
          roundId: 'r1',
          kind: 'berry',
          value,
          message: `Bowl has ${value} of 5`,
        },
      })
    }
    await flush()

    expect(seen).toEqual([
      'Bowl has 3 of 5',
      'Bowl has 4 of 5',
      'Bowl has 5 of 5',
    ])
    expect(teacher.state.responses).toHaveLength(0)
  })

  it('ends the lesson on both screens at once', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    const student = join(id, 'student', 'Samaya')
    await flush()

    teacher.send({ type: 'session:end' })
    await flush()

    expect(student.state.status).toBe('ended')
    expect(teacher.state.status).toBe('ended')
  })
})
