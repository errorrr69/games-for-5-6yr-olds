import { useEffect, useState, type ReactNode } from 'react'
import { useDragAndTap } from '../../components/useDragAndTap'
import { graphemeById } from '../../core/phonics'
import { play } from '../../core/sound'

/**
 * Shared pieces for Reading Adventures.
 *
 * Everything here supports tap-then-tap as well as dragging, so a child
 * who cannot manage a drag is never locked out (spec §28).
 */

export const letterOf = (id: string): string =>
  graphemeById(id)?.grapheme ?? id

export const soundOf = (id: string): string =>
  graphemeById(id)?.phoneme ?? `/${id}/`

/* ------------------------------------------------------------------ *
 * Building a word from graphemes
 * ------------------------------------------------------------------ */

export type BuilderResult = {
  slots: (string | null)[]
  complete: boolean
  correct: boolean
  render: ReactNode
  reset: () => void
}

/**
 * A row of sound boxes plus a tray of graphemes.
 *
 * `expected` drives both the number of boxes and the check. It is always a
 * grapheme list, so `sh` fills one box and `s`,`t` fill two.
 */
export function useWordBuilder({
  expected,
  tray,
  locked,
  labels,
  onPlace,
  onComplete,
}: {
  expected: string[]
  tray: string[]
  /** Slots the child cannot change, e.g. a pre-filled carriage. */
  locked?: (string | null)[]
  /** Optional caption under each box. */
  labels?: (string | undefined)[]
  onPlace?: (index: number, grapheme: string, slots: (string | null)[]) => void
  onComplete?: (correct: boolean, slots: (string | null)[]) => void
}): BuilderResult {
  const start = () =>
    expected.map((_, i) => locked?.[i] ?? null) as (string | null)[]

  const [slots, setSlots] = useState<(string | null)[]>(start)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    setSlots(start())
    setSettled(false)
    // Rebuild whenever the word or the locked pattern changes.
  }, [expected.join('|'), (locked ?? []).join('|')])

  const place = (index: number, grapheme: string) => {
    if (locked?.[index]) return
    const next = slots.map((value, i) => (i === index ? grapheme : value))
    setSlots(next)
    play('pop')
    onPlace?.(index, grapheme, next)

    if (next.every((value) => value !== null) && !settled) {
      setSettled(true)
      const correct = next.every((value, i) => value === expected[i])
      play(correct ? 'chime' : 'click')
      onComplete?.(correct, next)
    }
  }

  const { drag, selected, item, zone } = useDragAndTap((itemId, zoneId) => {
    const index = Number(zoneId.replace('slot-', ''))
    if (Number.isNaN(index)) return
    place(index, itemId.replace(/^t\d+-/, ''))
  })

  const complete = slots.every((value) => value !== null)
  const correct = complete && slots.every((value, i) => value === expected[i])

  const render = (
    <>
      <div className="sound-boxes">
        {slots.map((value, index) => (
          <div key={index} className="sound-box-wrap">
            <div
              className={`sound-box ${value ? 'is-filled' : ''} ${
                locked?.[index] ? 'is-locked' : ''
              }`}
              {...(locked?.[index] ? {} : zone(`slot-${index}`))}
              aria-label={`Sound box ${index + 1}${value ? `, ${letterOf(value)}` : ', empty'}`}
            >
              {value ? letterOf(value) : ''}
            </div>
            {labels?.[index] && <small>{labels[index]}</small>}
          </div>
        ))}
      </div>

      <div className="grapheme-tray" {...zone('tray')}>
        <p className="tray-label">
          {selected ? 'Now tap a box!' : 'Drag or tap a sound'}
        </p>
        <div className="tray-items">
          {tray.map((grapheme, i) => (
            <span
              key={`t${i}-${grapheme}`}
              className="grapheme-tile"
              {...item(`t${i}-${grapheme}`)}
            >
              {letterOf(grapheme)}
            </span>
          ))}
        </div>
      </div>

      {drag && (
        <span
          className="drag-ghost grapheme-tile"
          style={{ left: drag.x, top: drag.y }}
          aria-hidden="true"
        >
          {letterOf(drag.itemId.replace(/^t\d+-/, ''))}
        </span>
      )}
    </>
  )

  return {
    slots,
    complete,
    correct,
    render,
    reset: () => {
      setSlots(start())
      setSettled(false)
    },
  }
}

