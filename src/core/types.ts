import type { PhonicsConfig } from './phonics'
/**
 * Shared vocabulary for the whole app.
 *
 * Three categories of state live here (see maths spec §39):
 *   A. Durable lesson state  -> SessionSnapshot (Supabase is the source of truth)
 *   B. Realtime interaction  -> Interaction (broadcast only, never persisted)
 *   C. Historical learning   -> Response[] (persisted to Postgres)
 */

export type MathsGameId =
  | 'flash-hide'
  | 'feed-monster'
  | 'bond-garden'
  | 'ten-frame'
  | 'number-line'

export type FeelingsGameId =
  | 'feeling-thermometer'
  | 'opposite-game'
  | 'mirror-faces'
  | 'scavenger-hunt'
  | 'rock-buddy'
  | 'freeze-dance'

export type ReadingGameId =
  | 'robot-translator'
  | 'sound-safari'
  | 'skywriter'
  | 'sound-box-factory'
  | 'monster-lab'
  | 'digraph-detectives'
  | 'blend-train'
  | 'magic-e-wizard'
  | 'tricky-treasure'
  | 'word-ladder'
  | 'story-quest'

export type GameId = MathsGameId | FeelingsGameId | ReadingGameId

export type GameCategory = 'maths' | 'reading' | 'feelings'

export type SessionStatus = 'waiting' | 'active' | 'paused' | 'ended'

export type CharacterId = 'rabbit' | 'frog' | 'cat' | 'unicorn'

export type Representation = 'dots' | 'fingers' | 'mixed'

export type TenFrameMode = 'build' | 'missing' | 'flash' | 'make-ten'

/* ------------------------------------------------------------------ *
 * Settings — one typed block per game.
 * The session carries all of them so switching games never loses setup.
 * ------------------------------------------------------------------ */

export type FlashSettings = {
  max: number
  duration: number
  representation: Representation
}

export type MonsterSettings = {
  target: number
  start: number
  randomStart: boolean
  showEquation: boolean
}

export type GardenSettings = {
  target: number
  /** "What's Missing?" — one pot starts pre-filled. */
  challenge: boolean
  showEquation: boolean
}

export type TenFrameSettings = {
  mode: TenFrameMode
  target: number
  randomTarget: boolean
  flashDuration: number
  showEquation: boolean
}

export type LineSettings = {
  range: number
  operation: '+' | '-' | 'mixed'
  amount: number
  start: number
  randomStart: boolean
  character: CharacterId
  /** Level 6 — child predicts the landing spot before jumping. */
  predict: boolean
  showEquation: boolean
}

/* --- Feelings & Focus --------------------------------------------- */

/** "ME" asks about the child; "CHARACTER" lets them answer for someone else. */
export type ThermometerMode = 'me' | 'character'

export type ThermometerSettings = {
  mode: ThermometerMode
  /** Starter keeps the word list to six; wider opens the full set. */
  vocabulary: 'starter' | 'wider'
  askBody: boolean
  askStrategy: boolean
}

export type OppositeMode = 'observed' | 'screen'

export type OppositeSettings = {
  /** 1–3 = that many rule pairs. 4 adds a rule switch. 5 keeps the pace up. */
  level: number
  mode: OppositeMode
}

export type MirrorMode = 'child-face' | 'guess' | 'silly'

export type MirrorSettings = {
  mode: MirrorMode
  askClue: boolean
  /** Include faces that genuinely read several ways. */
  includeAmbiguous: boolean
}

export type HuntSettings = {
  askWhy: boolean
  askNext: boolean
  askOther: boolean
}

export type BuddySettings = {
  breaths: number
  pace: 'slow' | 'slower'
  position: 'sit' | 'lie'
  askReflection: boolean
}

export type FreezeMode = 'classic' | 'silly' | 'tempo' | 'emotion' | 'opposite'

export type FreezeSettings = {
  mode: FreezeMode
}

/* --- Reading Adventures ------------------------------------------- */

export type RobotSettings = {
  /** picture = letter-free R1. say-it = teacher marks the spoken blend. */
  mode: 'picture' | 'say-it' | 'child-robot'
  /** 1 = two sounds, 2 = three sounds, 3 = shorter gaps. */
  level: number
}

