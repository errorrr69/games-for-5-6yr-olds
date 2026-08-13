import {
  GRAPHEMES,
  LADDERS,
  MAGIC_E_PAIRS,
  SAFARI_SCENES,
  TRICKY_WORDS,
  WORDS,
  BLEND_WORDS,
  canDecode,
  decodableWords,
  enabledGraphemes,
  graphemeById,
  huntableSounds,
  laddersFor,
  magicEPairsFor,
  makePseudoword,
  picturableWords,
  ALL_DECODABLE,
  storiesFor,
  wordByText,
  type PhonicsConfig,
  type ReadingWord,
} from './phonics'
import type {
  MonsterLook,
  ReadingGameId,
  Round,
  RoundWord,
  Settings,
} from './types'

/**
 * Round creation for Reading Adventures.
 *
 * Every function here goes through the phonics gate. If the enabled sound
 * set cannot support a game, the round says so rather than quietly
 * reaching for an untaught grapheme (spec §5 rule D, §20).
 */

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

const toRoundWord = (word: ReadingWord): RoundWord => ({
  text: word.text,
  graphemes: word.graphemes,
  picture: word.picture,
})

/** Says the word as separate sounds, for the teacher's private cue. */
export const soundOut = (graphemes: string[], gap = ' … '): string =>
  graphemes.map((id) => graphemeById(id)?.phoneme ?? `/${id}/`).join(gap)

const randomLook = (): MonsterLook => ({
  eyes: 1 + Math.floor(Math.random() * 3),
  horns: Math.floor(Math.random() * 3),
  colour: Math.floor(Math.random() * 5),
  feet: 1 + Math.floor(Math.random() * 2),
})

/** A tray of graphemes: the right ones plus plausible distractors. */
function buildTray(
  needed: string[],
  enabled: readonly string[],
  extra = 3,
): string[] {
  const pool = enabledGraphemes(enabled)
    .map((g) => g.id)
    .filter((id) => !needed.includes(id) && id !== 'magic-e')
  return shuffle([...new Set([...needed, ...shuffle(pool).slice(0, extra)])])
}

/**
 * The single entry point. Returns null when the current sound set cannot
 * support this game — the teacher panel explains what to enable.
 */
