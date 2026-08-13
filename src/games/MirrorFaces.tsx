import { useEffect, useState } from 'react'
import { Face } from '../components/FeelingsArt'
import { FACE_CLUES } from '../core/feelings'
import { play } from '../core/sound'
import type { Choice, MirrorRound } from '../core/types'
import type { GameProps } from './shared'

/**
 * A face is a clue, not proof.
 *
 * The child's reading is never marked. `round.possible` exists only to give
 * the teacher discussion material, and ambiguous faces are included on
 * purpose so "we need more clues" is a real outcome (spec §8).
 */
export function MirrorFaces({
  round,
  cue,
  driver,
  onObserve,
}: GameProps<MirrorRound>) {
  const [guess, setGuess] = useState<Choice | null>(null)
  const [clue, setClue] = useState<Choice | null>(null)
  const [protested, setProtested] = useState(false)

  useEffect(() => {
    setGuess(null)
    setClue(null)
    setProtested(false)
  }, [round.id])

  useEffect(() => {
    setProtested(false)
  }, [cue?.id])

  /* --- Mode 1: the child pulls the face themselves ------------------ */
  if (round.mode === 'child-face') {
    const asked = cue?.headline ?? round.askFor?.label ?? 'HAPPY'
    return (
      <div className="stage theme-mirror-faces">
        <header className="stage-head">
          <p className="stage-eyebrow">Mirror Face Charades</p>
          <h1>Show me your best…</h1>
        </header>
        <div className="face-card-big">
          <p className="face-word">{asked}</p>
          <p className="face-word-sub">face!</p>
        </div>
        <p className="feedback">
          {driver
            ? `${driver} can see you on the video call. Hold it for a moment!`
            : 'Show your grown-up! Hold it for a moment!'}
        </p>
        <p className="mirror-hint">
          {driver
            ? 'No camera is used by this game — only your video call.'
            : 'No camera is used by this game.'}
        </p>
      </div>
    )
  }

  /* --- Modes 2 & 3: read a drawn face ------------------------------- */
  const sillyGuess = cue?.kind === 'silly-guess' ? cue.headline : null

  const chooseEmotion = (option: Choice) => {
    setGuess(option)
    play('click')
    onObserve({
      field: 'face-emotion',
      choices: [option],
      possible: round.possible,
      label: `Read the face as ${option.label}`,
    })
  }

  const chooseClue = (option: Choice) => {
    setClue(option)
    play('click')
    onObserve({
      field: 'face-clue',
      choices: [option],
      label: `Clue: ${option.label}`,
    })
  }

  const protest = () => {
    setProtested(true)
    play('pop')
    onObserve({
      field: 'protest',
      choices: [{ id: 'disagree', label: `disagreed with "${sillyGuess}"` }],
      label: driver
        ? `Corrected ${driver}’s silly guess (${sillyGuess})`
        : `Corrected the silly guess (${sillyGuess})`,
    })
  }

  return (
    <div className="stage theme-mirror-faces">
      <header className="stage-head">
        <p className="stage-eyebrow">Mirror Face Charades</p>
        <h1>What might they be feeling?</h1>
      </header>

      <div className="mirror-frame">
        <Face face={round.face ?? 'bright'} size="large" />
      </div>

      {sillyGuess && (
        <div className="silly-guess">
          <p>
            {driver ?? 'Your grown-up'} thinks they look{' '}
            <strong>{sillyGuess}</strong>…
          </p>
          {!protested ? (
            <button type="button" className="button-primary noo-button" onClick={protest}>
              NOOO! 😂
            </button>
          ) : (
            <p className="feedback feedback-success">
              You told {driver ?? 'them'}! What do YOU think?
            </p>
          )}
        </div>
      )}

      {!guess ? (
        <ul className="word-grid">
          {round.options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className="word-card"
                onClick={() => chooseEmotion(option)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className="feedback feedback-success">
            You said <strong>{guess.label}</strong>.
          </p>

          {round.askClue &&
            (!clue ? (
              <>
                <p className="stage-question">What clue made you think that?</p>
                <ul className="word-grid">
                  {FACE_CLUES.map((option) => (
                    <li key={option.id}>
                      <button
                        type="button"
                        className="word-card"
                        onClick={() => chooseClue(option)}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="feedback">
                The {clue.label.toLowerCase()} gave you the clue. Good noticing!
              </p>
            ))}

          {round.ambiguous && (
            <p className="mirror-hint">
              This one is tricky — it could be a few things. What else would
              help us know?
            </p>
          )}

          <button
            type="button"
            className="button-quiet"
            onClick={() => {
              setGuess(null)
              setClue(null)
            }}
          >
            Change my mind
          </button>
        </>
      )}
    </div>
  )
}