export type SafariSettings = {
  mode: 'digital' | 'room'
}

export type SkywriterSettings = {
  mode: 'air' | 'trace' | 'quick-sound'
  showLetter: boolean
}

export type SoundBoxSettings = {
  countersFirst: boolean
  showPicture: boolean
}

export type MonsterLabSettings = {
  mode: 'read' | 'build'
}

export type DigraphSettings = {
  mode: 'sort' | 'count' | 'build'
}

export type BlendTrainSettings = {
  mode: 'build' | 'missing' | 'sort'
}

export type MagicESettings = {
  mode: 'cast' | 'break' | 'which'
}

export type TrickySettings = {
  mode: 'find' | 'flash' | 'sentence'
  flashDuration: number
}

export type LadderSettings = {
  target: 'moon' | 'treehouse' | 'castle' | 'cupcake'
}

export type StorySettings = {
  readingMode: 'together' | 'child' | 'turns'
}

export type Settings = {
  'flash-hide': FlashSettings
  'feed-monster': MonsterSettings
  'bond-garden': GardenSettings
  'ten-frame': TenFrameSettings
  'number-line': LineSettings
  'feeling-thermometer': ThermometerSettings
  'opposite-game': OppositeSettings
  'mirror-faces': MirrorSettings
  'scavenger-hunt': HuntSettings
  'rock-buddy': BuddySettings
  'freeze-dance': FreezeSettings
  'robot-translator': RobotSettings
  'sound-safari': SafariSettings
  'skywriter': SkywriterSettings
  'sound-box-factory': SoundBoxSettings
  'monster-lab': MonsterLabSettings
  'digraph-detectives': DigraphSettings
  'blend-train': BlendTrainSettings
  'magic-e-wizard': MagicESettings
  'tricky-treasure': TrickySettings
  'word-ladder': LadderSettings
  'story-quest': StorySettings
}

export type SettingsFor<G extends GameId> = Settings[G]

/* ------------------------------------------------------------------ *
 * Content pieces referenced by rounds
 * ------------------------------------------------------------------ */

export type Point = readonly [number, number]

export type DotPattern = {
  /** Human label for the teacher panel, e.g. "dice five". */
  label: string
  points: readonly Point[]
}

/** A word the child can pick. `id` is stable; `label` is what they read. */
export type Choice = {
  id: string
  label: string
}

export type OppositePair = {
  id: string
  /** What the teacher calls out. */
  command: Choice
  /** What the child should do instead. */
  opposite: Choice
}

/** A short situation the child answers about instead of themselves. */
export type Scenario = {
  id: string
  who: string
  what: string
}

export type FaceId = string
export type SceneId = string

/** One follow-up question in the Scavenger Hunt sequence. */
export type HuntStep = 'find' | 'why' | 'next' | 'other'

/* ------------------------------------------------------------------ *
 * Rounds — a discriminated union so each game gets exactly the data
 * it needs, and the teacher panel can describe any round generically.
 * ------------------------------------------------------------------ */

type RoundBase = {
  id: string
  /** What the teacher sees under "current question". */
  prompt: string
  /**
   * The number an objective answer is compared against. Absent for games
   * where there is no correct answer, which is most of Feelings & Focus.
   */
  expected?: number
  /**
   * Bumped when the teacher presses Repeat. The id stays put so responses
   * keep stacking on one question, while timed games know to replay.
   */
  shownAt: number
}

export type FlashRound = RoundBase & {
  game: 'flash-hide'
  expected: number
  quantity: number
  /** Highest button offered on the answer pad. */
  max: number
  pattern: DotPattern
  representation: 'dots' | 'fingers'
  duration: number
}

export type MonsterRound = RoundBase & {
  game: 'feed-monster'
  expected: number
  target: number
  start: number
  showEquation: boolean
}

export type GardenRound = RoundBase & {
  game: 'bond-garden'
  expected: number
  target: number
  challenge: boolean
  /** In challenge mode the left pot is pre-filled with this many. */
  fixedLeft: number
  showEquation: boolean
}

