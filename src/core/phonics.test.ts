import { describe, expect, it } from 'vitest'
import {
  ALL_DECODABLE,
  BLEND_WORDS,
  DEFAULT_PHONICS,
  GRAPHEMES,
  LADDERS,
  MAGIC_E_PAIRS,
  SAFARI_SCENES,
  STORIES,
  WORDS,
  canDecode,
  chunk,
  decodableWords,
  graphemesUpTo,
  huntableSounds,
  isUsablePseudoword,
  laddersFor,
  magicEPairsFor,
  makePseudoword,
  phonemeCount,
  picturableWords,
  storiesFor,
  storyIsReadable,
  targetsIn,
  wordByText,
  type PhonicsConfig,
} from './phonics'

const ALL_GRAPHEMES = GRAPHEMES.map((g) => g.id)

/* ------------------------------------------------------------------ */

describe('the grapheme set', () => {
  it('follows the teaching sequence', () => {
    expect(graphemesUpTo(1)).toEqual(['s', 'a', 't', 'p', 'i', 'n'])
    expect(graphemesUpTo(2)).toContain('m')
    expect(graphemesUpTo(2)).not.toContain('e')
  })

  it('uses sounds, not letter names', () => {
    for (const g of GRAPHEMES) {
      // Teachers must see /s/, never "ess".
      expect(g.phoneme.startsWith('/') || g.id === 'magic-e').toBe(true)
    }
  })

  it('treats ck as another spelling of /k/, not a new sound', () => {
    const ck = GRAPHEMES.find((g) => g.id === 'ck')!
    const k = GRAPHEMES.find((g) => g.id === 'k')!
    expect(ck.phoneme).toBe(k.phoneme)
    expect(ck.note).toMatch(/another way/i)
  })

  it('has unique ids and only lowercase graphemes', () => {
    const ids = GRAPHEMES.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const g of GRAPHEMES) {
      expect(g.grapheme).toBe(g.grapheme.toLowerCase())
    }
  })
})

/* ------------------------------------------------------------------ */

describe('every word is broken into real graphemes', () => {
  it('spells back to its own text', () => {
    for (const word of ALL_DECODABLE) {
      const spelled = word.graphemes
        .map((id) => GRAPHEMES.find((g) => g.id === id)?.grapheme)
        .join('')
      expect(spelled, `${word.text} -> ${word.graphemes.join('|')}`).toBe(word.text)
    }
  })

  it('only references graphemes that exist', () => {
    for (const word of ALL_DECODABLE) {
      for (const id of word.graphemes) {
        expect(ALL_GRAPHEMES, `${word.text}`).toContain(id)
      }
    }
  })

  it('counts a digraph as one sound and a blend as two', () => {
    expect(phonemeCount(wordByText('ship')!)).toBe(3)
    expect(phonemeCount(wordByText('stop')!)).toBe(4)
    expect(phonemeCount(wordByText('shop')!)).toBe(3)
    expect(phonemeCount(wordByText('chin')!)).toBe(3)
    expect(phonemeCount(wordByText('thin')!)).toBe(3)
    expect(phonemeCount(wordByText('frog')!)).toBe(4)
    expect(phonemeCount(wordByText('nest')!)).toBe(4)
    expect(phonemeCount(wordByText('duck')!)).toBe(3)
  })

  it('has no duplicate entries', () => {
    const texts = ALL_DECODABLE.map((word) => word.text)
    expect(new Set(texts).size).toBe(texts.length)
  })
})

/* ------------------------------------------------------------------ */

describe('the Sounds We Know gate', () => {
  it('only offers words the child can actually sound out', () => {
    const enabled = graphemesUpTo(1) // s a t p i n
    const words = decodableWords(enabled)
    expect(words.length).toBeGreaterThan(0)
    for (const word of words) {
      for (const id of word.graphemes) {
        expect(enabled).toContain(id)
      }
    }
    expect(words.map((word) => word.text)).toContain('sat')
    expect(words.map((word) => word.text)).not.toContain('cat')
    expect(words.map((word) => word.text)).not.toContain('ship')
  })

  it('never leaks a digraph word into a pre-digraph set', () => {
    const enabled = graphemesUpTo(5) // everything except sh/ch/th
    const texts = decodableWords(enabled, ALL_DECODABLE).map((w) => w.text)
    expect(texts).not.toContain('ship')
    expect(texts).not.toContain('chin')
    expect(texts).not.toContain('fish')
  })

  it('rejects a word the moment one of its graphemes is missing', () => {
    const cat = wordByText('cat')!
    expect(canDecode(cat, ['c', 'a', 't'])).toBe(true)
    expect(canDecode(cat, ['c', 'a'])).toBe(false)
  })

  it('only offers picture words that are also decodable', () => {
    const enabled = graphemesUpTo(2)
    for (const word of picturableWords(enabled)) {
      expect(word.picture).toBeDefined()
      expect(canDecode(word, enabled)).toBe(true)
    }
  })
})

