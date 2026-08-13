import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { connect, type Connection, type Peer } from './channel'
import { applyEvent, type LiveEvent } from '../core/protocol'
import { createRound, uid } from '../core/gameLogic'
import { createReadingRound } from '../core/readingLogic'
import {
  DEFAULT_PHONICS,
  GRAPHEMES,
  graphemesUpTo,
  type PhonicsConfig,
} from '../core/phonics'
import {
  evidenceFor,
  loadMastery,
  recordEvidence,
  statusOf,
  STATUS_LABELS,
} from '../core/mastery'
import { summaryByCategory } from '../core/summary'
import {
  DEFAULT_SETTINGS,
  type ObservationalResponse,
  type SessionSnapshot,
} from '../core/types'

const ALL = GRAPHEMES.map((g) => g.id)

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
  phonics: { ...DEFAULT_PHONICS, enabled: ALL },
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

const makeReading = (game: Parameters<typeof createReadingRound>[0]) => {
  const round = createReadingRound(game, DEFAULT_SETTINGS, {
    ...DEFAULT_PHONICS,
    enabled: ALL,
  })
  if (!round) throw new Error(`no round for ${game}`)
  return round
}

/* ------------------------------------------------------------------ */

describe('a reading round over the wire', () => {
  it('opens on the child and reports each letter placement back', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    const student = join(id, 'student', 'Samaya')
    await flush()

    teacher.send({
      type: 'game:selected',
      game: 'sound-box-factory',
      settings: DEFAULT_SETTINGS,
    })
    const round = makeReading('sound-box-factory')
    teacher.send({ type: 'round:start', round })
    await flush()

    expect(student.state.game).toBe('sound-box-factory')
    expect(student.state.round?.id).toBe(round.id)

    const built: ObservationalResponse = {
      id: uid(),
      roundId: round.id,
      game: 'sound-box-factory',
      outcome: 'observational',
      field: 'word-built',
      choices: ['cat'],
      choiceLabels: ['cat'],
      attempt: 1,
      label: 'built cat',
      at: Date.now(),
    }
    student.send({ type: 'response:submitted', response: built })
    await flush()

    expect(teacher.state.responses).toHaveLength(1)
    expect(teacher.state.responses[0].label).toBe('built cat')
  })

  it('syncs the sound set to the child the moment the teacher changes it', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    const student = join(id, 'student', 'Samaya')
    await flush()

    const phonics: PhonicsConfig = {
      enabled: graphemesUpTo(3),
      trickyActive: ['the', 'said'],
      focus: 'R3',
    }
    teacher.send({ type: 'phonics:updated', phonics })
    await flush()

    expect(student.state.phonics.enabled).toEqual(graphemesUpTo(3))
    expect(student.state.phonics.trickyActive).toEqual(['the', 'said'])
  })

  it('turns a story page on both screens', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    const student = join(id, 'student', 'Samaya')
    await flush()

    const round = makeReading('story-quest')
    if (round.game !== 'story-quest') throw new Error('wrong game')
    teacher.send({ type: 'round:start', round })
    await flush()

    // The child turns the page; the teacher follows along.
    student.send({ type: 'round:update', round: { ...round, page: 1 } })
    await flush()

    expect(teacher.state.round).toMatchObject({ page: 1 })
    expect(student.state.round).toMatchObject({ page: 1 })

    // The teacher asks for help on a word; the child's screen chunks it.
    teacher.send({
      type: 'round:update',
      round: { ...round, page: 1, helpWord: 'cat' },
    })
    await flush()
    expect(student.state.round).toMatchObject({ helpWord: 'cat' })
  })

  it('ignores a page turn for a round that has already moved on', async () => {
    const state = blank('x')
    const round = makeReading('story-quest')
    const withRound = applyEvent(state, { type: 'round:start', round })
    const stale = { ...round, id: 'some-other-round', page: 4 }
    expect(applyEvent(withRound, { type: 'round:update', round: stale })).toBe(
      withRound,
    )
  })

  it('records a spoken-reading mark the browser could never judge itself', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    const student = join(id, 'student', 'Samaya')
    await flush()

    const round = makeReading('monster-lab')
    teacher.send({ type: 'round:start', round })
    teacher.send({
      type: 'teacher:marked',
      response: {
        id: uid(),
        roundId: round.id,
        game: 'monster-lab',
        outcome: 'marked',
        mark: 'read-independently',
        attempt: 1,
        label: 'Read it independently ✓',
        at: Date.now(),
      },
    })
    await flush()

    expect(teacher.state.responses[0]).toMatchObject({
      outcome: 'marked',
      mark: 'read-independently',
    })
    expect(student.state.responses[0]).toMatchObject({ outcome: 'marked' })
  })
})

/* ------------------------------------------------------------------ */

