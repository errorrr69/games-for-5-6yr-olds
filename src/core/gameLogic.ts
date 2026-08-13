import { pickPattern } from './patterns'
import {
  emotionsFor,
  FACES,
  HUNT_TARGETS,
  OPPOSITE_PAIRS,
  SCENARIOS,
  SCENES,
  SCREEN_FRIENDLY,
  FACE_REQUESTS,
  intensityLabel,
} from './feelings'
import { DEFAULT_PHONICS, type PhonicsConfig } from './phonics'
import { adjustReading, createReadingRound } from './readingLogic'
import {
  GAME_CATEGORY,
  type Bond,
  type GameId,
  type HuntStep,
  type LineSettings,
  type ReadingGameId,
  type Round,
  type Settings,
  type TenFrameMode,
} from './types'

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const randomInt = (lo: number, hi: number) =>
  lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)]

const shuffle = <T,>(items: readonly T[]): T[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/* ------------------------------------------------------------------ *
 * Number bonds (part–part–whole)
 * ------------------------------------------------------------------ */

/** Reversals are the same discovery: 3+2 and 2+3 both store as [2, 3]. */
export const canonicalBond = (a: number, b: number): Bond =>
  a <= b ? [a, b] : [b, a]

/** Every unique bond for a target, smallest part first. */
export const bondsFor = (target: number): Bond[] =>
  Array.from({ length: Math.floor(target / 2) + 1 }, (_, a): Bond => [
    a,
    target - a,
  ])

export const bondKey = (bond: Bond): string => `${bond[0]}+${bond[1]}`

export const hasBond = (found: readonly Bond[], bond: Bond): boolean =>
  found.some((b) => bondKey(b) === bondKey(bond))

export const allBondsFound = (target: number, found: readonly Bond[]): boolean =>
  bondsFor(target).every((b) => hasBond(found, b))

export const missingPart = (whole: number, known: number): number => whole - known

/* ------------------------------------------------------------------ *
 * Ten-frame
 * ------------------------------------------------------------------ */

/** Canonical fill order: top row left→right, then bottom row. Never random. */
export function tenFrame(filled: number) {
  const safe = clamp(filled, 0, 10)
  return {
    filled: safe,
    empty: 10 - safe,
    positions: Array.from({ length: safe }, (_, i) => ({
      row: i < 5 ? 0 : 1,
      col: i % 5,
    })),
  }
}

/* ------------------------------------------------------------------ *
 * Number line
 * ------------------------------------------------------------------ */

export const numberLineResult = (
  start: number,
  operation: '+' | '-',
  amount: number,
): number => (operation === '+' ? start + amount : start - amount)

/** A question is only valid if both ends sit on the visible line. */
export function validNumberLine(
  start: number,
  operation: '+' | '-',
  amount: number,
  max: number,
): boolean {
  const result = numberLineResult(start, operation, amount)
  return start >= 0 && start <= max && amount > 0 && result >= 0 && result <= max
}

/** Chooses a start that keeps the landing spot on the line. */
function planJump(s: LineSettings): { start: number; operation: '+' | '-'; amount: number } {
  const operation: '+' | '-' =
    s.operation === 'mixed' ? pick(['+', '-'] as const) : s.operation
  const amount = clamp(s.amount, 1, Math.max(1, s.range - 1))

  if (!s.randomStart && validNumberLine(s.start, operation, amount, s.range)) {
    return { start: s.start, operation, amount }
  }

  const lo = operation === '+' ? 0 : amount
  const hi = operation === '+' ? s.range - amount : s.range
  const start = hi >= lo ? randomInt(lo, hi) : clamp(s.start, lo, Math.max(lo, hi))
  return { start, operation, amount }
}

/* ------------------------------------------------------------------ *
 * Round creation — one pure function per game
 * ------------------------------------------------------------------ */

export function createRound(
  game: GameId,
  settings: Settings,
  previous?: Round,
  phonics: PhonicsConfig = DEFAULT_PHONICS,
): Round | null {

  const id = uid()
  const shownAt = Date.now()

  if (GAME_CATEGORY[game] === 'reading') {
    return createReadingRound(game as ReadingGameId, settings, phonics, previous)
  }

  switch (game) {
    case 'flash-hide': {
      const s = settings['flash-hide']
      const max = clamp(s.max, 1, 6)
      const quantity = randomInt(1, max)
      const previousLabel =
        previous?.game === 'flash-hide' && previous.quantity === quantity
          ? previous.pattern.label
          : undefined
      const representation =
        s.representation === 'mixed'
          ? pick(['dots', 'fingers'] as const)
          : s.representation
      return {
        id,
        shownAt,
        game,
        prompt: `${quantity} ${representation === 'dots' ? 'dots' : 'fingers'}`,
        expected: quantity,
        quantity,
        max,
        pattern: pickPattern(quantity, previousLabel),
        representation,
        duration: s.duration,
      }
    }

    case 'feed-monster': {
      const s = settings['feed-monster']
      const target = clamp(s.target, 2, 10)
      const start = s.randomStart
        ? randomInt(0, target - 1)
        : clamp(s.start, 0, target - 1)
      return {
        id,
        shownAt,
        game,
        prompt: `Make ${target}, starting from ${start}`,
        expected: target - start,
        target,
        start,
        showEquation: s.showEquation,
      }
    }

    case 'bond-garden': {
      const s = settings['bond-garden']
      const target = clamp(s.target, 2, 10)
      const fixedLeft = s.challenge ? randomInt(1, target - 1) : 0
      return {
        id,
        shownAt,
        game,
        prompt: s.challenge
          ? `${fixedLeft} is planted — find the missing ${target - fixedLeft}`
          : `Split ${target} between the pots`,
        expected: s.challenge ? target - fixedLeft : target,
        target,
        challenge: s.challenge,
        fixedLeft,
        showEquation: s.showEquation,
      }
    }

    case 'ten-frame': {
      const s = settings['ten-frame']
      const target = s.randomTarget ? randomInt(1, 10) : clamp(s.target, 1, 10)
      const prefilled = s.mode === 'build' ? 0 : target
      // Every mode except Flash Frame ends by asking about the gap to ten.
      const expected = s.mode === 'flash' ? target : 10 - target
      return {
        id,
        shownAt,
        game,
        prompt: promptForTenFrame(s.mode, target),
        expected,
        mode: s.mode,
        target,
        prefilled,
        flashDuration: s.flashDuration,
        showEquation: s.showEquation,
      }
    }

    case 'number-line': {
      const s = settings['number-line']
      const { start, operation, amount } = planJump(s)
      return {
        id,
        shownAt,
        game,
        prompt: `${start} ${operation} ${amount}`,
        expected: numberLineResult(start, operation, amount),
        range: s.range,
        start,
        operation,
        amount,
        character: s.character,
        predict: s.predict,
        showEquation: s.showEquation,
      }
    }

    /* --- Feelings & Focus.
     * These rounds carry no `expected`: there is no correct way to feel. */

    case 'feeling-thermometer': {
      const s = settings['feeling-thermometer']
      const scenario =
        s.mode === 'character'
          ? pick(
              SCENARIOS.filter(
                (sc) =>
                  previous?.game !== 'feeling-thermometer' ||
                  previous.scenario?.id !== sc.id,
              ),
            )
          : undefined
      return {
        id,
        shownAt,
        game,
        prompt: scenario
          ? `${scenario.who} ${scenario.what}`
          : 'How big is the feeling right now?',
        mode: s.mode,
        scenario,
        emotions: emotionsFor(s.vocabulary),
        askBody: s.askBody,
        askStrategy: s.askStrategy,
      }
    }

    case 'opposite-game': {
      const s = settings['opposite-game']
      const wanted = clamp(s.level, 1, 3)
      const available =
        s.mode === 'screen'
          ? OPPOSITE_PAIRS.filter((p) => SCREEN_FRIENDLY.has(p.id))
          : OPPOSITE_PAIRS
      const pairs = shuffle(available).slice(0, Math.min(wanted, available.length))
      return {
        id,
        shownAt,
        game,
        prompt: pairs
          .map((p) => `${p.command.label} → ${p.opposite.label}`)
          .join(' · '),
        pairs,
        mode: s.mode,
        allowRuleSwitch: s.level >= 4,
      }
    }

    case 'mirror-faces': {
      const s = settings['mirror-faces']
      if (s.mode === 'child-face') {
        const askFor = pick(
          FACE_REQUESTS.filter(
            (f) =>
              previous?.game !== 'mirror-faces' || previous.askFor?.id !== f.id,
          ),
        )
        return {
          id,
          shownAt,
          game,
          prompt: `Show me your best ${askFor.label.toLowerCase()} face`,
          mode: s.mode,
          options: [],
          possible: [],
          askClue: false,
          ambiguous: false,
          askFor,
        }
      }

      const pool = FACES.filter((f) => s.includeAmbiguous || !f.ambiguous)
      const fresh = pool.filter(
        (f) => previous?.game !== 'mirror-faces' || previous.face !== f.id,
      )
      const face = pick(fresh.length ? fresh : pool)
      return {
        id,
        shownAt,
        game,
        prompt: `A face that might read as ${face.possible.join(', ')}`,
        mode: s.mode,
        face: face.id,
        options: faceOptions(face.possible),
        possible: face.possible,
        askClue: s.askClue,
        ambiguous: face.ambiguous,
      }
    }

    case 'scavenger-hunt': {
      const s = settings['scavenger-hunt']
      const fresh = SCENES.filter(
        (sc) => previous?.game !== 'scavenger-hunt' || previous.scene !== sc.id,
      )
      const scene = pick(fresh.length ? fresh : SCENES)
      // Only look for feelings this particular scene can actually support.
      const present = new Set(scene.figures.flatMap((f) => f.might))
      const candidates = HUNT_TARGETS.filter((t) => present.has(t.id))
      const looksFor = pick(candidates.length ? candidates : HUNT_TARGETS)
      const steps: HuntStep[] = ['find']
      if (s.askWhy) steps.push('why')
      if (s.askNext) steps.push('next')
      if (s.askOther) steps.push('other')
      return {
        id,
        shownAt,
        game,
        prompt: `${scene.title} — find someone who might feel ${looksFor.label}`,
        scene: scene.id,
        looksFor,
        steps,
      }
    }

    case 'rock-buddy': {
      const s = settings['rock-buddy']
      return {
        id,
        shownAt,
        game,
        prompt: `${s.breaths} ${s.pace} breaths, ${s.position === 'sit' ? 'sitting' : 'lying down'}`,
        breaths: clamp(s.breaths, 1, 10),
        pace: s.pace,
        position: s.position,
        askReflection: s.askReflection,
      }
    }

    case 'freeze-dance': {
      const s = settings['freeze-dance']
      return {
        id,
        shownAt,
        game,
        prompt: `Freeze Dance — ${s.mode} mode`,
        mode: s.mode,
      }
    }

    // Reading games returned above; nothing else should reach here.
    default:
      return null
  }
}

/** Offers the child a real choice: the likely readings plus a couple more. */
function faceOptions(possible: string[]) {
  const distractors = ['sleepy', 'calm', 'angry', 'happy', 'surprised', 'sad']
  const extras = distractors.filter((d) => !possible.includes(d)).slice(0, 2)
  return shuffle([...possible.slice(0, 2), ...extras]).map((id) => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
  }))
}

