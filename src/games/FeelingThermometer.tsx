import { useState } from 'react'
import { BodyOutline, Thermometer } from '../components/FeelingsArt'
import {
  BODY_CLUES,
  CLUE_SPOTS,
  INTENSITY_LEVELS,
  STRATEGIES,
  intensityLabel,
} from '../core/feelings'
import { play } from '../core/sound'
import type { Choice, ThermometerRound } from '../core/types'
import { useStages, type GameProps } from './shared'

type Stage = 'intensity' | 'emotion' | 'body' | 'strategy'

/**
 * Four gentle stages: how big, what is it, where do you notice it, what
 * does your body need next.
 *
 * Nothing here is marked. There is no score, and "I'm not sure" is a
 * complete answer at every stage (spec §6).
 */
export function FeelingThermometer({
  round,
  onObserve,
  onInteraction,
}: GameProps<ThermometerRound>) {
  const stageList: Stage[] = [
    'intensity',
    'emotion',
    ...(round.askBody ? (['body'] as Stage[]) : []),
    ...(round.askStrategy ? (['strategy'] as Stage[]) : []),
  ]
  const stages = useStages<Stage>(round, stageList)

  const [level, setLevel] = useState<number | null>(null)
  const [emotion, setEmotion] = useState<Choice | null>(null)
  const [clues, setClues] = useState<Choice[]>([])

  const who = round.scenario ? round.scenario.who : 'you'
  const possessive = round.scenario ? `${round.scenario.who}’s` : 'your'

  const chooseLevel = (value: number) => {
    setLevel(value)
    play('pop')
    onInteraction({
      kind: 'thermometer',
      value,
      message: `Thermometer moved to ${value} — ${intensityLabel(value)}`,
    })
  }

  const confirmLevel = () => {
    if (level === null) return
    onObserve({
      field: 'intensity',
      choices: [{ id: `level-${level}`, label: intensityLabel(level) }],
      level,
      label: `${intensityLabel(level)} (${level}/5)`,
    })
    stages.next()
  }

  const chooseEmotion = (choice: Choice) => {
    setEmotion(choice)
    play('click')
    onObserve({ field: 'emotion', choices: [choice] })
    stages.next()
  }

  const toggleClue = (choice: Choice) => {
    play('click')
    setClues((current) =>
      current.some((c) => c.id === choice.id)
        ? current.filter((c) => c.id !== choice.id)
        : [...current, choice],
    )
  }

  const confirmClues = () => {
    if (clues.length) onObserve({ field: 'body-clue', choices: clues })
    stages.next()
  }

  const chooseStrategy = (choice: Choice) => {
    play('chime')
    onObserve({ field: 'strategy', choices: [choice] })
    stages.next()
  }

  return (
    <div className="stage theme-feeling-thermometer">
      <header className="stage-head">
        <p className="stage-eyebrow">Feeling Thermometer</p>
        {round.scenario ? (
          <h1>
            {round.scenario.who} {round.scenario.what}.
          </h1>
        ) : (
          <h1>How big is your feeling right now?</h1>
        )}
      </header>

      {stages.done ? (
        <div className="thermo-done">
          <Thermometer level={level ?? 1} className="thermo-final" />
          <p className="feeling-summary">
            {level !== null && <strong>{intensityLabel(level)}</strong>}
            {emotion && <span>{emotion.label}</span>}
          </p>
          <p className="thermo-thanks">
            Thank you for telling me. Feelings change — we can check again later.
          </p>
        </div>
      ) : stages.stage === 'intensity' ? (
        <>
          <p className="stage-question">
            {round.scenario
              ? `Where might ${who}’s feeling be?`
              : 'Where is your feeling right now?'}
          </p>
          <div className="thermo-layout">
            <Thermometer level={level ?? 0} className="thermo-art" />
            <ul className="thermo-scale">
              {[...INTENSITY_LEVELS].reverse().map((option) => (
                <li key={option.level}>
                  <button
                    type="button"
                    className={`thermo-step level-${option.level}`}
                    aria-pressed={level === option.level}
                    onClick={() => chooseLevel(option.level)}
                  >
                    <span className="thermo-number">{option.level}</span>
                    <span className="thermo-word">{option.label}</span>
                    <small>{option.hint}</small>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {level !== null && (
            <button type="button" className="button-primary" onClick={confirmLevel}>
              That’s the one
            </button>
          )}
        </>
      ) : stages.stage === 'emotion' ? (
        <>
          <p className="stage-question">
            {round.scenario
              ? `What might ${who} be feeling?`
              : 'What would you call it?'}
          </p>
          <ul className="word-grid">
            {round.emotions.map((option) => (
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
        </>
      ) : stages.stage === 'body' ? (
        <>
          <p className="stage-question">
            Where do {round.scenario ? `${who} might` : 'you'} notice it?
          </p>
          <div className="body-detective">
            <div className="body-figure">
              <BodyOutline />
              {clues
                .filter((c) => CLUE_SPOTS[c.id])
                .map((c) => (
                  <span
                    key={c.id}
                    className="body-pin"
                    style={{
                      left: `${CLUE_SPOTS[c.id].x}%`,
                      top: `${CLUE_SPOTS[c.id].y}%`,
                    }}
                    aria-hidden="true"
                  />
                ))}
            </div>
            <ul className="word-grid body-clues">
              {BODY_CLUES.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    className="word-card"
                    aria-pressed={clues.some((c) => c.id === option.id)}
                    onClick={() => toggleClue(option)}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <button type="button" className="button-primary" onClick={confirmClues}>
            {clues.length ? 'That’s where' : 'Skip this one'}
          </button>
        </>
      ) : (
        <>
          <p className="stage-question">
            What does {possessive} body need next?
          </p>
          <ul className="word-grid strategy-grid">
            {STRATEGIES.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className="word-card strategy-card"
                  onClick={() => chooseStrategy(option)}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
