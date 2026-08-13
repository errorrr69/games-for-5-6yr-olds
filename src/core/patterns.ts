import type { DotPattern, Point } from './types'

/**
 * Structured subitising patterns — never random scatter (spec §17).
 *
 * Coordinates are percentages of a SQUARE card, so a single minimum
 * spacing keeps dots from ever touching on either axis. Dots render at
 * 15% of the card, and no two centres here are closer than 18%.
 */

const p = (...points: Point[]): readonly Point[] => points

/** Evenly spaced dots on one horizontal line. */
function row(y: number, count: number, spread = 74): readonly Point[] {
  if (count === 1) return p([50, y])
  const step = spread / (count - 1)
  const startX = 50 - spread / 2
  return Array.from({ length: count }, (_, i): Point => [startX + i * step, y])
}

const pattern = (label: string, points: readonly Point[]): DotPattern => ({
  label,
  points,
})

export const DOT_PATTERNS: Record<number, readonly DotPattern[]> = {
  1: [pattern('one in the middle', p([50, 50]))],

  2: [
    pattern('a pair', p([28, 50], [72, 50])),
    pattern('a diagonal pair', p([32, 32], [68, 68])),
    pattern('one above one', p([50, 28], [50, 72])),
  ],

  3: [
    pattern('dice three', p([26, 26], [50, 50], [74, 74])),
    pattern('a triangle', p([50, 24], [26, 70], [74, 70])),
    pattern('a row of three', row(50, 3, 52)),
  ],

  4: [
    pattern('dice four', p([30, 30], [70, 30], [30, 70], [70, 70])),
    pattern('a diamond', p([50, 22], [22, 50], [78, 50], [50, 78])),
    pattern('two and two', p(...row(32, 2, 40), ...row(68, 2, 40))),
  ],

  5: [
    pattern('dice five', p([28, 28], [72, 28], [50, 50], [28, 72], [72, 72])),
    pattern('a five-frame row', row(50, 5, 72)),
    pattern('two and three', p(...row(30, 2, 38), ...row(70, 3, 56))),
  ],

  6: [
    pattern('dice six', p([30, 22], [70, 22], [30, 50], [70, 50], [30, 78], [70, 78])),
    pattern('two rows of three', p(...row(32, 3, 56), ...row(68, 3, 56))),
    pattern('three and three', p(...row(30, 3, 56), ...row(70, 3, 56))),
  ],
}

/** Picks a structured pattern for `quantity`, avoiding an immediate repeat. */
export function pickPattern(quantity: number, avoid?: string): DotPattern {
  const options = DOT_PATTERNS[quantity] ?? DOT_PATTERNS[1]
  const fresh = options.filter((o) => o.label !== avoid)
  const pool = fresh.length ? fresh : options
  return pool[Math.floor(Math.random() * pool.length)]
}
