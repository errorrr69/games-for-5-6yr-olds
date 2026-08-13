import { useEffect, useState } from 'react'
import { Gem, StoryScene } from '../../components/ReadingArt'
import { chunk } from '../../core/phonics'
import { play } from '../../core/sound'
import type { StoryRound, TrickyRound } from '../../core/types'
import type { GameProps } from '../shared'
import { CardRow, letterOf } from './kit'

/* ------------------------------------------------------------------ *
 * Tricky Word Treasure — irregular words, taught separately (spec §16)
 *
 * These are never put through sound boxes as if every letter mapped
 * straightforwardly, and only the teacher's active words appear.
 * ------------------------------------------------------------------ */

export function TrickyTreasure({
  round,
  onAnswer,
  onInteraction,
}: GameProps<TrickyRound>) {
  const [chosen, setChosen] = useState<string | null>(null)
  const [visible, setVisible] = useState(round.mode === 'flash')

  useEffect(() => {
    setChosen(null)
  }, [round.id])

  useEffect(() => {
    if (round.mode !== 'flash') return
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), round.flashDuration)
    return () => clearTimeout(timer)
  }, [round.shownAt, round.mode, round.flashDuration])

  const choose = (word: string) => {
    setChosen(word)
    const correct = word === round.target
    play(correct ? 'chime' : 'pop')
    onInteraction({
      kind: 'stage',
      value: correct ? 1 : 0,
      message: `Tapped "${word}"${correct ? ' ✓' : ` (looking for "${round.target}")`}`,
    })
    onAnswer(0, {
      correct,
      label: `"${word}"${correct ? ' ✓' : ` — wanted "${round.target}"`}`,
    })
  }

  const heading =
    round.mode === 'flash'
      ? visible
        ? 'Look carefully…'
        : 'Which word did you see?'
      : round.mode === 'sentence'
        ? 'Which word fits the gap?'
        : `Find the word`

  return (
    <div className="stage theme-tricky-treasure">
      <header className="stage-head">
        <p className="stage-eyebrow">Tricky Word Treasure</p>
        <h1>{heading}</h1>
      </header>

      {round.mode === 'flash' && (
        <div className={`flash-gem ${visible ? '' : 'is-hidden'}`}>
          <Gem />
          <span>{round.target}</span>
        </div>
      )}

      {round.mode === 'find' && <p className="treasure-target">{round.target}</p>}

      {round.mode === 'sentence' && round.sentence && (
        <p className="tricky-sentence">
          {round.sentence.map((word, i) => (
            <span key={i} className={word === '___' ? 'gap' : ''}>
              {word === '___' ? (chosen ?? '___') : word}{' '}
            </span>
          ))}
        </p>
      )}

      {(round.mode !== 'flash' || !visible) && (
        <div className="gem-row">
          <CardRow
            options={round.options}
            chosen={chosen}
            disabled={chosen === round.target}
            onPick={choose}
            render={(word) => (
              <>
                <Gem className="gem-art" />
                <span className="gem-word">{word}</span>
              </>
            )}
            ariaLabel="Choose the word"
          />
        </div>
      )}

      {chosen && (
        <p
          className={`feedback ${chosen === round.target ? 'feedback-success' : 'feedback-try-again'}`}
        >
          {chosen === round.target
            ? 'Treasure found! That is one to just know by sight.'
            : 'Not that gem — have another look.'}
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Story Quest — phonics turned into actual reading (spec §18)
 *
 * The teacher can ask for help on a word, which chunks it into its sounds
 * on the child's screen. It never simply supplies the answer.
 * ------------------------------------------------------------------ */

export function StoryQuest({
  round,
  cue,
  onObserve,
  onInteraction,
  onRoundChange,
}: GameProps<StoryRound> & {
  onRoundChange?: (round: StoryRound) => void
}) {
  const [retold, setRetold] = useState<string | null>(null)

  useEffect(() => setRetold(null), [round.id])

  const page = round.pages[Math.min(round.page, round.pages.length - 1)]
  const lastPage = round.page >= round.pages.length - 1

  const turn = (delta: number) => {
    const next = Math.max(0, Math.min(round.pages.length - 1, round.page + delta))
    if (next === round.page) return
    play('click')
    onInteraction({
      kind: 'stage',
      value: next + 1,
      message: `Turned to page ${next + 1} of ${round.pages.length}`,
    })
    onObserve({
      field: 'story-page',
      choices: [{ id: String(next), label: `page ${next + 1}` }],
      label: `Read page ${next + 1} of ${round.pages.length}`,
    })
    onRoundChange?.({ ...round, page: next, helpWord: undefined })
  }

  const modeLabel =
    round.readingMode === 'together'
      ? 'Let’s read it together'
      : round.readingMode === 'turns'
        ? 'Take turns — your line next!'
        : 'Your turn to read'

  if (round.retelling) {
    return (
      <div className="stage theme-story-quest">
        <header className="stage-head">
          <p className="stage-eyebrow">Story Quest · {round.title}</p>
          <h1>Tell me what happened!</h1>
        </header>
        <div className="retell-prompts">
          {['First', 'Then', 'Last'].map((step) => (
            <div key={step} className="retell-card">
              <strong>{step}</strong>
              <span aria-hidden="true">…</span>
            </div>
          ))}
        </div>
        <CardRow
          options={['I told the whole story', 'I needed some help']}
          chosen={retold}
          onPick={(value) => {
            setRetold(value)
            onObserve({
              field: 'retell',
              choices: [{ id: value, label: value }],
              label: `Retelling: ${value}`,
            })
          }}
          ariaLabel="How did the retelling go"
        />
        <p className="feedback feedback-success">
          Every retelling counts. Well read!
        </p>
      </div>
    )
  }

  return (
    <div className="stage theme-story-quest">
      <header className="stage-head">
        <p className="stage-eyebrow">Story Quest · {round.title}</p>
        <h1>{modeLabel}</h1>
      </header>

      <div className="story-page">
        <StoryScene variant={page.scene} />
        <p className="story-text">
          {page.words.map((word, i) => (
            <span key={i} className="story-word">
              {word}{' '}
            </span>
          ))}
        </p>
      </div>

      {/* Help chunks the word into sounds. It never reads it out. */}
      {round.helpWord && (
        <div className="chunk-help">
          <p className="label">Sound it through</p>
          <p className="big-word is-chunked">
            {chunk(round.helpWord).map((part, i) => (
              <span key={i} className="chunk">
                {letterOf(part)}
              </span>
            ))}
          </p>
        </div>
      )}

      {cue?.kind === 'read-it-wrong' && (
        <p className="feedback feedback-try-again">
          Wait… did Florie read that right? 👀
        </p>
      )}

      <div className="story-controls">
        <button
          type="button"
          className="button-quiet"
          disabled={round.page === 0}
          onClick={() => turn(-1)}
        >
          ← Back
        </button>
        <p className="story-progress">
          Page {round.page + 1} of {round.pages.length}
        </p>
        {lastPage ? (
          <button
            type="button"
            className="button-primary"
            onClick={() => {
              play('chime')
              onRoundChange?.({ ...round, retelling: true, helpWord: undefined })
            }}
          >
            The end! →
          </button>
        ) : (
          <button type="button" className="button-primary" onClick={() => turn(1)}>
            Next page →
          </button>
        )}
      </div>
    </div>
  )
}
