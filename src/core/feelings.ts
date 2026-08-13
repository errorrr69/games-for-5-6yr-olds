import type { Choice, OppositePair, Scenario } from './types'

/**
 * All Feelings & Focus content in one place, so new word lists, faces and
 * story packs can be added without touching a component.
 *
 * Language rule (spec §18): everything here is written for a six-year-old.
 * Clinical vocabulary belongs in comments, never on the child's screen.
 */

const choice = (id: string, label: string): Choice => ({ id, label })

/* ------------------------------------------------------------------ *
 * Feeling Thermometer
 * ------------------------------------------------------------------ */

/**
 * Intensity, not morality. Level 5 is not "bad" — a birthday is a 5.
 * The wording asks how BIG a feeling is (spec §6).
 */
export const INTENSITY_LEVELS = [
  { level: 1, label: 'Calm', hint: 'settled and quiet' },
  { level: 2, label: 'Little', hint: 'just a small feeling' },
  { level: 3, label: 'Medium', hint: 'I really notice it' },
  { level: 4, label: 'Big', hint: 'it fills me up' },
  { level: 5, label: 'Very big', hint: 'it is everywhere' },
] as const

export const intensityLabel = (level: number): string =>
  INTENSITY_LEVELS.find((l) => l.level === level)?.label ?? 'Unknown'

/** Six words to start with; the teacher can open up the full list. */
const STARTER_EMOTIONS: Choice[] = [
  choice('happy', 'Happy'),
  choice('excited', 'Excited'),
  choice('calm', 'Calm'),
  choice('worried', 'Worried'),
  choice('sad', 'Sad'),
  choice('angry', 'Angry'),
]

const WIDER_EMOTIONS: Choice[] = [
  ...STARTER_EMOTIONS,
  choice('frustrated', 'Frustrated'),
  choice('scared', 'Scared'),
  choice('disappointed', 'Disappointed'),
  choice('proud', 'Proud'),
  choice('embarrassed', 'Embarrassed'),
  choice('jealous', 'Jealous'),
]

/** Never make a child name a feeling they cannot find (spec §6). */
export const NOT_SURE = choice('not-sure', 'I’m not sure')

export const emotionsFor = (vocabulary: 'starter' | 'wider'): Choice[] => [
  ...(vocabulary === 'starter' ? STARTER_EMOTIONS : WIDER_EMOTIONS),
  NOT_SURE,
]

export const ALL_EMOTIONS: Choice[] = [...WIDER_EMOTIONS, NOT_SURE]

/**
 * Body clues. Noticing only — these are never interpreted medically
 * and never combined into any kind of reading (spec §6).
 */
export const BODY_CLUES: Choice[] = [
  choice('fast-heart', 'Fast heart'),
  choice('hot-face', 'Hot face'),
  choice('tight-tummy', 'Tight tummy'),
  choice('butterflies', 'Butterflies'),
  choice('shaky-hands', 'Shaky hands'),
  choice('tight-fists', 'Tight fists'),
  choice('busy-legs', 'Busy legs'),
  choice('want-to-move', 'Wanting to move'),
  choice('heavy-body', 'Heavy body'),
  choice('tears', 'Tears'),
  choice('fast-breathing', 'Fast breathing'),
  choice('somewhere-else', 'Somewhere else'),
  choice('dont-know', 'I don’t know'),
]

/** Roughly where each clue sits on the body silhouette, in percent. */
export const CLUE_SPOTS: Record<string, { x: number; y: number }> = {
  'fast-heart': { x: 42, y: 33 },
  'hot-face': { x: 50, y: 12 },
  'tight-tummy': { x: 50, y: 46 },
  butterflies: { x: 58, y: 46 },
  'shaky-hands': { x: 20, y: 55 },
  'tight-fists': { x: 80, y: 55 },
  'busy-legs': { x: 40, y: 78 },
  'want-to-move': { x: 62, y: 78 },
  'heavy-body': { x: 50, y: 62 },
  tears: { x: 40, y: 15 },
  'fast-breathing': { x: 57, y: 27 },
}

/**
 * "What does your body need next?" — not "get back to green".
 * Staying excited is a legitimate answer (spec §6, stage 4).
 */
