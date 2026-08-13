import { useEffect, useMemo, useState } from 'react'
import { Feedback, NumberPad } from '../components/common'
import { Counter, Scene } from '../components/Illustrations'
import { useDragAndTap } from '../components/useDragAndTap'
import { tenFrame } from '../core/gameLogic'
import { play } from '../core/sound'
import type { TenFrameRound } from '../core/types'
import { useRoundAnswer, type GameProps } from './shared'

/** The frame itself. Counters always fill top row first, left to right. */
function Frame({
  filled,
  hidden,
  dropProps,
}: {
  filled: number
  hidden?: boolean
  dropProps?: Record<string, unknown>
}) {
  const info = tenFrame(filled)
  return (
    <div
      className={`ten-frame-grid ${hidden ? 'is-hidden' : ''}`}
      role="img"
      aria-label={hidden ? 'Frame hidden' : `${info.filled} of 10 filled`}
      {...dropProps}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className="ten-frame-cell">
          {!hidden && i < info.filled && <Counter />}
        </span>
      ))}
    </div>
  )
}

export function TenFrame({
  round,
  nickname,
  onAnswer,
  onInteraction,
}: GameProps<TenFrameRound>) {
  const [filled, setFilled] = useState(round.prefilled)
  const [flashVisible, setFlashVisible] = useState(round.mode === 'flash')
  const answer = useRoundAnswer(round, onAnswer)

  const goal = round.mode === 'make-ten' ? 10 : round.target
  const buildingDone = filled === goal
  const asksQuestion =
    round.mode === 'missing' ||
    round.mode === 'flash' ||
    (round.mode === 'build' && buildingDone) ||
    (round.mode === 'make-ten' && buildingDone)

  useEffect(() => {
    setFilled(round.prefilled)
  }, [round.id, round.prefilled])

  useEffect(() => {
    if (round.mode !== 'flash') return
    setFlashVisible(true)
    const timer = setTimeout(() => setFlashVisible(false), round.flashDuration)
    return () => clearTimeout(timer)
  }, [round.shownAt, round.mode, round.flashDuration])

  const spare = useMemo(
    () => Array.from({ length: Math.max(0, 10 - filled) }, (_, i) => `c-${i}`),
    [filled],
  )

  const move = (next: number) => {
    const safe = Math.max(0, Math.min(10, next))
    if (safe === filled) return
    setFilled(safe)
    play(safe > filled ? 'pop' : 'click')
    onInteraction({
      kind: 'counter',
      value: safe,
      secondary: goal,
      message: `${nickname}'s frame has ${safe} of ${goal}`,
    })
  }

  const { drag, selected, item, zone } = useDragAndTap((_id, zoneId) => {
    if (zoneId === 'frame') move(filled + 1)
    else if (zoneId === 'tray') move(filled - 1)
  })

  const canBuild = round.mode === 'build' || round.mode === 'make-ten'
  const question =
    round.mode === 'flash'
      ? 'How many did you see?'
      : round.mode === 'missing'
        ? 'How many more make 10?'
        : round.mode === 'make-ten'
          ? 'How many did you add?'
          : 'How many spaces are empty?'

  const heading =
    round.mode === 'build'
      ? `Make ${round.target}!`
      : round.mode === 'make-ten'
        ? `There are ${round.target}. Fill it up to 10!`
        : round.mode === 'missing'
          ? `There are ${round.target}.`
          : 'Watch the frame!'

  const isFlash = round.mode === 'flash'

  return (
    <div className="stage theme-ten-frame">
      <Scene variant="blocks" />

      <header className="stage-head">
        <p className="stage-eyebrow">Ten-Frame Builder</p>
        <h1>{heading}</h1>
      </header>

      <Frame
        filled={filled}
        hidden={round.mode === 'flash' && !flashVisible}
        dropProps={canBuild ? zone('frame') : undefined}
      />

      {canBuild && !buildingDone && (
        <div className="tray" {...zone('tray')}>
          <p className="tray-label">
            {selected ? 'Now tap the frame!' : 'Counters — drag or tap one'}
          </p>
          <div className="tray-items">
            {spare.slice(0, Math.max(1, goal - filled) + 2).map((id) => (
              <span key={id} className="tray-item" {...item(id)}>
                <Counter />
              </span>
            ))}
          </div>
        </div>
      )}

      {canBuild && filled > 0 && !buildingDone && (
        <button
          type="button"
          className="button-quiet"
          onClick={() => move(filled - 1)}
        >
          Take one away
        </button>
      )}

      {asksQuestion && (
        <>
          <h2 className="stage-question">{question}</h2>
          <NumberPad
            min={0}
            max={10}
            chosen={answer.chosen}
            onChoose={(value) =>
              answer.submit(value, {
                label: isFlash
                  ? `saw ${round.expected}`
                  : `${round.target} + ${round.expected} = 10`,
              })
            }
            disabled={answer.solved}
          />
        </>
      )}

      <Feedback tone={answer.tone}>
        {answer.solved && !isFlash ? (
          <>
            {round.target} and {round.expected} make 10
            {round.showEquation && (
              <em className="equation">
                {round.target} + {round.expected} = 10
              </em>
            )}
          </>
        ) : (
          answer.message ||
          (canBuild && !buildingDone ? `${filled} of ${goal}` : 'Have a look.')
        )}
      </Feedback>

      {drag && (
        <span
          className="drag-ghost"
          style={{ left: drag.x, top: drag.y }}
          aria-hidden="true"
        >
          <Counter />
        </span>
      )}
    </div>
  )
}
