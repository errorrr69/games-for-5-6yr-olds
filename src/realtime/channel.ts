import { isDemo, supabase } from '../lib/supabase'
import { isLiveEvent, type LiveEvent } from '../core/protocol'
import { uid } from '../core/gameLogic'

export type Role = 'teacher' | 'student'

export type Peer = {
  peerId: string
  role: Role
  nickname?: string
}

export type Connection = {
  /** Fire-and-forget. Messages sent before the socket is ready are queued. */
  send: (event: LiveEvent) => void
  close: () => void
}

export type ConnectOptions = {
  role: Role
  nickname?: string
  onEvent: (event: LiveEvent) => void
  onPeers: (peers: Peer[]) => void
}

/** How long a silent peer stays "connected" before we call it reconnecting. */
const PEER_TIMEOUT_MS = 7000
const HEARTBEAT_MS = 2500

/* ------------------------------------------------------------------ *
 * Demo transport — BroadcastChannel between windows of one browser.
 * Used when no Supabase project is configured so the whole product can
 * still be driven end to end in two windows.
 * ------------------------------------------------------------------ */

type DemoMessage =
  | { kind: 'event'; event: LiveEvent }
  | { kind: 'hello' | 'ping' | 'bye'; peer: Peer }

function connectDemo(sessionId: string, options: ConnectOptions): Connection {
  const bc = new BroadcastChannel(`florie:${sessionId}`)
  const me: Peer = {
    peerId: uid(),
    role: options.role,
    nickname: options.nickname,
  }
  const seen = new Map<string, { peer: Peer; at: number }>()
  let lastSignature = ''

  const publishPeers = () => {
    const now = Date.now()
    const live: Peer[] = []
    for (const [id, entry] of seen) {
      if (now - entry.at > PEER_TIMEOUT_MS) seen.delete(id)
      else live.push(entry.peer)
    }
    const signature = live
      .map((p) => `${p.role}:${p.nickname ?? ''}`)
      .sort()
      .join('|')
    if (signature !== lastSignature) {
      lastSignature = signature
      options.onPeers(live)
    }
  }

  const post = (message: DemoMessage) => bc.postMessage(message)

  bc.onmessage = (e: MessageEvent<DemoMessage>) => {
    const message = e.data
    if (!message || typeof message !== 'object') return

    if (message.kind === 'event') {
      if (isLiveEvent(message.event)) options.onEvent(message.event)
      return
    }
    if (message.kind === 'bye') {
      seen.delete(message.peer.peerId)
      publishPeers()
      return
    }
    seen.set(message.peer.peerId, { peer: message.peer, at: Date.now() })
    // A newcomer needs to know we are here too.
    if (message.kind === 'hello') post({ kind: 'ping', peer: me })
    publishPeers()
  }

  post({ kind: 'hello', peer: me })
  const heartbeat = setInterval(() => {
    post({ kind: 'ping', peer: me })
    publishPeers()
  }, HEARTBEAT_MS)

  const farewell = () => post({ kind: 'bye', peer: me })
  window.addEventListener('pagehide', farewell)

  return {
    send: (event) => post({ kind: 'event', event }),
    close: () => {
      farewell()
      window.removeEventListener('pagehide', farewell)
      clearInterval(heartbeat)
      bc.close()
    },
  }
}

/* ------------------------------------------------------------------ *
 * Supabase transport — a private `session:<uuid>` channel carrying
 * Broadcast (commands + actions) and Presence (who is here).
 * ------------------------------------------------------------------ */

function connectSupabase(sessionId: string, options: ConnectOptions): Connection {
  const client = supabase!
  const peerId = uid()
  const channel = client.channel(`session:${sessionId}`, {
    config: {
      private: true,
      broadcast: { self: false, ack: false },
      presence: { key: peerId },
    },
  })

  let ready = false
  const queue: LiveEvent[] = []

  channel.on('broadcast', { event: 'lesson' }, ({ payload }) => {
    if (isLiveEvent(payload)) options.onEvent(payload)
  })

  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState<{ role: Role; nickname?: string }>()
    const peers: Peer[] = Object.entries(state).flatMap(([key, entries]) =>
      entries.map((entry) => ({
        peerId: key,
        role: entry.role,
        nickname: entry.nickname,
      })),
    )
    options.onPeers(peers.filter((p) => p.peerId !== peerId))
  })

  channel.subscribe((status) => {
    if (status !== 'SUBSCRIBED') {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') ready = false
      return
    }
    ready = true
    void channel.track({ role: options.role, nickname: options.nickname })
    while (queue.length) {
      const event = queue.shift()!
      void channel.send({ type: 'broadcast', event: 'lesson', payload: event })
    }
  })

  return {
    send: (event) => {
      if (!ready) {
        queue.push(event)
        return
      }
      void channel.send({ type: 'broadcast', event: 'lesson', payload: event })
    },
    close: () => {
      void client.removeChannel(channel)
    },
  }
}

export function connect(sessionId: string, options: ConnectOptions): Connection {
  return isDemo || !supabase
    ? connectDemo(sessionId, options)
    : connectSupabase(sessionId, options)
}