export const STRATEGIES: Choice[] = [
  choice('big-breath', 'Big breath'),
  choice('move', 'Move my body'),
  choice('water', 'Get some water'),
  choice('quiet-minute', 'Quiet minute'),
  choice('ask-help', 'Ask for help'),
  choice('squeeze', 'Squeeze something'),
  choice('count', 'Count slowly'),
  choice('talk', 'Talk about it'),
  choice('brain-break', 'Brain break'),
  choice('stay-excited', 'Stay excited!'),
]

/** Character Mode: answering for someone else asks nothing of the child. */
export const SCENARIOS: Scenario[] = [
  { id: 'tower', who: 'Pip', what: 'built a giant tower, and someone knocked it over' },
  { id: 'turn', who: 'Bo', what: 'has been waiting a long time for a turn on the swing' },
  { id: 'party', who: 'Nel', what: 'is going to a party with lots of new people' },
  { id: 'lost', who: 'Dot', what: 'cannot find their favourite toy anywhere' },
  { id: 'rain', who: 'Pip', what: 'had to come inside because it started raining' },
  { id: 'win', who: 'Bo', what: 'finally did something they had practised for ages' },
  { id: 'new', who: 'Nel', what: 'is standing by the door on their first day somewhere new' },
  { id: 'share', who: 'Dot', what: 'wanted the same toy as their friend' },
]

/* ------------------------------------------------------------------ *
 * The Opposite Game
 * ------------------------------------------------------------------ */

const pair = (
  id: string,
  a: [string, string],
  b: [string, string],
): OppositePair => ({
  id,
  command: choice(a[0], a[1]),
  opposite: choice(b[0], b[1]),
})

export const OPPOSITE_PAIRS: OppositePair[] = [
  pair('jump-sit', ['jump', 'JUMP'], ['sit', 'SIT']),
  pair('hands', ['hands-up', 'HANDS UP'], ['hands-down', 'HANDS DOWN']),
  pair('look', ['look-left', 'LOOK LEFT'], ['look-right', 'LOOK RIGHT']),
  pair('stand-crouch', ['stand', 'STAND'], ['crouch', 'CROUCH']),
  pair('volume', ['loud', 'LOUD'], ['quiet', 'QUIET']),
  pair('size', ['big', 'BIG'], ['small', 'SMALL']),
  pair('speed', ['fast', 'FAST'], ['slow', 'SLOW']),
]

/** Pairs a child can answer by tapping, rather than with their body. */
export const SCREEN_FRIENDLY = new Set(['look', 'hands', 'size', 'speed', 'volume'])

/**
 * A rule switch keeps the *command* but changes what it now means, which
 * is what makes it a flexibility exercise rather than a memory one.
 */
export function switchRule(pairs: OppositePair[]): OppositePair[] {
  if (pairs.length === 0) return pairs
  const [first, ...rest] = pairs
  const replacement =
    OPPOSITE_PAIRS.find(
      (p) => p.id !== first.id && !rest.some((r) => r.id === p.id),
    ) ?? OPPOSITE_PAIRS[0]
  return [{ ...first, opposite: replacement.opposite }, ...rest]
}

/* ------------------------------------------------------------------ *
 * Mirror Face Charades
 *
 * `possible` lists readings a teacher might reasonably open up. It is
 * shown to the teacher as discussion material, never as an answer key —
 * a face is a clue, not proof (spec §8).
 * ------------------------------------------------------------------ */

export type FaceDefinition = {
  id: string
  /** Drawing instructions consumed by the Face component. */
  brows: 'neutral' | 'raised' | 'furrowed' | 'worried' | 'soft'
  eyes: 'open' | 'wide' | 'narrow' | 'closed' | 'teary'
  mouth: 'smile' | 'big-smile' | 'flat' | 'frown' | 'open' | 'wobble' | 'small-smile'
  extra?: 'blush' | 'sweat' | 'sparkle'
  /** True when the face genuinely reads several ways. */
  ambiguous: boolean
  possible: string[]
}

