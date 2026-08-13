import { describe, expect, it } from 'vitest'
import {
  allBondsFound,
  bondsFor,
  canonicalBond,
  createRound,
  easier,
  harder,
  hasBond,
  missingPart,
  numberLineResult,
  replayRound,
  tenFrame,
  validNumberLine,
} from './gameLogic'
import { DOT_PATTERNS, pickPattern } from './patterns'
import { DEFAULT_SETTINGS, type Round, type Settings } from './types'

/** createRound returns null when a sound set cannot support a game. */
const mustRound = (...args: Parameters<typeof createRound>): Round => {
  const round = createRound(...args)
  if (!round) throw new Error('expected a round for ' + args[0])
  return round
}


const withSettings = (patch: Partial<Settings>): Settings => ({
  ...DEFAULT_SETTINGS,
  ...patch,
})

describe('Flash & Hide', () => {
  it('only ships structured, non-overlapping patterns', () => {
    for (const [quantity, patterns] of Object.entries(DOT_PATTERNS)) {
      for (const pattern of patterns) {
        expect(pattern.points).toHaveLength(Number(quantity))
        for (const [x, y] of pattern.points) {
          expect(x).toBeGreaterThan(0)
          expect(x).toBeLessThan(100)
          expect(y).toBeGreaterThan(0)
          expect(y).toBeLessThan(100)
        }
        // No two dots may sit close enough to touch at 15% dot size.
        for (let a = 0; a < pattern.points.length; a++) {
          for (let b = a + 1; b < pattern.points.length; b++) {
            const [x1, y1] = pattern.points[a]
            const [x2, y2] = pattern.points[b]
            expect(Math.hypot(x1 - x2, y1 - y2)).toBeGreaterThanOrEqual(18)
          }
        }
      }
    }
  })

  it('never exceeds the configured maximum', () => {
    for (let i = 0; i < 200; i++) {
      const round = mustRound(
        'flash-hide',
        withSettings({
          'flash-hide': { ...DEFAULT_SETTINGS['flash-hide'], max: 3 },
        }),
      )
      expect(round.expected).toBeGreaterThanOrEqual(1)
      expect(round.expected).toBeLessThanOrEqual(3)
    }
  })

  it('avoids repeating the previous pattern for the same quantity', () => {
    const previous = DOT_PATTERNS[5][0]
    for (let i = 0; i < 30; i++) {
      expect(pickPattern(5, previous.label).label).not.toBe(previous.label)
    }
  })

  it('gives a longer look when the teacher shows a question again', () => {
    const round = mustRound('flash-hide', DEFAULT_SETTINGS)
    const again = replayRound(round)
    expect(again.id).toBe(round.id)
    expect(again.shownAt).toBeGreaterThanOrEqual(round.shownAt)
    if (round.game === 'flash-hide' && again.game === 'flash-hide') {
      expect(again.duration).toBeGreaterThan(round.duration)
    }
  })
})

describe('number bonds', () => {
  it('canonicalises reversals', () => {
    expect(canonicalBond(4, 1)).toEqual([1, 4])
    expect(canonicalBond(2, 3)).toEqual(canonicalBond(3, 2))
  })

  it('lists each unique bond exactly once', () => {
    expect(bondsFor(5)).toEqual([
      [0, 5],
      [1, 4],
      [2, 3],
    ])
    expect(bondsFor(4)).toEqual([
      [0, 4],
      [1, 3],
      [2, 2],
    ])
  })

  it('detects completion regardless of the order found', () => {
    const found = [
      [2, 3],
      [0, 5],
      [1, 4],
    ] as const
    expect(allBondsFound(5, [...found])).toBe(true)
    expect(allBondsFound(5, [[0, 5]])).toBe(false)
    expect(hasBond([...found], canonicalBond(3, 2))).toBe(true)
  })

  it('calculates missing parts, including overfill', () => {
    expect(missingPart(5, 2)).toBe(3)
    expect(missingPart(5, 6)).toBe(-1)
  })
})

