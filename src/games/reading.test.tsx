import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { GameStage } from './index'
import { createRound } from '../core/gameLogic'
import { createReadingRound, readingBlocker, soundOut } from '../core/readingLogic'
import {
  DEFAULT_PHONICS,
  GRAPHEMES,
  graphemesUpTo,
  wordByText,
  type PhonicsConfig,
} from '../core/phonics'
import {
  DEFAULT_SETTINGS,
  type Interaction,
  type Round,
  type Settings,
} from '../core/types'
import type { AnswerOptions, ObservationInput } from './shared'

afterEach(cleanup)

const ALL = GRAPHEMES.map((g) => g.id)

const phonics = (patch: Partial<PhonicsConfig> = {}): PhonicsConfig => ({
  ...DEFAULT_PHONICS,
  ...patch,
})

const settings = (patch: Partial<Settings>): Settings => ({
  ...DEFAULT_SETTINGS,
  ...patch,
})

type Recorded = {
  answers: { answer: number; options?: AnswerOptions }[]
  observations: ObservationInput[]
  interactions: Omit<Interaction, 'game' | 'roundId'>[]
  rounds: Round[]
}

function mount(round: Round) {
  const log: Recorded = {
    answers: [],
    observations: [],
    interactions: [],
    rounds: [],
  }
  render(
    <GameStage
      round={round}
      nickname="Samaya"
      discoveries={{}}
      onAnswer={(answer, options) => log.answers.push({ answer, options })}
      onObserve={(input) => log.observations.push(input)}
      onInteraction={(patch) => log.interactions.push(patch)}
      onBond={() => undefined}
      onRoundChange={(next) => log.rounds.push(next)}
    />,
  )
  return log
}

/** Reading rounds can legitimately be null; these tests always want one. */
function make(
  game: Parameters<typeof createReadingRound>[0],
  config: PhonicsConfig = phonics({ enabled: ALL }),
  patch: Partial<Settings> = {},
): Round {
  const round = createReadingRound(game, settings(patch), config)
  if (!round) throw new Error(`no round for ${game}`)
  return round
}

/* ------------------------------------------------------------------ *
 * The gate
 * ------------------------------------------------------------------ */

describe('every reading game respects Sounds We Know', () => {
  const onlyFirstSet = phonics({ enabled: graphemesUpTo(1) })

  it('never puts an untaught grapheme in front of a child', () => {
    const games = [
      'robot-translator',
      'sound-safari',
      'skywriter',
      'sound-box-factory',
      'monster-lab',
      'digraph-detectives',
      'blend-train',
      'magic-e-wizard',
      'word-ladder',
      'story-quest',
    ] as const

    for (const game of games) {
      for (let i = 0; i < 25; i++) {
        const round = createReadingRound(game, DEFAULT_SETTINGS, onlyFirstSet)
        if (!round) continue // declined, which is the correct alternative
        for (const grapheme of graphemesUsedBy(round)) {
          expect(
            onlyFirstSet.enabled,
            `${game} used "${grapheme}" which is not enabled`,
          ).toContain(grapheme)
        }
      }
    }
  })

  it('declines rather than reaching for an untaught sound', () => {
    // No digraphs enabled, so the detectives cannot run.
    expect(
      createReadingRound('digraph-detectives', DEFAULT_SETTINGS, onlyFirstSet),
    ).toBeNull()
    expect(readingBlocker('digraph-detectives', onlyFirstSet)).toMatch(/sh, ch or th/)

    // No story is fully decodable with only s a t p i n.
    expect(
      createReadingRound('story-quest', DEFAULT_SETTINGS, onlyFirstSet),
    ).toBeNull()
    expect(readingBlocker('story-quest', onlyFirstSet)).toMatch(/decodable/)
  })

  it('explains what to switch on for every game it blocks', () => {
    const games = [
      'robot-translator',
      'sound-safari',
      'skywriter',
      'sound-box-factory',
      'monster-lab',
      'digraph-detectives',
      'blend-train',
      'magic-e-wizard',
      'tricky-treasure',
      'word-ladder',
      'story-quest',
    ] as const
    const nothing = phonics({ enabled: [], trickyActive: [] })
    for (const game of games) {
      const blocked = createReadingRound(game, DEFAULT_SETTINGS, nothing)
      const message = readingBlocker(game, nothing)
      if (blocked === null) {
        expect(message, `${game} blocked with no explanation`).toBeTruthy()
      }
    }
  })

  it('only offers tricky words the teacher has made active', () => {
    const config = phonics({ enabled: ALL, trickyActive: ['the', 'said', 'was'] })
    for (let i = 0; i < 30; i++) {
      const round = createReadingRound('tricky-treasure', DEFAULT_SETTINGS, config)
      if (round?.game !== 'tricky-treasure') throw new Error('wrong game')
      expect(config.trickyActive).toContain(round.target)
      for (const option of round.options) {
        expect(config.trickyActive).toContain(option)
      }
    }
  })
})

