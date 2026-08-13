/**
 * The shared phonics content layer.
 *
 * Every reading game consumes this — no game hardcodes its own word list
 * (spec §19). The rule that matters most: a game may only ever use words
 * the teacher's "Sounds We Know" set can actually decode (spec §20).
 */

export type ReadingStage = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6'

export const STAGE_NAMES: Record<ReadingStage, string> = {
  R1: 'Sounds only',
  R2: 'Letters make sounds',
  R3: 'Short words',
  R4: 'Two letters, one sound',
  R5: 'Blends',
  R6: 'Magic e',
}

export type Grapheme = {
  id: string
  /** What is written. Always lowercase in phonics activities (spec §28). */
  grapheme: string
  /** How it is said. Teachers see /s/, never "ess" (spec §9). */
  phoneme: string
  /** Position in the teaching sequence. */
  set: number
  kind: 'consonant' | 'vowel' | 'digraph'
  /** Shown to the teacher where a grapheme needs explaining. */
  note?: string
}

/**
 * The teaching sequence from the spec (§2). `ck` is presented as another
 * spelling of /k/ rather than a brand-new sound.
 */
export const GRAPHEMES: Grapheme[] = [
  // Set 1
  { id: 's', grapheme: 's', phoneme: '/s/', set: 1, kind: 'consonant' },
  { id: 'a', grapheme: 'a', phoneme: '/a/', set: 1, kind: 'vowel' },
  { id: 't', grapheme: 't', phoneme: '/t/', set: 1, kind: 'consonant' },
  { id: 'p', grapheme: 'p', phoneme: '/p/', set: 1, kind: 'consonant' },
  { id: 'i', grapheme: 'i', phoneme: '/i/', set: 1, kind: 'vowel' },
  { id: 'n', grapheme: 'n', phoneme: '/n/', set: 1, kind: 'consonant' },
  // Set 2
  { id: 'm', grapheme: 'm', phoneme: '/m/', set: 2, kind: 'consonant' },
  { id: 'd', grapheme: 'd', phoneme: '/d/', set: 2, kind: 'consonant' },
  { id: 'g', grapheme: 'g', phoneme: '/g/', set: 2, kind: 'consonant' },
  { id: 'o', grapheme: 'o', phoneme: '/o/', set: 2, kind: 'vowel' },
  { id: 'c', grapheme: 'c', phoneme: '/k/', set: 2, kind: 'consonant' },
  { id: 'k', grapheme: 'k', phoneme: '/k/', set: 2, kind: 'consonant' },
  // Set 3
  {
    id: 'ck',
    grapheme: 'ck',
    phoneme: '/k/',
    set: 3,
    kind: 'consonant',
    note: 'Another way to write /k/, used at the end of short words.',
  },
  { id: 'e', grapheme: 'e', phoneme: '/e/', set: 3, kind: 'vowel' },
  { id: 'u', grapheme: 'u', phoneme: '/u/', set: 3, kind: 'vowel' },
  { id: 'r', grapheme: 'r', phoneme: '/r/', set: 3, kind: 'consonant' },
  // Set 4
  { id: 'h', grapheme: 'h', phoneme: '/h/', set: 4, kind: 'consonant' },
  { id: 'b', grapheme: 'b', phoneme: '/b/', set: 4, kind: 'consonant' },
  { id: 'f', grapheme: 'f', phoneme: '/f/', set: 4, kind: 'consonant' },
  { id: 'l', grapheme: 'l', phoneme: '/l/', set: 4, kind: 'consonant' },
  // Set 5
  { id: 'j', grapheme: 'j', phoneme: '/j/', set: 5, kind: 'consonant' },
  { id: 'v', grapheme: 'v', phoneme: '/v/', set: 5, kind: 'consonant' },
  { id: 'w', grapheme: 'w', phoneme: '/w/', set: 5, kind: 'consonant' },
  { id: 'x', grapheme: 'x', phoneme: '/x/', set: 5, kind: 'consonant' },
  { id: 'y', grapheme: 'y', phoneme: '/y/', set: 5, kind: 'consonant' },
  { id: 'z', grapheme: 'z', phoneme: '/z/', set: 5, kind: 'consonant' },
  // Set 6 — two letters, one sound
  {
    id: 'sh',
    grapheme: 'sh',
    phoneme: '/sh/',
    set: 6,
    kind: 'digraph',
    note: 'Two letters, one sound.',
  },
  {
    id: 'ch',
    grapheme: 'ch',
    phoneme: '/ch/',
    set: 6,
    kind: 'digraph',
    note: 'Two letters, one sound.',
  },
  {
    id: 'th',
    grapheme: 'th',
    phoneme: '/th/',
    set: 6,
    kind: 'digraph',
    note: 'Two letters, one sound.',
  },
  // Magic e is a pattern rather than a grapheme, but the teacher enables it
  // the same way so the games can gate on it.
  {
    id: 'magic-e',
    grapheme: 'a_e',
    phoneme: 'magic e',
    set: 7,
    kind: 'vowel',
    note: 'The e on the end changes the vowel.',
  },
]