/* ------------------------------------------------------------------ */

describe('pseudoword generation', () => {
  it('only ever uses enabled graphemes', () => {
    const enabled = graphemesUpTo(2)
    for (let i = 0; i < 200; i++) {
      const word = makePseudoword(enabled)
      expect(word).not.toBeNull()
      for (const id of word!.graphemes) {
        expect(enabled).toContain(id)
      }
    }
  })

  it('never produces a real word from the bank', () => {
    const real = new Set(ALL_DECODABLE.map((w) => w.text))
    for (let i = 0; i < 300; i++) {
      const word = makePseudoword(ALL_GRAPHEMES)
      if (word) expect(real.has(word.text)).toBe(false)
    }
  })

  it('filters strings we would not ask a child to read aloud', () => {
    expect(isUsablePseudoword('bum')).toBe(false)
    expect(isUsablePseudoword('fag')).toBe(false)
    expect(isUsablePseudoword('poo')).toBe(false)
    expect(isUsablePseudoword('cat')).toBe(false) // real word
    expect(isUsablePseudoword('mip')).toBe(true)
    expect(isUsablePseudoword('vop')).toBe(true)

    for (let i = 0; i < 500; i++) {
      const word = makePseudoword(ALL_GRAPHEMES)
      if (word) expect(isUsablePseudoword(word.text)).toBe(true)
    }
  })

  it('is pronounceable — always consonant, vowel, consonant', () => {
    for (let i = 0; i < 100; i++) {
      const word = makePseudoword(graphemesUpTo(3))!
      const kinds = word.graphemes.map(
        (id) => GRAPHEMES.find((g) => g.id === id)!.kind,
      )
      expect(kinds[1]).toBe('vowel')
      expect(kinds[0]).not.toBe('vowel')
      expect(kinds[2]).not.toBe('vowel')
    }
  })

  it('never starts a word with ck', () => {
    for (let i = 0; i < 200; i++) {
      const word = makePseudoword(graphemesUpTo(3))!
      expect(word.graphemes[0]).not.toBe('ck')
    }
  })

  it('says so rather than inventing something when it cannot build one', () => {
    // No vowels enabled at all.
    expect(makePseudoword(['s', 't', 'p'])).toBeNull()
    expect(makePseudoword([])).toBeNull()
  })

  it('can avoid repeating the previous monster', () => {
    const seen: string[] = []
    for (let i = 0; i < 5; i++) {
      const word = makePseudoword(graphemesUpTo(3), seen)!
      expect(seen).not.toContain(word.text)
      seen.push(word.text)
    }
  })
})

/* ------------------------------------------------------------------ */

describe('magic e', () => {
  it('adds an e and keeps the rest of the word', () => {
    for (const pair of MAGIC_E_PAIRS) {
      expect(pair.long).toBe(`${pair.short}e`)
      expect(pair.graphemes.join('')).toBe(pair.short)
    }
  })

  it('only offers pairs the child can read the short form of', () => {
    const enabled = graphemesUpTo(2)
    for (const pair of magicEPairsFor(enabled)) {
      for (const id of pair.graphemes) expect(enabled).toContain(id)
    }
    expect(magicEPairsFor(['h', 'o', 'p']).map((p) => p.short)).toEqual(['hop'])
  })
})

/* ------------------------------------------------------------------ */

describe('word ladders', () => {
  it('changes exactly one sound per rung', () => {
    for (const l of LADDERS) {
      for (const step of l.steps) {
        const from = wordByText(step.from)!
        const to = wordByText(step.to)!
        expect(from.graphemes).toHaveLength(to.graphemes.length)
        const changed = from.graphemes.filter((g, i) => g !== to.graphemes[i])
        expect(changed, `${step.from} → ${step.to}`).toHaveLength(1)
        expect(from.graphemes[step.position]).not.toBe(to.graphemes[step.position])
      }
    }
  })

  it('uses only real words from the bank', () => {
    for (const l of LADDERS) {
      expect(wordByText(l.start)).toBeDefined()
      for (const step of l.steps) {
        expect(wordByText(step.to), step.to).toBeDefined()
      }
    }
  })

  it('is filtered by the enabled set', () => {
    const few = laddersFor(graphemesUpTo(1))
    for (const l of few) {
      for (const id of l.graphemes) expect(graphemesUpTo(1)).toContain(id)
    }
    expect(laddersFor(ALL_GRAPHEMES).length).toBe(LADDERS.length)
  })
})

