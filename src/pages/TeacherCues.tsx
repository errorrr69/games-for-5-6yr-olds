import { useState } from 'react'
import {
  FACE_REQUESTS,
  FREEZE_EMOTIONS,
  SILLY_GUESSES,
  SILLY_POSES,
  switchRule,
} from '../core/feelings'
import { GAME_CATEGORY } from '../core/types'
import { clueFor, soundOut } from '../core/readingLogic'
import { uid } from '../core/gameLogic'
import type {
  Cue,
  MarkedResponse,
  Round,
  TeacherMark,
} from '../core/types'

const pickFrom = <T,>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)]

export type CueSender = {
  send: (cue: Omit<Cue, 'id' | 'roundId' | 'sentAt'>) => void
  mark: (mark: TeacherMark, label: string) => void
  replaceRound: (round: Round) => void
}

export function buildCue(
  roundId: string,
  cue: Omit<Cue, 'id' | 'roundId' | 'sentAt'>,
): Cue {
  return { ...cue, id: uid(), roundId, sentAt: Date.now() }
}

export function buildMark(
  round: Round,
  mark: TeacherMark,
  label: string,
  attempt: number,
  cueId?: string,
): MarkedResponse {
  return {
    id: uid(),
    roundId: round.id,
    game: round.game,
    outcome: 'marked',
    mark,
    cueId,
    attempt,
    label,
    at: Date.now(),
  }
}

/**
 * The live controls a teacher uses *inside* an open round: call out an
 * instruction, mark what they saw on the video call, flip a rule.
 *
 * Marks are observations, never grades, and are never sent to the child's
 * screen (feelings spec §7, §11, §14).
 */