export const graphemeById = (id: string): Grapheme | undefined =>
  GRAPHEMES.find((g) => g.id === id)

/** Everything up to and including a set — the usual starting point. */
export const graphemesUpTo = (set: number): string[] =>
  GRAPHEMES.filter((g) => g.set <= set).map((g) => g.id)

export const DEFAULT_ENABLED = graphemesUpTo(2)

/* ------------------------------------------------------------------ *
 * Words
 * ------------------------------------------------------------------ */

export type WordKind = 'decodable' | 'tricky' | 'pseudoword'

export type ReadingWord = {
  text: string
  /** One entry per phoneme. `ship` is ['sh','i','p'] — three sounds. */
  graphemes: string[]
  kind: WordKind
  /** Set when there is a picture for this word. */
  picture?: string
}

const w = (text: string, graphemes: string[], picture?: string): ReadingWord => ({
  text,
  graphemes,
  kind: 'decodable',
  picture,
})

/** Number of sounds. `ship` = 3, `stop` = 4. */
export const phonemeCount = (word: ReadingWord): number => word.graphemes.length

/**
 * CVC and friends. Every entry is broken into graphemes so gating,
 * sound-box counts and blending prompts all come from one source.
 */
export const WORDS: ReadingWord[] = [
  // set 1–2 CVC
  w('sat', ['s', 'a', 't']),
  w('sit', ['s', 'i', 't']),
  w('sip', ['s', 'i', 'p']),
  w('tap', ['t', 'a', 'p'], 'tap'),
  w('tip', ['t', 'i', 'p']),
  w('pat', ['p', 'a', 't']),
  w('pit', ['p', 'i', 't']),
  w('pan', ['p', 'a', 'n'], 'pan'),
  w('pin', ['p', 'i', 'n'], 'pin'),
  w('nap', ['n', 'a', 'p']),
  w('tin', ['t', 'i', 'n'], 'tin'),
  w('man', ['m', 'a', 'n']),
  w('map', ['m', 'a', 'p'], 'map'),
  w('mat', ['m', 'a', 't'], 'mat'),
  w('mad', ['m', 'a', 'd']),
  w('dad', ['d', 'a', 'd']),
  w('dig', ['d', 'i', 'g']),
  w('dot', ['d', 'o', 't'], 'dot'),
  w('dog', ['d', 'o', 'g'], 'dog'),
  w('got', ['g', 'o', 't']),
  w('gap', ['g', 'a', 'p']),
  w('cat', ['c', 'a', 't'], 'cat'),
  w('cap', ['c', 'a', 'p'], 'cap'),
  w('can', ['c', 'a', 'n'], 'can'),
  w('cot', ['c', 'o', 't']),
  w('cop', ['c', 'o', 'p']),
  w('top', ['t', 'o', 'p'], 'top'),
  w('pot', ['p', 'o', 't'], 'pot'),
  w('pop', ['p', 'o', 'p']),
  w('mop', ['m', 'o', 'p'], 'mop'),
  w('kit', ['k', 'i', 't']),
  w('kid', ['k', 'i', 'd']),
  // set 3
  w('sun', ['s', 'u', 'n'], 'sun'),
  w('run', ['r', 'u', 'n']),
  w('rug', ['r', 'u', 'g'], 'rug'),
  w('rat', ['r', 'a', 't'], 'rat'),
  w('red', ['r', 'e', 'd']),
  w('net', ['n', 'e', 't'], 'net'),
  w('pet', ['p', 'e', 't']),
  w('pen', ['p', 'e', 'n'], 'pen'),
  w('ten', ['t', 'e', 'n']),
  w('cup', ['c', 'u', 'p'], 'cup'),
  w('cut', ['c', 'u', 't']),
  w('nut', ['n', 'u', 't'], 'nut'),
  w('mud', ['m', 'u', 'd']),
  w('duck', ['d', 'u', 'ck'], 'duck'),
  w('sock', ['s', 'o', 'ck'], 'sock'),
  w('rock', ['r', 'o', 'ck']),
  w('sack', ['s', 'a', 'ck']),
  w('pick', ['p', 'i', 'ck']),
  // set 4
  w('hat', ['h', 'a', 't'], 'hat'),
  w('hen', ['h', 'e', 'n'], 'hen'),
  w('hop', ['h', 'o', 'p']),
  w('hug', ['h', 'u', 'g']),
  w('bat', ['b', 'a', 't'], 'bat'),
  w('bag', ['b', 'a', 'g'], 'bag'),
  w('bed', ['b', 'e', 'd'], 'bed'),
  w('bus', ['b', 'u', 's'], 'bus'),
  w('bin', ['b', 'i', 'n']),
  w('big', ['b', 'i', 'g']),
  w('fan', ['f', 'a', 'n'], 'fan'),
  w('fish', ['f', 'i', 'sh'], 'fish'),
  w('fit', ['f', 'i', 't']),
  w('fun', ['f', 'u', 'n']),
  w('log', ['l', 'o', 'g'], 'log'),
  w('leg', ['l', 'e', 'g'], 'leg'),
  w('lid', ['l', 'i', 'd']),
  w('lip', ['l', 'i', 'p']),
  // set 5
  w('jam', ['j', 'a', 'm'], 'jam'),
  w('jet', ['j', 'e', 't']),
  w('jog', ['j', 'o', 'g']),
  w('van', ['v', 'a', 'n'], 'van'),
  w('vet', ['v', 'e', 't']),
  w('web', ['w', 'e', 'b'], 'web'),
  w('wig', ['w', 'i', 'g']),
  w('win', ['w', 'i', 'n']),
  w('box', ['b', 'o', 'x'], 'box'),
  w('fox', ['f', 'o', 'x'], 'fox'),
  w('six', ['s', 'i', 'x']),
  w('yes', ['y', 'e', 's']),
  w('zip', ['z', 'i', 'p'], 'zip'),
  // words the ladders and stories need
  w('sam', ['s', 'a', 'm']),
  w('ran', ['r', 'a', 'n']),
  w('on', ['o', 'n']),
  w('in', ['i', 'n']),
  w('is', ['i', 's']),
  w('at', ['a', 't']),
  w('up', ['u', 'p']),
  w('and', ['a', 'n', 'd']),
  w('get', ['g', 'e', 't']),
  w('had', ['h', 'a', 'd']),
  w('hid', ['h', 'i', 'd']),
  w('hit', ['h', 'i', 't']),
  w('hot', ['h', 'o', 't']),
  w('hip', ['h', 'i', 'p']),
  w('not', ['n', 'o', 't']),
  w('nod', ['n', 'o', 'd']),
  w('rod', ['r', 'o', 'd']),
  w('bun', ['b', 'u', 'n']),
  w('mug', ['m', 'u', 'g'], 'mug'),
  w('back', ['b', 'a', 'ck']),
  // set 6 — digraphs
  w('ship', ['sh', 'i', 'p'], 'ship'),
  w('shop', ['sh', 'o', 'p']),
  w('shed', ['sh', 'e', 'd']),
  w('dish', ['d', 'i', 'sh']),
  w('cash', ['c', 'a', 'sh']),
  w('chin', ['ch', 'i', 'n']),
  w('chop', ['ch', 'o', 'p']),
  w('chip', ['ch', 'i', 'p']),
  w('rich', ['r', 'i', 'ch']),
  w('much', ['m', 'u', 'ch']),
  w('thin', ['th', 'i', 'n']),
  w('that', ['th', 'a', 't']),
  w('this', ['th', 'i', 's']),
  w('bath', ['b', 'a', 'th']),
  w('moth', ['m', 'o', 'th']),
]