export const FACES: FaceDefinition[] = [
  {
    id: 'bright',
    brows: 'soft',
    eyes: 'open',
    mouth: 'big-smile',
    extra: 'blush',
    ambiguous: false,
    possible: ['happy', 'excited', 'proud'],
  },
  {
    id: 'downcast',
    brows: 'worried',
    eyes: 'teary',
    mouth: 'frown',
    ambiguous: false,
    possible: ['sad', 'disappointed'],
  },
  {
    id: 'stormy',
    brows: 'furrowed',
    eyes: 'narrow',
    mouth: 'flat',
    ambiguous: false,
    possible: ['angry', 'frustrated'],
  },
  {
    id: 'startled',
    brows: 'raised',
    eyes: 'wide',
    mouth: 'open',
    ambiguous: false,
    possible: ['surprised', 'scared'],
  },
  {
    id: 'sleepy',
    brows: 'soft',
    eyes: 'closed',
    mouth: 'small-smile',
    ambiguous: false,
    possible: ['sleepy', 'calm'],
  },
  {
    id: 'unsure',
    brows: 'worried',
    eyes: 'open',
    mouth: 'wobble',
    ambiguous: false,
    possible: ['worried', 'confused'],
  },
  // Deliberately open to more than one reading.
  {
    id: 'held-tight',
    brows: 'raised',
    eyes: 'wide',
    mouth: 'small-smile',
    ambiguous: true,
    possible: ['excited', 'worried', 'surprised'],
  },
  {
    id: 'quiet-corners',
    brows: 'soft',
    eyes: 'narrow',
    mouth: 'small-smile',
    extra: 'blush',
    ambiguous: true,
    possible: ['proud', 'embarrassed', 'shy'],
  },
  {
    id: 'still-face',
    brows: 'neutral',
    eyes: 'open',
    mouth: 'flat',
    ambiguous: true,
    possible: ['calm', 'bored', 'thinking', 'sad'],
  },
]

export const FACE_CLUES: Choice[] = [
  choice('eyebrows', 'Eyebrows'),
  choice('eyes', 'Eyes'),
  choice('mouth', 'Mouth'),
  choice('hands', 'Hands'),
  choice('body', 'Body'),
  choice('something-else', 'Something else'),
]

/** Faces the teacher can ask the child to pull in Mode 1. */
export const FACE_REQUESTS: Choice[] = [
  choice('happy', 'Happy'),
  choice('sad', 'Sad'),
  choice('angry', 'Angry'),
  choice('worried', 'Worried'),
  choice('surprised', 'Surprised'),
  choice('confused', 'Confused'),
  choice('excited', 'Excited'),
  choice('proud', 'Proud'),
  choice('disappointed', 'Disappointed'),
  choice('frustrated', 'Frustrated'),
]

/** Wrong on purpose, so the child gets to correct the adult (spec §4B). */
export const SILLY_GUESSES = [
  'sleepy',
  'hungry',
  'ticklish',
  'like they just saw a dinosaur',
  'like they are about to sneeze',
]

/* ------------------------------------------------------------------ *
 * Character Scavenger Hunt
 *
 * Original scenes only — no copyrighted picture-book content (spec §9).
 * Each figure carries `might` so several readings stay open.
 * ------------------------------------------------------------------ */

export type SceneFigure = {
  id: string
  name: string
  /** Placement on the scene, in percent. */
  x: number
  y: number
  /** Which face to draw. */
  face: string
  /** Posture hint for the illustration. */
  pose: 'standing' | 'sitting' | 'reaching' | 'covering-ears' | 'slumped' | 'waving'
  /** Feelings a teacher might reasonably explore for this figure. */
  might: string[]
  /** What is happening to them, for the teacher panel. */
  doing: string
}

export type Scene = {
  id: string
  title: string
  /** Read aloud by the teacher; the child mostly looks at the picture. */
  blurb: string
  backdrop: 'party' | 'classroom' | 'outdoors' | 'playroom'
  figures: SceneFigure[]
}