export function createReadingRound(
  game: ReadingGameId,
  settings: Settings,
  phonics: PhonicsConfig,
  previous?: Round,
): Round | null {
  const id = crypto.randomUUID()
  const shownAt = Date.now()
  const { enabled } = phonics
  const base = { id, shownAt }

  switch (game) {
    case 'robot-translator': {
      const s = settings['robot-translator']
      // Picture mode can only use words we have a picture for. Spoken modes
      // can use the whole bank, so level 1 gets real two-sound blends there.
      const source =
        s.mode === 'picture'
          ? picturableWords(enabled)
          : decodableWords(enabled, ALL_DECODABLE)
      const maxSounds = s.level <= 1 ? 2 : 3
      const pool = source.filter((word) => word.graphemes.length <= maxSounds)
      // If no short-enough word exists (there are few two-sound picture
      // words), fall back rather than showing nothing.
      const usable = pool.length ? pool : source
      if (!usable.length) return null

      const fresh = usable.filter(
        (word) =>
          previous?.game !== 'robot-translator' ||
          previous.word.text !== word.text,
      )
      const word = pick(fresh.length ? fresh : usable)
      const distractors = shuffle(
        usable.filter((other) => other.text !== word.text),
      ).slice(0, 3)

      return {
        ...base,
        game,
        prompt: `${word.text} — say ${soundOut(word.graphemes)}`,
        word: toRoundWord(word),
        mode: s.mode,
        level: s.level,
        options: shuffle([word, ...distractors]).map(toRoundWord),
      }
    }

    case 'sound-safari': {
      const s = settings['sound-safari']
      const scenes = SAFARI_SCENES.map((scene) => ({
        scene,
        sounds: huntableSounds(scene, enabled),
      })).filter((entry) => entry.sounds.length > 0)
      if (!scenes.length) return null

      const choice = pick(scenes)
      const fresh = choice.sounds.filter(
        (sound) =>
          previous?.game !== 'sound-safari' || previous.target !== sound,
      )
      const target = pick(fresh.length ? fresh : choice.sounds)

      return {
        ...base,
        game,
        prompt: `Find things starting with ${graphemeById(target)?.phoneme ?? target} in ${choice.scene.title}`,
        mode: s.mode,
        scene: choice.scene.id,
        target,
        phoneme: graphemeById(target)?.phoneme ?? `/${target}/`,
      }
    }

    case 'skywriter': {
      const s = settings['skywriter']
      const pool = enabledGraphemes(enabled).filter((g) => g.id !== 'magic-e')
      if (!pool.length) return null
      const fresh = pool.filter(
        (g) => previous?.game !== 'skywriter' || previous.grapheme !== g.id,
      )
      const grapheme = pick(fresh.length ? fresh : pool)
      const others = shuffle(pool.filter((g) => g.id !== grapheme.id)).slice(0, 3)

      return {
        ...base,
        game,
        prompt: `${grapheme.grapheme} says ${grapheme.phoneme}`,
        mode: s.mode,
        grapheme: grapheme.id,
        phoneme: grapheme.phoneme,
        showLetter: s.showLetter,
        options: shuffle([grapheme, ...others]).map((g) => g.id),
      }
    }

    case 'sound-box-factory': {
      const s = settings['sound-box-factory']
      const pool = decodableWords(enabled, WORDS).filter(
        (word) => word.graphemes.length === 3,
      )
      if (!pool.length) return null
      const fresh = pool.filter(
        (word) =>
          previous?.game !== 'sound-box-factory' ||
          previous.word.text !== word.text,
      )
      const word = pick(fresh.length ? fresh : pool)

      return {
        ...base,
        game,
        prompt: `${word.text} — ${soundOut(word.graphemes)}`,
        word: toRoundWord(word),
        tray: buildTray(word.graphemes, enabled),
        countersFirst: s.countersFirst,
        showPicture: s.showPicture && !!word.picture,
      }
    }

    case 'monster-lab': {
      const s = settings['monster-lab']
      const avoid =
        previous?.game === 'monster-lab' && previous.name
          ? [previous.name.text]
          : []
      const pseudo = makePseudoword(enabled, avoid)
      if (!pseudo) return null

      return {
        ...base,
        game,
        prompt: `${pseudo.text} — ${soundOut(pseudo.graphemes)}`,
        mode: s.mode,
        name: toRoundWord(pseudo),
        look: randomLook(),
        tray: buildTray(pseudo.graphemes, enabled, 4),
      }
    }

    case 'digraph-detectives': {
      const s = settings['digraph-detectives']
      const digraphs = ['sh', 'ch', 'th'].filter((d) => enabled.includes(d))
      if (!digraphs.length) return null

      if (s.mode === 'sort') {
        const withDigraph = decodableWords(enabled, WORDS).filter((word) =>
          word.graphemes.some((g) => digraphs.includes(g)),
        )
        // Traps: perfectly good words that belong to no detective.
        const traps = decodableWords(enabled, WORDS).filter(
          (word) => !word.graphemes.some((g) => digraphs.includes(g)),
        )
        if (withDigraph.length < 3) return null
        const words = shuffle([
          ...shuffle(withDigraph).slice(0, 4),
          ...shuffle(traps).slice(0, 2),
        ])
        return {
          ...base,
          game,
          prompt: `Sort ${words.map((word) => word.text).join(', ')}`,
          mode: s.mode,
          words: words.map(toRoundWord),
          options: digraphs,
        }
      }

      if (s.mode === 'count') {
        const pool = [
          ...decodableWords(enabled, WORDS).filter((word) =>
            word.graphemes.some((g) => digraphs.includes(g)),
          ),
          ...decodableWords(enabled, BLEND_WORDS),
        ]
        if (!pool.length) return null
        const word = pick(pool)
        return {
          ...base,
          game,
          prompt: `${word.text} — ${word.graphemes.length} sounds`,
          expected: word.graphemes.length,
          mode: s.mode,
          words: [],
          word: toRoundWord(word),
          options: digraphs,
        }
      }

      // build: "_ip" and a choice of letter pairs
      const pool = decodableWords(enabled, WORDS).filter((word) =>
        digraphs.includes(word.graphemes[0]),
      )
      if (!pool.length) return null
      const word = pick(pool)
      return {
        ...base,
        game,
        prompt: `Build ${word.text}`,
        mode: s.mode,
        words: [],
        word: toRoundWord(word),
        options: shuffle(digraphs),
      }
    }

    case 'blend-train': {
      const s = settings['blend-train']
      const blends = decodableWords(enabled, BLEND_WORDS)
      if (!blends.length) return null

      if (s.mode === 'sort') {
        const digraphs = ['sh', 'ch', 'th'].filter((d) => enabled.includes(d))
        const digraphWords = decodableWords(enabled, WORDS).filter((word) =>
          word.graphemes.some((g) => digraphs.includes(g)),
        )
        if (!digraphWords.length) return null
        const words = shuffle([
          ...shuffle(blends).slice(0, 3),
          ...shuffle(digraphWords).slice(0, 3),
        ])
        return {
          ...base,
          game,
          prompt: `Sort ${words.map((word) => word.text).join(', ')}`,
          mode: s.mode,
          words: words.map(toRoundWord),
          tray: [],
        }
      }

      const fresh = blends.filter(
        (word) =>
          previous?.game !== 'blend-train' || previous.word?.text !== word.text,
      )
      const word = pick(fresh.length ? fresh : blends)

      return {
        ...base,
        game,
        prompt: `${word.text} — ${soundOut(word.graphemes)}`,
        mode: s.mode,
        word: toRoundWord(word),
        words: [],
        tray: buildTray(word.graphemes, enabled),
        missingIndex:
          s.mode === 'missing'
            ? Math.floor(Math.random() * word.graphemes.length)
            : undefined,
      }
    }

    case 'magic-e-wizard': {
      const s = settings['magic-e-wizard']
      const pairs = magicEPairsFor(enabled)
      if (!pairs.length) return null
      const fresh = pairs.filter(
        (pair) =>
          previous?.game !== 'magic-e-wizard' || previous.short !== pair.short,
      )
      const pair = pick(fresh.length ? fresh : pairs)

      return {
        ...base,
        game,
        prompt: `${pair.short} → ${pair.long}`,
        mode: s.mode,
        short: pair.short,
        long: pair.long,
        shortPicture: pair.shortPicture,
        longPicture: pair.longPicture,
      }
    }

    case 'tricky-treasure': {
      const s = settings['tricky-treasure']
      const active = phonics.trickyActive.filter((word) =>
        TRICKY_WORDS.includes(word),
      )
      if (active.length < 2) return null

      const fresh = active.filter(
        (word) =>
          previous?.game !== 'tricky-treasure' || previous.target !== word,
      )
      const target = pick(fresh.length ? fresh : active)

      if (s.mode === 'sentence') {
        const sentence = SENTENCE_FRAMES[target]
        if (sentence) {
          return {
            ...base,
            game,
            prompt: `${sentence.join(' ')} → ${target}`,
            mode: s.mode,
            target,
            options: shuffle(active).slice(0, 4),
            sentence,
            flashDuration: s.flashDuration,
          }
        }
      }

      return {
        ...base,
        game,
        prompt: `Find "${target}"`,
        mode: s.mode === 'sentence' ? 'find' : s.mode,
        target,
        options: shuffle(active),
        flashDuration: s.flashDuration,
      }
    }

    case 'word-ladder': {
      const s = settings['word-ladder']
      const ladders = laddersFor(enabled)
      if (!ladders.length) return null
      const fresh = ladders.filter(
        (l) => previous?.game !== 'word-ladder' || previous.ladderId !== l.id,
      )
      const ladder = pick(fresh.length ? fresh : ladders)

      return {
        ...base,
        game,
        prompt: `${ladder.start} → ${ladder.steps.map((step) => step.to).join(' → ')}`,
        ladderId: ladder.id,
        start: ladder.start,
        steps: ladder.steps,
        climbTo: s.target,
        tray: buildTray(ladder.graphemes, enabled, 2),
      }
    }

    case 'story-quest': {
      const s = settings['story-quest']
      const stories = storiesFor(phonics)
      if (!stories.length) return null
      const fresh = stories.filter(
        (story) =>
          previous?.game !== 'story-quest' || previous.storyId !== story.id,
      )
      const story = pick(fresh.length ? fresh : stories)

      return {
        ...base,
        game,
        prompt: `${story.title} — ${story.pages.length} pages`,
        storyId: story.id,
        title: story.title,
        pages: story.pages,
        page: 0,
        readingMode: s.readingMode,
      }
    }
  }
}