/**
 * Blends. Both consonants keep their own sound, so `stop` gets four
 * boxes where `shop` gets three (spec §2, R5).
 */
export const BLEND_WORDS: ReadingWord[] = [
  w('stop', ['s', 't', 'o', 'p'], 'stop'),
  w('step', ['s', 't', 'e', 'p']),
  w('spot', ['s', 'p', 'o', 't']),
  w('spin', ['s', 'p', 'i', 'n']),
  w('snap', ['s', 'n', 'a', 'p']),
  w('stem', ['s', 't', 'e', 'm']),
  w('frog', ['f', 'r', 'o', 'g'], 'frog'),
  w('flag', ['f', 'l', 'a', 'g'], 'flag'),
  w('flat', ['f', 'l', 'a', 't']),
  w('clap', ['c', 'l', 'a', 'p']),
  w('clip', ['c', 'l', 'i', 'p']),
  w('crab', ['c', 'r', 'a', 'b'], 'crab'),
  w('drum', ['d', 'r', 'u', 'm'], 'drum'),
  w('drip', ['d', 'r', 'i', 'p']),
  w('grin', ['g', 'r', 'i', 'n']),
  w('trip', ['t', 'r', 'i', 'p']),
  w('trap', ['t', 'r', 'a', 'p']),
  w('plan', ['p', 'l', 'a', 'n']),
  w('nest', ['n', 'e', 's', 't'], 'nest'),
  w('best', ['b', 'e', 's', 't']),
  w('lamp', ['l', 'a', 'm', 'p'], 'lamp'),
  w('jump', ['j', 'u', 'm', 'p']),
  w('hand', ['h', 'a', 'n', 'd'], 'hand'),
  w('milk', ['m', 'i', 'l', 'k']),
]