export const SCENES: Scene[] = [
  {
    id: 'birthday',
    title: 'The birthday party',
    blurb: 'It is someone’s birthday. There is cake, and there were balloons.',
    backdrop: 'party',
    figures: [
      { id: 'balloon-holder', name: 'the one holding a balloon', x: 22, y: 58, face: 'bright', pose: 'standing', might: ['happy', 'excited', 'proud'], doing: 'holding a balloon' },
      { id: 'popped', name: 'the one whose balloon popped', x: 45, y: 62, face: 'downcast', pose: 'slumped', might: ['sad', 'disappointed', 'frustrated'], doing: 'looking at a popped balloon' },
      { id: 'ears', name: 'the one covering their ears', x: 68, y: 58, face: 'startled', pose: 'covering-ears', might: ['scared', 'worried', 'overwhelmed'], doing: 'covering their ears' },
      { id: 'waiting', name: 'the one beside the cake', x: 86, y: 60, face: 'held-tight', pose: 'standing', might: ['excited', 'worried', 'impatient'], doing: 'waiting beside the cake' },
    ],
  },
  {
    id: 'tower',
    title: 'The tower falls',
    blurb: 'A tall tower of blocks has just come down.',
    backdrop: 'playroom',
    figures: [
      { id: 'builder', name: 'the one who built it', x: 30, y: 62, face: 'stormy', pose: 'slumped', might: ['angry', 'frustrated', 'sad', 'disappointed'], doing: 'sitting by the fallen blocks' },
      { id: 'bumper', name: 'the one who bumped it', x: 58, y: 58, face: 'unsure', pose: 'standing', might: ['worried', 'embarrassed', 'sorry'], doing: 'standing very still' },
      { id: 'watcher', name: 'the one watching', x: 80, y: 60, face: 'still-face', pose: 'sitting', might: ['calm', 'surprised', 'unsure'], doing: 'watching from nearby' },
    ],
  },
  {
    id: 'same-toy',
    title: 'The same toy',
    blurb: 'Two children have reached for the same toy at the same moment.',
    backdrop: 'playroom',
    figures: [
      { id: 'left-hand', name: 'the one on the left', x: 34, y: 60, face: 'stormy', pose: 'reaching', might: ['angry', 'frustrated', 'determined'], doing: 'holding one side of the toy' },
      { id: 'right-hand', name: 'the one on the right', x: 62, y: 60, face: 'unsure', pose: 'reaching', might: ['frustrated', 'worried', 'sad'], doing: 'holding the other side' },
    ],
  },
  {
    id: 'new-room',
    title: 'A new room',
    blurb: 'Everyone is playing. One child has just arrived.',
    backdrop: 'classroom',
    figures: [
      { id: 'newcomer', name: 'the one by the door', x: 16, y: 60, face: 'held-tight', pose: 'standing', might: ['worried', 'shy', 'excited', 'lonely'], doing: 'standing near the door' },
      { id: 'players-a', name: 'one of the players', x: 52, y: 62, face: 'bright', pose: 'sitting', might: ['happy', 'busy'], doing: 'playing with others' },
      { id: 'players-b', name: 'the other player', x: 70, y: 62, face: 'bright', pose: 'sitting', might: ['happy', 'excited'], doing: 'playing with others' },
    ],
  },
  {
    id: 'lost-toy',
    title: 'The missing toy',
    blurb: 'Someone has looked everywhere and still cannot find it.',
    backdrop: 'playroom',
    figures: [
      { id: 'searcher', name: 'the one searching', x: 36, y: 60, face: 'downcast', pose: 'standing', might: ['sad', 'worried', 'frustrated'], doing: 'looking under things' },
      { id: 'helper', name: 'the one helping look', x: 64, y: 60, face: 'still-face', pose: 'reaching', might: ['helpful', 'calm', 'worried'], doing: 'helping to search' },
    ],
  },
  {
    id: 'rain',
    title: 'The rain starts',
    blurb: 'Outdoor play has stopped suddenly because it began to rain.',
    backdrop: 'outdoors',
    figures: [
      { id: 'disappointed', name: 'the one still holding a ball', x: 30, y: 60, face: 'downcast', pose: 'standing', might: ['disappointed', 'sad', 'frustrated'], doing: 'holding a ball in the rain' },
      { id: 'splasher', name: 'the one in the puddle', x: 58, y: 62, face: 'bright', pose: 'standing', might: ['excited', 'happy', 'delighted'], doing: 'jumping in a puddle' },
      { id: 'hurrying', name: 'the one running inside', x: 82, y: 58, face: 'startled', pose: 'waving', might: ['surprised', 'worried', 'excited'], doing: 'running for the door' },
    ],
  },
  {
    id: 'joining',
    title: 'Joining in',
    blurb: 'A game is going on. Someone is watching from the edge.',
    backdrop: 'outdoors',
    figures: [
      { id: 'onlooker', name: 'the one watching', x: 20, y: 60, face: 'quiet-corners', pose: 'standing', might: ['shy', 'lonely', 'interested', 'worried'], doing: 'watching the game' },
      { id: 'player', name: 'one of the players', x: 56, y: 60, face: 'bright', pose: 'standing', might: ['happy', 'excited'], doing: 'playing the game' },
      { id: 'inviter', name: 'the one looking over', x: 78, y: 60, face: 'bright', pose: 'waving', might: ['friendly', 'happy'], doing: 'looking towards the edge' },
    ],
  },
  {
    id: 'bumped-drawing',
    title: 'The bumped drawing',
    blurb: 'Someone walked past and a drawing got a big mark across it.',
    backdrop: 'classroom',
    figures: [
      { id: 'artist', name: 'the one who drew it', x: 34, y: 60, face: 'downcast', pose: 'sitting', might: ['sad', 'angry', 'disappointed'], doing: 'looking at the marked drawing' },
      { id: 'passer', name: 'the one walking past', x: 62, y: 58, face: 'unsure', pose: 'standing', might: ['worried', 'embarrassed', 'surprised'], doing: 'stopping and turning round' },
    ],
  },
  {
    id: 'surprise-present',
    title: 'The surprise',
    blurb: 'A present has just been opened. Everyone reacted differently.',
    backdrop: 'party',
    figures: [
      { id: 'opener', name: 'the one who opened it', x: 30, y: 60, face: 'startled', pose: 'standing', might: ['surprised', 'excited', 'unsure'], doing: 'holding the open present' },
      { id: 'clapper', name: 'the one clapping', x: 56, y: 60, face: 'bright', pose: 'waving', might: ['happy', 'excited'], doing: 'clapping' },
      { id: 'quiet-one', name: 'the quiet one', x: 80, y: 60, face: 'quiet-corners', pose: 'sitting', might: ['shy', 'jealous', 'thinking', 'calm'], doing: 'sitting quietly' },
    ],
  },
  {
    id: 'loud-room',
    title: 'The loud room',
    blurb: 'It has become very noisy in here.',
    backdrop: 'classroom',
    figures: [
      { id: 'loving-it', name: 'the loud one', x: 32, y: 60, face: 'bright', pose: 'waving', might: ['excited', 'happy', 'silly'], doing: 'being loud and happy' },
      { id: 'ears-covered', name: 'the one covering their ears', x: 62, y: 60, face: 'startled', pose: 'covering-ears', might: ['overwhelmed', 'worried', 'cross'], doing: 'covering their ears' },
    ],
  },
  {
    id: 'waiting-turn',
    title: 'Waiting for a turn',
    blurb: 'One person is on the swing. Someone else is waiting.',
    backdrop: 'outdoors',
    figures: [
      { id: 'swinging', name: 'the one on the swing', x: 36, y: 55, face: 'bright', pose: 'sitting', might: ['happy', 'excited'], doing: 'swinging' },
      { id: 'waiting', name: 'the one waiting', x: 68, y: 60, face: 'held-tight', pose: 'standing', might: ['impatient', 'frustrated', 'hopeful', 'jealous'], doing: 'waiting for a turn' },
    ],
  },
  {
    id: 'changed-plan',
    title: 'The plan changed',
    blurb: 'The thing everyone expected to do today is not happening.',
    backdrop: 'classroom',
    figures: [
      { id: 'let-down', name: 'the one with their head down', x: 30, y: 60, face: 'downcast', pose: 'slumped', might: ['disappointed', 'sad', 'angry'], doing: 'putting their head down' },
      { id: 'asking', name: 'the one with a question', x: 56, y: 58, face: 'unsure', pose: 'reaching', might: ['confused', 'worried', 'curious'], doing: 'putting a hand up' },
      { id: 'ok-with-it', name: 'the one carrying on', x: 80, y: 60, face: 'still-face', pose: 'sitting', might: ['calm', 'fine', 'thinking'], doing: 'carrying on as normal' },
    ],
  },
]

