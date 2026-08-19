import { describe, expect, it } from 'vitest'

/**
 * The palette has a job to do besides looking bright.
 *
 * Every `--accent` is set as TEXT on a white card — the eyebrow above each
 * game's title, the hunt sound, the numerals on the number pad — and every
 * `--stage-wash` has ink sitting on it. So a colour is not free to be as light
 * as it likes, and "make it brighter" is exactly the change that breaks this:
 * the obvious way to brighten a colour is to lighten it, which is the one move
 * that costs contrast.
 *
 * Brightness has to come from SATURATION instead. That is a real constraint on
 * every colour in tokens.css, and this is the thing that enforces it, so the
 * next person to reach for a cheerier orange finds out here rather than from a
 * child who cannot read the question.
 *
 * WCAG 2.1 AA: 4.5:1 for normal text.
 */

/**
 * The stylesheets as text, through Vite rather than `node:fs` — this project
 * has no @types/node, and reaching for one would be a dependency bought to read
 * a file that is sitting in the same folder.
 */
const RAW = import.meta.glob('./*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const css = (name: string): string => {
  const text = RAW[`./${name}`]
  if (text === undefined) throw new Error(`${name} is not next to this test any more`)
  return text
}

const SHEETS = ['tokens.css', 'feelings.css', 'reading.css', 'together.css']
const AA_NORMAL = 4.5

/* --- Colour maths --------------------------------------------------- */

function luminance(hex: string): number {
  const parts = hex.replace('#', '').match(/../g)
  if (!parts || parts.length < 3) throw new Error(`not a hex colour: ${hex}`)
  const [r, g, b] = parts
    .slice(0, 3)
    .map((p) => parseInt(p, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/* --- Reading the stylesheets ---------------------------------------- */

/** Every `--name: value` in :root, so `var(--teal)` can be followed home. */
function rootTokens(): Map<string, string> {
  const root = css('tokens.css').match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
  const map = new Map<string, string>()
  for (const m of root.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    map.set(m[1], m[2].trim())
  }
  return map
}

const TOKENS = rootTokens()

/** Follows a chain of `var(--x)` down to the hex it eventually means. */
function resolve(value: string, seen = new Set<string>()): string {
  const ref = value.trim().match(/^var\(\s*(--[\w-]+)\s*\)$/)
  if (!ref) return value.trim()
  if (seen.has(ref[1])) throw new Error(`${ref[1]} refers to itself`)
  seen.add(ref[1])
  const next = TOKENS.get(ref[1])
  if (!next) throw new Error(`${ref[1]} is used but never defined in :root`)
  return resolve(next, seen)
}

/** Every declaration of one custom property across the stylesheets. */
function declarationsOf(property: string): { file: string; value: string }[] {
  const found: { file: string; value: string }[] = []
  for (const file of SHEETS) {
    for (const m of css(file).matchAll(new RegExp(`${property}:\\s*([^;]+);`, 'g'))) {
      found.push({ file, value: resolve(m[1]) })
    }
  }
  return found
}

const INK = resolve(TOKENS.get('--ink')!)
const PAPER = resolve(TOKENS.get('--paper')!)

/* --- The rules ------------------------------------------------------ */

describe('the palette stays readable while it gets brighter', () => {
  it('finds every game theme', () => {
    // If a rename ever makes the regex match nothing, the suite below would
    // pass by testing an empty list. This is the tripwire for that.
    expect(declarationsOf('--accent').length).toBeGreaterThan(20)
    expect(declarationsOf('--stage-wash').length).toBeGreaterThan(20)
  })

  it('every accent is legible as text on a white card', () => {
    for (const { file, value } of declarationsOf('--accent')) {
      expect(
        contrast(value, PAPER),
        `${file}: --accent ${value} on white`,
      ).toBeGreaterThanOrEqual(AA_NORMAL)
    }
  })

  it('ink is legible on every stage wash', () => {
    for (const { file, value } of declarationsOf('--stage-wash')) {
      expect(
        contrast(INK, value),
        `${file}: ink on --stage-wash ${value}`,
      ).toBeGreaterThanOrEqual(AA_NORMAL)
    }
  })

  /**
   * The buttons that carry white text on a colour.
   *
   * These are listed by hand because no regex can tell which background a
   * `color: #fff` in some other rule is going to land on. Add a row whenever a
   * new coloured button appears; the point is that the pairing is written down
   * somewhere a test can see it.
   */
  it('white button labels are legible on their fills', () => {
    const pairs: [string, string][] = [
      ['--go-start', 'Next (left end of the gradient)'],
      ['--go-end', 'Next (right end of the gradient)'],
      ['--coral-strong', 'Freeze!/Dance!'],
    ]
    for (const [token, what] of pairs) {
      const fill = resolve(TOKENS.get(token) ?? `MISSING ${token}`)
      expect(contrast('#ffffff', fill), `white on ${fill} — ${what}`).toBeGreaterThanOrEqual(
        AA_NORMAL,
      )
    }
  })
})
