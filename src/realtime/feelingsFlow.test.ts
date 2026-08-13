import { afterEach, describe, expect, it } from 'vitest'
import { connect, type Connection, type Peer } from './channel'
import { applyEvent, type LiveEvent } from '../core/protocol'
import { createRound, uid } from '../core/gameLogic'
import { summarise, summaryByCategory } from '../core/summary'
import {
  DEFAULT_SETTINGS,
  type Cue,
  type ObservationalResponse,
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
 * Feelings & Focus rides the same realtime loop as the maths games. These
 * tests drive both ends through the real transport.
 */

const open: Connection[] = []
afterEach(() => {
  while (open.length) open.pop()!.close()
})

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
  const side: Side = { state: blank(sessionId), peers: [], send: () => undefined }
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

const observation = (
  patch: Partial<ObservationalResponse> & { roundId: string },
): ObservationalResponse => ({
  id: uid(),
  game: 'feeling-thermometer',
  outcome: 'observational',
  field: 'emotion',
  choices: ['excited'],
  choiceLabels: ['Excited'],
  attempt: 1,
  label: 'Excited',
  at: Date.now(),
  ...patch,
})

/* ------------------------------------------------------------------ */

describe('a Feelings & Focus round over the wire', () => {
  it('opens on the child and reports each choice back, unmarked', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    const student = join(id, 'student', 'Samaya')
    await flush()

    teacher.send({
      type: 'game:selected',
      game: 'feeling-thermometer',
      settings: DEFAULT_SETTINGS,
    })
    const round = mustRound('feeling-thermometer', DEFAULT_SETTINGS)
    teacher.send({ type: 'round:start', round })
    await flush()

    expect(student.state.game).toBe('feeling-thermometer')
    expect(student.state.round?.id).toBe(round.id)

    student.send({
      type: 'response:submitted',
      response: observation({
        roundId: round.id,
        field: 'intensity',
        choices: ['level-4'],
        choiceLabels: ['Big'],
        level: 4,
        label: 'Big (4/5)',
      }),
    })
    student.send({
      type: 'response:submitted',
      response: observation({ roundId: round.id }),
    })
    student.send({
      type: 'response:submitted',
      response: observation({
        roundId: round.id,
        field: 'body-clue',
        choices: ['busy-legs'],
        choiceLabels: ['Busy legs'],
        label: 'Busy legs',
      }),
    })
    await flush()

    expect(teacher.state.responses).toHaveLength(3)
    expect(teacher.state.responses[0]).toMatchObject({
      outcome: 'observational',
      level: 4,
    })
    expect(teacher.state.responses[1].label).toBe('Excited')
    expect(teacher.state.responses[2].label).toBe('Busy legs')

    // Nothing anywhere in this flow was marked right or wrong.
    for (const response of teacher.state.responses) {
      expect(response.outcome).toBe('observational')
      expect('correct' in response).toBe(false)
    }
  })

  it('sends a live instruction and keeps it for a child who reconnects', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    const student = join(id, 'student', 'Samaya')
    await flush()

    const round = mustRound('freeze-dance', DEFAULT_SETTINGS)
    teacher.send({ type: 'round:start', round })
    await flush()

    const freeze: Cue = {
      id: uid(),
      roundId: round.id,
      kind: 'freeze',
      state: 'freeze',
      headline: 'FREEZE!',
      sentAt: Date.now(),
    }
    teacher.send({ type: 'cue:sent', cue: freeze })
    await flush()
    expect(student.state.cue?.headline).toBe('FREEZE!')

    // The child reloads mid-freeze and gets the instruction back.
    const fresh = join(id, 'student', 'Samaya')
    teacher.send({ type: 'session:sync', snapshot: teacher.state })
    await flush()
    expect(fresh.state.cue?.headline).toBe('FREEZE!')
    expect(fresh.state.round?.id).toBe(round.id)
  })

  it('records a teacher mark without ever showing it to the child', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    const student = join(id, 'student', 'Samaya')
    await flush()

    const round = mustRound('opposite-game', DEFAULT_SETTINGS)
    teacher.send({ type: 'round:start', round })
    teacher.send({
      type: 'teacher:marked',
      response: {
        id: uid(),
        roundId: round.id,
        game: 'opposite-game',
        outcome: 'marked',
        mark: 'got-it',
        attempt: 1,
        label: 'JUMP — got it ✓',
        at: Date.now(),
      },
    })
    await flush()

    expect(teacher.state.responses).toHaveLength(1)
    // The child's snapshot carries it too (one shared state), but nothing
    // in the child's game screens reads `responses` at all.
    expect(student.state.responses[0]).toMatchObject({ outcome: 'marked' })
  })
})

