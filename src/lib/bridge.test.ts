import { describe, it, expect, afterEach } from 'vitest'
import { postToMomzo, isEmbedded } from './bridge'

/**
 * These tests exist because the obvious mock hides the only bug that has ever
 * actually occurred here.
 *
 * The bridge shipped as `const post = channel()?.postMessage; post(json)`, which
 * detaches the function from its receiver. Against a plain object mock that is
 * fine — a normal JS function ignores `this` unless it uses it — so a green test
 * suite reported a working bridge while, on a real device, every single event was
 * rejected by Android's addJavascriptInterface proxy and swallowed by the catch.
 * 122 seconds of play recorded zero events and logged nothing.
 *
 * So the mock below is deliberately `this`-sensitive, the way the real channel is.
 */

type Recorded = string[]

/** A channel that behaves like Android's: unusable once detached from its object. */
function installStrictChannel(): Recorded {
  const received: Recorded = []
  const channel = {
    postMessage(this: unknown, message: string) {
      if (this !== channel) {
        throw new TypeError(
          "Java bridge method can't be invoked on a non-injected object",
        )
      }
      received.push(message)
    },
  }
  ;(window as unknown as Record<string, unknown>).MomzoBridge = channel
  return received
}

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).MomzoBridge
})

describe('postToMomzo', () => {
  it('posts through a receiver-sensitive channel, as Android requires', () => {
    const received = installStrictChannel()

    postToMomzo({ event: 'game_ready', game: 'feed-monster' })

    expect(received).toHaveLength(1)
    expect(JSON.parse(received[0])).toEqual({
      event: 'game_ready',
      game: 'feed-monster',
    })
  })

  it('delivers every event type the host stores', () => {
    const received = installStrictChannel()

    postToMomzo({
      event: 'round_result',
      game: 'feed-monster',
      bucket: 'firstTime',
      responseTimeMs: 4200,
    })
    postToMomzo({
      event: 'session_summary',
      game: 'feed-monster',
      durationSec: 122,
      rounds: 2,
      firstTime: 2,
      anotherLook: 0,
      stillExploring: 0,
      notes: [],
    })

    expect(received.map((r) => JSON.parse(r).event)).toEqual([
      'round_result',
      'session_summary',
    ])
  })

  it('is a no-op in a plain browser, so /play stays usable for testing', () => {
    expect(isEmbedded()).toBe(false)
    expect(() => postToMomzo({ event: 'game_ready', game: 'ten-frame' })).not.toThrow()
  })

  it('never lets a broken host interrupt play', () => {
    ;(window as unknown as Record<string, unknown>).MomzoBridge = {
      postMessage() {
        throw new Error('host exploded')
      },
    }
    expect(() => postToMomzo({ event: 'game_ready', game: 'ten-frame' })).not.toThrow()
  })

  it('ignores a channel object that has no postMessage at all', () => {
    ;(window as unknown as Record<string, unknown>).MomzoBridge = {}
    expect(isEmbedded()).toBe(false)
    expect(() => postToMomzo({ event: 'game_ready', game: 'ten-frame' })).not.toThrow()
  })
})
