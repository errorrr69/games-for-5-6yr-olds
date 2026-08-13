import { useEffect, useState } from 'react'
import { SceneBackdrop, SceneFigureArt } from '../components/FeelingsArt'
import {
  HUNT_NEXT_STEPS,
  HUNT_REASONS,
  sceneById,
  type SceneFigure,
} from '../core/feelings'
import { play } from '../core/sound'
import type { Choice, HuntRound, HuntStep } from '../core/types'
import { useStages, type GameProps } from './shared'

/**
 * Perspective taking inside an original illustrated scene.
 *
 * Scenes are built so several characters could plausibly fit the prompt;
 * whoever the child picks is right enough to talk about (spec §9).
 */
export function ScavengerHunt({
  round,
  onObserve,
  onInteraction,
}: GameProps<HuntRound>) {
  const scene = sceneById(round.scene)
  const stages = useStages<HuntStep>(round, round.steps)
  const [picked, setPicked] = useState<SceneFigure | null>(null)

  useEffect(() => {
    setPicked(null)
  }, [round.id])

  const choose = (figure: SceneFigure) => {
    if (stages.stage !== 'find' || picked) return
    setPicked(figure)
    play('pop')
    onInteraction({
      kind: 'stage',
      value: 1,
      message: `Picked ${figure.name} (${figure.doing})`,
    })
    onObserve({
      field: 'character',
      choices: [{ id: figure.id, label: figure.name }],
      possible: figure.might,
      label: `Chose ${figure.name} for "${round.looksFor.label}"`,
    })
    stages.next()
  }

  const answer = (field: 'reason' | 'next-step' | 'other-view', option: Choice) => {
    play('click')
    onObserve({ field, choices: [option] })
    stages.next()
  }

  const other = scene.figures.filter((f) => f.id !== picked?.id)

  return (
    <div className="stage theme-scavenger-hunt">
      <header className="stage-head">
        <p className="stage-eyebrow">Character Scavenger Hunt</p>
        <h1>
          {stages.stage === 'find'
            ? `Can you find someone who might feel ${round.looksFor.label}?`
            : stages.stage === 'why'
              ? 'What makes you think that?'
              : stages.stage === 'next'
                ? 'What could they do next?'
                : stages.done
                  ? scene.title
                  : 'How might someone else be feeling?'}
        </h1>
      </header>

      <div className="hunt-scene">
        <SceneBackdrop variant={scene.backdrop} />
        {scene.figures.map((figure, index) => (
          <button
            key={figure.id}
            type="button"
            className="hunt-figure"
            style={{ left: `${figure.x}%`, top: `${figure.y}%` }}
            aria-label={figure.name}
            aria-pressed={picked?.id === figure.id}
            disabled={stages.stage !== 'find'}
            onClick={() => choose(figure)}
          >
            <SceneFigureArt face={figure.face} pose={figure.pose} tint={index} />
          </button>
        ))}
      </div>

      {picked && (
        <p className="hunt-picked">
          You chose <strong>{picked.name}</strong>.
        </p>
      )}

      {stages.stage === 'why' && (
        <ul className="word-grid">
          {HUNT_REASONS.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className="word-card"
                onClick={() => answer('reason', option)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {stages.stage === 'next' && (
        <ul className="word-grid">
          {HUNT_NEXT_STEPS.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className="word-card"
                onClick={() => answer('next-step', option)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {stages.stage === 'other' && (
        <>
          <p className="stage-question">
            How might one of the others be feeling?
          </p>
          <ul className="word-grid">
            {other.map((figure) => (
              <li key={figure.id}>
                <button
                  type="button"
                  className="word-card"
                  onClick={() =>
                    answer('other-view', { id: figure.id, label: figure.name })
                  }
                >
                  {figure.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {stages.done && (
        <p className="feedback feedback-success">
          Lots of people, lots of feelings. Nice noticing!
        </p>
      )}
    </div>
  )
}
