import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  CATEGORY_NAMES,
  CATEGORY_ORDER,
  GAME_BLURBS,
  GAME_NAMES,
  gamesIn,
  type ConnectionState,
  type GameCategory,
  type GameId,
} from '../core/types'
import { play, setSoundEnabled, soundEnabled } from '../core/sound'
import { Berry, Counter, Flower, Monster, Character } from './Illustrations'
import {
  Buddy,
  Face,
  MiniScene,
  SwitchArrows,
  Thermometer,
} from './FeelingsArt'
import {
  Engine,
  Gem,
  Ladder,
  LabMonster,
  Robot,
  Wand,
  WordPicture,
} from './ReadingArt'

/* ------------------------------------------------------------------ */

export function Brand({ to = '/' }: { to?: string | null }) {
  const mark = (
    <span className="brand">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="brand-words">
        Florie<em>.</em>
        <small>Learning Games</small>
      </span>
    </span>
  )
  return to ? (
    <Link to={to} className="brand-link">
      {mark}
    </Link>
  ) : (
    mark
  )
}

export function SoundToggle() {
  const [on, setOn] = useState(soundEnabled)
  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={on}
      onClick={() => {
        const next = !on
        setOn(next)
        setSoundEnabled(next)
        if (next) play('pop')
      }}
    >
      <span aria-hidden="true">{on ? '♪' : '♪̸'}</span>
      <span className="visually-hidden">
        {on ? 'Sound on. Turn sound off' : 'Sound off. Turn sound on'}
      </span>
    </button>
  )
}

export function Shell({
  children,
  variant = 'default',
  aside,
}: {
  children: ReactNode
  variant?: 'default' | 'student'
  aside?: ReactNode
}) {
  return (
    <div className={`shell shell-${variant}`}>
      <header className="shell-header">
        <Brand to={variant === 'student' ? null : '/'} />
        <div className="shell-header-end">
          {aside}
          <SoundToggle />
        </div>
      </header>
      <main className="shell-body">{children}</main>
    </div>
  )
}

/* ------------------------------------------------------------------ */

const GAME_ART: Record<GameId, ReactNode> = {
  'flash-hide': (
    <span className="game-art game-art-flash" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  ),
  'feed-monster': <Monster mood="hungry" className="game-art" />,
  'bond-garden': <Flower className="game-art" tone={0} />,
  'ten-frame': <Counter className="game-art" />,
  'number-line': <Character id="rabbit" className="game-art" />,
  'feeling-thermometer': <Thermometer className="game-art" level={4} />,
  'opposite-game': <SwitchArrows className="game-art" />,
  'mirror-faces': <Face className="game-art" face="bright" />,
  'scavenger-hunt': <MiniScene className="game-art" />,
  'rock-buddy': <Buddy className="game-art" asleep />,
  'freeze-dance': <Face className="game-art" face="startled" />,
  'robot-translator': <Robot className="game-art" />,
  'sound-safari': <WordPicture className="game-art" word="fox" />,
  skywriter: (
    <span className="game-art game-art-letter" aria-hidden="true">
      a
    </span>
  ),
  'sound-box-factory': (
    <span className="game-art game-art-boxes" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  ),
  'monster-lab': (
    <LabMonster
      className="game-art"
      look={{ eyes: 2, horns: 2, colour: 0, feet: 2 }}
    />
  ),
  'digraph-detectives': (
    <span className="game-art game-art-letter" aria-hidden="true">
      sh
    </span>
  ),
  'blend-train': <Engine className="game-art" />,
  'magic-e-wizard': <Wand className="game-art" />,
  'tricky-treasure': <Gem className="game-art" />,
  'word-ladder': <Ladder className="game-art" rungs={4} done={2} />,
  'story-quest': (
    <span className="game-art game-art-book" aria-hidden="true">
      <i />
      <i />
    </span>
  ),
}

export function GamePicker({
  onPick,
  current,
  categories = CATEGORY_ORDER,
}: {
  onPick: (game: GameId) => void
  current?: GameId
  categories?: GameCategory[]
}) {
  return (
    <div className="game-library">
      {categories.map((category) => (
        <section key={category} className="game-category">
          <h3 className="game-category-name">{CATEGORY_NAMES[category]}</h3>
          <ul className="game-grid">
            {gamesIn(category).map((game) => (
              <li key={game}>
                <button
                  type="button"
                  className={`game-card theme-${game}`}
                  aria-current={current === game || undefined}
                  onClick={() => {
                    play('click')
                    onPick(game)
                  }}
                >
                  <span className="game-card-art">{GAME_ART[game]}</span>
                  <span className="game-card-text">
                    <strong>{GAME_NAMES[game]}</strong>
                    <small>{GAME_BLURBS[game]}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function NumberPad({
  min = 0,
  max = 10,
  onChoose,
  chosen,
  disabled,
}: {
  min?: number
  max?: number
  onChoose: (value: number) => void
  chosen?: number | null
  disabled?: boolean
}) {
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  return (
    <div className="number-pad" role="group" aria-label="Choose your answer">
      {values.map((value) => (
        <button
          key={value}
          type="button"
          className="number-key"
          disabled={disabled}
          aria-pressed={chosen === value || undefined}
          onClick={() => {
            play('click')
            onChoose(value)
          }}
        >
          {value}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function ConnectionPill({
  state,
  name,
}: {
  state: ConnectionState
  name?: string
}) {
  const label =
    state === 'connected'
      ? 'Connected'
      : state === 'reconnecting'
        ? 'Reconnecting…'
        : 'Waiting to join'
  return (
    <p className={`connection connection-${state}`}>
      <span className="connection-dot" aria-hidden="true" />
      <strong>{name ?? 'Your learner'}</strong>
      <span>{label}</span>
    </p>
  )
}

/** A calm, playful placeholder — never a blank screen (spec §37). */
export function Waiting({
  title,
  detail,
}: {
  title: string
  detail?: string
}) {
  return (
    <div className="waiting">
      <div className="waiting-art" aria-hidden="true">
        <Berry />
        <Flower tone={2} />
        <Counter />
      </div>
      <h1>{title}</h1>
      {detail && <p>{detail}</p>}
      <div className="waiting-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    </div>
  )
}

/** Warm, never punishing (spec §16). */
export function Feedback({
  tone,
  children,
}: {
  tone: 'idle' | 'try-again' | 'success'
  children: ReactNode
}) {
  return (
    <p className={`feedback feedback-${tone}`} role="status" aria-live="polite">
      {children}
    </p>
  )
}
