import { useEffect, useState } from 'react'
import { Ladder, LabMonster, WordPicture } from '../../components/ReadingArt'
import { wordByText } from '../../core/phonics'
import { play } from '../../core/sound'
import type {
  LadderRound,
  MonsterLabRound,
  SoundBoxRound,
} from '../../core/types'
import type { GameProps } from '../shared'
import { BigWord, SayItAloud, letterOf, useWordBuilder } from './kit'

/* ------------------------------------------------------------------ *
 * Sound Box Factory — segment and blend CVC words (R3)
 * ------------------------------------------------------------------ */

export function SoundBoxFactory({
  round,
  onAnswer,
  onInteraction,
}: GameProps<SoundBoxRound>) {
  const [counters, setCounters] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setCounters(0)
    setDone(false)
  }, [round.id])

  const needCounters = round.countersFirst && counters < round.word.graphemes.length

  const builder = useWordBuilder({
    expected: round.word.graphemes,
    tray: round.tray,
    onPlace: (index, grapheme, slots) =>
      onInteraction({
        kind: 'stage',
        value: index + 1,
        message: `Placed ${letterOf(grapheme)} in box ${index + 1} — ${slots
          .map((v) => (v ? letterOf(v) : '_'))
          .join('')}`,
      }),
    onComplete: (correct, slots) => {
      setDone(true)
      const built = slots.map((v) => (v ? letterOf(v) : '')).join('')
      onAnswer(correct ? 1 : 0, {
        correct,
        label: `built ${built}${correct ? ' ✓' : ` (wanted ${round.word.text})`}`,
      })
    },
  })

  return (
    <div className="stage theme-sound-box-factory">
      <header className="stage-head">
        <p className="stage-eyebrow">Sound Box Factory</p>
        <h1>
          {needCounters
            ? 'How many sounds can you hear?'
            : 'One box for every sound'}
        </h1>
      </header>

      {round.showPicture && round.word.picture && (
        <WordPicture word={round.word.picture} className="factory-picture" />
      )}

      {needCounters ? (
        <>
          {/* Sounds first, letters second (spec §11, mode B). */}
          <div className="counter-row">
            {Array.from({ length: counters }, (_, i) => (
              <span key={i} className="sound-counter" />
            ))}
          </div>
          <button
            type="button"
            className="button-primary"
            onClick={() => {
              const next = counters + 1
              setCounters(next)
              play('pop')
              onInteraction({
                kind: 'counter',
                value: next,
                message: `Counted ${next} sound${next === 1 ? '' : 's'}`,
              })
            }}
          >
            + One more sound
          </button>
          {counters > 0 && (
            <button
              type="button"
              className="button-quiet"
              onClick={() => setCounters(0)}
            >
              Start again
            </button>
          )}
        </>
      ) : (
        <>
          {builder.render}
          {done && (
            <p
              className={`feedback ${builder.correct ? 'feedback-success' : 'feedback-try-again'}`}
            >
              {builder.correct ? (
                <>
                  {round.word.graphemes.map(letterOf).join(' - ')} …{' '}
                  <strong>{round.word.text.toUpperCase()}!</strong>
                </>
              ) : (
                'Nearly! Say it slowly and listen for each sound.'
              )}
            </p>
          )}
          {done && !builder.correct && (
            <button
              type="button"
              className="button-primary"
              onClick={builder.reset}
            >
              Try that one again
            </button>
          )}
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Monster Name Lab — decoding a word nobody has memorised (R3+)
 * ------------------------------------------------------------------ */

export function MonsterLab({
  round,
  onAnswer,
  onObserve,
  onInteraction,
}: GameProps<MonsterLabRound>) {
  const [built, setBuilt] = useState<string | null>(null)

  useEffect(() => setBuilt(null), [round.id])

  if (!round.name) {
    return (
      <div className="stage theme-monster-lab">
        <header className="stage-head">
          <p className="stage-eyebrow">Monster Name Lab</p>
          <h1>The lab is warming up…</h1>
        </header>
        <p className="feedback">Florie is choosing some sounds.</p>
      </div>
    )
  }

  if (round.mode === 'build') {
    return (
      <div className="stage theme-monster-lab">
        <header className="stage-head">
          <p className="stage-eyebrow">Monster Name Lab</p>
          <h1>Make up a name for your monster!</h1>
        </header>
        <LabMonster look={round.look} className="lab-monster" />
        <BuildAName
          tray={round.tray}
          length={round.name.graphemes.length}
          onBuilt={(name) => {
            setBuilt(name)
            onObserve({
              field: 'word-built',
              choices: [{ id: name, label: name }],
              label: `Invented the name "${name}" — now Florie reads it`,
            })
          }}
        />
        {built && (
          <p className="feedback feedback-success">
            Now make Florie read it! Can she do it?
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="stage theme-monster-lab">
      <header className="stage-head">
        <p className="stage-eyebrow">Monster Name Lab</p>
        <h1>Meet your new monster…</h1>
      </header>

      <LabMonster look={round.look} className="lab-monster" />

      <SayItAloud>
        <BigWord text={round.name.text} />
      </SayItAloud>

      <p className="feedback">
        Nobody has ever read this name before. Sound it out!
      </p>

      <div className="lab-controls">
        <button
          type="button"
          className="button-quiet"
          onClick={() => {
            play('pop')
            onInteraction({
              kind: 'stage',
              value: 1,
              message: `Wants to customise ${round.name!.text}`,
            })
            onAnswer(1, {
              correct: true,
              label: `read "${round.name!.text}"`,
            })
          }}
        >
          I read it!
        </button>
      </div>
    </div>
  )
}

/** Small builder used only by the monster's role-reversal mode. */
function BuildAName({
  tray,
  length,
  onBuilt,
}: {
  tray: string[]
  length: number
  onBuilt: (name: string) => void
}) {
  const [slots, setSlots] = useState<(string | null)[]>(
    Array.from({ length }, () => null),
  )
  const next = slots.findIndex((slot) => slot === null)

  return (
    <>
      <div className="sound-boxes">
        {slots.map((value, index) => (
          <div key={index} className={`sound-box ${value ? 'is-filled' : ''}`}>
            {value ? letterOf(value) : ''}
          </div>
        ))}
      </div>
      <div className="grapheme-tray">
        <p className="tray-label">Pick any sounds you like</p>
        <div className="tray-items">
          {tray.map((grapheme, i) => (
            <button
              key={`${grapheme}-${i}`}
              type="button"
              className="grapheme-tile"
              disabled={next === -1}
              onClick={() => {
                if (next === -1) return
                const updated = slots.map((v, n) => (n === next ? grapheme : v))
                setSlots(updated)
                play('pop')
                if (updated.every((v) => v !== null)) {
                  onBuilt(updated.map((v) => letterOf(v!)).join(''))
                }
              }}
            >
              {letterOf(grapheme)}
            </button>
          ))}
        </div>
      </div>
      {next === -1 && (
        <button
          type="button"
          className="button-quiet"
          onClick={() => setSlots(Array.from({ length }, () => null))}
        >
          Start again
        </button>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Word Ladder Workshop — change one sound at a time (R3–R5)
 * ------------------------------------------------------------------ */

const CLIMB_LABELS: Record<string, string> = {
  moon: 'the moon',
  treehouse: 'the treehouse',
  castle: 'the dragon castle',
  cupcake: 'a giant cupcake',
}

export function WordLadder({
  round,
  onAnswer,
  onInteraction,
}: GameProps<LadderRound>) {
  const [rung, setRung] = useState(0)
  const [wrong, setWrong] = useState(false)

  useEffect(() => {
    setRung(0)
    setWrong(false)
  }, [round.id])

  const step = round.steps[rung]
  const finished = rung >= round.steps.length
  const current = finished ? round.steps[round.steps.length - 1].to : step.from

  const target = wordGraphemes(step?.to)
  const from = wordGraphemes(step?.from)

  const builder = useWordBuilder({
    expected: target,
    tray: round.tray,
    // Only the changing sound is open; the rest of the word stays put.
    locked: target.map((g, i) => (step && i === step.position ? null : g)),
    onPlace: (index, grapheme) =>
      onInteraction({
        kind: 'stage',
        value: rung + 1,
        message: `${step?.from} → tried ${letterOf(grapheme)} in position ${index + 1}`,
      }),
    onComplete: (correct) => {
      if (correct) {
        play('chime')
        setWrong(false)
        setRung((r) => r + 1)
        onAnswer(1, { correct: true, label: `${step.from} → ${step.to} ✓` })
      } else {
        setWrong(true)
        onAnswer(0, { correct: false, label: `${step.from} → not quite` })
      }
    },
  })

  return (
    <div className="stage theme-word-ladder">
      <header className="stage-head">
        <p className="stage-eyebrow">Word Ladder Workshop</p>
        <h1>
          {finished
            ? `You reached ${CLIMB_LABELS[round.climbTo]}!`
            : `Change one sound: ${step.from} → ?`}
        </h1>
      </header>

      <div className="ladder-layout">
        <Ladder rungs={round.steps.length} done={rung} className="ladder-art" />

        <div className="ladder-work">
          <p className="ladder-current">{current}</p>
          {!finished && (
            <>
              <p className="stage-question">
                Swap the {ordinal(step.position)} sound
              </p>
              {builder.render}
              {wrong && (
                <>
                  <p className="feedback feedback-try-again">
                    Not that one — say both words and listen to what changed.
                  </p>
                  <button
                    type="button"
                    className="button-primary"
                    onClick={() => {
                      builder.reset()
                      setWrong(false)
                    }}
                  >
                    Try again
                  </button>
                </>
              )}
            </>
          )}
          {finished && (
            <p className="feedback feedback-success">
              Every rung built. Brilliant sound swapping!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const ordinal = (index: number) =>
  ['first', 'second', 'third', 'fourth'][index] ?? 'next'

/** Ladder words all live in the word bank, so this is a plain lookup. */
function wordGraphemes(text?: string): string[] {
  if (!text) return []
  return wordByText(text)?.graphemes ?? text.split('')
}