/** Describes any response value in words, for the teacher's history strip. */
export const describeIntensity = (level: number): string =>
  `${intensityLabel(level)} (${level}/5)`

/**
 * "Show Again" — the same question, replayed. The id is preserved so the
 * child's second look is recorded as attempt 2 of one question, and timed
 * games get a slightly longer look (spec §17).
 */
export function replayRound(round: Round, longer = true): Round {
  const shownAt = Date.now()
  const stretch = (ms: number) => (longer ? Math.min(2200, ms + 400) : ms)
  switch (round.game) {
    case 'flash-hide':
      return { ...round, shownAt, duration: stretch(round.duration) }
    case 'ten-frame':
      return { ...round, shownAt, flashDuration: stretch(round.flashDuration) }
    default:
      return { ...round, shownAt }
  }
}

function promptForTenFrame(mode: TenFrameMode, target: number): string {
  switch (mode) {
    case 'build':
      return `Build ${target}`
    case 'missing':
      return `${target} shown — how many more make 10?`
    case 'flash':
      return `Flash ${target}`
    case 'make-ten':
      return `${target} shown — fill up to 10`
  }
}

/* ------------------------------------------------------------------ *
 * Difficulty adapters (spec §23)
 * ------------------------------------------------------------------ */

const FLASH_DURATIONS = [1500, 1200, 1000, 800]
const TEN_FRAME_LADDER: TenFrameMode[] = ['build', 'make-ten', 'missing', 'flash']

