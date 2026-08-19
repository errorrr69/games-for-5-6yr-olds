import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  Robot,
  SafariBackdrop,
  SoundPulses,
  WordPicture,
} from '../../components/ReadingArt'
import {
  SAFARI_OBJECT_SIZE,
  SAFARI_SCENES,
  SAFARI_SCENE_ASPECT,
  graphemeById,
} from '../../core/phonics'
import { play } from '../../core/sound'
import type { RobotRound, SafariRound, SkywriterRound } from '../../core/types'
import type { GameProps } from '../shared'
import { CardRow, SayItAloud, soundOf } from './kit'

/* ------------------------------------------------------------------ *
 * Robot Translator — oral blending (R1)
 *
 * Robo speaks in sounds; the child turns them back into a word. In picture
 * mode no letters appear at all, which is what keeps R1 genuinely
 * letter-free (spec §8).
 * ------------------------------------------------------------------ */

export function RobotTranslator({
  round,
  onObserve,
  onInteraction,
}: GameProps<RobotRound>) {
  const [chosen, setChosen] = useState<string | null>(null)
  const [pulse, setPulse] = useState(-1)

  useEffect(() => {
    setChosen(null)
  }, [round.id])

  // A gentle visual beat per sound, so the child can see how many there are.
  useEffect(() => {
    setPulse(-1)
    const gap = round.level >= 3 ? 420 : round.level === 2 ? 620 : 800
    const timers = round.word.graphemes.map((_, i) =>
      setTimeout(() => setPulse(i), 500 + i * gap),
    )
    timers.push(
      setTimeout(
        () => setPulse(-1),
        700 + round.word.graphemes.length * gap,
      ),
    )
    return () => timers.forEach(clearTimeout)
  }, [round.shownAt, round.word.text, round.level])

  const choose = (text: string) => {
    const option = round.options.find((o) => o.text === text)
    if (!option) return
    setChosen(text)
    const right = text === round.word.text
    play(right ? 'chime' : 'pop')
    onInteraction({
      kind: 'stage',
      value: right ? 1 : 0,
      message: `Chose the picture of ${text}${right ? ' ✓' : ` (word was ${round.word.text})`}`,
    })
    onObserve({
      field: 'picture',
      choices: [{ id: text, label: text }],
      label: `Blended to ${text}${right ? ' ✓' : ` — word was ${round.word.text}`}`,
    })
  }

  if (round.mode === 'child-robot') {
    return (
      <div className="stage theme-robot-translator">
        <header className="stage-head">
          <p className="stage-eyebrow">Robot Translator</p>
          <h1>Your turn to be the robot!</h1>
        </header>
        <Robot talking className="robot-figure" />
        <SayItAloud>{round.word.text}</SayItAloud>
        <p className="feedback">
          Say it in sounds and see if Florie can guess it!
        </p>
      </div>
    )
  }

  return (
    <div className="stage theme-robot-translator">
      <header className="stage-head">
        <p className="stage-eyebrow">Robot Translator</p>
        <h1>What word is Robo saying?</h1>
      </header>

      <Robot talking={pulse >= 0} className="robot-figure" />
      <SoundPulses count={round.word.graphemes.length} active={pulse} />

      {round.mode === 'picture' ? (
        <>
          <p className="stage-question">Tap the picture</p>
          <CardRow
            options={round.options.map((o) => o.text)}
            chosen={chosen}
            onPick={choose}
            ariaLabel="Choose the picture"
            render={(text) => (
              <>
                <WordPicture
                  decorative
                  word={round.options.find((o) => o.text === text)?.picture}
                />
                {/*
                  The word is never drawn on screen — this is R1, and it is
                  a listening task. It exists only as the button's accessible
                  name, so a screen-reader user can tell the options apart.
                */}
                <span className="visually-hidden">{text}</span>
              </>
            )}
          />
          {chosen && (
            <p
              className={`feedback ${chosen === round.word.text ? 'feedback-success' : 'feedback-try-again'}`}
            >
              {chosen === round.word.text
                ? 'You translated it! Robo is delighted.'
                : 'Nearly — listen to the sounds once more.'}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="stage-question">Say the whole word out loud</p>
          <p className="feedback">Robo is listening…</p>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Sound Safari — initial sounds (R1)
 * ------------------------------------------------------------------ */

export function SoundSafari({
  round,
  onObserve,
  onInteraction,
}: GameProps<SafariRound>) {
  const scene = SAFARI_SCENES.find((s) => s.id === round.scene) ?? SAFARI_SCENES[0]
  const [found, setFound] = useState<string[]>([])
  const [missed, setMissed] = useState<string[]>([])

  useEffect(() => {
    setFound([])
    setMissed([])
  }, [round.id])

  const targets = scene.objects.filter((o) => o.initial === round.target)

  const tap = (id: string) => {
    const object = scene.objects.find((o) => o.id === id)
    if (!object || found.includes(id) || missed.includes(id)) return
    const hit = object.initial === round.target
    if (hit) {
      setFound((current) => [...current, id])
      play('chime')
    } else {
      setMissed((current) => [...current, id])
      play('pop')
    }
    onInteraction({
      kind: 'stage',
      value: hit ? 1 : 0,
      message: `Tapped ${object.word}${hit ? ' ✓' : ` — starts with ${soundOf(object.initial)}`}`,
    })
    onObserve({
      field: 'sound',
      choices: [{ id: object.word, label: object.word }],
      label: `${object.word} for ${round.phoneme}${hit ? ' ✓' : ''}`,
    })
  }

  if (round.mode === 'room') {
    return (
      <div className="stage theme-sound-safari">
        <header className="stage-head">
          <p className="stage-eyebrow">Sound Safari</p>
          <h1>Find something in YOUR room…</h1>
        </header>
        <p className="hunt-sound">{round.phoneme}</p>
        <p className="stage-question">
          …that starts with {round.phoneme}. Show Florie!
        </p>
        <p className="feedback">Off you go — Florie is watching.</p>
      </div>
    )
  }

  const allFound = found.length >= targets.length

  return (
    <div className="stage theme-sound-safari">
      <header className="stage-head">
        <p className="stage-eyebrow">Sound Safari · {scene.title}</p>
        <h1>Find something that starts with…</h1>
      </header>

      <p className="hunt-sound">{round.phoneme}</p>

      <div
        className="safari-scene"
        // Size and shape come from phonics.ts, next to the coordinates they have
        // to agree with and the test that enforces the no-overlap rule. Passing
        // them through rather than repeating them in the stylesheet is what
        // stops a bigger object quietly landing on top of its neighbour.
        style={
          {
            '--safari-object': `${SAFARI_OBJECT_SIZE}%`,
            '--safari-aspect': SAFARI_SCENE_ASPECT,
          } as CSSProperties
        }
      >
        <SafariBackdrop variant={scene.backdrop} />
        {scene.objects.map((object) => (
          <button
            key={object.id}
            type="button"
            className={`safari-object ${found.includes(object.id) ? 'is-found' : ''} ${
              missed.includes(object.id) ? 'is-missed' : ''
            }`}
            style={{ left: `${object.x}%`, top: `${object.y}%` }}
            aria-label={object.word}
            onClick={() => tap(object.id)}
          >
            <WordPicture word={object.word} />
          </button>
        ))}
      </div>

      <p className={`feedback ${allFound ? 'feedback-success' : ''}`}>
        {allFound
          ? `You found all ${targets.length}! Great listening.`
          : `Found ${found.length} of ${targets.length}`}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Skywriter Studio — sound to letter shape (R2)
 * ------------------------------------------------------------------ */

type Point = { x: number; y: number }

export function Skywriter({
  round,
  onObserve,
  onInteraction,
}: GameProps<SkywriterRound>) {
  const [path, setPath] = useState<Point[]>([])
  const [drawing, setDrawing] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const board = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPath([])
    setChosen(null)
  }, [round.id])

  const letter = graphemeById(round.grapheme)?.grapheme ?? round.grapheme

  const point = (event: React.PointerEvent) => {
    const box = board.current?.getBoundingClientRect()
    if (!box) return null
    return {
      x: ((event.clientX - box.left) / box.width) * 100,
      y: ((event.clientY - box.top) / box.height) * 100,
    }
  }

  if (round.mode === 'air') {
    return (
      <div className="stage theme-skywriter">
        <header className="stage-head">
          <p className="stage-eyebrow">Skywriter Studio</p>
          <h1>Can you draw {round.phoneme} in the air?</h1>
        </header>
        {round.showLetter && <p className="sky-letter">{letter}</p>}
        <p className="stage-question">Use your whole arm!</p>
        <p className="feedback">Florie can see you on the video call.</p>
        <p className="mirror-hint">
          No camera is used by this game — only your video call.
        </p>
      </div>
    )
  }

  if (round.mode === 'quick-sound') {
    return (
      <div className="stage theme-skywriter">
        <header className="stage-head">
          <p className="stage-eyebrow">Skywriter Studio</p>
          <h1>What sound does this letter make?</h1>
        </header>
        <p className="sky-letter">{letter}</p>
        <CardRow
          options={round.options}
          chosen={chosen}
          onPick={(id) => {
            setChosen(id)
            const right = id === round.grapheme
            play(right ? 'chime' : 'pop')
            onObserve({
              field: 'sound',
              choices: [{ id, label: soundOf(id) }],
              label: `${letter} → ${soundOf(id)}${right ? ' ✓' : ''}`,
            })
          }}
          render={(id) => soundOf(id)}
          ariaLabel="Choose the sound"
        />
        {chosen && (
          <p
            className={`feedback ${chosen === round.grapheme ? 'feedback-success' : 'feedback-try-again'}`}
          >
            {chosen === round.grapheme
              ? `Yes! ${letter} says ${round.phoneme}.`
              : 'Have another look at the letter.'}
          </p>
        )}
      </div>
    )
  }

  // Trace mode. Exploration, not handwriting assessment (spec §10).
  return (
    <div className="stage theme-skywriter">
      <header className="stage-head">
        <p className="stage-eyebrow">Skywriter Studio</p>
        <h1>Trace the letter with your finger</h1>
      </header>

      <div
        ref={board}
        className="sky-board"
        onPointerDown={(event) => {
          const p = point(event)
          if (!p) return
          event.currentTarget.setPointerCapture?.(event.pointerId)
          setDrawing(true)
          setPath([p])
        }}
        onPointerMove={(event) => {
          if (!drawing) return
          const p = point(event)
          if (p) setPath((current) => [...current, p])
        }}
        onPointerUp={() => {
          setDrawing(false)
          if (path.length > 4) {
            play('chime')
            onInteraction({
              kind: 'stage',
              value: 1,
              message: `Traced ${letter}`,
            })
            onObserve({
              field: 'letter',
              choices: [{ id: round.grapheme, label: letter }],
              label: `Traced ${letter} (${round.phoneme})`,
            })
          }
        }}
      >
        <span className="sky-guide" aria-hidden="true">
          {letter}
        </span>
        <svg viewBox="0 0 100 100" className="sky-trail" preserveAspectRatio="none" aria-hidden="true">
          {path.length > 1 && (
            <polyline
              points={path.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#ffd166"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>

      <p className="feedback feedback-success">
        {path.length > 4 ? `${letter} says ${round.phoneme}` : 'Off you go!'}
      </p>
      {path.length > 4 && (
        <button
          type="button"
          className="button-quiet"
          onClick={() => setPath([])}
        >
          Clear and try again
        </button>
      )}
    </div>
  )
}
