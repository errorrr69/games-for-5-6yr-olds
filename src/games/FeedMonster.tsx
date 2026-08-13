import { useEffect, useMemo, useState } from 'react'
import { Feedback } from '../components/common'
import { Berry, Monster, Scene, type MonsterMood } from '../components/Illustrations'
import { useDragAndTap } from '../components/useDragAndTap'
import { play } from '../core/sound'
import type { MonsterRound } from '../core/types'
import type { GameProps } from './shared'

/** Spare berries beyond the answer, so overfilling is possible and safe. */
const SPARE = 3

export function FeedMonster({
  round,
  nickname,
  onAnswer,
  onInteraction,
}: GameProps<MonsterRound>) {
  const [inBowl, setInBowl] = useState(round.start)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    setInBowl(round.start)
    setSettled(false)
  }, [round.id, round.start])

  const trayCount = round.target - round.start + SPARE
  const berries = useMemo(
    () => Array.from({ length: trayCount }, (_, i) => `berry-${i}`),
    [trayCount],
  )

  const added = inBowl - round.start
  const remaining = trayCount - added
  const overfilled = inBowl > round.target
  const complete = inBowl === round.target

  const move = (next: number) => {
    if (next === inBowl) return
    setInBowl(next)
    play(next > inBowl ? 'pop' : 'click')
    onInteraction({
      kind: 'berry',
      value: next,
      secondary: round.target,
      message:
        next > inBowl
          ? `${nickname} added a berry — bowl has ${next} of ${round.target}`
          : `${nickname} took one out — bowl has ${next} of ${round.target}`,
    })

    if (next === round.target && !settled) {
      setSettled(true)
      play('munch')
      onAnswer(next - round.start, {
        correct: true,
        label: `${round.start} + ${next - round.start} = ${round.target}`,
      })
    }
  }

  const { drag, selected, item, zone } = useDragAndTap((_itemId, zoneId) => {
    if (zoneId === 'bowl') move(inBowl + 1)
    else if (zoneId === 'tray') move(Math.max(round.start, inBowl - 1))
  })

  const mood: MonsterMood = complete
    ? 'full'
    : overfilled
      ? 'oops'
      : added > 0
        ? 'happy'
        : 'hungry'

  return (
    <div className="stage theme-feed-monster">
      <Scene variant="kitchen" />

      <header className="stage-head">
        <p className="stage-eyebrow">Feed the Monster</p>
        <h1>
          Momo has {round.start}. Momo needs {round.target}!
        </h1>
      </header>

      <div className="monster-scene">
        <Monster mood={mood} className="monster-figure" />

        <div
          className={`bowl ${complete ? 'is-full' : ''} ${overfilled ? 'is-over' : ''}`}
          {...zone('bowl')}
          aria-label={`Momo's bowl, ${inBowl} of ${round.target} berries`}
        >
          <div className="bowl-berries">
            {Array.from({ length: inBowl }, (_, i) => (
              <Berry key={i} className="bowl-berry" />
            ))}
          </div>
          <p className="bowl-count">
            <strong>{inBowl}</strong>
            <span>of {round.target}</span>
          </p>
        </div>
      </div>

      <div className="tray" {...zone('tray')}>
        <p className="tray-label">
          {selected ? 'Now tap the bowl!' : 'Berries — drag or tap one'}
        </p>
        <div className="tray-items">
          {berries.slice(0, remaining).map((id) => (
            <span key={id} className="tray-item" {...item(id)}>
              <Berry />
            </span>
          ))}
        </div>
      </div>

      {inBowl > round.start && !complete && (
        <button
          type="button"
          className="button-quiet"
          onClick={() => move(Math.max(round.start, inBowl - 1))}
        >
          Take one back out
        </button>
      )}

      <Feedback tone={complete ? 'success' : overfilled ? 'try-again' : 'idle'}>
        {complete ? (
          <>
            {round.start} and {round.expected} make {round.target}!
            {round.showEquation && (
              <em className="equation">
                {round.start} + {round.expected} = {round.target}
              </em>
            )}
          </>
        ) : overfilled ? (
          `Oops! My tummy only has room for ${round.target}. Let’s check.`
        ) : (
          'How many more?'
        )}
      </Feedback>

      {drag && (
        <span
          className="drag-ghost"
          style={{ left: drag.x, top: drag.y }}
          aria-hidden="true"
        >
          <Berry />
        </span>
      )}
    </div>
  )
}