function stepInList<T>(list: readonly T[], current: T, delta: number): T {
  const index = list.indexOf(current)
  const safe = index === -1 ? 0 : index
  return list[clamp(safe + delta, 0, list.length - 1)]
}

export function easier(game: GameId, settings: Settings): Settings {
  if (GAME_CATEGORY[game] === 'reading') {
    return adjustReading(game as ReadingGameId, settings, -1)
  }
  switch (game) {
    case 'flash-hide': {
      const s = settings['flash-hide']
      return {
        ...settings,
        'flash-hide': {
          ...s,
          max: Math.max(3, s.max - 1),
          duration: stepInList(FLASH_DURATIONS, s.duration, -1),
          representation: 'dots',
        },
      }
    }
    case 'feed-monster': {
      const s = settings['feed-monster']
      return {
        ...settings,
        'feed-monster': { ...s, target: 5, start: Math.min(4, s.start + 1) },
      }
    }
    case 'bond-garden': {
      const s = settings['bond-garden']
      return {
        ...settings,
        'bond-garden': {
          ...s,
          target: s.challenge ? s.target : Math.max(3, Math.min(5, s.target - 1)),
          challenge: false,
        },
      }
    }
    case 'ten-frame': {
      const s = settings['ten-frame']
      return {
        ...settings,
        'ten-frame': {
          ...s,
          mode: stepInList(TEN_FRAME_LADDER, s.mode, -1),
          target: Math.max(1, Math.min(5, s.target)),
          flashDuration: Math.min(1600, s.flashDuration + 200),
        },
      }
    }
    case 'number-line': {
      const s = settings['number-line']
      if (s.predict) return { ...settings, 'number-line': { ...s, predict: false } }
      if (s.operation !== '+')
        return { ...settings, 'number-line': { ...s, operation: '+' } }
      return {
        ...settings,
        'number-line': {
          ...s,
          range: 5,
          amount: Math.max(1, s.amount - 1),
          start: Math.min(s.start, 4),
        },
      }
    }

    /* --- Feelings & Focus.
     * "Easier" never means fewer feelings — it means less to hold in mind
     * at once, and a shorter list of words to choose from. */

    case 'feeling-thermometer': {
      const s = settings['feeling-thermometer']
      if (s.vocabulary === 'wider')
        return {
          ...settings,
          'feeling-thermometer': { ...s, vocabulary: 'starter' },
        }
      // Answering for a character asks less of a child than answering for
      // themselves, so it is the gentler direction, not the harder one.
      return {
        ...settings,
        'feeling-thermometer': { ...s, mode: 'character', askStrategy: false },
      }
    }

    case 'opposite-game': {
      const s = settings['opposite-game']
      return {
        ...settings,
        'opposite-game': { ...s, level: Math.max(1, s.level - 1) },
      }
    }

    case 'mirror-faces': {
      const s = settings['mirror-faces']
      if (s.includeAmbiguous)
        return { ...settings, 'mirror-faces': { ...s, includeAmbiguous: false } }
      return { ...settings, 'mirror-faces': { ...s, mode: 'guess', askClue: false } }
    }

    case 'scavenger-hunt': {
      const s = settings['scavenger-hunt']
      if (s.askOther) return { ...settings, 'scavenger-hunt': { ...s, askOther: false } }
      if (s.askNext) return { ...settings, 'scavenger-hunt': { ...s, askNext: false } }
      return { ...settings, 'scavenger-hunt': { ...s, askWhy: false } }
    }

    case 'rock-buddy': {
      const s = settings['rock-buddy']
      return {
        ...settings,
        'rock-buddy': { ...s, breaths: Math.max(1, s.breaths - 2), pace: 'slow' },
      }
    }

    case 'freeze-dance': {
      const s = settings['freeze-dance']
      return { ...settings, 'freeze-dance': { ...s, mode: 'classic' } }
    }
    default:
      return settings
  }
}

