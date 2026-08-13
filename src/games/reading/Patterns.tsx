import { useEffect, useState } from 'react'
import { Carriage, Detective, Engine, Wand, WordPicture } from '../../components/ReadingArt'
import { play } from '../../core/sound'
import type {
  BlendTrainRound,
  DigraphRound,
  MagicERound,
} from '../../core/types'
import type { GameProps } from '../shared'
import { CardRow, letterOf, soundOf, useSorter, useWordBuilder } from './kit'

const DIGRAPHS = ['sh', 'ch', 'th']

const DETECTIVE_NAMES: Record<string, string> = {
  sh: 'Sharky',
  ch: 'Chirp',
  th: 'Thunder',
}

/* ------------------------------------------------------------------ *
 * Digraph Detectives — two letters, one sound (R4)
 * ------------------------------------------------------------------ */

export function DigraphDetectives({
  round,
  onAnswer,
  onObserve,
  onInteraction,
}: GameProps<DigraphRound>) {
  const [chosen, setChosen] = useState<string | null>(null)

  useEffect(() => setChosen(null), [round.id])

  /* --- Mode A: file each word with the right detective ------------- */
  if (round.mode === 'sort') {
    return <DigraphSort round={round} onObserve={onObserve} onInteraction={onInteraction} />
  }

  /* --- Mode B: how many sound boxes? ------------------------------- */
  if (round.mode === 'count' && round.word) {
    const word = round.word
    return (
      <div className="stage theme-digraph-detectives">
        <header className="stage-head">
          <p className="stage-eyebrow">Digraph Detectives</p>
          <h1>How many sound boxes does it need?</h1>
        </header>

        <p className="big-word">{word.text}</p>

        <CardRow
          options={['2', '3', '4', '5']}
          chosen={chosen}
          disabled={chosen !== null && chosen === String(word.graphemes.length)}
          onPick={(value) => {
            setChosen(value)
            const correct = Number(value) === word.graphemes.length
            onAnswer(Number(value), {
              correct,
              label: `${word.text} → ${value} sounds${correct ? ' ✓' : ''}`,
            })
          }}
          ariaLabel="How many sounds"
        />

        {chosen && (
          <>
            <div className="sound-boxes">
              {word.graphemes.map((g, i) => (
                <div key={i} className="sound-box is-filled">
                  {letterOf(g)}
                </div>
              ))}
            </div>
            <p
              className={`feedback ${
                Number(chosen) === word.graphemes.length
                  ? 'feedback-success'
                  : 'feedback-try-again'
              }`}
            >
              {word.graphemes.length} sounds —{' '}
              {word.graphemes.map(soundOf).join(' ')}
              {word.graphemes.some((g) => DIGRAPHS.includes(g)) && (
                <em className="equation">Two letters, one sound!</em>
              )}
            </p>
          </>
        )}
      </div>
    )
  }

  /* --- Mode C: build the pair -------------------------------------- */
  if (round.word) {
    const word = round.word
    const rest = word.graphemes.slice(1).map(letterOf).join('')
    return (
      <div className="stage theme-digraph-detectives">
        <header className="stage-head">
          <p className="stage-eyebrow">Digraph Detectives</p>
          <h1>Which pair completes the word?</h1>
        </header>

        <p className="big-word is-gapped">
          <span className="gap">{chosen ? letterOf(chosen) : '__'}</span>
          {rest}
        </p>

        <CardRow
          options={round.options}
          chosen={chosen}
          onPick={(value) => {
            setChosen(value)
            const correct = value === word.graphemes[0]
            onAnswer(0, {
              correct,
              label: `${letterOf(value)}${rest}${correct ? ' ✓' : ` (wanted ${word.text})`}`,
            })
          }}
          render={(value) => letterOf(value)}
          ariaLabel="Choose the letter pair"
        />

        {chosen && (
          <p
            className={`feedback ${chosen === word.graphemes[0] ? 'feedback-success' : 'feedback-try-again'}`}
          >
            {chosen === word.graphemes[0]
              ? `Yes — ${word.text}!`
              : 'Say each one and listen. Which sounds right?'}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="stage theme-digraph-detectives">
      <p className="feedback">Getting the case files ready…</p>
    </div>
  )
}

function DigraphSort({
  round,
  onObserve,
  onInteraction,
}: {
  round: DigraphRound
  onObserve: GameProps<DigraphRound>['onObserve']
  onInteraction: GameProps<DigraphRound>['onInteraction']
}) {
  const bins = [
    ...round.options.map((digraph, i) => ({
      id: digraph,
      label: letterOf(digraph),
      hint: DETECTIVE_NAMES[digraph],
      art: <Detective tone={i} label={letterOf(digraph)} />,
    })),
    // Traps belong to nobody — an important part of the case (spec §13).
    { id: 'none', label: 'Nobody', hint: 'no letter team here' },
  ]

  const sorter = useSorter({
    items: round.words.map((word) => word.text),
    bins,
    onSort: (text, bin) => {
      const word = round.words.find((entry) => entry.text === text)
      const owner = word?.graphemes.find((g) => DIGRAPHS.includes(g)) ?? 'none'
      const right = bin === owner
      onInteraction({
        kind: 'sorted',
        value: right ? 1 : 0,
        message: `Filed ${text} with ${bin === 'none' ? 'nobody' : bin}${right ? ' ✓' : ` (it belongs to ${owner === 'none' ? 'nobody' : owner})`}`,
      })
      onObserve({
        field: 'digraph',
        choices: [{ id: text, label: `${text} → ${bin}` }],
        label: `${text} → ${bin === 'none' ? 'nobody' : bin}${right ? ' ✓' : ''}`,
      })
    },
  })

  return (
    <div className="stage theme-digraph-detectives">
      <header className="stage-head">
        <p className="stage-eyebrow">Digraph Detectives</p>
        <h1>Which detective does each word belong to?</h1>
      </header>
      {sorter.render}
      <p className={`feedback ${sorter.remaining.length ? '' : 'feedback-success'}`}>
        {sorter.remaining.length
          ? `${sorter.remaining.length} still to file`
          : 'Case closed! Every word filed.'}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Blend Train — both consonants keep their sound (R5)
 * ------------------------------------------------------------------ */

export function BlendTrain({
  round,
  onAnswer,
  onObserve,
  onInteraction,
}: GameProps<BlendTrainRound>) {
  const [chosen, setChosen] = useState<string | null>(null)

  useEffect(() => setChosen(null), [round.id])

  if (round.mode === 'sort') {
    return <BlendSort round={round} onObserve={onObserve} onInteraction={onInteraction} />
  }

  if (!round.word) {
    return (
      <div className="stage theme-blend-train">
        <p className="feedback">The train is coming…</p>
      </div>
    )
  }

  const word = round.word

  /* --- Mode B: which carriage lost its sound? ---------------------- */
  if (round.mode === 'missing' && round.missingIndex !== undefined) {
    const missing = word.graphemes[round.missingIndex]
    return (
      <div className="stage theme-blend-train">
        <header className="stage-head">
          <p className="stage-eyebrow">Blend Train</p>
          <h1>Which sound disappeared?</h1>
        </header>

        <div className="train">
          <Engine className="train-engine" />
          {word.graphemes.map((g, i) => (
            <Carriage
              key={i}
              label={i === round.missingIndex ? (chosen ? letterOf(chosen) : '?') : letterOf(g)}
              filled={i !== round.missingIndex || !!chosen}
            />
          ))}
        </div>

        <CardRow
          options={round.tray}
          chosen={chosen}
          onPick={(value) => {
            setChosen(value)
            const correct = value === missing
            onAnswer(0, {
              correct,
              label: `${word.text} missing ${letterOf(missing)} → ${letterOf(value)}${correct ? ' ✓' : ''}`,
            })
          }}
          render={(id) => letterOf(id)}
          ariaLabel="Choose the missing sound"
        />

        {chosen && (
          <p
            className={`feedback ${chosen === missing ? 'feedback-success' : 'feedback-try-again'}`}
          >
            {chosen === missing
              ? `All aboard — ${word.text}!`
              : 'Say the word slowly and listen to every sound.'}
          </p>
        )}
      </div>
    )
  }

  /* --- Mode A: build the train ------------------------------------- */
  return <BlendBuild round={round} word={word} onAnswer={onAnswer} onInteraction={onInteraction} />
}

function BlendBuild({
  round,
  word,
  onAnswer,
  onInteraction,
}: {
  round: BlendTrainRound
  word: { text: string; graphemes: string[] }
  onAnswer: GameProps<BlendTrainRound>['onAnswer']
  onInteraction: GameProps<BlendTrainRound>['onInteraction']
}) {
  const [done, setDone] = useState(false)
  useEffect(() => setDone(false), [round.id])

  const builder = useWordBuilder({
    expected: word.graphemes,
    tray: round.tray,
    onPlace: (index, grapheme, slots) =>
      onInteraction({
        kind: 'stage',
        value: index + 1,
        message: `Carriage ${index + 1} → ${letterOf(grapheme)} (${slots
          .map((v) => (v ? letterOf(v) : '_'))
          .join('')})`,
      }),
    onComplete: (correct, slots) => {
      setDone(true)
      onAnswer(0, {
        correct,
        label: `${slots.map((v) => (v ? letterOf(v) : '')).join('')}${correct ? ' ✓' : ` (wanted ${word.text})`}`,
      })
    },
  })

  return (
    <div className="stage theme-blend-train">
      <header className="stage-head">
        <p className="stage-eyebrow">Blend Train</p>
        <h1>One carriage for every sound</h1>
      </header>

      <div className="train">
        <Engine className="train-engine" />
        {builder.slots.map((value, i) => (
          <Carriage key={i} label={value ? letterOf(value) : ''} filled={!!value} />
        ))}
      </div>

      {builder.render}

      {done && (
        <p
          className={`feedback ${builder.correct ? 'feedback-success' : 'feedback-try-again'}`}
        >
          {builder.correct
            ? `${word.graphemes.length} carriages — the ${word.text} train is ready!`
            : 'Nearly! Check each carriage against the sounds.'}
        </p>
      )}
      {done && !builder.correct && (
        <button type="button" className="button-primary" onClick={builder.reset}>
          Try that one again
        </button>
      )}
    </div>
  )
}

function BlendSort({
  round,
  onObserve,
  onInteraction,
}: {
  round: BlendTrainRound
  onObserve: GameProps<BlendTrainRound>['onObserve']
  onInteraction: GameProps<BlendTrainRound>['onInteraction']
}) {
  const sorter = useSorter({
    items: round.words.map((word) => word.text),
    bins: [
      { id: 'team', label: 'Letter team', hint: 'two letters, ONE sound' },
      { id: 'blend', label: 'Blend', hint: 'two letters, TWO sounds' },
    ],
    onSort: (text, bin) => {
      const word = round.words.find((entry) => entry.text === text)
      const isTeam = !!word?.graphemes.some((g) => DIGRAPHS.includes(g))
      const right = bin === (isTeam ? 'team' : 'blend')
      onInteraction({
        kind: 'sorted',
        value: right ? 1 : 0,
        message: `${text} → ${bin === 'team' ? 'letter team' : 'blend'}${right ? ' ✓' : ''}`,
      })
      onObserve({
        field: 'sorted',
        choices: [{ id: text, label: `${text} → ${bin}` }],
        label: `${text} → ${bin === 'team' ? 'one sound' : 'two sounds'}${right ? ' ✓' : ''}`,
      })
    },
  })

  return (
    <div className="stage theme-blend-train">
      <header className="stage-head">
        <p className="stage-eyebrow">Blend Train</p>
        <h1>Which station does each word go to?</h1>
      </header>
      {sorter.render}
      <p className={`feedback ${sorter.remaining.length ? '' : 'feedback-success'}`}>
        {sorter.remaining.length
          ? `${sorter.remaining.length} still waiting`
          : 'All aboard!'}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Magic-e Wizard — the e that changes the vowel (R6)
 * ------------------------------------------------------------------ */

export function MagicEWizard({
  round,
  onAnswer,
  onObserve,
  onInteraction,
}: GameProps<MagicERound>) {
  const [cast, setCast] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)

  useEffect(() => {
    setCast(round.mode === 'break')
    setChosen(null)
  }, [round.id, round.mode])

  /* --- Mode C: which word matches the picture? --------------------- */
  if (round.mode === 'which') {
    return (
      <div className="stage theme-magic-e-wizard">
        <header className="stage-head">
          <p className="stage-eyebrow">Magic-e Wizard</p>
          <h1>Which word is it?</h1>
        </header>

        <div className="which-pictures">
          <WordPicture word={round.shortPicture} />
          <WordPicture word={round.longPicture} />
        </div>

        <CardRow
          options={[round.short, round.long]}
          chosen={chosen}
          onPick={(value) => {
            setChosen(value)
            onObserve({
              field: 'word-built',
              choices: [{ id: value, label: value }],
              label: `Matched the picture to "${value}"`,
            })
          }}
          ariaLabel="Choose the word"
        />

        {chosen && (
          <p className="feedback feedback-success">
            You chose <strong>{chosen}</strong>. Read them both to Florie!
          </p>
        )}
      </div>
    )
  }

  const breaking = round.mode === 'break'
  const shown = cast ? round.long : round.short

  return (
    <div className="stage theme-magic-e-wizard">
      <header className="stage-head">
        <p className="stage-eyebrow">Magic-e Wizard</p>
        <h1>{breaking ? 'Break the spell!' : 'Cast the spell!'}</h1>
      </header>

      <Wand className={`wand ${cast !== breaking ? 'is-cast' : ''}`} />

      <p className={`big-word magic-word ${cast ? 'is-long' : ''}`}>
        {shown.slice(0, shown.length - (cast ? 1 : 0))}
        {cast && <span className="magic-e">e</span>}
      </p>

      <button
        type="button"
        className="button-primary"
        onClick={() => {
          const next = !cast
          setCast(next)
          play('chime')
          onInteraction({
            kind: 'stage',
            value: next ? 1 : 0,
            message: `${next ? round.short : round.long} → ${next ? round.long : round.short}`,
          })
          onAnswer(0, {
            correct: true,
            label: `${round.short} ↔ ${round.long}`,
          })
        }}
      >
        {cast
          ? breaking
            ? 'Take the e away'
            : 'Take the e away'
          : 'Add the magic e ✨'}
      </button>

      <p className="feedback">
        {cast
          ? `The e is silent, but it changed ${round.short} into ${round.long}.`
          : `Read ${round.short} first, then add the e.`}
      </p>
      <p className="mirror-hint">Read both words to Florie.</p>
    </div>
  )
}