export type TenFrameRound = RoundBase & {
  game: 'ten-frame'
  expected: number
  mode: TenFrameMode
  target: number
  /** Counters already in the frame when the round opens. */
  prefilled: number
  flashDuration: number
  showEquation: boolean
}

export type LineRound = RoundBase & {
  game: 'number-line'
  expected: number
  range: number
  start: number
  operation: '+' | '-'
  amount: number
  character: CharacterId
  predict: boolean
  showEquation: boolean
}

export type ThermometerRound = RoundBase & {
  game: 'feeling-thermometer'
  mode: ThermometerMode
  scenario?: Scenario
  emotions: Choice[]
  askBody: boolean
  askStrategy: boolean
}

export type OppositeRound = RoundBase & {
  game: 'opposite-game'
  pairs: OppositePair[]
  mode: OppositeMode
  /** Level 4 — the teacher can flip a rule part-way through. */
  allowRuleSwitch: boolean
}

export type MirrorRound = RoundBase & {
  game: 'mirror-faces'
  mode: MirrorMode
  face?: FaceId
  /** Emotion words offered to the child. */
  options: Choice[]
  /** Readings the teacher is shown as reasonable — never "the answer". */
  possible: string[]
  askClue: boolean
  ambiguous: boolean
  /** child-face mode: the expression the child is asked to make. */
  askFor?: Choice
}

export type HuntRound = RoundBase & {
  game: 'scavenger-hunt'
  scene: SceneId
  /** "Find someone who might feel ___" */
  looksFor: Choice
  steps: HuntStep[]
}

export type BuddyRound = RoundBase & {
  game: 'rock-buddy'
  breaths: number
  pace: 'slow' | 'slower'
  position: 'sit' | 'lie'
  askReflection: boolean
}

export type FreezeRound = RoundBase & {
  game: 'freeze-dance'
  mode: FreezeMode
}

/* --- Reading rounds ------------------------------------------------- *
 * Each carries its own resolved content, so teacher and child look at
 * exactly the same words without re-running any generator.
 * ------------------------------------------------------------------- */

/** A word plus its grapheme breakdown, copied from the phonics layer. */
export type RoundWord = {
  text: string
  graphemes: string[]
  picture?: string
}

export type RobotRound = RoundBase & {
  game: 'robot-translator'
  word: RoundWord
  mode: 'picture' | 'say-it' | 'child-robot'
  level: number
  /** Picture choices, only in picture mode. */
  options: RoundWord[]
}

export type SafariRound = RoundBase & {
  game: 'sound-safari'
  mode: 'digital' | 'room'
  scene: string
  /** Grapheme id being hunted, e.g. 's'. */
  target: string
  phoneme: string
}

export type SkywriterRound = RoundBase & {
  game: 'skywriter'
  mode: 'air' | 'trace' | 'quick-sound'
  grapheme: string
  phoneme: string
  showLetter: boolean
  /** Sound choices for quick-sound mode. */
  options: string[]
}

export type SoundBoxRound = RoundBase & {
  game: 'sound-box-factory'
  word: RoundWord
  /** Grapheme ids offered in the tray, shuffled. */
  tray: string[]
  countersFirst: boolean
  showPicture: boolean
}

export type MonsterLook = {
  eyes: number
  horns: number
  colour: number
  feet: number
}

export type MonsterLabRound = RoundBase & {
  game: 'monster-lab'
  mode: 'read' | 'build'
  /** The pseudoword. Null when the sound set cannot make a legal one. */
  name: RoundWord | null
  look: MonsterLook
  /** Graphemes offered when the child builds the name themselves. */
  tray: string[]
}

export type DigraphRound = RoundBase & {
  game: 'digraph-detectives'
  mode: 'sort' | 'count' | 'build'
  /** sort mode: words to file, including traps that belong to nobody. */
  words: RoundWord[]
  /** count and build modes. */
  word?: RoundWord
  options: string[]
}

export type BlendTrainRound = RoundBase & {
  game: 'blend-train'
  mode: 'build' | 'missing' | 'sort'
  word?: RoundWord
  words: RoundWord[]
  tray: string[]
  /** missing mode: which carriage was emptied. */
  missingIndex?: number
}