export function harder(game: GameId, settings: Settings): Settings {
  if (GAME_CATEGORY[game] === 'reading') {
    return adjustReading(game as ReadingGameId, settings, 1)
  }
  switch (game) {
    case 'flash-hide': {
      const s = settings['flash-hide']
      return {
        ...settings,
        'flash-hide': {
          ...s,
          max: Math.min(6, s.max + 1),
          duration: stepInList(FLASH_DURATIONS, s.duration, 1),
        },
      }
    }
    case 'feed-monster': {
      const s = settings['feed-monster']
      return {
        ...settings,
        'feed-monster': { ...s, target: 10, start: Math.min(s.start, 9) },
      }
    }
    case 'bond-garden': {
      const s = settings['bond-garden']
      if (s.target < 10)
        return { ...settings, 'bond-garden': { ...s, target: s.target + 1 } }
      return { ...settings, 'bond-garden': { ...s, challenge: true } }
    }
    case 'ten-frame': {
      const s = settings['ten-frame']
      return {
        ...settings,
        'ten-frame': {
          ...s,
          mode: stepInList(TEN_FRAME_LADDER, s.mode, 1),
          target: Math.max(6, s.target),
          flashDuration: Math.max(800, s.flashDuration - 200),
        },
      }
    }
    case 'number-line': {
      const s = settings['number-line']
      if (s.range < 10) return { ...settings, 'number-line': { ...s, range: 10 } }
      if (s.operation === '+')
        return { ...settings, 'number-line': { ...s, operation: '-' } }
      if (s.operation === '-')
        return { ...settings, 'number-line': { ...s, operation: 'mixed' } }
      return { ...settings, 'number-line': { ...s, predict: true } }
    }

    case 'feeling-thermometer': {
      const s = settings['feeling-thermometer']
      if (s.vocabulary === 'starter')
        return {
          ...settings,
          'feeling-thermometer': { ...s, vocabulary: 'wider' },
        }
      return {
        ...settings,
        'feeling-thermometer': { ...s, askBody: true, askStrategy: true },
      }
    }

    case 'opposite-game': {
      const s = settings['opposite-game']
      return {
        ...settings,
        'opposite-game': { ...s, level: Math.min(5, s.level + 1) },
      }
    }

    case 'mirror-faces': {
      const s = settings['mirror-faces']
      if (!s.askClue) return { ...settings, 'mirror-faces': { ...s, askClue: true } }
      return { ...settings, 'mirror-faces': { ...s, includeAmbiguous: true } }
    }

    case 'scavenger-hunt': {
      const s = settings['scavenger-hunt']
      if (!s.askWhy) return { ...settings, 'scavenger-hunt': { ...s, askWhy: true } }
      if (!s.askNext) return { ...settings, 'scavenger-hunt': { ...s, askNext: true } }
      return { ...settings, 'scavenger-hunt': { ...s, askOther: true } }
    }

    case 'rock-buddy': {
      const s = settings['rock-buddy']
      // Longer and slower, never "better breathing".
      return {
        ...settings,
        'rock-buddy': { ...s, breaths: Math.min(10, s.breaths + 2), pace: 'slower' },
      }
    }

    case 'freeze-dance': {
      const s = settings['freeze-dance']
      const ladder = ['classic', 'silly', 'tempo', 'emotion', 'opposite'] as const
      return {
        ...settings,
        'freeze-dance': { ...s, mode: stepInList(ladder, s.mode, 1) },
      }
    }
    default:
      return settings
  }
}

/* ------------------------------------------------------------------ *
 * Equations for the reveal + the teacher's history strip
 * ------------------------------------------------------------------ */

export function equationFor(round: Round): string | null {
  switch (round.game) {
    case 'feed-monster':
      return `${round.start} + ${round.expected} = ${round.target}`
    case 'ten-frame':
      if (round.mode === 'missing' || round.mode === 'make-ten')
        return `${round.target} + ${round.expected} = 10`
      return `${round.target} + ${10 - round.target} = 10`
    case 'number-line':
      return `${round.start} ${round.operation} ${round.amount} = ${round.expected}`
    default:
      return null
  }
}

export const bondSentence = (a: number, b: number, target: number): string =>
  `${a} and ${b} make ${target}`
