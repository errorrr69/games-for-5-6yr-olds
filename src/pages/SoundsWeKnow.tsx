import {
  GRAPHEMES,
  TRICKY_WORDS,
  decodableWords,
  graphemesUpTo,
  makePseudoword,
  storiesFor,
  type PhonicsConfig,
  type ReadingStage,
} from '../core/phonics'
import { STAGE_NAMES } from '../core/phonics'
import {
  STATUS_LABELS,
  evidenceFor,
  formatDay,
  recordEvidence,
  statusOf,
  today,
} from '../core/mastery'
import { useState } from 'react'

/**
 * "Sounds We Know" — the teacher's record of what has been taught.
 *
 * This is the gate for the whole Reading category. Nothing anywhere may
 * hand a child a grapheme that is switched off here (spec §20).
 */
export function SoundsWeKnow({
  phonics,
  onChange,
  learner,
}: {
  phonics: PhonicsConfig
  onChange: (next: PhonicsConfig) => void
  learner?: string
}) {
  const [evidence, setEvidence] = useState(() =>
    learner ? evidenceFor(learner, phonics.focus) : { stage: phonics.focus, days: [] },
  )
  const sets = [...new Set(GRAPHEMES.map((g) => g.set))].sort((a, b) => a - b)

  const toggle = (id: string) =>
    onChange({
      ...phonics,
      enabled: phonics.enabled.includes(id)
        ? phonics.enabled.filter((g) => g !== id)
        : [...phonics.enabled, id],
    })

  const toggleTricky = (word: string) =>
    onChange({
      ...phonics,
      trickyActive: phonics.trickyActive.includes(word)
        ? phonics.trickyActive.filter((w) => w !== word)
        : [...phonics.trickyActive, word],
    })

  const wordCount = decodableWords(phonics.enabled).length
  const storyCount = storiesFor(phonics).length
  const canMakeNames = makePseudoword(phonics.enabled) !== null

  return (
    <section className="card sounds-panel">
      <header className="panel-head">
        <span className="panel-step">A</span>
        <h2>Sounds we know</h2>
      </header>

      <p className="control-hint">
        Every reading game is limited to these. A child is never shown a
        grapheme that is switched off here.
      </p>

      {sets.map((set) => (
        <div key={set} className="sound-set">
          <div className="sound-set-head">
            <span className="field-label">Set {set}</span>
            <button
              type="button"
              className="button-link"
              onClick={() =>
                onChange({ ...phonics, enabled: graphemesUpTo(set) })
              }
            >
              Up to here
            </button>
          </div>
          <div className="sound-chips">
            {GRAPHEMES.filter((g) => g.set === set).map((g) => (
              <button
                key={g.id}
                type="button"
                className="sound-chip"
                aria-pressed={phonics.enabled.includes(g.id)}
                title={g.note ?? `${g.grapheme} says ${g.phoneme}`}
                onClick={() => toggle(g.id)}
              >
                <strong>{g.grapheme}</strong>
                <small>{g.phoneme}</small>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="field">
        <span className="field-label">
          Active tricky words ({phonics.trickyActive.length})
        </span>
        <p className="control-hint">
          Taught separately, about five at a time. These are never put
          through sound boxes.
        </p>
        <div className="sound-chips">
          {TRICKY_WORDS.map((word) => (
            <button
              key={word}
              type="button"
              className="sound-chip is-word"
              aria-pressed={phonics.trickyActive.includes(word)}
              onClick={() => toggleTricky(word)}
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Current focus</span>
        <div className="segmented">
          {(Object.keys(STAGE_NAMES) as ReadingStage[]).map((stage) => (
            <button
              key={stage}
              type="button"
              className="segment"
              aria-pressed={phonics.focus === stage}
              onClick={() => {
                onChange({ ...phonics, focus: stage })
                if (learner) setEvidence(evidenceFor(learner, stage))
              }}
            >
              {stage}
            </button>
          ))}
        </div>
        <small className="control-hint">{STAGE_NAMES[phonics.focus]}</small>
      </div>

      {learner && (
        <div className="mastery">
          <span className="field-label">
            {phonics.focus} evidence for {learner}
          </span>
          <p className="control-hint">
            A milestone counts as secure only after two different days. You
            decide when to move on — the app never does it for you.
          </p>
          <p className={`mastery-status is-${statusOf(evidence)}`}>
            {STATUS_LABELS[statusOf(evidence)]}
          </p>
          {evidence.days.length > 0 && (
            <ul className="mastery-days">
              {evidence.days.map((day) => (
                <li key={day}>✓ {formatDay(day)}</li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="button-quiet"
            disabled={evidence.days.includes(today())}
            onClick={() => {
              const record = recordEvidence(learner, phonics.focus)
              setEvidence(evidenceFor(learner, phonics.focus, record))
            }}
          >
            {evidence.days.includes(today())
              ? 'Recorded for today'
              : `Showed ${phonics.focus} today`}
          </button>
        </div>
      )}

      {/* Tells the teacher immediately what these sounds can support. */}
      <dl className="sound-stats">
        <div>
          <dt>Words available</dt>
          <dd>{wordCount}</dd>
        </div>
        <div>
          <dt>Stories readable</dt>
          <dd>{storyCount}</dd>
        </div>
        <div>
          <dt>Monster names</dt>
          <dd>{canMakeNames ? 'yes' : 'not yet'}</dd>
        </div>
      </dl>
    </section>
  )
}