export type MagicERound = RoundBase & {
  game: 'magic-e-wizard'
  mode: 'cast' | 'break' | 'which'
  short: string
  long: string
  shortPicture?: string
  longPicture?: string
}

export type TrickyRound = RoundBase & {
  game: 'tricky-treasure'
  mode: 'find' | 'flash' | 'sentence'
  target: string
  options: string[]
  /** sentence mode: words with one gap marked as three underscores. */
  sentence?: string[]
  flashDuration: number
}

export type LadderRound = RoundBase & {
  game: 'word-ladder'
  ladderId: string
  start: string
  steps: { from: string; to: string; position: number }[]
  climbTo: string
  tray: string[]
}

export type StoryRound = RoundBase & {
  game: 'story-quest'
  storyId: string
  title: string
  pages: { words: string[]; scene: string }[]
  page: number
  readingMode: 'together' | 'child' | 'turns'
  /** Word the teacher asked for help with, chunked on the child's screen. */
  helpWord?: string
  /** Set once the story is finished and the child is retelling. */
  retelling?: boolean
}

export type Round =
  | FlashRound
  | MonsterRound
  | GardenRound
  | TenFrameRound
  | LineRound
  | ThermometerRound
  | OppositeRound
  | MirrorRound
  | HuntRound
  | BuddyRound
  | FreezeRound
  | RobotRound
  | SafariRound
  | SkywriterRound
  | SoundBoxRound
  | MonsterLabRound
  | DigraphRound
  | BlendTrainRound
  | MagicERound
  | TrickyRound
  | LadderRound
  | StoryRound

export type RoundFor<G extends GameId> = Extract<Round, { game: G }>

/* ------------------------------------------------------------------ *
 * Teacher cues — a live instruction inside an open round.
 *
 * Kept in durable state rather than fired and forgotten, so a child who
 * reconnects mid-round still sees the instruction they are acting on.
 * ------------------------------------------------------------------ */

export type CueKind =
  | 'opposite'
  | 'freeze'
  | 'face'
  | 'silly-guess'
  | 'clue'
  | 'read-it-wrong'

export type Cue = {
  id: string
  roundId: string
  kind: CueKind
  /** The big words on the child's screen. */
  headline: string
  detail?: string
  /** Screen-response mode: the choice id the child should tap. */
  expect?: string
  /** Freeze Dance only. */
  state?: 'dance' | 'freeze'
  sentAt: number
}

/* ------------------------------------------------------------------ *
 * What a child did — three genuinely different kinds of thing.
 *
 * A maths answer can be marked. "How does Pip feel?" cannot, and pretending
 * otherwise would turn feelings into right and wrong (feelings spec §3).
 * ------------------------------------------------------------------ */

export type ObservationField =
  | 'intensity'
  | 'emotion'
  | 'body-clue'
  | 'strategy'
  | 'face-emotion'
  | 'face-clue'
  | 'character'
  | 'reason'
  | 'next-step'
  | 'other-view'
  | 'reflection'
  | 'protest'
  | 'breathing'
  | 'picture'
  | 'sound'
  | 'letter'
  | 'word-built'
  | 'digraph'
  | 'sorted'
  | 'story-page'
  | 'retell'

export type TeacherMark =
  | 'got-it'
  | 'try-again'
  | 'froze'
  | 'needed-cue'
  | 'completed'
  // Reading observations (spec section 7). The browser cannot hear the
  // child, so anything spoken is marked by the teacher over the video call.
  | 'read-independently'
  | 'sounded-with-help'
  | 'needed-prompt'
  | 'guessed'
  | 'self-corrected'
  | 'teacher-supplied'
  | 'retold-independently'
  | 'retold-with-prompts'

type ResponseBase = {
  id: string
  roundId: string
  game: GameId
  /** Ordinal within this round. */
  attempt: number
  /** Pre-formatted for the teacher's history strip. */
  label: string
  at: number
}

