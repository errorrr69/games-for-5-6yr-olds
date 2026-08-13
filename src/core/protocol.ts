import { canonicalBond, hasBond } from './gameLogic'
import type { PhonicsConfig } from './phonics'
import type {
  Bond,
  Cue,
  GameId,
  Interaction,
  ParkedGame,
  Response,
  Round,
  SessionSnapshot,
  Settings,
} from './types'

/* ------------------------------------------------------------------ *
 * The one place every realtime message is defined.
 * ------------------------------------------------------------------ */

export type TeacherEvent =
  | { type: 'game:selected'; game: GameId; settings: Settings }
  | { type: 'round:start'; round: Round }
  | { type: 'round:repeat'; round: Round }
  /**
   * Replaces the open round in place, keeping its id. Used for state that
   * moves inside a round: a story page turn, a ladder rung, a monster
   * getting its horns. Either side may send it.
   */
  | { type: 'round:update'; round: Round }
  | { type: 'phonics:updated'; phonics: PhonicsConfig }
  | { type: 'settings:updated'; settings: Settings }
  /** A live instruction inside an open round: JUMP, FREEZE, a face to pull. */
  | { type: 'cue:sent'; cue: Cue }
  | { type: 'cue:cleared' }
  /** The teacher watched something off-screen and noted it. */
  | { type: 'teacher:marked'; response: Response }
  /** Quick Break — set the current game aside and switch to another. */
  | { type: 'session:park'; parked: ParkedGame; game: GameId; round?: Round }
  /** Return to whatever Quick Break set aside. */
  | { type: 'session:unpark' }
  | { type: 'session:pause' }
  | { type: 'session:resume' }
  | { type: 'session:end' }
  /** Full state, sent whenever a peer announces itself (join or reconnect). */
  | { type: 'session:sync'; snapshot: SessionSnapshot }

export type StudentEvent =
  | { type: 'student:joined'; nickname: string }
  | { type: 'student:ready'; nickname: string }
  /** Covers marked answers and unmarked observations alike. */
  | { type: 'response:submitted'; response: Response }
  | { type: 'interaction:update'; interaction: Interaction }
  | { type: 'bond:discovered'; target: number; bond: Bond }

export type LiveEvent = TeacherEvent | StudentEvent

const EVENT_TYPES = new Set<string>([
  'game:selected',
  'round:start',
  'round:repeat',
  'round:update',
  'phonics:updated',
  'settings:updated',
  'cue:sent',
  'cue:cleared',
  'teacher:marked',
  'session:park',
  'session:unpark',
  'session:pause',
  'session:resume',
  'session:end',
  'session:sync',
  'student:joined',
  'student:ready',
  'response:submitted',
  'interaction:update',
  'bond:discovered',
])

export const isLiveEvent = (value: unknown): value is LiveEvent =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as { type?: unknown }).type === 'string' &&
  EVENT_TYPES.has((value as { type: string }).type)

/**
 * Every peer folds the same events into the same snapshot shape.
 *
 * This is what makes the teacher panel update when the child answers:
 * both browsers derive their view from the event stream rather than
 * from whatever happens to be in their own localStorage.
 */
export function applyEvent(
  snapshot: SessionSnapshot,
  event: LiveEvent,
): SessionSnapshot {
  const stamp = (next: Partial<SessionSnapshot>): SessionSnapshot => ({
    ...snapshot,
    ...next,
    updatedAt: Date.now(),
  })

  /** Responses are append-only and de-duplicated by id. */
  const record = (response: Response): SessionSnapshot => {
    if (snapshot.responses.some((r) => r.id === response.id)) return snapshot
    return stamp({ responses: [...snapshot.responses, response] })
  }

  switch (event.type) {
    case 'session:sync':
      // A peer sent authoritative state. Keep our own note (teacher-private).
      return { ...event.snapshot, note: snapshot.note ?? event.snapshot.note }

    case 'game:selected':
      return stamp({
        game: event.game,
        settings: event.settings,
        status: 'active',
        round: undefined,
        cue: undefined,
      })

    case 'round:start':
    case 'round:repeat':
      return stamp({ round: event.round, status: 'active', cue: undefined })

    case 'round:update':
      // Ignore an update for a round that is no longer open, which can
      // happen if the teacher moves on while a message is in flight.
      if (snapshot.round?.id !== event.round.id) return snapshot
      return stamp({ round: event.round })

    case 'phonics:updated':
      return stamp({ phonics: event.phonics })

    case 'settings:updated':
      return stamp({ settings: event.settings })

    case 'cue:sent':
      return stamp({ cue: event.cue })

    case 'cue:cleared':
      return stamp({ cue: undefined })

    case 'session:park':
      // Keep the maths round intact so we can drop straight back into it.
      return stamp({
        parked: event.parked,
        game: event.game,
        round: event.round,
        cue: undefined,
        status: 'active',
      })

    case 'session:unpark': {
      if (!snapshot.parked) return snapshot
      return stamp({
        game: snapshot.parked.game,
        round: snapshot.parked.round,
        parked: undefined,
        cue: undefined,
      })
    }

    case 'session:pause':
      return stamp({ status: 'paused' })

    case 'session:resume':
      return stamp({ status: 'active' })

    case 'session:end':
      return stamp({ status: 'ended' })

    case 'student:joined':
    case 'student:ready':
      return stamp({
        nickname: event.nickname,
        status: snapshot.status === 'waiting' ? 'active' : snapshot.status,
      })

    case 'response:submitted':
      return record(event.response)

    case 'teacher:marked':
      return record(event.response)

    case 'bond:discovered': {
      const found = snapshot.discoveries[event.target] ?? []
      const bond = canonicalBond(event.bond[0], event.bond[1])
      if (hasBond(found, bond)) return snapshot
      return stamp({
        discoveries: { ...snapshot.discoveries, [event.target]: [...found, bond] },
      })
    }

    case 'interaction:update':
      // Ephemeral by design (maths spec §39B) — never folded into durable state.
      return snapshot
  }
}