export const ALL_DECODABLE = [...WORDS, ...BLEND_WORDS]

export const wordByText = (text: string): ReadingWord | undefined =>
  ALL_DECODABLE.find((word) => word.text === text)

/* ------------------------------------------------------------------ *
 * Tricky words — taught separately, never sounded out box by box
 * (spec §5 rule E).
 * ------------------------------------------------------------------ */

export const TRICKY_WORDS: string[] = [
  'the',
  'said',
  'was',
  'you',
  'they',
  'I',
  'to',
  'go',
  'no',
  'he',
  'she',
  'we',
  'me',
  'be',
  'my',
  'her',
  'all',
  'are',
  'have',
  'like',
  'some',
  'come',
  'there',
  'were',
]

export const DEFAULT_TRICKY_ACTIVE = ['the', 'said', 'was', 'you', 'they']

/* ------------------------------------------------------------------ *
 * The gate. Every reading game filters through this.
 * ------------------------------------------------------------------ */

export type PhonicsConfig = {
  /** Grapheme ids the teacher has taught. */
  enabled: string[]
  /** Roughly five tricky words in play at a time. */
  trickyActive: string[]
  /** The teacher's current focus, for their own reference. */
  focus: ReadingStage
}

export const DEFAULT_PHONICS: PhonicsConfig = {
  enabled: DEFAULT_ENABLED,
  trickyActive: DEFAULT_TRICKY_ACTIVE,
  focus: 'R3',
}

/** Can this word be sounded out with only the sounds we know? */
export const canDecode = (word: ReadingWord, enabled: readonly string[]): boolean =>
  word.graphemes.every((g) => enabled.includes(g))

export const decodableWords = (
  enabled: readonly string[],
  pool: readonly ReadingWord[] = WORDS,
): ReadingWord[] => pool.filter((word) => canDecode(word, enabled))

/** Words with a picture, for the letter-free R1 activities. */
export const picturableWords = (enabled: readonly string[]): ReadingWord[] =>
  decodableWords(enabled, ALL_DECODABLE).filter((word) => word.picture)

