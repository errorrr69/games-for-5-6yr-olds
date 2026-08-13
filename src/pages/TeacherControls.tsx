import type { ReactNode } from 'react'
import { CHARACTER_NAMES } from '../components/Illustrations'
import type { CharacterId, GameId, Settings } from '../core/types'

/* ------------------------------------------------------------------ *
 * Small, consistent control primitives
 * ------------------------------------------------------------------ */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {children}
    </div>
  )
}

function Choice<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (next: T) => void
}) {
  return (
    <div className="segmented" role="group">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className="segment"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
      <span>{label}</span>
    </label>
  )
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="control-hint">{children}</p>
}

const numbers = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => ({
    value: from + i,
    label: String(from + i),
  }))

/* ------------------------------------------------------------------ *
 * Per-game settings. Every change syncs straight to the child.
 * ------------------------------------------------------------------ */

export function TeacherControls({
  game,
  settings,
  onChange,
}: {
  game: GameId
  settings: Settings
  onChange: (next: Settings) => void
}) {
  const update = <G extends GameId>(id: G, patch: Partial<Settings[G]>) =>
    onChange({ ...settings, [id]: { ...settings[id], ...patch } })

  /* --- Maths -------------------------------------------------------- */

  if (game === 'flash-hide') {
    const s = settings['flash-hide']
    return (
      <div className="controls">
        <Field label="Maximum quantity">
          <Choice
            value={s.max}
            options={numbers(3, 6)}
            onChange={(max) => update('flash-hide', { max })}
          />
        </Field>
        <Field label="Show for">
          <Choice
            value={s.duration}
            options={[1500, 1200, 1000, 800].map((v) => ({
              value: v,
              label: `${v}ms`,
            }))}
            onChange={(duration) => update('flash-hide', { duration })}
          />
        </Field>
        <Field label="Shown as">
          <Choice
            value={s.representation}
            options={[
              { value: 'dots' as const, label: 'Dots' },
              { value: 'fingers' as const, label: 'Fingers' },
              { value: 'mixed' as const, label: 'Mixed' },
            ]}
            onChange={(representation) =>
              update('flash-hide', { representation })
            }
          />
        </Field>
      </div>
    )
  }

  if (game === 'feed-monster') {
    const s = settings['feed-monster']
    return (
      <div className="controls">
        <Field label="Make">
          <Choice
            value={s.target}
            options={[
              { value: 5, label: 'Make 5' },
              { value: 10, label: 'Make 10' },
            ]}
            onChange={(target) =>
              update('feed-monster', {
                target,
                start: Math.min(s.start, target - 1),
              })
            }
          />
        </Field>
        <Field label="Starting berries">
          <Choice
            value={s.start}
            options={numbers(0, s.target - 1)}
            onChange={(start) => update('feed-monster', { start })}
          />
        </Field>
        <Toggle
          label="Random starting amount"
          checked={s.randomStart}
          onChange={(randomStart) => update('feed-monster', { randomStart })}
        />
        <Toggle
          label="Show the equation after success"
          checked={s.showEquation}
          onChange={(showEquation) => update('feed-monster', { showEquation })}
        />
      </div>
    )
  }

  if (game === 'bond-garden') {
    const s = settings['bond-garden']
    return (
      <div className="controls">
        <Field label="Target number">
          <Choice
            value={s.target}
            options={[3, 4, 5, 6, 10].map((v) => ({ value: v, label: String(v) }))}
            onChange={(target) => update('bond-garden', { target })}
          />
        </Field>
        <Toggle
          label="What's Missing? (one pot pre-filled)"
          checked={s.challenge}
          onChange={(challenge) => update('bond-garden', { challenge })}
        />
        <Toggle
          label="Show the equation after success"
          checked={s.showEquation}
          onChange={(showEquation) => update('bond-garden', { showEquation })}
        />
      </div>
    )
  }

  if (game === 'ten-frame') {
    const s = settings['ten-frame']
    return (
      <div className="controls">
        <Field label="Mode">
          <Choice
            value={s.mode}
            options={[
              { value: 'build' as const, label: 'Build It' },
              { value: 'make-ten' as const, label: 'Make 10' },
              { value: 'missing' as const, label: "What's Missing" },
              { value: 'flash' as const, label: 'Flash Frame' },
            ]}
            onChange={(mode) => update('ten-frame', { mode })}
          />
        </Field>
        <Field label="Target quantity">
          <Choice
            value={s.target}
            options={numbers(1, 10)}
            onChange={(target) => update('ten-frame', { target })}
          />
        </Field>
        {s.mode === 'flash' && (
          <Field label="Flash for">
            <Choice
              value={s.flashDuration}
              options={[1600, 1200, 1000, 800].map((v) => ({
                value: v,
                label: `${v}ms`,
              }))}
              onChange={(flashDuration) => update('ten-frame', { flashDuration })}
            />
          </Field>
        )}
        <Toggle
          label="Random target"
          checked={s.randomTarget}
          onChange={(randomTarget) => update('ten-frame', { randomTarget })}
        />
        <Toggle
          label="Show the equation after success"
          checked={s.showEquation}
          onChange={(showEquation) => update('ten-frame', { showEquation })}
        />
      </div>
    )
  }

  if (game === 'number-line') {
    const s = settings['number-line']
    return (
      <div className="controls">
        <Field label="Number line">
          <Choice
            value={s.range}
            options={[
              { value: 5, label: '0 – 5' },
              { value: 10, label: '0 – 10' },
            ]}
            onChange={(range) => update('number-line', { range })}
          />
        </Field>
        <Field label="Direction">
          <Choice
            value={s.operation}
            options={[
              { value: '+' as const, label: 'Forward +' },
              { value: '-' as const, label: 'Back −' },
              { value: 'mixed' as const, label: 'Mixed' },
            ]}
            onChange={(operation) => update('number-line', { operation })}
          />
        </Field>
        <Field label="Jumps">
          <Choice
            value={s.amount}
            options={numbers(1, 4)}
            onChange={(amount) => update('number-line', { amount })}
          />
        </Field>
        <Field label="Starting number">
          <Choice
            value={s.start}
            options={numbers(0, s.range)}
            onChange={(start) => update('number-line', { start })}
          />
        </Field>
        <Field label="Traveller">
          <Choice
            value={s.character}
            options={(Object.keys(CHARACTER_NAMES) as CharacterId[]).map(
              (id) => ({ value: id, label: CHARACTER_NAMES[id] }),
            )}
            onChange={(character) => update('number-line', { character })}
          />
        </Field>
        <Toggle
          label="Random starting number"
          checked={s.randomStart}
          onChange={(randomStart) => update('number-line', { randomStart })}
        />
        <Toggle
          label="Predict first"
          checked={s.predict}
          onChange={(predict) => update('number-line', { predict })}
        />
        <Toggle
          label="Show the equation after success"
          checked={s.showEquation}
          onChange={(showEquation) => update('number-line', { showEquation })}
        />
      </div>
    )
  }

  /* --- Feelings & Focus --------------------------------------------- */

  if (game === 'feeling-thermometer') {
    const s = settings['feeling-thermometer']
    return (
      <div className="controls">
        <Field label="Who are we asking about?">
          <Choice
            value={s.mode}
            options={[
              { value: 'me' as const, label: 'Me' },
              { value: 'character' as const, label: 'A character' },
            ]}
            onChange={(mode) => update('feeling-thermometer', { mode })}
          />
        </Field>
        <Hint>
          Character mode lets a child think about feelings without having to
          talk about their own.
        </Hint>
        <Field label="Feeling words">
          <Choice
            value={s.vocabulary}
            options={[
              { value: 'starter' as const, label: 'Six words' },
              { value: 'wider' as const, label: 'Full list' },
            ]}
            onChange={(vocabulary) =>
              update('feeling-thermometer', { vocabulary })
            }
          />
        </Field>
        <Toggle
          label="Ask where they notice it (Body Detective)"
          checked={s.askBody}
          onChange={(askBody) => update('feeling-thermometer', { askBody })}
        />
        <Toggle
          label="Ask what their body needs next"
          checked={s.askStrategy}
          onChange={(askStrategy) =>
            update('feeling-thermometer', { askStrategy })
          }
        />
      </div>
    )
  }

  if (game === 'opposite-game') {
    const s = settings['opposite-game']
    return (
      <div className="controls">
        <Field label="How the child answers">
          <Choice
            value={s.mode}
            options={[
              { value: 'observed' as const, label: 'With their body' },
              { value: 'screen' as const, label: 'By tapping' },
            ]}
            onChange={(mode) => update('opposite-game', { mode })}
          />
        </Field>
        <Hint>
          With their body, you mark what you see on the video call. There is no
          camera tracking anywhere in this app.
        </Hint>
        <Field label="Level">
          <Choice
            value={s.level}
            options={[
              { value: 1, label: '1 rule' },
              { value: 2, label: '2 rules' },
              { value: 3, label: '3 rules' },
              { value: 4, label: '+ switch' },
              { value: 5, label: 'Keep moving' },
            ]}
            onChange={(level) => update('opposite-game', { level })}
          />
        </Field>
      </div>
    )
  }

  if (game === 'mirror-faces') {
    const s = settings['mirror-faces']
    return (
      <div className="controls">
        <Field label="Mode">
          <Choice
            value={s.mode}
            options={[
              { value: 'child-face' as const, label: 'They make it' },
              { value: 'guess' as const, label: 'Guess the character' },
              { value: 'silly' as const, label: 'Florie gets it wrong' },
            ]}
            onChange={(mode) => update('mirror-faces', { mode })}
          />
        </Field>
        <Toggle
          label="Ask which clue they used"
          checked={s.askClue}
          onChange={(askClue) => update('mirror-faces', { askClue })}
        />
        <Toggle
          label="Include faces that could mean several things"
          checked={s.includeAmbiguous}
          onChange={(includeAmbiguous) =>
            update('mirror-faces', { includeAmbiguous })
          }
        />
        <Hint>
          The ambiguous faces are the useful ones — “we need more clues” is a
          good place to land.
        </Hint>
      </div>
    )
  }

  if (game === 'scavenger-hunt') {
    const s = settings['scavenger-hunt']
    return (
      <div className="controls">
        <Toggle
          label="Ask what makes them think that"
          checked={s.askWhy}
          onChange={(askWhy) => update('scavenger-hunt', { askWhy })}
        />
        <Toggle
          label="Ask what could happen next"
          checked={s.askNext}
          onChange={(askNext) => update('scavenger-hunt', { askNext })}
        />
        <Toggle
          label="Ask about someone else in the scene"
          checked={s.askOther}
          onChange={(askOther) => update('scavenger-hunt', { askOther })}
        />
        <Hint>
          Every scene has more than one reasonable answer. Whoever they pick is
          worth talking about.
        </Hint>
      </div>
    )
  }

  if (game === 'rock-buddy') {
    const s = settings['rock-buddy']
    return (
      <div className="controls">
        <Field label="How many breaths">
          <Choice
            value={s.breaths}
            options={[
              { value: 3, label: '3' },
              { value: 5, label: '5' },
            ]}
            onChange={(breaths) => update('rock-buddy', { breaths })}
          />
        </Field>
        <Field label="Pace">
          <Choice
            value={s.pace}
            options={[
              { value: 'slow' as const, label: 'Slow' },
              { value: 'slower' as const, label: 'Slower' },
            ]}
            onChange={(pace) => update('rock-buddy', { pace })}
          />
        </Field>
        <Field label="Position">
          <Choice
            value={s.position}
            options={[
              { value: 'sit' as const, label: 'Sitting' },
              { value: 'lie' as const, label: 'Lying down' },
            ]}
            onChange={(position) => update('rock-buddy', { position })}
          />
        </Field>
        <Toggle
          label="Ask what they noticed afterwards"
          checked={s.askReflection}
          onChange={(askReflection) => update('rock-buddy', { askReflection })}
        />
        <Hint>
          No score and no “perfect breath”. Three breaths is a whole activity.
        </Hint>
      </div>
    )
  }


  /* --- Reading Adventures -------------------------------------------- */

  if (game === 'robot-translator') {
    const s = settings['robot-translator']
    return (
      <div className="controls">
        <Field label="How the child answers">
          <Choice
            value={s.mode}
            options={[
              { value: 'picture' as const, label: 'Tap a picture' },
              { value: 'say-it' as const, label: 'Say it aloud' },
              { value: 'child-robot' as const, label: 'Child is the robot' },
            ]}
            onChange={(mode) => update('robot-translator', { mode })}
          />
        </Field>
        <Hint>
          Picture mode shows no letters at all, which is what keeps this a
          pure listening activity.
        </Hint>
        <Field label="Level">
          <Choice
            value={s.level}
            options={[
              { value: 1, label: 'Two sounds' },
              { value: 2, label: 'Three sounds' },
              { value: 3, label: 'Shorter gaps' },
            ]}
            onChange={(level) => update('robot-translator', { level })}
          />
        </Field>
      </div>
    )
  }

  if (game === 'sound-safari') {
    const s = settings['sound-safari']
    return (
      <div className="controls">
        <Field label="Where do we hunt?">
          <Choice
            value={s.mode}
            options={[
              { value: 'digital' as const, label: 'On screen' },
              { value: 'room' as const, label: 'Their own room' },
            ]}
            onChange={(mode) => update('sound-safari', { mode })}
          />
        </Field>
        <Hint>
          Say the SOUND, not the letter name — /s/, never &ldquo;ess&rdquo;.
        </Hint>
      </div>
    )
  }

  if (game === 'skywriter') {
    const s = settings['skywriter']
    return (
      <div className="controls">
        <Field label="Mode">
          <Choice
            value={s.mode}
            options={[
              { value: 'trace' as const, label: 'Trace on screen' },
              { value: 'air' as const, label: 'Draw in the air' },
              { value: 'quick-sound' as const, label: 'Quick sound' },
            ]}
            onChange={(mode) => update('skywriter', { mode })}
          />
        </Field>
        <Toggle
          label="Show the letter to copy"
          checked={s.showLetter}
          onChange={(showLetter) => update('skywriter', { showLetter })}
        />
        <Hint>
          Tracing is exploration, not handwriting. Nothing is scored and no
          camera is used.
        </Hint>
      </div>
    )
  }

  if (game === 'sound-box-factory') {
    const s = settings['sound-box-factory']
    return (
      <div className="controls">
        <Toggle
          label="Count the sounds with counters first"
          checked={s.countersFirst}
          onChange={(countersFirst) =>
            update('sound-box-factory', { countersFirst })
          }
        />
        <Toggle
          label="Show a picture of the word"
          checked={s.showPicture}
          onChange={(showPicture) =>
            update('sound-box-factory', { showPicture })
          }
        />
        <Hint>
          Sounds first, letters second. The picture supports meaning — the
          child still has to hear each sound.
        </Hint>
      </div>
    )
  }

  if (game === 'monster-lab') {
    const s = settings['monster-lab']
    return (
      <div className="controls">
        <Field label="Mode">
          <Choice
            value={s.mode}
            options={[
              { value: 'read' as const, label: 'Child reads it' },
              { value: 'build' as const, label: 'Child invents it' },
            ]}
            onChange={(mode) => update('monster-lab', { mode })}
          />
        </Field>
        <Hint>
          Made-up names cannot be recalled from memory, so this is the
          truest check of real decoding. Only enabled sounds are ever used.
        </Hint>
      </div>
    )
  }

  if (game === 'digraph-detectives') {
    const s = settings['digraph-detectives']
    return (
      <div className="controls">
        <Field label="Mode">
          <Choice
            value={s.mode}
            options={[
              { value: 'build' as const, label: 'Build the pair' },
              { value: 'sort' as const, label: 'Sort the words' },
              { value: 'count' as const, label: 'How many sounds' },
            ]}
            onChange={(mode) => update('digraph-detectives', { mode })}
          />
        </Field>
        <Hint>Needs sh, ch or th switched on in Sounds we know.</Hint>
      </div>
    )
  }

  if (game === 'blend-train') {
    const s = settings['blend-train']
    return (
      <div className="controls">
        <Field label="Mode">
          <Choice
            value={s.mode}
            options={[
              { value: 'build' as const, label: 'Build the train' },
              { value: 'missing' as const, label: 'Missing carriage' },
              { value: 'sort' as const, label: 'Blend or team?' },
            ]}
            onChange={(mode) => update('blend-train', { mode })}
          />
        </Field>
        <Hint>
          stop gets four carriages, shop gets three. That contrast is the
          whole lesson.
        </Hint>
      </div>
    )
  }

  if (game === 'magic-e-wizard') {
    const s = settings['magic-e-wizard']
    return (
      <div className="controls">
        <Field label="Mode">
          <Choice
            value={s.mode}
            options={[
              { value: 'cast' as const, label: 'Cast the spell' },
              { value: 'break' as const, label: 'Break the spell' },
              { value: 'which' as const, label: 'Which word?' },
            ]}
            onChange={(mode) => update('magic-e-wizard', { mode })}
          />
        </Field>
        <Hint>Ask for both words aloud — hop and hope.</Hint>
      </div>
    )
  }

  if (game === 'tricky-treasure') {
    const s = settings['tricky-treasure']
    return (
      <div className="controls">
        <Field label="Mode">
          <Choice
            value={s.mode}
            options={[
              { value: 'find' as const, label: 'Find the word' },
              { value: 'flash' as const, label: 'Flash treasure' },
              { value: 'sentence' as const, label: 'Missing word' },
            ]}
            onChange={(mode) => update('tricky-treasure', { mode })}
          />
        </Field>
        {s.mode === 'flash' && (
          <Field label="Flash for">
            <Choice
              value={s.flashDuration}
              options={[1600, 1200, 900, 700].map((v) => ({
                value: v,
                label: `${v}ms`,
              }))}
              onChange={(flashDuration) =>
                update('tricky-treasure', { flashDuration })
              }
            />
          </Field>
        )}
        <Hint>
          Choose the active words in Sounds we know. These are learned by
          sight, not sounded out.
        </Hint>
      </div>
    )
  }

  if (game === 'word-ladder') {
    const s = settings['word-ladder']
    return (
      <div className="controls">
        <Field label="Climbing to">
          <Choice
            value={s.target}
            options={[
              { value: 'treehouse' as const, label: 'Treehouse' },
              { value: 'moon' as const, label: 'Moon' },
              { value: 'castle' as const, label: 'Castle' },
              { value: 'cupcake' as const, label: 'Cupcake' },
            ]}
            onChange={(target) => update('word-ladder', { target })}
          />
        </Field>
        <Hint>
          Ladders are curated so exactly one sound changes per rung, and
          only ladders your sound set supports are offered.
        </Hint>
      </div>
    )
  }

  if (game === 'story-quest') {
    const s = settings['story-quest']
    return (
      <div className="controls">
        <Field label="Who reads?">
          <Choice
            value={s.readingMode}
            options={[
              { value: 'together' as const, label: 'Together' },
              { value: 'turns' as const, label: 'Take turns' },
              { value: 'child' as const, label: 'Child reads' },
            ]}
            onChange={(readingMode) => update('story-quest', { readingMode })}
          />
        </Field>
        <Hint>
          Only stories that are fully decodable with your current sounds and
          active tricky words are offered.
        </Hint>
      </div>
    )
  }

  const s = settings['freeze-dance']
  return (
    <div className="controls">
      <Field label="Mode">
        <Choice
          value={s.mode}
          options={[
            { value: 'classic' as const, label: 'Classic' },
            { value: 'silly' as const, label: 'Silly freeze' },
            { value: 'tempo' as const, label: 'Fast / slow' },
            { value: 'emotion' as const, label: 'Emotion freeze' },
            { value: 'opposite' as const, label: 'Opposite freeze' },
          ]}
          onChange={(mode) => update('freeze-dance', { mode })}
        />
      </Field>
      <Hint>
        You press DANCE and FREEZE yourself from the live panel, so your own
        music works fine — nothing is bundled or streamed.
      </Hint>
    </div>
  )
}