describe('ten-frame', () => {
  it('fills the top row before the bottom row', () => {
    const frame = tenFrame(7)
    expect(frame.filled).toBe(7)
    expect(frame.empty).toBe(3)
    expect(frame.positions[4]).toEqual({ row: 0, col: 4 })
    expect(frame.positions[5]).toEqual({ row: 1, col: 0 })
  })

  it('clamps impossible counts', () => {
    expect(tenFrame(14).filled).toBe(10)
    expect(tenFrame(-2).filled).toBe(0)
  })

  it('asks about the gap to ten in every mode except Flash Frame', () => {
    const build = mustRound(
      'ten-frame',
      withSettings({
        'ten-frame': { ...DEFAULT_SETTINGS['ten-frame'], mode: 'build', target: 7 },
      }),
    )
    expect(build.expected).toBe(3)

    const flash = mustRound(
      'ten-frame',
      withSettings({
        'ten-frame': { ...DEFAULT_SETTINGS['ten-frame'], mode: 'flash', target: 7 },
      }),
    )
    expect(flash.expected).toBe(7)
  })
})

describe('number line', () => {
  it('moves both directions', () => {
    expect(numberLineResult(3, '+', 2)).toBe(5)
    expect(numberLineResult(7, '-', 3)).toBe(4)
  })

  it('rejects questions that fall off the line', () => {
    expect(validNumberLine(9, '+', 2, 10)).toBe(false)
    expect(validNumberLine(1, '-', 2, 10)).toBe(false)
    expect(validNumberLine(3, '+', 2, 5)).toBe(true)
  })

  it('never generates an out-of-range question', () => {
    for (const range of [5, 10] as const) {
      for (const operation of ['+', '-', 'mixed'] as const) {
        for (let i = 0; i < 100; i++) {
          const round = mustRound(
            'number-line',
            withSettings({
              'number-line': {
                ...DEFAULT_SETTINGS['number-line'],
                range,
                operation,
                amount: 4,
                randomStart: true,
              },
            }),
          )
          expect(round.expected).toBeGreaterThanOrEqual(0)
          expect(round.expected).toBeLessThanOrEqual(range)
          if (round.game === 'number-line') {
            expect(round.start).toBeGreaterThanOrEqual(0)
            expect(round.start).toBeLessThanOrEqual(range)
          }
        }
      }
    }
  })
})

describe('feed the monster', () => {
  it('always leaves something to work out', () => {
    for (let i = 0; i < 100; i++) {
      const round = mustRound(
        'feed-monster',
        withSettings({
          'feed-monster': { ...DEFAULT_SETTINGS['feed-monster'], target: 10 },
        }),
      )
      if (round.game !== 'feed-monster') throw new Error('wrong game')
      expect(round.start).toBeLessThan(round.target)
      expect(round.expected).toBe(round.target - round.start)
      expect(round.expected).toBeGreaterThan(0)
    }
  })
})

describe('difficulty adapters', () => {
  it('moves Flash & Hide in opposite directions', () => {
    const up = harder('flash-hide', DEFAULT_SETTINGS)['flash-hide']
    const down = easier('flash-hide', DEFAULT_SETTINGS)['flash-hide']
    expect(up.max).toBeGreaterThan(down.max)
    expect(up.duration).toBeLessThan(down.duration)
  })

  it('stays inside its bounds when pushed repeatedly', () => {
    let settings = DEFAULT_SETTINGS
    for (let i = 0; i < 20; i++) settings = harder('flash-hide', settings)
    expect(settings['flash-hide'].max).toBe(6)
    expect(settings['flash-hide'].duration).toBe(800)

    for (let i = 0; i < 20; i++) settings = easier('flash-hide', settings)
    expect(settings['flash-hide'].max).toBe(3)
    expect(settings['flash-hide'].duration).toBe(1500)
  })

  it('only touches the game being adjusted', () => {
    const next = harder('number-line', DEFAULT_SETTINGS)
    expect(next['feed-monster']).toBe(DEFAULT_SETTINGS['feed-monster'])
    expect(next['ten-frame']).toBe(DEFAULT_SETTINGS['ten-frame'])
  })

  it('walks the ten-frame ladder without falling off either end', () => {
    let settings = DEFAULT_SETTINGS
    for (let i = 0; i < 10; i++) settings = harder('ten-frame', settings)
    expect(settings['ten-frame'].mode).toBe('flash')
    for (let i = 0; i < 10; i++) settings = easier('ten-frame', settings)
    expect(settings['ten-frame'].mode).toBe('build')
  })
})