/** Simple frames for the missing-word mode. Kept short and decodable. */
const SENTENCE_FRAMES: Record<string, string[]> = {
  the: ['___', 'cat', 'sat.'],
  was: ['The', 'cat', '___', 'big.'],
  said: ['"Sit,"', '___', 'Sam.'],
  you: ['Can', '___', 'run?'],
  they: ['___', 'ran', 'up.'],
}

/**
 * Why a game cannot run, in words a teacher can act on. Returned instead
 * of silently falling back to sounds the child has not been taught.
 */
export function readingBlocker(
  game: ReadingGameId,
  phonics: PhonicsConfig,
): string | null {
  const { enabled } = phonics
  switch (game) {
    case 'robot-translator':
      return picturableWords(enabled).length >= 4
        ? null
        : 'Enable a few more sounds — this needs at least four picture words.'
    case 'sound-safari':
      return SAFARI_SCENES.some((scene) => huntableSounds(scene, enabled).length)
        ? null
        : 'No scene has two things starting with an enabled sound yet.'
    case 'skywriter':
      return enabled.length ? null : 'Enable at least one sound.'
    case 'sound-box-factory':
      return decodableWords(enabled, WORDS).some((w) => w.graphemes.length === 3)
        ? null
        : 'Enable a vowel and two consonants to make three-sound words.'
    case 'monster-lab':
      return makePseudoword(enabled)
        ? null
        : 'Enable at least one vowel and two consonants.'
    case 'digraph-detectives':
      return ['sh', 'ch', 'th'].some((d) => enabled.includes(d))
        ? null
        : 'Turn on sh, ch or th in Sounds We Know first.'
    case 'blend-train':
      return decodableWords(enabled, BLEND_WORDS).length
        ? null
        : 'Enable the sounds in a blend word such as stop or frog.'
    case 'magic-e-wizard':
      return magicEPairsFor(enabled).length
        ? null
        : 'Enable the sounds for a pair such as hop / hope.'
    case 'tricky-treasure':
      return phonics.trickyActive.length >= 2
        ? null
        : 'Choose at least two active tricky words.'
    case 'word-ladder':
      return laddersFor(enabled).length
        ? null
        : 'No ladder fits these sounds yet — try enabling the next set.'
    case 'story-quest':
      return storiesFor(phonics).length
        ? null
        : 'No story is fully decodable yet. Enable more sounds, or activate the tricky words a story needs.'
  }
}