export const sceneById = (id: string): Scene =>
  SCENES.find((s) => s.id === id) ?? SCENES[0]

/** Feelings the hunt can send a child looking for. */
export const HUNT_TARGETS: Choice[] = [
  choice('sad', 'sad'),
  choice('worried', 'worried'),
  choice('excited', 'excited'),
  choice('angry', 'angry'),
  choice('happy', 'happy'),
  choice('left-out', 'left out'),
  choice('surprised', 'surprised'),
]

export const HUNT_REASONS: Choice[] = [
  choice('their-face', 'Their face'),
  choice('their-body', 'Their body'),
  choice('what-happened', 'What just happened'),
  choice('where-they-are', 'Where they are standing'),
  choice('something-else', 'Something else'),
]

export const HUNT_NEXT_STEPS: Choice[] = [
  choice('ask-to-join', 'Ask to join in'),
  choice('tell-someone', 'Tell a grown-up'),
  choice('take-a-breath', 'Take a big breath'),
  choice('say-sorry', 'Say sorry'),
  choice('share', 'Share or take turns'),
  choice('try-again', 'Try again'),
  choice('sit-with-them', 'Go and sit with them'),
  choice('not-sure', 'I’m not sure'),
]

/* ------------------------------------------------------------------ *
 * Rock the Buddy
 * ------------------------------------------------------------------ */