export const enabledGraphemes = (enabled: readonly string[]): Grapheme[] =>
  GRAPHEMES.filter((g) => enabled.includes(g.id))

export const enabledVowels = (enabled: readonly string[]): Grapheme[] =>
  enabledGraphemes(enabled).filter((g) => g.kind === 'vowel' && g.id !== 'magic-e')

export const enabledConsonants = (enabled: readonly string[]): Grapheme[] =>
  enabledGraphemes(enabled).filter((g) => g.kind !== 'vowel')

/* ------------------------------------------------------------------ *
 * Pseudowords — the truth-teller for real decoding (spec §12).
 * ------------------------------------------------------------------ */

/**
 * Strings we never want a six-year-old asked to read aloud, plus a few
 * near-misses. Checked as whole words, so ordinary words are unaffected.
 */
const BLOCKED = new Set([
  'ass', 'arse', 'bum', 'bra', 'cok', 'cok', 'coc', 'cum', 'dam', 'dic', 'dik',
  'fag', 'fak', 'fuk', 'fuc', 'gay', 'god', 'jiz', 'nob', 'pee', 'pis', 'poo',
  'pox', 'pub', 'sex', 'shi', 'sod', 'tit', 'twa', 'wee', 'wet', 'wil', 'jew',
  'gun', 'gut', 'hel', 'hit', 'kil', 'rot', 'rip', 'sap', 'sic', 'vom', 'bog',
])

const REAL_WORDS = new Set(ALL_DECODABLE.map((word) => word.text))

/** A generated name must look and sound like a word a child could say. */
export function isUsablePseudoword(text: string): boolean {
  if (REAL_WORDS.has(text)) return false
  if (BLOCKED.has(text)) return false
  // No doubled consonant at the join, e.g. "ttip".
  if (/(.)\1/.test(text)) return false
  return true
}