/** Has a right answer, and the child either found it or is still looking. */
export type ObjectiveResponse = ResponseBase & {
  outcome: 'objective'
  answer: number
  expected: number
  correct: boolean
  responseTimeMs?: number
  /** Number-line level 6 records the guess separately from the result. */
  kind?: 'prediction' | 'final'
}

/** Something the child noticed or chose. Never marked, only noted. */
export type ObservationalResponse = ResponseBase & {
  outcome: 'observational'
  field: ObservationField
  /** Ids of what they picked — several where multi-select makes sense. */
  choices: string[]
  /** Readable version of `choices`, for the teacher panel. */
  choiceLabels: string[]
  /** Thermometer level, breath count, and similar. */
  level?: number
  /** Readings the teacher may want to open up, never a correct answer. */
  possible?: string[]
}

/** The teacher watched something happen off-screen and noted it. */
export type MarkedResponse = ResponseBase & {
  outcome: 'marked'
  mark: TeacherMark
  cueId?: string
}

export type Response =
  | ObjectiveResponse
  | ObservationalResponse
  | MarkedResponse

/** The maths games only ever produce objective responses. */
export type Attempt = ObjectiveResponse

export type Interaction = {
  game: GameId
  roundId: string
  kind:
    | 'berry'
    | 'flower'
    | 'counter'
    | 'jump'
    | 'pickup'
    | 'thermometer'
    | 'breath'
    | 'stage'
    | 'sorted'
  value: number
  secondary?: number
  /** Plain-English line for the teacher, e.g. "Bowl has 3 of 5". */
  message: string
}

/** A discovered part-part-whole pair, always stored small-first. */
export type Bond = readonly [number, number]

/** A game set aside by Quick Break, waiting to be returned to. */
export type ParkedGame = {
  game: GameId
  round?: Round
}

export type SessionSnapshot = {
  id: string
  code: string
  status: SessionStatus
  nickname?: string
  game?: GameId
  settings: Settings
  round?: Round
  cue?: Cue
  /** Shared by every reading game: the sounds this child has been taught. */
  phonics: PhonicsConfig
  responses: Response[]
  /** Bonds the child has found this lesson, keyed by target number. */
  discoveries: Record<number, Bond[]>
  parked?: ParkedGame
  note?: string
  startedAt: number
  updatedAt: number
}

export type ConnectionState = 'waiting' | 'connected' | 'reconnecting'

/* ------------------------------------------------------------------ *
 * Game registry
 * ------------------------------------------------------------------ */

export const GAME_NAMES: Record<GameId, string> = {
  'flash-hide': 'Flash & Hide',
  'feed-monster': 'Feed the Monster',
  'bond-garden': 'Number Bond Garden',
  'ten-frame': 'Ten-Frame Builder',
  'number-line': 'Number-Line Adventure',
  'feeling-thermometer': 'Feeling Thermometer',
  'opposite-game': 'The Opposite Game',
  'mirror-faces': 'Mirror Face Charades',
  'scavenger-hunt': 'Character Scavenger Hunt',
  'rock-buddy': 'Rock the Buddy',
  'freeze-dance': 'Freeze Dance',
  'robot-translator': 'Robot Translator',
  'sound-safari': 'Sound Safari',
  'skywriter': 'Skywriter Studio',
  'sound-box-factory': 'Sound Box Factory',
  'monster-lab': 'Monster Name Lab',
  'digraph-detectives': 'Digraph Detectives',
  'blend-train': 'Blend Train',
  'magic-e-wizard': 'Magic-e Wizard',
  'tricky-treasure': 'Tricky Word Treasure',
  'word-ladder': 'Word Ladder Workshop',
  'story-quest': 'Story Quest',
}

export const GAME_IDS = Object.keys(GAME_NAMES) as GameId[]

export const GAME_CATEGORY: Record<GameId, GameCategory> = {
  'flash-hide': 'maths',
  'feed-monster': 'maths',
  'bond-garden': 'maths',
  'ten-frame': 'maths',
  'number-line': 'maths',
  'feeling-thermometer': 'feelings',
  'opposite-game': 'feelings',
  'mirror-faces': 'feelings',
  'scavenger-hunt': 'feelings',
  'rock-buddy': 'feelings',
  'freeze-dance': 'feelings',
  'robot-translator': 'reading',
  'sound-safari': 'reading',
  'skywriter': 'reading',
  'sound-box-factory': 'reading',
  'monster-lab': 'reading',
  'digraph-detectives': 'reading',
  'blend-train': 'reading',
  'magic-e-wizard': 'reading',
  'tricky-treasure': 'reading',
  'word-ladder': 'reading',
  'story-quest': 'reading',
}