/**
 * No medical breathing ratios (spec §10) — just a slow, even rise and
 * fall the child can follow with a teddy on their tummy.
 */
export const BREATH_PACE = {
  slow: { inMs: 3200, holdMs: 500, outMs: 3800 },
  slower: { inMs: 4200, holdMs: 800, outMs: 5000 },
} as const

export const REFLECTIONS: Choice[] = [
  choice('tummy-moved', 'My tummy moved'),
  choice('breathing-slowed', 'My breathing slowed'),
  choice('same', 'I feel the same'),
  choice('calmer', 'I feel calmer'),
  choice('sleepy', 'I feel sleepy'),
  choice('not-sure', 'I’m not sure'),
]

/* ------------------------------------------------------------------ *
 * Freeze Dance
 * ------------------------------------------------------------------ */

export const SILLY_POSES = [
  'like a flamingo',
  'like a superhero',
  'like jelly',
  'like a tree',
  'like a robot',
  'like a sleepy cat',
]

export const FREEZE_EMOTIONS = [
  'excited',
  'worried',
  'proud',
  'sleepy',
  'surprised',
  'silly',
]

/* ------------------------------------------------------------------ *
 * Teacher coaching prompts (spec §17)
 *
 * Interaction reminders only. This is not a clinical intervention and
 * must never be presented as one.
 * ------------------------------------------------------------------ */

export const COACHING: Record<string, string[]> = {
  'feeling-thermometer': [
    'Give them a few seconds — thinking time is not dead air.',
    'Try reflecting their word back: “a BIG frustrated feeling.”',
    'Naming it yourself first can make it easier for them to join in.',
    'Every answer here is a real answer, including “I’m not sure”.',
  ],
  'opposite-game': [
    'Praise the effort: “You stopped even though you wanted to jump.”',
    'A wobble is the game working — the brakes are being practised.',
    'Try getting one wrong on purpose and let them correct you.',
    'Describe what you see: “You waited, then you did the opposite.”',
  ],
  'mirror-faces': [
    'Ask what clue they used, not whether they were right.',
    'Join in — pull the face with them.',
    '“What might they be feeling?” keeps it open. “What ARE they feeling?” closes it.',
    'If the face is ambiguous, say so: “We might need more clues.”',
  ],
  'scavenger-hunt': [
    'Ask “what makes you think that?” before moving on.',
    'Try the other character too — two people can feel different things.',
    'Build on their idea rather than replacing it.',
  ],
  'rock-buddy': [
    'Do it with them — breathe where they can see you.',
    'Don’t promise it will work. Ask what they noticed.',
    'Short is fine. Three breaths is a whole activity.',
  ],
  'freeze-dance': [
    'Be silly first — it gives them permission.',
    'Name the hard part: “Stopping is the tricky bit, and you did it.”',
    'Getting going again matters as much as freezing.',
  ],
}
