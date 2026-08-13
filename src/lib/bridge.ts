/**
 * The only way anything leaves the games app when it is embedded in Momzo.
 *
 * Momzo hosts the built SPA in a WebView and registers a JavaScript channel
 * called `MomzoBridge`. This module posts to it. Nothing else in this repo may
 * talk to the host.
 *
 * Three rules, all load-bearing:
 *
 *  1. ONE WAY. Events go out; nothing comes in. The host never drives the game.
 *  2. NO PII. Game slug, outcome buckets, counts, timings, and the observation
 *     strings summary.ts already produces from the child's own choices. No names —
 *     these games have no free-text entry, so there is nothing else to leak.
 *  3. NO-OP WITHOUT A HOST. In a plain browser the channel is absent and every
 *     call quietly does nothing, so /play stays usable for testing.
 */

/** A round that has closed. `bucket` mirrors summary.ts's vocabulary. */
export type RoundResult = {
  event: 'round_result'
  game: string
  bucket: 'firstTime' | 'anotherLook' | 'stillExploring'
  responseTimeMs?: number
}

export type BridgeEvent =
  | { event: 'game_ready'; game: string }
  | RoundResult
  | {
      event: 'session_summary'
      game: string
      durationSec: number
      rounds: number
      firstTime: number
      anotherLook: number
      stillExploring: number
      /** What the child noticed or chose, in their own words. Never a score. */
      notes: string[]
    }

type Channel = { postMessage?: (message: string) => void }

function channel(): Channel | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { MomzoBridge?: Channel }).MomzoBridge
}

/** True when running inside Momzo. Only useful for copy — never gate play on it. */
export const isEmbedded = (): boolean => typeof channel()?.postMessage === 'function'

/**
 * Post one event to the host. Never throws: a telemetry failure must not be able
 * to interrupt a child mid-game.
 */
export function postToMomzo(event: BridgeEvent): void {
  const post = channel()?.postMessage
  if (!post) return
  try {
    post(JSON.stringify(event))
  } catch {
    /* the game continues regardless */
  }
}