export const CATEGORY_NAMES: Record<GameCategory, string> = {
  maths: 'Maths',
  reading: 'Reading Adventures',
  feelings: 'Feelings & Focus',
}

export const CATEGORY_ORDER: GameCategory[] = ['maths', 'reading', 'feelings']

export const gamesIn = (category: GameCategory): GameId[] =>
  GAME_IDS.filter((id) => GAME_CATEGORY[id] === category)

export const GAME_BLURBS: Record<GameId, string> = {
  'flash-hide': 'See a number without counting it',
  'feed-monster': 'Find the missing part of a whole',
  'bond-garden': 'Split a number in lots of ways',
  'ten-frame': 'Build a clear picture of five and ten',
  'number-line': 'Make adding and taking away move',
  'feeling-thermometer': 'How big is the feeling right now?',
  'opposite-game': 'Do the opposite — practise brain brakes',
  'mirror-faces': 'What might this face be telling us?',
  'scavenger-hunt': 'Find the feelings hiding in a scene',
  'rock-buddy': 'Rock a buddy to sleep with slow breaths',
  'freeze-dance': 'Dance, then stop your whole body',
  'robot-translator': 'Hear the sounds, say the word',
  'sound-safari': 'Hunt for things that start with a sound',
  'skywriter': 'Draw a letter and say its sound',
  'sound-box-factory': 'One box for every sound in a word',
  'monster-lab': 'Sound out a name nobody has read before',
  'digraph-detectives': 'Find the letters working as a team',
  'blend-train': 'One carriage for every sound',
  'magic-e-wizard': 'Add an e and change the word',
  'tricky-treasure': 'Words we know by sight, not by sounding out',
  'word-ladder': 'Change one sound and climb a rung',
  'story-quest': 'Read a whole little story',
}

/* ------------------------------------------------------------------ *
 * Defaults
 * ------------------------------------------------------------------ */

export const DEFAULT_SETTINGS: Settings = {
  'flash-hide': { max: 5, duration: 1000, representation: 'dots' },
  'feed-monster': { target: 5, start: 2, randomStart: true, showEquation: true },
  'bond-garden': { target: 5, challenge: false, showEquation: true },
  'ten-frame': {
    mode: 'build',
    target: 7,
    randomTarget: false,
    flashDuration: 1200,
    showEquation: true,
  },
  'number-line': {
    range: 10,
    operation: '+',
    amount: 2,
    start: 3,
    randomStart: true,
    character: 'rabbit',
    predict: false,
    showEquation: true,
  },
  'feeling-thermometer': {
    mode: 'me',
    vocabulary: 'starter',
    askBody: true,
    askStrategy: true,
  },
  'opposite-game': { level: 1, mode: 'observed' },
  'mirror-faces': { mode: 'guess', askClue: true, includeAmbiguous: false },
  'scavenger-hunt': { askWhy: true, askNext: true, askOther: false },
  'rock-buddy': {
    breaths: 3,
    pace: 'slow',
    position: 'sit',
    askReflection: true,
  },
  'freeze-dance': { mode: 'classic' },
  'robot-translator': { mode: 'picture', level: 2 },
  'sound-safari': { mode: 'digital' },
  'skywriter': { mode: 'trace', showLetter: true },
  'sound-box-factory': { countersFirst: false, showPicture: true },
  'monster-lab': { mode: 'read' },
  'digraph-detectives': { mode: 'sort' },
  'blend-train': { mode: 'build' },
  'magic-e-wizard': { mode: 'cast' },
  'tricky-treasure': { mode: 'find', flashDuration: 1200 },
  'word-ladder': { target: 'treehouse' },
  'story-quest': { readingMode: 'child' },
}