/* ------------------------------------------------------------------ */

describe('Quick Break', () => {
  it('parks the current game, switches, and restores it exactly', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    const student = join(id, 'student', 'Samaya')
    await flush()

    const maths = mustRound('ten-frame', DEFAULT_SETTINGS)
    teacher.send({
      type: 'game:selected',
      game: 'ten-frame',
      settings: DEFAULT_SETTINGS,
    })
    teacher.send({ type: 'round:start', round: maths })
    await flush()
    expect(student.state.round?.id).toBe(maths.id)

    // Samaya gets restless — straight into Freeze Dance.
    const brk = mustRound('freeze-dance', DEFAULT_SETTINGS)
    teacher.send({
      type: 'session:park',
      parked: { game: 'ten-frame', round: maths },
      game: 'freeze-dance',
      round: brk,
    })
    await flush()

    expect(student.state.game).toBe('freeze-dance')
    expect(student.state.round?.id).toBe(brk.id)
    expect(teacher.state.parked).toMatchObject({ game: 'ten-frame' })

    // Two minutes later, back to where they were.
    teacher.send({ type: 'session:unpark' })
    await flush()

    expect(student.state.game).toBe('ten-frame')
    expect(student.state.round?.id).toBe(maths.id)
    expect(student.state.round).toEqual(maths)
    expect(teacher.state.parked).toBeUndefined()
  })

  it('does nothing on unpark when nothing was parked', () => {
    const state = blank('x')
    expect(applyEvent(state, { type: 'session:unpark' })).toBe(state)
  })

  it('clears a stale instruction when the game changes', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    const student = join(id, 'student', 'Samaya')
    await flush()

    const round = mustRound('freeze-dance', DEFAULT_SETTINGS)
    teacher.send({ type: 'round:start', round })
    teacher.send({
      type: 'cue:sent',
      cue: {
        id: uid(),
        roundId: round.id,
        kind: 'freeze',
        state: 'freeze',
        headline: 'FREEZE!',
        sentAt: Date.now(),
      },
    })
    await flush()
    expect(student.state.cue).toBeDefined()

    teacher.send({
      type: 'game:selected',
      game: 'feeling-thermometer',
      settings: DEFAULT_SETTINGS,
    })
    await flush()
    expect(student.state.cue).toBeUndefined()
  })
})

/* ------------------------------------------------------------------ */

describe('mixed lesson summary', () => {
  it('groups maths and feelings separately and scores neither of them', () => {
    const responses = [
      {
        id: '1',
        roundId: 'm1',
        game: 'flash-hide' as const,
        outcome: 'objective' as const,
        answer: 5,
        expected: 5,
        correct: true,
        attempt: 1,
        label: '5 ✓',
        at: 1,
      },
      observation({ roundId: 'f1', field: 'emotion' }),
      observation({
        roundId: 'f1',
        field: 'body-clue',
        choices: ['tight-fists'],
        choiceLabels: ['Tight fists'],
        label: 'Tight fists',
      }),
      {
        id: '4',
        roundId: 'f2',
        game: 'opposite-game' as const,
        outcome: 'marked' as const,
        mark: 'got-it' as const,
        attempt: 1,
        label: 'JUMP ✓',
        at: 4,
      },
    ]

    const groups = summaryByCategory(responses)
    expect(groups.map((g) => g.category)).toEqual(['maths', 'feelings'])

    const feelings = groups.find((g) => g.category === 'feelings')!
    const thermometer = feelings.entries.find(
      (e) => e.game === 'feeling-thermometer',
    )!
    expect(thermometer.rounds).toBe(0)
    expect(thermometer.notes).toContain('Named Excited')
    expect(thermometer.notes).toContain('Noticed Tight fists')

    const opposite = feelings.entries.find((e) => e.game === 'opposite-game')!
    expect(opposite.gotIt).toBe(1)
    expect(opposite.neededAnother).toBe(0)

    // Nothing resembling a grade comes out of any of this.
    const serialised = JSON.stringify(summarise(responses))
    expect(serialised).not.toMatch(/score|percent|%|grade|rank|poor|below/i)
  })
})