/** Every grapheme a round could put on screen. */
function graphemesUsedBy(round: Round): string[] {
  switch (round.game) {
    case 'robot-translator':
      return [...round.word.graphemes, ...round.options.flatMap((o) => o.graphemes)]
    case 'sound-safari':
      return [round.target]
    case 'skywriter':
      return [round.grapheme, ...round.options]
    case 'sound-box-factory':
      return [...round.word.graphemes, ...round.tray]
    case 'monster-lab':
      return [...(round.name?.graphemes ?? []), ...round.tray]
    case 'digraph-detectives':
      return [
        ...round.words.flatMap((w) => w.graphemes),
        ...(round.word?.graphemes ?? []),
        ...round.options,
      ]
    case 'blend-train':
      return [
        ...round.words.flatMap((w) => w.graphemes),
        ...(round.word?.graphemes ?? []),
        ...round.tray,
      ]
    case 'magic-e-wizard':
      return wordByText(round.short)?.graphemes ?? []
    case 'word-ladder':
      return [
        ...round.tray,
        ...round.steps.flatMap((s) => [
          ...(wordByText(s.from)?.graphemes ?? []),
          ...(wordByText(s.to)?.graphemes ?? []),
        ]),
      ]
    case 'story-quest':
      return round.pages.flatMap((p) =>
        p.words.flatMap(
          (raw) =>
            wordByText(raw.toLowerCase().replace(/[^a-z]/g, ''))?.graphemes ?? [],
        ),
      )
    default:
      return []
  }
}

/* ------------------------------------------------------------------ *
 * Robot Translator
 * ------------------------------------------------------------------ */

describe('Robot Translator', () => {
  it('shows pictures and no written words at all in picture mode', () => {
    const round = make('robot-translator', phonics({ enabled: ALL }), {
      'robot-translator': { mode: 'picture', level: 2 },
    })
    if (round.game !== 'robot-translator') throw new Error('wrong game')

    mount(round)
    // The word must never be *drawn* on screen. It exists only as an
    // accessible name, which is why we check for visible text specifically.
    const visible = [...document.querySelectorAll('.stage *')].filter(
      (node) =>
        !node.classList.contains('visually-hidden') &&
        node.children.length === 0 &&
        node.textContent?.toLowerCase().includes(round.word.text),
    )
    expect(visible).toHaveLength(0)
    expect(document.querySelectorAll('.word-picture').length).toBeGreaterThan(1)
  })

  it('reports the picture the child tapped', () => {
    const round = make('robot-translator', phonics({ enabled: ALL }), {
      'robot-translator': { mode: 'picture', level: 2 },
    })
    if (round.game !== 'robot-translator') throw new Error('wrong game')

    const log = mount(round)
    fireEvent.click(screen.getByRole('button', { name: round.word.text }))
    expect(log.observations.at(-1)!.field).toBe('picture')
    expect(log.observations.at(-1)!.label).toContain(round.word.text)
    expect(screen.getByText(/You translated it/)).toBeTruthy()
  })

  it('gives the teacher the sounds to say, separated', () => {
    const round = make('robot-translator')
    if (round.game !== 'robot-translator') throw new Error('wrong game')
    expect(round.prompt).toContain(soundOut(round.word.graphemes))
    expect(round.prompt).toContain(round.word.text)
  })

  it('gives real two-sound blends at level 1 when speaking', () => {
    for (let i = 0; i < 30; i++) {
      const round = createReadingRound(
        'robot-translator',
        settings({ 'robot-translator': { mode: 'say-it', level: 1 } }),
        phonics({ enabled: ALL }),
      )
      if (round?.game !== 'robot-translator') continue
      expect(round.word.graphemes.length).toBeLessThanOrEqual(2)
    }
  })

  it('falls back to three sounds in picture mode, where two-sound pictures are scarce', () => {
    const round = createReadingRound(
      'robot-translator',
      settings({ 'robot-translator': { mode: 'picture', level: 1 } }),
      phonics({ enabled: ALL }),
    )
    if (round?.game !== 'robot-translator') throw new Error('wrong game')
    // Still a real, decodable, picturable word — just not two sounds.
    expect(round.word.picture).toBeDefined()
    expect(round.word.graphemes.length).toBeLessThanOrEqual(3)
  })
})