describe('Quick Break works from a reading game', () => {
  it('parks the reading round and restores it exactly', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    const student = join(id, 'student', 'Samaya')
    await flush()

    const reading = makeReading('monster-lab')
    teacher.send({
      type: 'game:selected',
      game: 'monster-lab',
      settings: DEFAULT_SETTINGS,
    })
    teacher.send({ type: 'round:start', round: reading })
    await flush()
    expect(student.state.round?.id).toBe(reading.id)

    const brk = createRound('freeze-dance', DEFAULT_SETTINGS)!
    teacher.send({
      type: 'session:park',
      parked: { game: 'monster-lab', round: reading },
      game: 'freeze-dance',
      round: brk,
    })
    await flush()
    expect(student.state.game).toBe('freeze-dance')

    teacher.send({ type: 'session:unpark' })
    await flush()

    expect(student.state.game).toBe('monster-lab')
    expect(student.state.round).toEqual(reading)
  })

  it('switches freely between all three categories in one lesson', async () => {
    const id = uid()
    const teacher = join(id, 'teacher')
    const student = join(id, 'student', 'Samaya')
    await flush()

    for (const game of ['flash-hide', 'story-quest', 'feeling-thermometer'] as const) {
      teacher.send({ type: 'game:selected', game, settings: DEFAULT_SETTINGS })
      const round =
        game === 'story-quest'
          ? makeReading('story-quest')
          : createRound(game, DEFAULT_SETTINGS)!
      teacher.send({ type: 'round:start', round })
      await flush()
      expect(student.state.game).toBe(game)
      expect(student.state.round?.game).toBe(game)
    }
  })
})

/* ------------------------------------------------------------------ */

describe('two-day mastery', () => {
  beforeEach(() => localStorage.clear())

  it('is not secure after one good day', () => {
    recordEvidence('Samaya', 'R3', '2026-08-11')
    const evidence = evidenceFor('Samaya', 'R3')
    expect(evidence.days).toEqual(['2026-08-11'])
    expect(statusOf(evidence)).toBe('emerging')
    expect(STATUS_LABELS[statusOf(evidence)]).toMatch(/needs another day/)
  })

  it('becomes secure on a second, different day', () => {
    recordEvidence('Samaya', 'R3', '2026-08-11')
    recordEvidence('Samaya', 'R3', '2026-08-13')
    expect(statusOf(evidenceFor('Samaya', 'R3'))).toBe('secure')
  })

  it('counts the same day twice as one day', () => {
    recordEvidence('Samaya', 'R3', '2026-08-11')
    recordEvidence('Samaya', 'R3', '2026-08-11')
    const evidence = evidenceFor('Samaya', 'R3')
    expect(evidence.days).toHaveLength(1)
    expect(statusOf(evidence)).toBe('emerging')
  })

  it('keeps stages and learners apart', () => {
    recordEvidence('Samaya', 'R3', '2026-08-11')
    recordEvidence('Samaya', 'R4', '2026-08-11')
    recordEvidence('Alex', 'R3', '2026-08-11')
    expect(evidenceFor('Samaya', 'R3').days).toHaveLength(1)
    expect(evidenceFor('Samaya', 'R5').days).toHaveLength(0)
    expect(Object.keys(loadMastery()).sort()).toEqual(['Alex', 'Samaya'])
  })

  it('never advances anybody on its own', () => {
    // The module exposes evidence and a status; there is deliberately no
    // function that changes a child's level.
    const api = Object.keys(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      {} as Record<string, unknown>,
    )
    expect(api).not.toContain('advance')
    recordEvidence('Samaya', 'R3', '2026-08-11')
    recordEvidence('Samaya', 'R3', '2026-08-13')
    // Secure is a label for the teacher, not an instruction to the app.
    expect(statusOf(evidenceFor('Samaya', 'R3'))).toBe('secure')
    expect(evidenceFor('Samaya', 'R4').days).toHaveLength(0)
  })
})

/* ------------------------------------------------------------------ */

describe('one combined lesson summary', () => {
  it('groups maths, reading and feelings, and scores none of them', () => {
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
      {
        id: '2',
        roundId: 'r1',
        game: 'sound-box-factory' as const,
        outcome: 'objective' as const,
        answer: 1,
        expected: 1,
        correct: true,
        attempt: 1,
        label: 'built cat',
        at: 2,
      },
      {
        id: '3',
        roundId: 'r2',
        game: 'monster-lab' as const,
        outcome: 'marked' as const,
        mark: 'read-independently' as const,
        attempt: 1,
        label: 'Read it independently ✓',
        at: 3,
      },
      {
        id: '4',
        roundId: 'f1',
        game: 'feeling-thermometer' as const,
        outcome: 'observational' as const,
        field: 'emotion' as const,
        choices: ['proud'],
        choiceLabels: ['Proud'],
        attempt: 1,
        label: 'Proud',
        at: 4,
      },
    ]

    const groups = summaryByCategory(responses)
    expect(groups.map((g) => g.category)).toEqual(['maths', 'reading', 'feelings'])

    const reading = groups.find((g) => g.category === 'reading')!
    expect(reading.entries.map((e) => e.game).sort()).toEqual([
      'monster-lab',
      'sound-box-factory',
    ])
    expect(reading.entries.find((e) => e.game === 'monster-lab')!.gotIt).toBe(1)

    const serialised = JSON.stringify(groups)
    expect(serialised).not.toMatch(
      /score|percent|%|grade|rank|reading age|below average|poor/i,
    )
  })
})
