import type { JSX } from 'react'
import type { CharacterId } from '../core/types'

/**
 * Every picture in the app. All inline SVG so it scales cleanly, themes
 * from CSS custom properties, and never waits on a network request.
 */

type Art = { className?: string }

/* ------------------------------------------------------------------ *
 * Momo the monster
 * ------------------------------------------------------------------ */

export type MonsterMood = 'hungry' | 'happy' | 'oops' | 'full'

const MOUTHS: Record<MonsterMood, JSX.Element> = {
  hungry: (
    <>
      <ellipse cx="100" cy="134" rx="27" ry="22" fill="#3d2140" />
      <ellipse cx="100" cy="145" rx="16" ry="10" fill="#ef7d8e" />
      <rect x="84" y="112" width="12" height="11" rx="3" fill="#fffaf2" />
      <rect x="104" y="112" width="12" height="11" rx="3" fill="#fffaf2" />
    </>
  ),
  happy: (
    <>
      <path d="M66 120c6 24 62 24 68 0 0 30-68 30-68 0Z" fill="#3d2140" />
      <path d="M82 138c8 10 28 10 36 0-4 12-32 12-36 0Z" fill="#ef7d8e" />
    </>
  ),
  oops: (
    <>
      <ellipse cx="100" cy="136" rx="15" ry="18" fill="#3d2140" />
      <ellipse cx="100" cy="143" rx="8" ry="7" fill="#ef7d8e" />
    </>
  ),
  full: (
    <>
      <path
        d="M70 128c10 18 50 18 60 0"
        fill="none"
        stroke="#3d2140"
        strokeWidth="9"
        strokeLinecap="round"
      />
    </>
  ),
}