/* ------------------------------------------------------------------ *
 * Sound Safari
 * ------------------------------------------------------------------ */

describe('Sound Safari', () => {
  it('accepts objects that start with the sound and flags those that do not', () => {
    const round = make('sound-safari')
    if (round.game !== 'sound-safari') throw new Error('wrong game')

    const log = mount(round)
    const objects = document.querySelectorAll('.safari-object')
    expect(objects.length).toBeGreaterThan(4)

    // Tap everything and check the split is exactly right.
    objects.forEach((node) => fireEvent.click(node))
    const found = document.querySelectorAll('.safari-object.is-found')
    const missed = document.querySelectorAll('.safari-object.is-missed')
    expect(found.length).toBeGreaterThanOrEqual(2)
    expect(found.length + missed.length).toBe(objects.length)
    expect(log.observations).toHaveLength(objects.length)
  })

  it('needs no camera for the room hunt', () => {
    const round = make('sound-safari', phonics({ enabled: ALL }), {
      'sound-safari': { mode: 'room' },
    })
    mount(round)
    expect(screen.getByText(/Find something in YOUR room/)).toBeTruthy()
    expect(document.querySelector('video')).toBeNull()
  })
})

/* ------------------------------------------------------------------ *
 * Skywriter
 * ------------------------------------------------------------------ */