const shuffled = <T,>(items: readonly T[]): T[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Builds a legal CVC pseudoword from the enabled set only. Returns null
 * when the enabled sounds cannot make one — better to tell the teacher
 * than to hand a child an untaught grapheme (spec §5 rule D).
 */
export function makePseudoword(
  enabled: readonly string[],
  avoid: readonly string[] = [],
): ReadingWord | null {
  const vowels = enabledVowels(enabled)
  // `ck` and `ng`-style endings are not valid word starts.
  const starts = enabledConsonants(enabled).filter((g) => g.id !== 'ck' && g.id !== 'x')
  const ends = enabledConsonants(enabled)
  if (!vowels.length || !starts.length || !ends.length) return null

  for (const start of shuffled(starts)) {
    for (const vowel of shuffled(vowels)) {
      for (const end of shuffled(ends)) {
        const graphemes = [start.id, vowel.id, end.id]
        const text = start.grapheme + vowel.grapheme + end.grapheme
        if (!isUsablePseudoword(text)) continue
        if (avoid.includes(text)) continue
        return { text, graphemes, kind: 'pseudoword' }
      }
    }
  }
  return null
}

/* ------------------------------------------------------------------ *
 * Magic e — curated pairs only (spec §15)
 * ------------------------------------------------------------------ */

export type MagicEPair = {
  short: string
  long: string
  /** Graphemes needed for the short form. */
  graphemes: string[]
  shortPicture?: string
  longPicture?: string
}

export const MAGIC_E_PAIRS: MagicEPair[] = [
  { short: 'hop', long: 'hope', graphemes: ['h', 'o', 'p'] },
  { short: 'tap', long: 'tape', graphemes: ['t', 'a', 'p'], shortPicture: 'tap', longPicture: 'tape' },
  { short: 'cap', long: 'cape', graphemes: ['c', 'a', 'p'], shortPicture: 'cap', longPicture: 'cape' },
  { short: 'kit', long: 'kite', graphemes: ['k', 'i', 't'], longPicture: 'kite' },
  { short: 'rid', long: 'ride', graphemes: ['r', 'i', 'd'] },
  { short: 'cub', long: 'cube', graphemes: ['c', 'u', 'b'] },
  { short: 'pin', long: 'pine', graphemes: ['p', 'i', 'n'], shortPicture: 'pin' },
  { short: 'can', long: 'cane', graphemes: ['c', 'a', 'n'], shortPicture: 'can' },
  { short: 'not', long: 'note', graphemes: ['n', 'o', 't'] },
  { short: 'man', long: 'mane', graphemes: ['m', 'a', 'n'] },
]

export const magicEPairsFor = (enabled: readonly string[]): MagicEPair[] =>
  MAGIC_E_PAIRS.filter((pair) => pair.graphemes.every((g) => enabled.includes(g)))

/* ------------------------------------------------------------------ *
 * Word ladders — curated, one sound changed per rung (spec §17)
 * ------------------------------------------------------------------ */

export type LadderStep = {
  from: string
  to: string
  /** Index of the grapheme that changes. */
  position: number
}

export type WordLadder = {
  id: string
  start: string
  steps: LadderStep[]
  graphemes: string[]
}

const ladder = (id: string, words: string[]): WordLadder => {
  const steps: LadderStep[] = []
  const used = new Set<string>()
  for (let i = 1; i < words.length; i++) {
    const before = wordByText(words[i - 1])!
    const after = wordByText(words[i])!
    const position = before.graphemes.findIndex((g, n) => g !== after.graphemes[n])
    steps.push({ from: words[i - 1], to: words[i], position })
    before.graphemes.forEach((g) => used.add(g))
    after.graphemes.forEach((g) => used.add(g))
  }
  return { id, start: words[0], steps, graphemes: [...used] }
}

export const LADDERS: WordLadder[] = [
  ladder('cat-cup', ['cat', 'cot', 'cop', 'cap', 'cup']),
  ladder('sat-sit', ['sat', 'sit', 'sip', 'tip', 'tin']),
  ladder('pan-pin', ['pan', 'pin', 'pit', 'pot', 'pop']),
  ladder('map-mop', ['map', 'mat', 'mad', 'mud', 'mug']),
  ladder('bat-bus', ['bat', 'bag', 'big', 'bin', 'bun']),
  ladder('hat-hen', ['hat', 'hit', 'hot', 'hop', 'hip']),
  ladder('net-rod', ['net', 'nut', 'not', 'nod', 'rod']),
]

export const laddersFor = (enabled: readonly string[]): WordLadder[] =>
  LADDERS.filter((l) => l.graphemes.every((g) => enabled.includes(g)))

/* ------------------------------------------------------------------ *
 * Decodable stories — original, and validated against the sound set
 * (spec §18)
 * ------------------------------------------------------------------ */

export type StoryPage = {
  /** Words already split so the teacher can tap any one of them. */
  words: string[]
  scene: string
}

export type DecodableStory = {
  id: string
  title: string
  pages: StoryPage[]
  /** Tricky words this story needs the teacher to have active. */
  trickyWords: string[]
}

const page = (text: string, scene: string): StoryPage => ({
  words: text.split(' '),
  scene,
})

export const STORIES: DecodableStory[] = [
  {
    id: 'sam-and-the-cat',
    title: 'Sam and the Cat',
    trickyWords: ['the'],
    pages: [
      page('Sam sat.', 'room'),
      page('The cat sat.', 'room'),
      page('Sam can pat the cat.', 'room'),
      page('The cat ran.', 'garden'),
      page('Sam ran.', 'garden'),
    ],
  },
  {
    id: 'the-big-dog',
    title: 'The Big Dog',
    trickyWords: ['the'],
    pages: [
      page('The dog sat on the mat.', 'room'),
      page('The dog is big.', 'room'),
      page('Get up, dog!', 'room'),
      page('The dog ran at the pot.', 'kitchen'),
      page('The pot is on the rug.', 'kitchen'),
    ],
  },
  {
    id: 'the-red-hen',
    title: 'The Red Hen',
    trickyWords: ['the'],
    pages: [
      page('The hen is red.', 'garden'),
      page('The hen ran up the log.', 'garden'),
      page('The hen sat and had fun.', 'garden'),
      page('The fox sat and hid.', 'garden'),
      page('The hen ran back!', 'garden'),
    ],
  },
  {
    id: 'the-ship',
    title: 'The Ship',
    trickyWords: ['the', 'was'],
    pages: [
      page('The ship is big.', 'sea'),
      page('The fish had fun.', 'sea'),
      page('The fish was thin.', 'sea'),
      page('The fish was in the ship.', 'sea'),
      page('Get on the ship!', 'sea'),
    ],
  },
]

/** Every non-tricky word in a story must be decodable with the sound set. */
export function storyIsReadable(
  story: DecodableStory,
  config: PhonicsConfig,
): boolean {
  const tricky = new Set(config.trickyActive.map((t) => t.toLowerCase()))
  // A story may not lean on a tricky word the teacher has not activated.
  if (!story.trickyWords.every((t) => tricky.has(t.toLowerCase()))) return false

  return story.pages.every((p) =>
    p.words.every((raw) => {
      const text = raw.toLowerCase().replace(/[^a-z]/g, '')
      if (!text) return true
      if (tricky.has(text)) return true
      const word = wordByText(text)
      return !!word && canDecode(word, config.enabled)
    }),
  )
}

export const storiesFor = (config: PhonicsConfig): DecodableStory[] =>
  STORIES.filter((story) => storyIsReadable(story, config))

/** Splits a word into its graphemes for the "Help" chunking display. */
export function chunk(text: string): string[] {
  const word = wordByText(text.toLowerCase().replace(/[^a-z]/g, ''))
  return word ? word.graphemes : text.split('')
}

/* ------------------------------------------------------------------ *
 * Sound Safari scenes — objects placed in a room, each with its sound
 * ------------------------------------------------------------------ */

export type SafariObject = {
  id: string
  word: string
  /** The grapheme its name begins with. */
  initial: string
  x: number
  y: number
}

export type SafariScene = {
  id: string
  title: string
  backdrop: string
  objects: SafariObject[]
}

const obj = (word: string, initial: string, x: number, y: number): SafariObject => ({
  id: word,
  word,
  initial,
  x,
  y,
})

export const SAFARI_SCENES: SafariScene[] = [
  {
    id: 'bedroom',
    title: 'The bedroom',
    backdrop: 'room',
    objects: [
      obj('sock', 's', 16, 72),
      obj('sun', 's', 78, 20),
      obj('bed', 'b', 30, 62),
      obj('cup', 'c', 62, 66),
      obj('map', 'm', 84, 46),
      obj('top', 't', 46, 74),
      obj('pen', 'p', 70, 78),
      obj('hat', 'h', 24, 34),
    ],
  },
  {
    id: 'kitchen',
    title: 'The kitchen',
    backdrop: 'kitchen',
    objects: [
      obj('pan', 'p', 22, 66),
      obj('pot', 'p', 40, 70),
      obj('jam', 'j', 60, 62),
      obj('mug', 'm', 76, 68),
      obj('tin', 't', 34, 40),
      obj('nut', 'n', 68, 40),
      obj('fish', 'f', 86, 74),
      obj('bag', 'b', 12, 62),
    ],
  },
  {
    id: 'garden',
    title: 'The garden',
    backdrop: 'garden',
    objects: [
      obj('log', 'l', 18, 74),
      obj('leg', 'l', 36, 66),
      obj('net', 'n', 54, 70),
      obj('sun', 's', 80, 18),
      obj('dog', 'd', 66, 72),
      obj('cat', 'c', 30, 50),
      obj('rat', 'r', 86, 66),
      obj('web', 'w', 48, 34),
    ],
  },
]

/** Objects in a scene whose name starts with the target sound. */
export const targetsIn = (scene: SafariScene, initial: string): SafariObject[] =>
  scene.objects.filter((o) => o.initial === initial)

/** Sounds this scene can actually be hunted for, given the enabled set. */
export function huntableSounds(
  scene: SafariScene,
  enabled: readonly string[],
): string[] {
  const counts = new Map<string, number>()
  for (const o of scene.objects) {
    counts.set(o.initial, (counts.get(o.initial) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([initial, count]) => count >= 2 && enabled.includes(initial))
    .map(([initial]) => initial)
}