export function Monster({
  mood = 'hungry',
  className,
}: Art & { mood?: MonsterMood }) {
  const asleep = mood === 'full'
  return (
    <svg
      viewBox="0 0 200 200"
      className={['art art-monster', `is-${mood}`, className].filter(Boolean).join(' ')}
      role="img"
      aria-label={`Momo the monster looks ${mood}`}
    >
      {/* antennae */}
      <g stroke="#6f5aa8" strokeWidth="7" strokeLinecap="round" fill="none">
        <path d="M70 34 56 12" />
        <path d="M130 34 144 12" />
      </g>
      <circle cx="54" cy="9" r="9" fill="#ffd166" />
      <circle cx="146" cy="9" r="9" fill="#ffd166" />

      {/* arms */}
      <ellipse cx="20" cy="122" rx="15" ry="26" fill="#6f5aa8" />
      <ellipse cx="180" cy="122" rx="15" ry="26" fill="#6f5aa8" />

      {/* feet */}
      <ellipse cx="70" cy="184" rx="24" ry="13" fill="#5b4890" />
      <ellipse cx="130" cy="184" rx="24" ry="13" fill="#5b4890" />

      {/* body */}
      <path
        d="M100 18c46 0 78 36 78 88s-32 82-78 82-78-30-78-82 32-88 78-88Z"
        fill="#8067c4"
      />
      <path
        d="M100 18c46 0 78 36 78 88 0 14-2 26-7 36-14-42-40-64-71-64s-57 22-71 64c-5-10-7-22-7-36 0-52 32-88 78-88Z"
        fill="#8f77d0"
      />

      {/* spots */}
      <circle cx="42" cy="86" r="9" fill="#a48fe0" />
      <circle cx="158" cy="96" r="7" fill="#a48fe0" />
      <circle cx="52" cy="150" r="6" fill="#a48fe0" />

      {/* cheeks */}
      <ellipse cx="52" cy="118" rx="15" ry="11" fill="#ef7d8e" opacity=".55" />
      <ellipse cx="148" cy="118" rx="15" ry="11" fill="#ef7d8e" opacity=".55" />

      {/* eyes */}
      <g className="monster-eyes">
        <ellipse cx="76" cy="82" rx="21" ry="24" fill="#fffaf2" />
        <ellipse cx="124" cy="82" rx="21" ry="24" fill="#fffaf2" />
        {asleep ? (
          <g stroke="#3d2140" strokeWidth="5" strokeLinecap="round">
            <path d="M64 84c8 8 16 8 24 0" fill="none" />
            <path d="M112 84c8 8 16 8 24 0" fill="none" />
          </g>
        ) : (
          <>
            <circle cx="80" cy="86" r="10" fill="#3d2140" />
            <circle cx="128" cy="86" r="10" fill="#3d2140" />
            <circle cx="84" cy="81" r="4" fill="#fffaf2" />
            <circle cx="132" cy="81" r="4" fill="#fffaf2" />
          </>
        )}
      </g>

      {MOUTHS[mood]}
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Countable objects
 * ------------------------------------------------------------------ */

export function Berry({ className }: Art) {
  return (
    <svg viewBox="0 0 60 66" className={['art', className].filter(Boolean).join(' ')} aria-hidden="true">
      <path d="M30 14c2-8 10-12 18-11-2 9-9 13-18 11Z" fill="#5aa06b" />
      <path d="M30 12V6" stroke="#5aa06b" strokeWidth="4" strokeLinecap="round" />
      <circle cx="30" cy="40" r="23" fill="#e0455f" />
      <path d="M30 17a23 23 0 0 1 20 34A23 23 0 0 0 30 17Z" fill="#c0304a" />
      <ellipse cx="22" cy="32" rx="7" ry="5" fill="#ff97a8" opacity=".85" transform="rotate(-30 22 32)" />
    </svg>
  )
}

export function Flower({ className, tone = 0 }: Art & { tone?: number }) {
  const palettes = [
    ['#ef7d8e', '#ffd166'],
    ['#f4a259', '#fff3c4'],
    ['#a48fe0', '#ffd166'],
    ['#68b6d8', '#fff3c4'],
    ['#e8617f', '#ffe08a'],
  ]
  const [petal, heart] = palettes[tone % palettes.length]
  return (
    <svg viewBox="0 0 60 72" className={['art', className].filter(Boolean).join(' ')} aria-hidden="true">
      <path d="M30 40v28" stroke="#5aa06b" strokeWidth="5" strokeLinecap="round" />
      <path d="M30 56c-9 0-14-5-15-12 9-1 14 4 15 12Z" fill="#5aa06b" />
      <g fill={petal}>
        <ellipse cx="30" cy="14" rx="10" ry="13" />
        <ellipse cx="47" cy="27" rx="10" ry="13" transform="rotate(72 47 27)" />
        <ellipse cx="41" cy="47" rx="10" ry="13" transform="rotate(144 41 47)" />
        <ellipse cx="19" cy="47" rx="10" ry="13" transform="rotate(216 19 47)" />
        <ellipse cx="13" cy="27" rx="10" ry="13" transform="rotate(288 13 27)" />
      </g>
      <circle cx="30" cy="30" r="9" fill={heart} />
    </svg>
  )
}

export function Pot({ className }: Art) {
  return (
    <svg viewBox="0 0 160 110" className={['art', className].filter(Boolean).join(' ')} aria-hidden="true">
      <rect x="6" y="4" width="148" height="26" rx="12" fill="#c98159" />
      <path d="M18 32h124l-14 66a10 10 0 0 1-10 8H42a10 10 0 0 1-10-8Z" fill="#b56c47" />
      <path d="M18 32h30l-8 74h-2a10 10 0 0 1-10-8Z" fill="#c98159" />
      <ellipse cx="80" cy="34" rx="58" ry="8" fill="#6b4a33" opacity=".35" />
    </svg>
  )
}

export function Counter({ className }: Art) {
  return (
    <svg viewBox="0 0 60 60" className={['art', className].filter(Boolean).join(' ')} aria-hidden="true">
      <circle cx="30" cy="32" r="26" fill="#d1502f" />
      <circle cx="30" cy="28" r="26" fill="#e8613c" />
      <ellipse cx="22" cy="19" rx="9" ry="6" fill="#ffb59c" opacity=".7" transform="rotate(-28 22 19)" />
    </svg>
  )
}

export function Sprout({ className }: Art) {
  return (
    <svg viewBox="0 0 40 40" className={['art', className].filter(Boolean).join(' ')} aria-hidden="true">
      <path d="M20 36V18" stroke="#4f8f5f" strokeWidth="4" strokeLinecap="round" />
      <path d="M20 24c-8 0-12-5-12-12 8-1 12 4 12 12Z" fill="#68b06f" />
      <path d="M20 20c7 0 11-4 11-11-7-1-11 3-11 11Z" fill="#8fc97a" />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Number-line travellers
 * ------------------------------------------------------------------ */

function Rabbit() {
  return (
    <>
      <ellipse cx="34" cy="30" rx="9" ry="21" fill="#f6ece0" />
      <ellipse cx="34" cy="32" rx="4" ry="14" fill="#f6b8c4" />
      <ellipse cx="60" cy="26" rx="9" ry="21" fill="#f6ece0" transform="rotate(14 60 26)" />
      <ellipse cx="60" cy="28" rx="4" ry="14" fill="#f6b8c4" transform="rotate(14 60 28)" />
      <ellipse cx="50" cy="76" rx="27" ry="22" fill="#fdf5ec" />
      <circle cx="47" cy="54" r="21" fill="#fdf5ec" />
      <circle cx="40" cy="51" r="3.4" fill="#3d2140" />
      <circle cx="55" cy="51" r="3.4" fill="#3d2140" />
      <ellipse cx="47.5" cy="59" rx="4" ry="3" fill="#ef7d8e" />
      <ellipse cx="33" cy="58" rx="6" ry="4" fill="#f6b8c4" opacity=".7" />
      <circle cx="74" cy="82" r="9" fill="#fdf5ec" />
    </>
  )
}

function Frog() {
  return (
    <>
      <ellipse cx="50" cy="72" rx="32" ry="25" fill="#6fbf73" />
      <ellipse cx="50" cy="80" rx="20" ry="14" fill="#c7e8a8" />
      <ellipse cx="20" cy="86" rx="12" ry="8" fill="#57a95d" />
      <ellipse cx="80" cy="86" rx="12" ry="8" fill="#57a95d" />
      <circle cx="34" cy="42" r="15" fill="#6fbf73" />
      <circle cx="66" cy="42" r="15" fill="#6fbf73" />
      <circle cx="34" cy="41" r="10" fill="#fffaf2" />
      <circle cx="66" cy="41" r="10" fill="#fffaf2" />
      <circle cx="36" cy="43" r="5" fill="#3d2140" />
      <circle cx="64" cy="43" r="5" fill="#3d2140" />
      <path d="M34 68c8 9 24 9 32 0" stroke="#2f6b3a" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  )
}

function Cat() {
  return (
    <>
      <path d="M76 84c14-4 16-20 6-28-6 10-14 6-14 6Z" fill="#f5a35c" />
      <ellipse cx="48" cy="76" rx="26" ry="22" fill="#f9b571" />
      <path d="M30 36l4 18 14-8Z" fill="#f9b571" />
      <path d="M66 36l-4 18-14-8Z" fill="#f9b571" />
      <path d="M33 40l2 10 7-4Z" fill="#f6b8c4" />
      <path d="M63 40l-2 10-7-4Z" fill="#f6b8c4" />
      <circle cx="48" cy="52" r="21" fill="#fcc98d" />
      <path d="M40 34c2 6 2 10 0 14M56 34c-2 6-2 10 0 14" stroke="#e08c48" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="41" cy="50" r="3.6" fill="#3d2140" />
      <circle cx="55" cy="50" r="3.6" fill="#3d2140" />
      <path d="M48 57l-3 3h6Z" fill="#ef7d8e" />
      <path d="M48 60c-2 4-7 4-9 1M48 60c2 4 7 4 9 1" stroke="#3d2140" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>
  )
}

function Unicorn() {
  return (
    <>
      <ellipse cx="50" cy="76" rx="28" ry="22" fill="#fdf5ec" />
      <path d="M56 20l6 20-16 2Z" fill="#ffd166" />
      <circle cx="48" cy="52" r="22" fill="#fffaf2" />
      <path d="M30 36c-8 8-9 20-4 30 8-2 10-12 8-22" fill="#b79ae8" />
      <path d="M66 34c9 6 12 18 8 28-8-1-11-11-10-21" fill="#f6b8c4" />
      <ellipse cx="70" cy="30" rx="7" ry="10" fill="#fdf5ec" transform="rotate(20 70 30)" />
      <circle cx="41" cy="52" r="3.6" fill="#3d2140" />
      <circle cx="56" cy="52" r="3.6" fill="#3d2140" />
      <ellipse cx="48" cy="62" rx="5" ry="3.4" fill="#f6b8c4" />
      <ellipse cx="32" cy="60" rx="6" ry="4" fill="#f6b8c4" opacity=".6" />
    </>
  )
}

const CHARACTERS: Record<CharacterId, () => JSX.Element> = {
  rabbit: Rabbit,
  frog: Frog,
  cat: Cat,
  unicorn: Unicorn,
}

export const CHARACTER_NAMES: Record<CharacterId, string> = {
  rabbit: 'Bunny',
  frog: 'Hoppy',
  cat: 'Ginger',
  unicorn: 'Sparkle',
}

export function Character({
  id,
  className,
}: Art & { id: CharacterId }) {
  const Shape = CHARACTERS[id]
  return (
    <svg
      viewBox="0 0 100 100"
      className={['art art-character', className].filter(Boolean).join(' ')}
      role="img"
      aria-label={CHARACTER_NAMES[id]}
    >
      <Shape />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Fingers, for Flash & Hide's finger representation
 * ------------------------------------------------------------------ */

function OneHand({ raised, flip }: { raised: number; flip?: boolean }) {
  const fingers = [0, 1, 2, 3]
  const heights = [46, 54, 50, 40]
  return (
    <g transform={flip ? 'translate(100 0) scale(-1 1)' : undefined}>
      {/* thumb */}
      <rect
        x="4"
        y={raised >= 5 ? 62 : 78}
        width="20"
        height={raised >= 5 ? 34 : 18}
        rx="10"
        fill="#f3c9a2"
        transform="rotate(-22 14 88)"
      />
      {fingers.map((i) => {
        const up = i < Math.min(raised, 4)
        const h = up ? heights[i] : 12
        return (
          <rect
            key={i}
            x={26 + i * 17}
            y={72 - h}
            width="15"
            height={h + 20}
            rx="7.5"
            fill="#f7d4b0"
          />
        )
      })}
      <rect x="20" y="66" width="72" height="46" rx="20" fill="#f3c9a2" />
    </g>
  )
}

export function Fingers({ count, className }: Art & { count: number }) {
  const left = Math.min(count, 5)
  const right = Math.max(0, count - 5)
  const twoHands = count > 5
  return (
    <svg
      viewBox={twoHands ? '0 0 240 120' : '0 0 110 120'}
      className={['art art-fingers', className].filter(Boolean).join(' ')}
      role="img"
      aria-label={`${count} fingers`}
    >
      <OneHand raised={left} />
      {twoHands && (
        <g transform="translate(120 0)">
          <OneHand raised={right} flip />
        </g>
      )}
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Scenery
 * ------------------------------------------------------------------ */

export function Scene({ variant }: { variant: 'garden' | 'trail' | 'night' | 'blocks' | 'kitchen' }) {
  return (
    <svg viewBox="0 0 400 120" className="art scene" aria-hidden="true" preserveAspectRatio="none">
      {variant === 'night' && (
        <>
          <circle cx="60" cy="40" r="16" fill="#ffd166" opacity=".7" />
          {[
            [30, 80],
            [120, 30],
            [200, 62],
            [280, 26],
            [350, 70],
            [320, 100],
          ].map(([x, y], i) => (
            <path
              key={i}
              d={`M${x} ${y - 7}l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z`}
              fill="#fff3c4"
              opacity=".9"
            />
          ))}
        </>
      )}
      {variant === 'garden' && (
        <>
          <circle cx="340" cy="34" r="24" fill="#ffd166" />
          <path d="M0 120c40-40 90-40 130 0Z" fill="#8fc97a" opacity=".55" />
          <path d="M150 120c50-52 120-52 170 0Z" fill="#8fc97a" opacity=".45" />
        </>
      )}
      {variant === 'trail' && (
        <>
          <circle cx="52" cy="36" r="22" fill="#ffd166" />
          <path d="M0 120c60-46 130-46 190 0Z" fill="#a7d59a" opacity=".5" />
          <path d="M210 120c50-38 120-38 190 0Z" fill="#a7d59a" opacity=".4" />
          <ellipse cx="150" cy="34" rx="34" ry="16" fill="#fff" opacity=".8" />
          <ellipse cx="176" cy="30" rx="24" ry="14" fill="#fff" opacity=".8" />
        </>
      )}
      {variant === 'blocks' && (
        <>
          {[20, 90, 300, 360].map((x, i) => (
            <rect key={i} x={x} y={80 - (i % 2) * 18} width="42" height="42" rx="10" fill={i % 2 ? '#ffd166' : '#a7c9e8'} opacity=".6" />
          ))}
        </>
      )}
      {variant === 'kitchen' && (
        <>
          <circle cx="350" cy="40" r="20" fill="#ffd166" opacity=".7" />
          <path d="M0 120c50-30 110-30 160 0Z" fill="#f4a259" opacity=".35" />
        </>
      )}
    </svg>
  )
}
