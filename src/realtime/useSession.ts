import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyEvent, type LiveEvent } from '../core/protocol'
import type {
  ConnectionState,
  Interaction,
  SessionSnapshot,
} from '../core/types'
import { connect, type Connection, type Peer, type Role } from './channel'
import { hydrate, loadLocal, persistState } from './sessionService'

export type LiveSession = {
  snapshot: SessionSnapshot | null
  /** Connection state of the *other* person in the lesson. */
  peerState: ConnectionState
  /** Latest ephemeral action from the child (spec §39B). Not persisted. */
  interaction: Interaction | null
  /** Apply an event locally, broadcast it, and persist if we own the state. */
  emit: (event: LiveEvent) => void
  /** Local-only change (teacher notes). Never leaves this browser. */
  patch: (change: Partial<SessionSnapshot>) => void
  loading: boolean
}

export function useSession(
  sessionId: string | undefined,
  role: Role,
  nickname?: string,
): LiveSession {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(() =>
    sessionId ? loadLocal(sessionId) : null,
  )
  const [peers, setPeers] = useState<Peer[]>([])
  const [interaction, setInteraction] = useState<Interaction | null>(null)
  const [loading, setLoading] = useState(true)

  const connectionRef = useRef<Connection | null>(null)
  const snapshotRef = useRef<SessionSnapshot | null>(snapshot)
  snapshotRef.current = snapshot

  const seenPeer = useRef(false)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }
    let cancelled = false

    void hydrate(sessionId).then((fresh) => {
      if (cancelled || !fresh) {
        setLoading(false)
        return
      }
      // Durable state wins over a stale cache, but never over live events
      // that already arrived while we were fetching.
      setSnapshot((current) =>
        current && current.updatedAt > fresh.updatedAt ? current : fresh,
      )
      setLoading(false)
    })

    const connection = connect(sessionId, {
      role,
      nickname,
      onEvent: (event) => {
        if (event.type === 'interaction:update') {
          setInteraction(event.interaction)
          return
        }
        setSnapshot((current) =>
          current ? applyEvent(current, event) : current,
        )

        // A child announcing itself gets the lesson back immediately,
        // rather than waiting on the next presence sync.
        if (role === 'teacher' && event.type === 'student:ready') {
          const now = snapshotRef.current
          if (now) connectionRef.current?.send({ type: 'session:sync', snapshot: now })
        }
      },
      onPeers: (next) => {
        if (next.length) seenPeer.current = true
        setPeers(next)
      },
    })
    connectionRef.current = connection

    if (role === 'student' && nickname) {
      connection.send({ type: 'student:ready', nickname })
    }

    return () => {
      cancelled = true
      connection.close()
      connectionRef.current = null
    }
  }, [sessionId, role, nickname])

  /**
   * The teacher owns durable state, so only the teacher writes it back.
   * The child's browser keeps a local copy purely to render from.
   */
  useEffect(() => {
    if (role !== 'teacher' || !snapshot) return
    persistState(snapshot)
  }, [role, snapshot])

  /**
   * Whenever a child appears — first join, page reload, or a recovered
   * connection — push the current lesson at them. Waiting for `loading`
   * matters: syncing before our own state has loaded would hand the child
   * an empty lesson and wipe the game they were mid-way through.
   */
  const studentPresent = peers.some((p) => p.role === 'student')
  useEffect(() => {
    if (role !== 'teacher' || loading || !studentPresent) return
    const current = snapshotRef.current
    if (current) connectionRef.current?.send({ type: 'session:sync', snapshot: current })
  }, [role, loading, studentPresent, snapshot?.id])

  const emit = useCallback((event: LiveEvent) => {
    setSnapshot((current) => (current ? applyEvent(current, event) : current))
    if (event.type === 'interaction:update') setInteraction(event.interaction)
    connectionRef.current?.send(event)
  }, [])

  const patch = useCallback((change: Partial<SessionSnapshot>) => {
    setSnapshot((current) =>
      current ? { ...current, ...change, updatedAt: Date.now() } : current,
    )
  }, [])

  const peerState: ConnectionState = useMemo(() => {
    const wanted: Role = role === 'teacher' ? 'student' : 'teacher'
    if (peers.some((p) => p.role === wanted)) return 'connected'
    return seenPeer.current || snapshot?.nickname ? 'reconnecting' : 'waiting'
  }, [peers, role, snapshot?.nickname])

  return { snapshot, peerState, interaction, emit, patch, loading }
}
