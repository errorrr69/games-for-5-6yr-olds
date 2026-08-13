import { useEffect, useMemo, useState } from 'react'
import { Feedback } from '../components/common'
import { Flower, Pot, Scene, Sprout } from '../components/Illustrations'
import { useDragAndTap } from '../components/useDragAndTap'
import { allBondsFound, bondKey, bondsFor, canonicalBond } from '../core/gameLogic'
import { play } from '../core/sound'
import type { Bond, GardenRound } from '../core/types'
import type { GameProps } from './shared'

type Spot = 'tray' | 'left' | 'right'

export function BondGarden({
  round,
  nickname,
  discoveries,
  onAnswer,
  onInteraction,
  onBond,
}: GameProps<GardenRound>) {
  const [placement, setPlacement] = useState<Spot[]>([])
  const [settled, setSettled] = useState(false)

  const reset = useMemo(
    () => () =>
      Array.from({ length: round.target }, (_, i): Spot =>
        i < round.fixedLeft ? 'left' : 'tray',
      ),
    [round.target, round.fixedLeft],
  )

  useEffect(() => {
    setPlacement(reset())
    setSettled(false)
  }, [round.id, reset])

  const count = (spot: Spot) => placement.filter((p) => p === spot).length
  const left = count('left')
  const right = count('right')
  const unplaced = count('tray')

  const found = discoveries[round.target] ?? []
  const everyBond = bondsFor(round.target)
  const complete = unplaced === 0 && placement.length > 0

  const settle = (l: number, r: number) => {
    if (settled) return
    setSettled(true)
    play('bloom')
    const bond = canonicalBond(l, r)
    onBond(round.target, bond)
    onAnswer(round.challenge ? r : l, {
      correct: round.challenge ? r === round.expected : true,
      label: `${l} + ${r} = ${round.target}`,
    })
  }

  const place = (index: number, spot: Spot) => {
    if (index < round.fixedLeft) return
    if (placement[index] === spot) return

    const next = placement.map((p, i) => (i === index ? spot : p))
    setPlacement(next)
    play('click')

    const l = next.filter((p) => p === 'left').length
    const r = next.filter((p) => p === 'right').length
    const u = next.filter((p) => p === 'tray').length

    onInteraction({
      kind: 'flower',
      value: l,
      secondary: r,
      message: `Left pot ${l} · right pot ${r} · unplaced ${u}`,
    })

    if (u === 0 && !round.challenge) settle(l, r)
  }

  const { drag, selected, item, zone } = useDragAndTap((itemId, zoneId) => {
    place(Number(itemId), zoneId as Spot)
  })

  const gardenDone = allBondsFound(round.target, found)

  return (
    <div className="stage theme-bond-garden">
      <Scene variant="garden" />

      <header className="stage-head">
        <p className="stage-eyebrow">Number Bond Garden</p>
        <h1>
          {round.challenge
            ? `One pot has ${round.fixedLeft}. Can you make ${round.target}?`
            : `Can you split ${round.target} between the pots?`}
        </h1>
      </header>

      <div className="garden-whole">
        <Flower tone={4} className="garden-whole-flower" />
        <strong>{round.target}</strong>
      </div>

      <div className="pots">
        {(['left', 'right'] as const).map((side) => {
          const flowers = placement
            .map((spot, index) => ({ spot, index }))
            .filter((f) => f.spot === side)
          return (
            <div
              key={side}
              className={`pot-slot ${selected ? 'is-ready' : ''}`}
              {...zone(side)}
              aria-label={`${side} pot, ${flowers.length} flowers`}
            >
              <div className="pot-flowers">
                {flowers.map(({ index }) => (
                  <span
                    key={index}
                    className="pot-flower"
                    {...(index < round.fixedLeft ? {} : item(String(index)))}
                  >
                    <Flower tone={index} />
                  </span>
                ))}
              </div>
              <Pot className="pot-art" />
              <strong className="pot-count">{flowers.length}</strong>
            </div>
          )
        })}
      </div>

      <div className="tray garden-tray" {...zone('tray')}>
        <p className="tray-label">
          {selected
            ? 'Now tap a pot!'
            : unplaced > 0
              ? 'Flowers to plant — drag or tap one'
              : 'All planted!'}
        </p>
        <div className="tray-items">
          {placement
            .map((spot, index) => ({ spot, index }))
            .filter((f) => f.spot === 'tray')
            .map(({ index }) => (
              <span key={index} className="tray-item" {...item(String(index))}>
                <Flower tone={index} />
              </span>
            ))}
        </div>
      </div>

      {round.challenge && !settled && (
        <button
          type="button"
          className="button-primary"
          onClick={() => settle(left, right)}
        >
          That’s how many!
        </button>
      )}

      <Feedback tone={complete || settled ? 'success' : 'idle'}>
        {settled ? (
          <>
            {left} and {right} make {round.target}!
            {round.showEquation && (
              <em className="equation">
                {left} + {right} = {round.target}
              </em>
            )}
          </>
        ) : (
          `${unplaced} still to plant`
        )}
      </Feedback>

      {settled && !gardenDone && (
        <button
          type="button"
          className="button-primary"
          onClick={() => {
            setPlacement(reset())
            setSettled(false)
            play('click')
          }}
        >
          Can you make {round.target} a different way?
        </button>
      )}

      <section className={`discoveries ${gardenDone ? 'is-complete' : ''}`}>
        <h2>{nickname}’s garden</h2>
        <ul>
          {everyBond.map((bond: Bond) => {
            const known = found.some((f) => bondKey(f) === bondKey(bond))
            return (
              <li key={bondKey(bond)} className={known ? 'is-found' : 'is-hidden'}>
                {known ? (
                  <>
                    <Sprout />
                    <span>
                      {bond[0]} + {bond[1]}
                    </span>
                  </>
                ) : (
                  <span aria-label="not found yet">?</span>
                )}
              </li>
            )
          })}
        </ul>
        {gardenDone && (
          <p className="discoveries-done">
            You found every way to make {round.target}! 🌼
          </p>
        )}
      </section>

      {drag && (
        <span
          className="drag-ghost"
          style={{ left: drag.x, top: drag.y }}
          aria-hidden="true"
        >
          <Flower tone={Number(drag.itemId)} />
        </span>
      )}
    </div>
  )
}