export function TeacherCues({
  round,
  cue,
  sender,
}: {
  round: Round
  cue?: Cue
  sender: CueSender
}) {
  const [lastCommand, setLastCommand] = useState<string | null>(null)

  if (round.game === 'opposite-game') {
    return (
      <div className="cue-panel">
        <p className="cue-title">Call out an instruction</p>
        <div className="cue-row">
          {round.pairs.map((pair) => (
            <button
              key={pair.id}
              type="button"
              className="cue-button"
              onClick={() => {
                setLastCommand(pair.command.label)
                sender.send({
                  kind: 'opposite',
                  headline: pair.command.label,
                  detail:
                    round.mode === 'screen' ? 'Tap the opposite!' : undefined,
                  expect: pair.opposite.id,
                })
              }}
            >
              {pair.command.label}
            </button>
          ))}
        </div>

        {round.mode === 'observed' && (
          <>
            <p className="cue-title">
              What did you see? {lastCommand && <em>after “{lastCommand}”</em>}
            </p>
            <div className="cue-row">
              <button
                type="button"
                className="cue-button is-positive"
                disabled={!cue}
                onClick={() =>
                  sender.mark('got-it', `${cue?.headline ?? ''} — got it ✓`)
                }
              >
                Got it
              </button>
              <button
                type="button"
                className="cue-button"
                disabled={!cue}
                onClick={() =>
                  sender.mark(
                    'try-again',
                    `${cue?.headline ?? ''} — brakes wobbled`,
                  )
                }
              >
                Try again
              </button>
            </div>
          </>
        )}

        {round.allowRuleSwitch && (
          <>
            <p className="cue-title">Mental flexibility</p>
            <button
              type="button"
              className="button-quiet"
              onClick={() =>
                sender.replaceRound({
                  ...round,
                  pairs: switchRule(round.pairs),
                  shownAt: Date.now(),
                })
              }
            >
              ↻ Change the rule
            </button>
            <p className="cue-hint">
              Keeps the same command, changes what it means. Expect a wobble —
              that is the exercise.
            </p>
          </>
        )}
      </div>
    )
  }

  if (round.game === 'freeze-dance') {
    const detailFor = (state: 'dance' | 'freeze') => {
      if (state === 'dance') return undefined
      if (round.mode === 'silly') return `Freeze ${pickFrom(SILLY_POSES)}!`
      if (round.mode === 'emotion')
        return `Freeze with an ${pickFrom(FREEZE_EMOTIONS)} face!`
      return undefined
    }
    return (
      <div className="cue-panel">
        <p className="cue-title">Drive the music yourself</p>
        <div className="cue-row">
          <button
            type="button"
            className="cue-button is-big"
            onClick={() =>
              sender.send({
                kind: 'freeze',
                state: 'dance',
                headline: 'DANCE!',
                detail: round.mode === 'tempo' ? 'FAST!' : detailFor('dance'),
              })
            }
          >
            DANCE
          </button>
          <button
            type="button"
            className="cue-button is-big is-cold"
            onClick={() =>
              sender.send({
                kind: 'freeze',
                state: 'freeze',
                headline: 'FREEZE!',
                detail: detailFor('freeze'),
              })
            }
          >
            FREEZE
          </button>
        </div>

        {round.mode === 'tempo' && (
          <div className="cue-row">
            <button
              type="button"
              className="cue-button"
              onClick={() =>
                sender.send({
                  kind: 'freeze',
                  state: 'dance',
                  headline: 'SLOW DANCE…',
                  detail: 'nice and slow',
                })
              }
            >
              Slow dance
            </button>
          </div>
        )}

        <p className="cue-title">What did you see?</p>
        <div className="cue-row">
          <button
            type="button"
            className="cue-button is-positive"
            onClick={() => sender.mark('froze', 'Froze straight away')}
          >
            Froze straight away
          </button>
          <button
            type="button"
            className="cue-button"
            onClick={() => sender.mark('needed-cue', 'Needed another cue')}
          >
            Needed another cue
          </button>
        </div>
        <p className="cue-hint">
          Private to you. The child never sees these.
        </p>
      </div>
    )
  }

  if (round.game === 'mirror-faces') {
    if (round.mode === 'child-face') {
      return (
        <div className="cue-panel">
          <p className="cue-title">Ask for a face</p>
          <div className="cue-row is-wrap">
            {FACE_REQUESTS.map((face) => (
              <button
                key={face.id}
                type="button"
                className="cue-button"
                onClick={() =>
                  sender.send({
                    kind: 'face',
                    headline: face.label.toUpperCase(),
                  })
                }
              >
                {face.label}
              </button>
            ))}
          </div>
          <div className="cue-row">
            <button
              type="button"
              className="cue-button is-positive"
              disabled={!cue}
              onClick={() => sender.mark('got-it', `${cue?.headline} face ✓`)}
            >
              Got it!
            </button>
          </div>
          <p className="cue-hint">
            Then ask out loud: what did your eyebrows do? Your mouth?
          </p>
        </div>
      )
    }

    return (
      <div className="cue-panel">
        <p className="cue-title">Be wrong on purpose</p>
        <button
          type="button"
          className="cue-button"
          onClick={() =>
            sender.send({
              kind: 'silly-guess',
              headline: pickFrom(SILLY_GUESSES),
            })
          }
        >
          🤪 Silly guess
        </button>
        {cue?.kind === 'silly-guess' && (
          <p className="cue-say">
            Say out loud: “I think they look <strong>{cue.headline}</strong>.”
          </p>
        )}
        <p className="cue-hint">
          Let them correct you — being the expert is the point.
        </p>
        {round.possible.length > 0 && (
          <p className="cue-hint">
            Reasonable readings: {round.possible.join(', ')}. Not an answer key.
          </p>
        )}
      </div>
    )
  }

  if (round.game === 'feeling-thermometer') {
    return (
      <div className="cue-panel">
        <p className="cue-hint is-standout">
          Give them a few seconds. Thinking time is not dead air.
        </p>
        {round.scenario && (
          <p className="cue-say">
            Read aloud: “{round.scenario.who} {round.scenario.what}.”
          </p>
        )}
      </div>
    )
  }

  if (round.game === 'rock-buddy') {
    return (
      <div className="cue-panel">
        <p className="cue-hint is-standout">
          Breathe with them where they can see you.
        </p>
        <button
          type="button"
          className="cue-button is-positive"
          onClick={() => sender.mark('completed', 'Completed the breathing')}
        >
          Mark as done together
        </button>
      </div>
    )
  }


  /* --- Reading Adventures ------------------------------------------- */

  if (GAME_CATEGORY[round.game] === 'reading') {
    const clue = clueFor(round)

    /** What the teacher says out loud, which the child never sees. */
    const script = (() => {
      switch (round.game) {
        case 'robot-translator':
          return `Say: ${soundOut(round.word.graphemes)}  →  ${round.word.text}`
        case 'sound-safari':
          return `Use the sound ${round.phoneme}, not the letter name.`
        case 'skywriter':
          return `${round.grapheme} says ${round.phoneme}`
        case 'sound-box-factory':
          return `Say the word: "${round.word.text}"  (${soundOut(round.word.graphemes, ' ')})`
        case 'monster-lab':
          return round.name
            ? `It says ${round.name.text} — ${soundOut(round.name.graphemes, ' ')}. Wait before helping.`
            : null
        case 'blend-train':
          return round.word
            ? `Say the word: "${round.word.text}" (${round.word.graphemes.length} sounds)`
            : null
        case 'magic-e-wizard':
          return `${round.short} → ${round.long}. Ask for both aloud.`
        case 'tricky-treasure':
          return `Looking for "${round.target}". This one we just know.`
        case 'story-quest':
          return `Page ${round.page + 1}: "${round.pages[round.page]?.words.join(' ')}"`
        default:
          return null
      }
    })()

    const spoken =
      round.game === 'monster-lab' ||
      round.game === 'story-quest' ||
      round.game === 'robot-translator' ||
      round.game === 'magic-e-wizard'

    return (
      <div className="cue-panel">
        {script && <p className="cue-say">{script}</p>}

        <p className="cue-hint is-standout">
          Wait. Give them time to sound it through — about seven seconds
          before you offer anything.
        </p>

        {clue && (
          <>
            <p className="cue-title">Give a clue</p>
            <button
              type="button"
              className="cue-button"
              onClick={() =>
                sender.send({
                  kind: 'clue',
                  headline: clue.headline,
                  detail: clue.detail,
                })
              }
            >
              💡 {clue.headline}
            </button>
            <p className="cue-hint">
              A nudge, never the whole word. Ask for the first sound first.
            </p>
          </>
        )}

        {round.game === 'story-quest' && (
          <>
            <p className="cue-title">While they read</p>
            <div className="cue-row is-wrap">
              {round.pages[round.page]?.words.map((word, i) => (
                <button
                  key={`${word}-${i}`}
                  type="button"
                  className="cue-button is-word"
                  onClick={() =>
                    sender.replaceRound({
                      ...round,
                      helpWord: word.replace(/[^A-Za-z]/g, '').toLowerCase(),
                    })
                  }
                >
                  {word}
                </button>
              ))}
            </div>
            <p className="cue-hint">
              Tap a word to chunk it into sounds on their screen. It never
              shows them the answer.
            </p>
            <button
              type="button"
              className="cue-button"
              onClick={() =>
                sender.send({
                  kind: 'read-it-wrong',
                  headline: 'Read it wrong on purpose',
                  detail: 'Change one word and see if they catch you.',
                })
              }
            >
              🙃 Read it wrong
            </button>
          </>
        )}

        {spoken && (
          <>
            <p className="cue-title">What did you hear?</p>
            <div className="cue-row is-wrap">
              <button
                type="button"
                className="cue-button is-positive"
                onClick={() =>
                  sender.mark('read-independently', 'Read it independently ✓')
                }
              >
                Read independently
              </button>
              <button
                type="button"
                className="cue-button"
                onClick={() =>
                  sender.mark('sounded-with-help', 'Sounded through with help')
                }
              >
                Sounded with help
              </button>
              <button
                type="button"
                className="cue-button"
                onClick={() => sender.mark('needed-prompt', 'Needed a sound prompt')}
              >
                Needed a prompt
              </button>
              <button
                type="button"
                className="cue-button"
                onClick={() => sender.mark('guessed', 'Guessed rather than decoded')}
              >
                Guessed
              </button>
            </div>
            {round.game === 'story-quest' && (
              <div className="cue-row is-wrap">
                <button
                  type="button"
                  className="cue-button"
                  onClick={() => sender.mark('self-corrected', 'Self-corrected')}
                >
                  Self-corrected
                </button>
                <button
                  type="button"
                  className="cue-button"
                  onClick={() =>
                    sender.mark('teacher-supplied', 'I supplied the word')
                  }
                >
                  I gave the word
                </button>
                <button
                  type="button"
                  className="cue-button is-positive"
                  onClick={() =>
                    sender.mark('retold-independently', 'Retold it independently')
                  }
                >
                  Retold it
                </button>
                <button
                  type="button"
                  className="cue-button"
                  onClick={() =>
                    sender.mark('retold-with-prompts', 'Retold with prompts')
                  }
                >
                  Retold with prompts
                </button>
              </div>
            )}
            <p className="cue-hint">
              Private to you. Mark only what is worth remembering — you are
              teaching, not doing data entry.
            </p>
          </>
        )}
      </div>
    )
  }

  if (round.game === 'scavenger-hunt') {
    return (
      <div className="cue-panel">
        <p className="cue-hint is-standout">
          Ask “what makes you think that?” before moving on.
        </p>
      </div>
    )
  }

  return null
}