/* ------------------------------------------------------------------ */

describe('decodable stories', () => {
  it('are readable end to end once their sounds are enabled', () => {
    const config: PhonicsConfig = {
      enabled: ALL_GRAPHEMES,
      trickyActive: ['the', 'said', 'was'],
      focus: 'R3',
    }
    for (const story of STORIES) {
      expect(storyIsReadable(story, config), story.title).toBe(true)
    }
  })

  it('are rejected when a needed sound is missing', () => {
    const config: PhonicsConfig = {
      enabled: graphemesUpTo(1),
      trickyActive: ['the', 'said', 'was'],
      focus: 'R3',
    }
    expect(storiesFor(config)).toHaveLength(0)
  })

  it('are rejected when a tricky word they need is not active', () => {
    const ship = STORIES.find((s) => s.id === 'the-ship')!
    const withWas: PhonicsConfig = {
      enabled: ALL_GRAPHEMES,
      trickyActive: ['the', 'was'],
      focus: 'R4',
    }
    const withoutWas: PhonicsConfig = { ...withWas, trickyActive: ['the'] }
    expect(storyIsReadable(ship, withWas)).toBe(true)
    expect(storyIsReadable(ship, withoutWas)).toBe(false)
  })

  it('never contain a word that is neither decodable nor an active tricky word', () => {
    const config: PhonicsConfig = {
      enabled: ALL_GRAPHEMES,
      trickyActive: ['the', 'said', 'was'],
      focus: 'R3',
    }
    for (const story of storiesFor(config)) {
      for (const p of story.pages) {
        for (const raw of p.words) {
          const text = raw.toLowerCase().replace(/[^a-z]/g, '')
          if (!text) continue
          const known =
            config.trickyActive.includes(text) || wordByText(text) !== undefined
          expect(known, `"${text}" in ${story.title}`).toBe(true)
        }
      }
    }
  })

  it('chunks a word by grapheme for the Help display', () => {
    expect(chunk('ship')).toEqual(['sh', 'i', 'p'])
    expect(chunk('stop')).toEqual(['s', 't', 'o', 'p'])
    expect(chunk('Sam.')).toEqual(['s', 'a', 'm'].length ? chunk('sam') : [])
  })
})

/* ------------------------------------------------------------------ */

describe('Sound Safari scenes', () => {
  it('gives every object a starting sound that matches its word', () => {
    for (const scene of SAFARI_SCENES) {
      for (const o of scene.objects) {
        const word = wordByText(o.word)
        expect(word, `${o.word} missing from the word bank`).toBeDefined()
        expect(word!.graphemes[0], o.word).toBe(o.initial)
      }
    }
  })

  it('finds targets and leaves distractors alone', () => {
    const bedroom = SAFARI_SCENES.find((s) => s.id === 'bedroom')!
    const targets = targetsIn(bedroom, 's')
    expect(targets.map((o) => o.word).sort()).toEqual(['sock', 'sun'])
    for (const o of bedroom.objects) {
      const isTarget = targets.some((t) => t.id === o.id)
      expect(o.initial === 's').toBe(isTarget)
    }
  })

  it('only offers a hunt sound with at least two things to find', () => {
    for (const scene of SAFARI_SCENES) {
      for (const initial of huntableSounds(scene, ALL_GRAPHEMES)) {
        expect(targetsIn(scene, initial).length).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('respects the enabled set', () => {
    const bedroom = SAFARI_SCENES.find((s) => s.id === 'bedroom')!
    expect(huntableSounds(bedroom, ['s'])).toEqual(['s'])
    expect(huntableSounds(bedroom, ['z'])).toEqual([])
  })
})

/* ------------------------------------------------------------------ */

describe('defaults are sane out of the box', () => {
  it('can run a CVC lesson immediately', () => {
    expect(decodableWords(DEFAULT_PHONICS.enabled).length).toBeGreaterThan(10)
    expect(makePseudoword(DEFAULT_PHONICS.enabled)).not.toBeNull()
    expect(DEFAULT_PHONICS.trickyActive).toHaveLength(5)
  })

  it('keeps blends out of the plain word list', () => {
    for (const word of WORDS) expect(word.graphemes.length).toBeLessThanOrEqual(3)
    for (const word of BLEND_WORDS) expect(word.graphemes.length).toBe(4)
  })
})