/* ------------------------------------------------------------------ *
 * Choosing from a row of big cards
 * ------------------------------------------------------------------ */

export function CardRow({
  options,
  onPick,
  chosen,
  disabled,
  render,
  ariaLabel = 'Choose one',
}: {
  options: string[]
  onPick: (value: string) => void
  chosen?: string | null
  disabled?: boolean
  render?: (value: string) => ReactNode
  ariaLabel?: string
}) {
  return (
    <div className="card-row" role="group" aria-label={ariaLabel}>
      {options.map((value) => (
        <button
          key={value}
          type="button"
          className="reading-card"
          disabled={disabled}
          aria-pressed={chosen === value || undefined}
          onClick={() => {
            play('click')
            onPick(value)
          }}
        >
          {render ? render(value) : value}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Sorting words into bins
 * ------------------------------------------------------------------ */

export type Bin = { id: string; label: string; art?: ReactNode; hint?: string }

export function useSorter({
  items,
  bins,
  onSort,
}: {
  items: string[]
  bins: Bin[]
  onSort: (item: string, bin: string) => void
}) {
  const [placed, setPlaced] = useState<Record<string, string>>({})

  useEffect(() => setPlaced({}), [items.join('|')])

  const drop = (item: string, bin: string) => {
    setPlaced((current) => ({ ...current, [item]: bin }))
    play('pop')
    onSort(item, bin)
  }

  const { drag, selected, item: itemProps, zone } = useDragAndTap(drop)

  const remaining = items.filter((word) => !placed[word])

  const render = (
    <>
      <div className="sort-tray">
        <p className="tray-label">
          {selected
            ? 'Now tap where it goes!'
            : remaining.length
              ? 'Drag or tap a word'
              : 'All sorted!'}
        </p>
        <div className="tray-items">
          {remaining.map((word) => (
            <span key={word} className="word-tile" {...itemProps(word)}>
              {word}
            </span>
          ))}
        </div>
      </div>

      <div className="sort-bins">
        {bins.map((bin) => (
          <div key={bin.id} className="sort-bin" {...zone(bin.id)}>
            {bin.art}
            <strong>{bin.label}</strong>
            {bin.hint && <small>{bin.hint}</small>}
            <div className="sort-bin-items">
              {items
                .filter((word) => placed[word] === bin.id)
                .map((word) => (
                  <span key={word} className="word-tile is-placed">
                    {word}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>

      {drag && (
        <span
          className="drag-ghost word-tile"
          style={{ left: drag.x, top: drag.y }}
          aria-hidden="true"
        >
          {drag.itemId}
        </span>
      )}
    </>
  )

  return { placed, remaining, render }
}

/* ------------------------------------------------------------------ *
 * Small shared bits
 * ------------------------------------------------------------------ */

/**
 * Nothing spoken can be checked by the browser, so the child simply gets
 * an encouraging prompt and the teacher marks what they heard (spec §7).
 */
export function SayItAloud({ children }: { children: ReactNode }) {
  return (
    <div className="say-it">
      <p className="say-it-cue">Read it out loud to Florie</p>
      <div className="say-it-word">{children}</div>
    </div>
  )
}

export function BigWord({
  text,
  chunks,
  highlight,
}: {
  text: string
  /** When present, the word is shown split into its sounds. */
  chunks?: string[]
  highlight?: string
}) {
  if (!chunks) {
    return <p className="big-word">{text}</p>
  }
  return (
    <p className="big-word is-chunked">
      {chunks.map((part, i) => (
        <span
          key={i}
          className={`chunk ${part === highlight ? 'is-highlight' : ''}`}
        >
          {letterOf(part)}
        </span>
      ))}
    </p>
  )
}