describe('Skywriter Studio', () => {
  it('uses no camera API in air-writing mode', () => {
    const round = make('skywriter', phonics({ enabled: ALL }), {
      skywriter: { mode: 'air', showLetter: true },
    })
    mount(round)
    expect(screen.getByText(/No camera is used by this game/)).toBeTruthy()
    expect(document.querySelector('video')).toBeNull()
  })

  it('checks the sound in quick-sound mode', () => {
    const round = make('skywriter', phonics({ enabled: ALL }), {
      skywriter: { mode: 'quick-sound', showLetter: true },
    })
    if (round.game !== 'skywriter') throw new Error('wrong game')

    const log = mount(round)
    fireEvent.click(screen.getByRole('button', { name: round.phoneme }))
    expect(log.observations.at(-1)!.field).toBe('sound')
    expect(screen.getByText(new RegExp(`says ${round.phoneme.replace(/\//g, '\\/')}`))).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * Sound Box Factory
 * ------------------------------------------------------------------ */

describe('Sound Box Factory', () => {
  it('gives one box per sound and reports every placement', () => {
    const round = make('sound-box-factory', phonics({ enabled: ALL }), {
      'sound-box-factory': { countersFirst: false, showPicture: true },
    })
    if (round.game !== 'sound-box-factory') throw new Error('wrong game')

    const log = mount(round)
    expect(document.querySelectorAll('.sound-box')).toHaveLength(
      round.word.graphemes.length,
    )

    // Build the word correctly, one grapheme at a time.
    round.word.graphemes.forEach((grapheme, index) => {
      const tile = [...document.querySelectorAll('.grapheme-tile')].find(
        (node) => node.textContent === letterFor(grapheme),
      )!
      fireEvent.pointerDown(tile, { clientX: 0, clientY: 0 })
      fireEvent.pointerUp(tile, { clientX: 0, clientY: 0 })
      fireEvent.click(document.querySelector(`[data-dropzone="slot-${index}"]`)!)
    })

    expect(log.interactions).toHaveLength(round.word.graphemes.length)
    expect(log.answers.at(-1)!.options?.correct).toBe(true)
    expect(screen.getByText(round.word.text.toUpperCase() + '!')).toBeTruthy()
  })

  it('counts sounds before letters when counters-first is on', () => {
    const round = make('sound-box-factory', phonics({ enabled: ALL }), {
      'sound-box-factory': { countersFirst: true, showPicture: false },
    })
    if (round.game !== 'sound-box-factory') throw new Error('wrong game')

    const log = mount(round)
    expect(document.querySelectorAll('.sound-box')).toHaveLength(0)
    for (let i = 0; i < round.word.graphemes.length; i++) {
      fireEvent.click(screen.getByRole('button', { name: /One more sound/ }))
    }
    expect(log.interactions.at(-1)!.value).toBe(round.word.graphemes.length)
    // Only now do the letters appear.
    expect(document.querySelectorAll('.sound-box').length).toBe(
      round.word.graphemes.length,
    )
  })
})

const letterFor = (id: string) =>
  GRAPHEMES.find((g) => g.id === id)?.grapheme ?? id

/* ------------------------------------------------------------------ *
 * Monster Name Lab
 * ------------------------------------------------------------------ */

describe('Monster Name Lab', () => {
  it('shows a made-up name for the child to sound out', () => {
    const round = make('monster-lab')
    if (round.game !== 'monster-lab') throw new Error('wrong game')
    expect(round.name).not.toBeNull()

    mount(round)
    expect(screen.getByText(round.name!.text)).toBeTruthy()
    expect(screen.getByText(/Read it out loud/)).toBeTruthy()
    expect(screen.getByText(/Nobody has ever read this name/)).toBeTruthy()
  })

  it('lets the child invent a name for the teacher to read', () => {
    const round = make('monster-lab', phonics({ enabled: ALL }), {
      'monster-lab': { mode: 'build' },
    })
    if (round.game !== 'monster-lab') throw new Error('wrong game')

    const log = mount(round)
    const tiles = [...document.querySelectorAll('.grapheme-tile')]
    for (let i = 0; i < round.name!.graphemes.length; i++) {
      fireEvent.click(tiles[i] as HTMLElement)
    }
    expect(log.observations.at(-1)!.field).toBe('word-built')
    expect(screen.getByText(/Now make Florie read it/)).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * Digraph Detectives + Blend Train
 * ------------------------------------------------------------------ */

describe('Digraph Detectives', () => {
  it('knows ship is three sounds and stop is four', () => {
    for (let i = 0; i < 40; i++) {
      const round = createReadingRound(
        'digraph-detectives',
        settings({ 'digraph-detectives': { mode: 'count' } }),
        phonics({ enabled: ALL }),
      )
      if (round?.game !== 'digraph-detectives' || !round.word) continue
      expect(round.expected).toBe(round.word.graphemes.length)
    }
    expect(wordByText('ship')!.graphemes).toHaveLength(3)
    expect(wordByText('stop')!.graphemes).toHaveLength(4)
  })

  it('includes traps that belong to no detective', () => {
    const round = make('digraph-detectives', phonics({ enabled: ALL }), {
      'digraph-detectives': { mode: 'sort' },
    })
    if (round.game !== 'digraph-detectives') throw new Error('wrong game')
    const traps = round.words.filter(
      (word) => !word.graphemes.some((g) => ['sh', 'ch', 'th'].includes(g)),
    )
    expect(traps.length).toBeGreaterThan(0)
    mount(round)
    expect(screen.getByText('Nobody')).toBeTruthy()
  })

  it('records where each word was filed, right or wrong', () => {
    const round = make('digraph-detectives', phonics({ enabled: ALL }), {
      'digraph-detectives': { mode: 'sort' },
    })
    if (round.game !== 'digraph-detectives') throw new Error('wrong game')

    const log = mount(round)
    const tile = document.querySelector('.word-tile')!
    const word = tile.textContent!
    fireEvent.pointerDown(tile, { clientX: 0, clientY: 0 })
    fireEvent.pointerUp(tile, { clientX: 0, clientY: 0 })
    fireEvent.click(document.querySelector('[data-dropzone="none"]')!)

    const owner =
      round.words
        .find((w) => w.text === word)!
        .graphemes.find((g) => ['sh', 'ch', 'th'].includes(g)) ?? 'none'
    expect(log.interactions.at(-1)!.value).toBe(owner === 'none' ? 1 : 0)
  })
})

describe('Blend Train', () => {
  it('gives a carriage to every sound', () => {
    const round = make('blend-train', phonics({ enabled: ALL }), {
      'blend-train': { mode: 'build' },
    })
    if (round.game !== 'blend-train' || !round.word) throw new Error('wrong game')
    expect(round.word.graphemes).toHaveLength(4)
    mount(round)
    expect(document.querySelectorAll('.carriage')).toHaveLength(4)
  })

  it('sorts letter teams apart from blends', () => {
    const round = make('blend-train', phonics({ enabled: ALL }), {
      'blend-train': { mode: 'sort' },
    })
    if (round.game !== 'blend-train') throw new Error('wrong game')
    const teams = round.words.filter((w) =>
      w.graphemes.some((g) => ['sh', 'ch', 'th'].includes(g)),
    )
    const blends = round.words.filter((w) => w.graphemes.length === 4)
    expect(teams.length).toBeGreaterThan(0)
    expect(blends.length).toBeGreaterThan(0)
    mount(round)
    expect(screen.getByText('Letter team')).toBeTruthy()
    expect(screen.getByText('Blend')).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * Magic-e, Tricky Words, Ladders, Stories
 * ------------------------------------------------------------------ */

describe('Magic-e Wizard', () => {
  it('adds the e and changes the word', () => {
    const round = make('magic-e-wizard', phonics({ enabled: ALL }), {
      'magic-e-wizard': { mode: 'cast' },
    })
    if (round.game !== 'magic-e-wizard') throw new Error('wrong game')
    expect(round.long).toBe(`${round.short}e`)

    const log = mount(round)
    expect(screen.getByText(round.short)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Add the magic e/ }))
    expect(log.interactions.at(-1)!.message).toBe(`${round.short} → ${round.long}`)
    expect(screen.getByText(new RegExp(`changed ${round.short} into ${round.long}`))).toBeTruthy()
  })
})

describe('Tricky Word Treasure', () => {
  it('checks the chosen gem against the target', () => {
    const round = make('tricky-treasure', phonics({ enabled: ALL }), {
      'tricky-treasure': { mode: 'find', flashDuration: 1200 },
    })
    if (round.game !== 'tricky-treasure') throw new Error('wrong game')

    const log = mount(round)
    fireEvent.click(screen.getAllByRole('button', { name: round.target })[0])
    expect(log.answers.at(-1)!.options?.correct).toBe(true)
    expect(screen.getByText(/Treasure found/)).toBeTruthy()
  })

  it('hides the word after the flash', () => {
    vi.useFakeTimers()
    try {
      const round = make('tricky-treasure', phonics({ enabled: ALL }), {
        'tricky-treasure': { mode: 'flash', flashDuration: 1000 },
      })
      mount(round)
      expect(document.querySelector('.flash-gem.is-hidden')).toBeNull()
      act(() => void vi.advanceTimersByTime(1200))
      expect(document.querySelector('.flash-gem.is-hidden')).not.toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('Word Ladder Workshop', () => {
  it('locks every sound except the one that changes', () => {
    const round = make('word-ladder')
    if (round.game !== 'word-ladder') throw new Error('wrong game')

    mount(round)
    const open = document.querySelectorAll('.sound-box:not(.is-locked)')
    // Exactly one box is editable per rung.
    expect(open).toHaveLength(1)
  })

  it('climbs a rung when the right sound goes in', () => {
    const round = make('word-ladder')
    if (round.game !== 'word-ladder') throw new Error('wrong game')

    const log = mount(round)
    const step = round.steps[0]
    const wanted = wordByText(step.to)!.graphemes[step.position]
    const tile = [...document.querySelectorAll('.grapheme-tile')].find(
      (node) => node.textContent === letterFor(wanted),
    )!
    fireEvent.pointerDown(tile, { clientX: 0, clientY: 0 })
    fireEvent.pointerUp(tile, { clientX: 0, clientY: 0 })
    fireEvent.click(
      document.querySelector(`[data-dropzone="slot-${step.position}"]`)!,
    )

    expect(log.answers.at(-1)!.options?.correct).toBe(true)
    expect(log.answers.at(-1)!.options?.label).toBe(`${step.from} → ${step.to} ✓`)
  })
})

describe('Story Quest', () => {
  it('turns pages and reports which page the child is on', () => {
    const round = make('story-quest')
    if (round.game !== 'story-quest') throw new Error('wrong game')

    const log = mount(round)
    expect(screen.getByText(`Page 1 of ${round.pages.length}`)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Next page/ }))
    expect(log.rounds.at(-1)).toMatchObject({ page: 1 })
    expect(log.observations.at(-1)!.field).toBe('story-page')
  })

  it('chunks a word into sounds instead of reading it out', () => {
    const round = make('story-quest')
    if (round.game !== 'story-quest') throw new Error('wrong game')

    mount({ ...round, helpWord: 'cat' })
    const chunks = [...document.querySelectorAll('.chunk-help .chunk')].map(
      (node) => node.textContent,
    )
    expect(chunks).toEqual(['c', 'a', 't'])
    expect(screen.getByText('Sound it through')).toBeTruthy()
  })

  it('offers the retell prompts at the end', () => {
    const round = make('story-quest')
    if (round.game !== 'story-quest') throw new Error('wrong game')

    const log = mount({ ...round, retelling: true })
    expect(screen.getByText('First')).toBeTruthy()
    expect(screen.getByText('Then')).toBeTruthy()
    expect(screen.getByText('Last')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /I told the whole story/ }))
    expect(log.observations.at(-1)!.field).toBe('retell')
  })
})

/* ------------------------------------------------------------------ *
 * Nothing spoken is ever scored automatically
 * ------------------------------------------------------------------ */

describe('speech is never graded by the browser', () => {
  it('offers no automatic marking for the read-aloud games', () => {
    for (const round of [
      make('monster-lab'),
      make('robot-translator', phonics({ enabled: ALL }), {
        'robot-translator': { mode: 'say-it', level: 2 },
      }),
    ]) {
      cleanup()
      const log = mount(round)
      expect(log.answers).toHaveLength(0)
      expect(screen.queryByText(/correct/i)).toBeNull()
      expect(screen.queryByText(/wrong/i)).toBeNull()
    }
  })

  it('mounts all eleven reading games without crashing', () => {
    const games = [
      'robot-translator',
      'sound-safari',
      'skywriter',
      'sound-box-factory',
      'monster-lab',
      'digraph-detectives',
      'blend-train',
      'magic-e-wizard',
      'tricky-treasure',
      'word-ladder',
      'story-quest',
    ] as const
    for (const game of games) {
      cleanup()
      expect(() => mount(make(game)), game).not.toThrow()
    }
  })

  it('routes reading games through createRound with the phonics config', () => {
    const round = createRound(
      'story-quest',
      DEFAULT_SETTINGS,
      undefined,
      phonics({ enabled: ALL }),
    )
    expect(round?.game).toBe('story-quest')
    // And declines when the sounds are not there.
    expect(
      createRound('story-quest', DEFAULT_SETTINGS, undefined, phonics({ enabled: [] })),
    ).toBeNull()
  })
})