/* ------------------------------------------------------------------ *
 * Difficulty
 * ------------------------------------------------------------------ */

const step = <T,>(list: readonly T[], current: T, delta: number): T => {
  const index = Math.max(0, list.indexOf(current))
  return list[Math.min(list.length - 1, Math.max(0, index + delta))]
}

export function adjustReading(
  game: ReadingGameId,
  settings: Settings,
  direction: 1 | -1,
): Settings {
  switch (game) {
    case 'robot-translator': {
      const s = settings['robot-translator']
      return {
        ...settings,
        'robot-translator': {
          ...s,
          level: Math.min(3, Math.max(1, s.level + direction)),
        },
      }
    }
    case 'sound-safari':
      return settings
    case 'skywriter': {
      const s = settings['skywriter']
      return {
        ...settings,
        skywriter: {
          ...s,
          mode: step(['trace', 'air', 'quick-sound'] as const, s.mode, direction),
          showLetter: direction < 0,
        },
      }
    }
    case 'sound-box-factory': {
      const s = settings['sound-box-factory']
      return {
        ...settings,
        'sound-box-factory': {
          ...s,
          countersFirst: direction < 0,
          showPicture: direction < 0,
        },
      }
    }
    case 'monster-lab': {
      const s = settings['monster-lab']
      return {
        ...settings,
        'monster-lab': { ...s, mode: direction > 0 ? 'build' : 'read' },
      }
    }
    case 'digraph-detectives': {
      const s = settings['digraph-detectives']
      return {
        ...settings,
        'digraph-detectives': {
          ...s,
          mode: step(['build', 'sort', 'count'] as const, s.mode, direction),
        },
      }
    }
    case 'blend-train': {
      const s = settings['blend-train']
      return {
        ...settings,
        'blend-train': {
          ...s,
          mode: step(['build', 'missing', 'sort'] as const, s.mode, direction),
        },
      }
    }
    case 'magic-e-wizard': {
      const s = settings['magic-e-wizard']
      return {
        ...settings,
        'magic-e-wizard': {
          ...s,
          mode: step(['which', 'cast', 'break'] as const, s.mode, direction),
        },
      }
    }
    case 'tricky-treasure': {
      const s = settings['tricky-treasure']
      return {
        ...settings,
        'tricky-treasure': {
          ...s,
          mode: step(['find', 'flash', 'sentence'] as const, s.mode, direction),
          flashDuration: Math.min(
            1800,
            Math.max(700, s.flashDuration - direction * 200),
          ),
        },
      }
    }
    case 'word-ladder':
      return settings
    case 'story-quest': {
      const s = settings['story-quest']
      return {
        ...settings,
        'story-quest': {
          ...s,
          readingMode: step(
            ['together', 'turns', 'child'] as const,
            s.readingMode,
            direction,
          ),
        },
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Game-specific clues (spec §21). A clue is a nudge, never the answer.
 * ------------------------------------------------------------------ */

export function clueFor(round: Round): { headline: string; detail: string } | null {
  switch (round.game) {
    case 'robot-translator':
      return {
        headline: 'Say the sounds again, more slowly',
        detail: soundOut(round.word.graphemes, ' …… '),
      }
    case 'sound-box-factory':
      return {
        headline: `First sound: ${graphemeById(round.word.graphemes[0])?.phoneme}`,
        detail: 'Stretch it out: ' + round.word.text.split('').join('-'),
      }
    case 'monster-lab':
      return round.name
        ? {
            headline: `First grapheme: ${round.name.graphemes[0]}`,
            detail: 'Underline it and ask for that sound only.',
          }
        : null
    case 'digraph-detectives': {
      const pair = round.word?.graphemes.find((g) =>
        ['sh', 'ch', 'th'].includes(g),
      )
      return pair
        ? {
            headline: `Highlight the pair: ${pair}`,
            detail: 'Two letters, one sound.',
          }
        : null
    }
    case 'blend-train':
      return round.word
        ? {
            headline: 'Both consonants get a carriage',
            detail: soundOut(round.word.graphemes, ' - '),
          }
        : null
    case 'magic-e-wizard':
      return {
        headline: 'Glow the final e',
        detail: `The e is silent, but it changes ${round.short} into ${round.long}.`,
      }
    case 'story-quest':
      return {
        headline: 'Chunk the word',
        detail: 'Tap a word to show it split into its sounds.',
      }
    default:
      return null
  }
}

/** Everything the phonics layer exposes, re-exported for convenience. */
export { canDecode, wordByText, GRAPHEMES, LADDERS, MAGIC_E_PAIRS }
