import { useEffect, useState, type CSSProperties } from 'react'
import { Feedback, NumberPad } from '../components/common'
import { CHARACTER_NAMES, Character, Scene } from '../components/Illustrations'
import { play } from '../core/sound'
import type { LineRound } from '../core/types'
import { useRoundAnswer, type GameProps } from './shared'

export function NumberLine({
  round,
  nickname,
  onAnswer,
  onInteraction,
}: GameProps<LineRound>) {
  const [position, setPosition] = useState(round.start)
  const [jumps, setJumps] = useState(0)
  const [predicted, setPredicted] = useState<number | null>(null)
  const answer = useRoundAnswer(round, onAnswer)

  const name = CHARACTER_NAMES[round.character]
  const forward = round.operation === '+'
  const jumpsLeft = round.amount - jumps
  const landed = jumps === round.amount
  const needsPrediction = round.predict && predicted === null

  useEffect(() => {
    setPosition(round.start)
    setJumps(0)
    setPredicted(null)
  }, [round.id, round.start])

  const jump = () => {
    if (landed || needsPrediction) return
    const next = position + (forward ? 1 : -1)
    play('hop')
    setPosition(next)
    setJumps((j) => j + 1)
    onInteraction({
      kind: 'jump',
      value: next,
      secondary: jumps + 1,
      message: `${nickname} jumped ${position} → ${next} (${jumps + 1} of ${round.amount})`,
    })
  }

  const cells = Array.from({ length: round.range + 1 }, (_, n) => n)

  return (
    <div className="stage theme-number-line">
      <Scene variant="trail" />

      <header className="stage-head">
        <p className="stage-eyebrow">Number-Line Adventure</p>
        <h1>
          {needsPrediction
            ? `${name} is on ${round.start}. Where will ${name} land?`
            : landed
              ? `Where did ${name} land?`
              : `${name} is on ${round.start}. Jump ${forward ? 'forward' : 'back'} ${round.amount}!`}
        </h1>
      </header>

      <div
        className="numberline"
        style={{ '--cells': cells.length } as CSSProperties}
      >
        <div
          className="numberline-walker"
          style={{ '--at': position } as CSSProperties}
        >
          <Character id={round.character} />
        </div>
        <div className="numberline-track">
          {cells.map((n) => (
            <span
              key={n}
              className={`numberline-stop ${n === position ? 'is-here' : ''} ${
                n === round.start ? 'is-start' : ''
              }`}
            >
              <i aria-hidden="true" />
              <b>{n}</b>
            </span>
          ))}
        </div>
      </div>

      {needsPrediction ? (
        <>
          <h2 className="stage-question">Have a good guess!</h2>
          <NumberPad
            min={0}
            max={round.range}
            onChoose={(value) => {
              setPredicted(value)
              answer.submit(value, {
                kind: 'prediction',
                label: `guessed ${value}`,
              })
            }}
          />
        </>
      ) : !landed ? (
        <>
          <button type="button" className="jump-button" onClick={jump}>
            {forward ? 'JUMP →' : '← JUMP'}
          </button>
          <p className="jump-count">
            {jumpsLeft} {jumpsLeft === 1 ? 'jump' : 'jumps'} to go
          </p>
        </>
      ) : (
        <NumberPad
          min={0}
          max={round.range}
          chosen={answer.chosen}
          onChoose={(value) =>
            answer.submit(value, {
              kind: 'final',
              label: `${round.start} ${round.operation} ${round.amount} = ${value}`,
            })
          }
          disabled={answer.solved}
        />
      )}

      <Feedback
        tone={answer.solved && landed ? 'success' : answer.tone}
      >
        {answer.solved && landed ? (
          <>
            {name} landed on {round.expected}!
            {round.showEquation && (
              <em className="equation">
                {round.start} {round.operation} {round.amount} = {round.expected}
              </em>
            )}
          </>
        ) : (
          answer.message ||
          (predicted !== null && !landed
            ? `You guessed ${predicted}. Let’s find out!`
            : 'Take one jump at a time.')
        )}
      </Feedback>
    </div>
  )
}
