import { isDemo, supabase } from '../lib/supabase'
import { uid } from '../core/gameLogic'
import { DEFAULT_PHONICS } from '../core/phonics'
import {
  DEFAULT_SETTINGS,
  GAME_IDS,
  type SessionSnapshot,
  type Settings,
} from '../core/types'

const PREFIX = 'florie-session:'

/** Join codes skip I, O, 0 and 1 so a five-year-old can read them aloud. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const makeCode = () =>
  Array.from(
    { length: 6 },
    () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
  ).join('')

/**
 * Anything arriving from storage or the database is untrusted shape-wise
 * (older rows, partial RPC payloads). Fill the gaps rather than crash.
 */
export function normalizeSnapshot(raw: Partial<SessionSnapshot>): SessionSnapshot {
  const stored = (raw.settings ?? {}) as Partial<Settings>
  // Merge per game so a snapshot written before a game existed still loads.
  const settings = Object.fromEntries(
    GAME_IDS.map((id) => [
      id,
      { ...DEFAULT_SETTINGS[id], ...((stored[id] ?? {}) as object) },
    ]),
  ) as Settings

  return {
    id: raw.id ?? uid(),
    code: raw.code ?? '',
    status: raw.status ?? 'waiting',
    nickname: raw.nickname ?? undefined,
    game: raw.game ?? undefined,
    settings,
    round: raw.round ?? undefined,
    cue: raw.cue ?? undefined,
    phonics: { ...DEFAULT_PHONICS, ...(raw.phonics ?? {}) },
    responses: Array.isArray(raw.responses) ? raw.responses : [],
    discoveries: raw.discoveries ?? {},
    parked: raw.parked ?? undefined,
    note: raw.note ?? undefined,
    startedAt: raw.startedAt ?? Date.now(),
    updatedAt: raw.updatedAt ?? Date.now(),
  }
}

/* ------------------------------------------------------------------ *
 * Local cache — durability for demo mode, and a warm start on reload.
 * ------------------------------------------------------------------ */

export function loadLocal(id: string): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(PREFIX + id)
    return raw ? normalizeSnapshot(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function saveLocal(snapshot: SessionSnapshot): void {
  try {
    localStorage.setItem(PREFIX + snapshot.id, JSON.stringify(snapshot))
  } catch {
    /* private browsing — realtime still works, just no warm reload */
  }
}

export function findByCode(code: string): SessionSnapshot | null {
  const wanted = code.trim().toUpperCase()
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(PREFIX)) continue
    const snapshot = loadLocal(key.slice(PREFIX.length))
    if (snapshot?.code === wanted) return snapshot
  }
  return null
}

/* ------------------------------------------------------------------ *
 * Session lifecycle
 * ------------------------------------------------------------------ */

export async function createSession(): Promise<SessionSnapshot> {
  if (!isDemo && supabase) {
    const { data, error } = await supabase.rpc('create_lesson')
    if (error) throw error
    const snapshot = normalizeSnapshot(data as Partial<SessionSnapshot>)
    saveLocal(snapshot)
    return snapshot
  }

  const snapshot = normalizeSnapshot({
    id: uid(),
    code: makeCode(),
    status: 'waiting',
    startedAt: Date.now(),
  })
  saveLocal(snapshot)
  return snapshot
}

export class JoinError extends Error {
  constructor(readonly reason: 'invalid' | 'ended' | 'full' | 'unknown') {
    super(reason)
  }
}

export async function joinSession(
  code: string,
  nickname: string,
): Promise<SessionSnapshot> {
  if (!isDemo && supabase) {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) throw new JoinError('unknown')
    }
    const { data, error } = await supabase.rpc('join_lesson', {
      p_join_code: code,
      p_nickname: nickname,
    })
    if (error) {
      const message = error.message.toLowerCase()
      if (message.includes('ended')) throw new JoinError('ended')
      if (message.includes('already has')) throw new JoinError('full')
      if (message.includes('invalid')) throw new JoinError('invalid')
      throw new JoinError('unknown')
    }
    const snapshot = normalizeSnapshot(data as Partial<SessionSnapshot>)
    saveLocal(snapshot)
    return snapshot
  }

  const existing = findByCode(code)
  if (!existing) throw new JoinError('invalid')
  if (existing.status === 'ended') throw new JoinError('ended')
  if (existing.nickname && existing.nickname !== nickname)
    throw new JoinError('full')

  const joined: SessionSnapshot = {
    ...existing,
    nickname,
    status: existing.status === 'waiting' ? 'active' : existing.status,
    updatedAt: Date.now(),
  }
  saveLocal(joined)
  return joined
}

/** Re-reads durable state after a reload or a dropped connection. */
export async function hydrate(id: string): Promise<SessionSnapshot | null> {
  if (isDemo || !supabase) return loadLocal(id)
  const { data, error } = await supabase.rpc('get_lesson_snapshot', {
    p_session_id: id,
  })
  if (error) return loadLocal(id)
  const snapshot = normalizeSnapshot(data as Partial<SessionSnapshot>)
  saveLocal(snapshot)
  return snapshot
}

/* ------------------------------------------------------------------ *
 * Persistence — fire-and-forget so the lesson never waits on the network.
 * ------------------------------------------------------------------ */

let syncTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Teacher-side, and the only writer of durable state. Debounced so that
 * typing a note does not spam the database; `sync_lesson_state` stores the
 * session, the active round, and any attempts it has not seen before.
 */
export function persistState(snapshot: SessionSnapshot): void {
  saveLocal(snapshot)
  if (isDemo || !supabase) return
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    void supabase!.rpc('sync_lesson_state', { p_snapshot: snapshot })
  }, 400)
}
