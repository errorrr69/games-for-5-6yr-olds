import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ConnectionPill, GamePicker, Shell } from '../components/common'
import { Monster } from '../components/Illustrations'
import { COACHING } from '../core/feelings'
import { createRound, easier, harder, replayRound } from '../core/gameLogic'
import { formatDuration, summaryByCategory } from '../core/summary'
import {
  CATEGORY_NAMES,
  GAME_CATEGORY,
  GAME_NAMES,
  type GameId,
  type ReadingGameId,
  type Round,
  type Settings,
  type TeacherMark,
} from '../core/types'
import { useSession } from '../realtime/useSession'
import { readingBlocker } from '../core/readingLogic'
import { SoundsWeKnow } from './SoundsWeKnow'
import { TeacherControls } from './TeacherControls'
import { TeacherCues, buildCue, buildMark } from './TeacherCues'

/** Regulation activities reachable from inside any other game (spec §13). */
const QUICK_BREAKS: GameId[] = [
  'freeze-dance',
  'opposite-game',
  'rock-buddy',
  'feeling-thermometer',
]

export function TeacherSession() {
  const { sessionId } = useParams()
  const { snapshot, peerState, interaction, emit, patch, loading } = useSession(
    sessionId,
    'teacher',
  )
  const [now, setNow] = useState(() => Date.now())
  const [switching, setSwitching] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 20000)
    return () => clearInterval(timer)
  }, [])

  if (loading && !snapshot) {
    return (
      <Shell>
        <p className="notice">Opening your lesson…</p>
      </Shell>
    )
  }

  if (!snapshot) {
    return (
      <Shell>
        <div className="card empty-card">
          <h1>That lesson could not be found.</h1>
          <Link className="button-primary" to="/teacher">
            Back to the dashboard
          </Link>
        </div>
      </Shell>
    )
  }

  const joinUrl = `${location.origin}/join/${snapshot.code}`
  const latest = snapshot.responses.at(-1)
  const thisRound = snapshot.round
    ? snapshot.responses.filter((r) => r.roundId === snapshot.round!.id)
    : []

  const chooseGame = (game: GameId) => {
    setSwitching(false)
    emit({ type: 'game:selected', game, settings: snapshot.settings })
  }

  const startRound = (game = snapshot.game) => {
    if (!game) return
    const round = createRound(
      game,
      snapshot.settings,
      snapshot.round,
      snapshot.phonics,
    )
    // A reading game returns null when the enabled sounds cannot support
    // it. The panel explains what to turn on rather than guessing.
    if (!round) return
    emit({ type: 'round:start', round })
  }

  const adjust = (direction: 'easier' | 'harder') => {
    if (!snapshot.game) return
    emit({
      type: 'settings:updated',
      settings:
        direction === 'easier'
          ? easier(snapshot.game, snapshot.settings)
          : harder(snapshot.game, snapshot.settings),
    })
  }

  /**
   * Quick Break: set the current game aside — round and all — and drop
   * into a regulation activity without ending anything.
   */
  const quickBreak = (game: GameId) => {
    if (!snapshot.game) {
      chooseGame(game)
      startRound(game)
      return
    }
    emit({
      type: 'session:park',
      parked: { game: snapshot.game, round: snapshot.round },
      game,
      round: createRound(game, snapshot.settings, undefined, snapshot.phonics) ?? undefined,
    })
  }

  const sender = {
    send: (cue: Parameters<typeof buildCue>[1]) => {
      if (!snapshot.round) return
      emit({ type: 'cue:sent', cue: buildCue(snapshot.round.id, cue) })
    },
    mark: (mark: TeacherMark, label: string) => {
      if (!snapshot.round) return
      emit({
        type: 'teacher:marked',
        response: buildMark(
          snapshot.round,
          mark,
          label,
          thisRound.length + 1,
          snapshot.cue?.id,
        ),
      })
    },
    replaceRound: (round: Round) => emit({ type: 'round:start', round }),
  }

  /* ---------------------------------------------------------------- */

  if (snapshot.status === 'ended') {
    const groups = summaryByCategory(snapshot.responses)
    return (
      <Shell>
        <section className="summary">
          <Monster mood="full" className="summary-monster" />
          <p className="eyebrow">Lesson finished</p>
          <h1>{snapshot.nickname ?? 'Your learner'}</h1>
          <p className="lede">
            {formatDuration(snapshot.updatedAt - snapshot.startedAt)} together
          </p>

          {groups.length === 0 ? (
            <p className="notice">No rounds were played this time.</p>
          ) : (
            groups.map((group) => (
              <div key={group.category} className="summary-group">
                <h2 className="summary-category">
                  {CATEGORY_NAMES[group.category]}
                </h2>
                <ul className="summary-list">
                  {group.entries.map((entry) => (
                    <li key={entry.game} className="card">
                      <h3>{entry.name}</h3>
                      {entry.rounds > 0 && (
                        <ul>
                          <li>
                            {entry.rounds}{' '}
                            {entry.rounds === 1 ? 'round' : 'rounds'}
                          </li>
                          <li>{entry.firstTime} first-attempt correct</li>
                          <li>{entry.anotherLook} needed another look</li>
                          {entry.stillExploring > 0 && (
                            <li>{entry.stillExploring} still exploring</li>
                          )}
                        </ul>
                      )}
                      {(entry.gotIt > 0 || entry.neededAnother > 0) && (
                        <ul>
                          <li>{entry.gotIt} straight away</li>
                          <li>{entry.neededAnother} needed another cue</li>
                        </ul>
                      )}
                      {entry.notes.length > 0 && (
                        <ul className="summary-notes">
                          {entry.notes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}

          {snapshot.note && (
            <div className="card">
              <h2>Your private note</h2>
              <p>{snapshot.note}</p>
            </div>
          )}

          <p className="summary-disclaimer">
            Observations from one lesson — not a score, a ranking, or an
            assessment of any kind.
          </p>

          <Link className="button-primary" to="/teacher">
            Back to the dashboard
          </Link>
        </section>
      </Shell>
    )
  }

  const blocker =
    snapshot.game && GAME_CATEGORY[snapshot.game] === 'reading'
      ? readingBlocker(snapshot.game as ReadingGameId, snapshot.phonics)
      : null

  const coaching = snapshot.game ? COACHING[snapshot.game] : undefined
  const tip = coaching?.[Math.floor(now / 45000) % coaching.length]

  return (
    <Shell
      aside={
        <button
          type="button"
          className="button-quiet"
          onClick={() => emit({ type: 'session:end' })}
        >
          End session
        </button>
      }
    >
      <div className="teacher-bar card">
        <ConnectionPill state={peerState} name={snapshot.nickname} />
        <dl className="teacher-facts">
          <div>
            <dt>Session</dt>
            <dd>{formatDuration(now - snapshot.startedAt)}</dd>
          </div>
          <div>
            <dt>Current game</dt>
            <dd>{snapshot.game ? GAME_NAMES[snapshot.game] : 'Not chosen yet'}</dd>
          </div>
        </dl>
      </div>

      {peerState !== 'connected' && (
        <section className="card join-card">
          <div>
            <p className="eyebrow">Your lesson is ready</p>
            <p className="join-code">{snapshot.code}</p>
            <p className="join-url">{joinUrl}</p>
          </div>
          <button
            type="button"
            className="button-primary"
            onClick={() => {
              void navigator.clipboard?.writeText(joinUrl)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
          >
            {copied ? 'Copied ✓' : 'Copy child link'}
          </button>
        </section>
      )}

      {/* Quick Break — always one click away, from inside any game. */}
      <section className="card quick-break">
        {snapshot.parked ? (
          <>
            <p className="quick-break-title">
              {GAME_NAMES[snapshot.parked.game]} is paused and waiting
            </p>
            <button
              type="button"
              className="button-primary"
              onClick={() => emit({ type: 'session:unpark' })}
            >
              ← Return to {GAME_NAMES[snapshot.parked.game]}
            </button>
          </>
        ) : (
          <>
            <p className="quick-break-title">Quick break</p>
            <div className="quick-break-row">
              {QUICK_BREAKS.map((game) => (
                <button
                  key={game}
                  type="button"
                  className="button-quiet"
                  disabled={snapshot.game === game}
                  onClick={() => quickBreak(game)}
                >
                  {GAME_NAMES[game]}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="teacher-layout">
        <section className="card panel">
          <header className="panel-head">
            <span className="panel-step">1</span>
            <h2>
              {snapshot.game && !switching
                ? GAME_NAMES[snapshot.game]
                : 'Choose a game'}
            </h2>
            {snapshot.game && !switching && (
              <span className={`panel-tag tag-${GAME_CATEGORY[snapshot.game]}`}>
                {CATEGORY_NAMES[GAME_CATEGORY[snapshot.game]]}
              </span>
            )}
          </header>

          {!snapshot.game || switching ? (
            <>
              <GamePicker onPick={chooseGame} current={snapshot.game} />
              {switching && (
                <button
                  type="button"
                  className="button-link"
                  onClick={() => setSwitching(false)}
                >
                  Keep playing {GAME_NAMES[snapshot.game!]}
                </button>
              )}
            </>
          ) : (
            <>
              <TeacherControls
                game={snapshot.game}
                settings={snapshot.settings}
                onChange={(settings: Settings) =>
                  emit({ type: 'settings:updated', settings })
                }
              />

              {/* A reading game says plainly why it cannot run, rather
                  than reaching for a sound the child has not been taught. */}
              {blocker && <p className="notice">{blocker}</p>}

              <button
                type="button"
                className="button-primary button-wide"
                disabled={!!blocker}
                onClick={() => startRound()}
              >
                {snapshot.round ? 'Next one' : 'Start'}{' '}
                <span aria-hidden="true">→</span>
              </button>

              <div className="button-row">
                <button
                  type="button"
                  className="button-quiet"
                  disabled={!snapshot.round}
                  onClick={() =>
                    snapshot.round &&
                    emit({
                      type: 'round:repeat',
                      round: replayRound(snapshot.round),
                    })
                  }
                >
                  ↻ Show again
                </button>
                <button
                  type="button"
                  className="button-quiet"
                  onClick={() => adjust('easier')}
                >
                  Easier
                </button>
                <button
                  type="button"
                  className="button-quiet"
                  onClick={() => adjust('harder')}
                >
                  Harder
                </button>
              </div>

              <button
                type="button"
                className="button-link"
                onClick={() => setSwitching(true)}
              >
                Switch game
              </button>
            </>
          )}
        </section>

        <section className="card panel">
          <header className="panel-head">
            <span className="panel-step">2</span>
            <h2>Live learning</h2>
          </header>

          {!snapshot.round ? (
            <div className="empty-state">
              <p>Answers and actions appear here the moment they happen.</p>
            </div>
          ) : (
            <>
              <div className="current-question">
                <p className="label">Right now</p>
                <strong>{snapshot.round.prompt}</strong>
                {snapshot.round.expected !== undefined && (
                  <span>
                    Expected: {snapshot.round.expected}
                    {snapshot.round.game === 'flash-hide' &&
                      ` · ${snapshot.round.pattern.label} · ${snapshot.round.duration}ms`}
                  </span>
                )}
              </div>

              <TeacherCues
                round={snapshot.round}
                cue={snapshot.cue}
                sender={sender}
              />

              {interaction && interaction.roundId === snapshot.round.id && (
                <p className="interaction">{interaction.message}</p>
              )}

              {latest && latest.roundId === snapshot.round.id ? (
                <ResponseCard
                  nickname={snapshot.nickname ?? 'Your learner'}
                  response={latest}
                />
              ) : (
                <p className="waiting-line">Waiting…</p>
              )}

              <p className="attempt-line">
                {thisRound.length}{' '}
                {thisRound.length === 1 ? 'response' : 'responses'} this round
              </p>
            </>
          )}

          {tip && <p className="coaching-tip">{tip}</p>}

          <ul className="history">
            {snapshot.responses.slice(-8).map((response) => (
              <li
                key={response.id}
                className={
                  response.outcome === 'objective'
                    ? response.correct
                      ? 'is-correct'
                      : 'is-retry'
                    : response.outcome === 'marked'
                      ? response.mark === 'got-it' || response.mark === 'froze'
                        ? 'is-correct'
                        : 'is-retry'
                      : 'is-note'
                }
              >
                {response.label}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {snapshot.game && GAME_CATEGORY[snapshot.game] === 'reading' && (
        <SoundsWeKnow
          phonics={snapshot.phonics}
          learner={snapshot.nickname}
          onChange={(phonics) => emit({ type: 'phonics:updated', phonics })}
        />
      )}

      <label className="card note-card">
        <span className="label">Private lesson note</span>
        <textarea
          value={snapshot.note ?? ''}
          placeholder="What did you notice?"
          onChange={(e) => patch({ note: e.target.value })}
        />
        <small>Only you can see this. The child never does.</small>
      </label>
    </Shell>
  )
}

/**
 * One response, rendered honestly for what it is: a marked answer, an
 * observation, or something the teacher noted themselves.
 */
function ResponseCard({
  nickname,
  response,
}: {
  nickname: string
  response: import('../core/types').Response
}) {
  if (response.outcome === 'objective') {
    return (
      <div className={`answer ${response.correct ? 'is-correct' : ''}`}>
        <p className="label">
          {nickname}
          {response.kind === 'prediction' ? ' predicted' : ' answered'}
        </p>
        <strong>{response.answer}</strong>
        <p className="answer-meta">
          Expected {response.expected} · attempt {response.attempt}
          {response.responseTimeMs
            ? ` · ${(response.responseTimeMs / 1000).toFixed(1)}s`
            : ''}
        </p>
        <p className="answer-verdict">
          {response.kind === 'prediction'
            ? 'A prediction — not marked.'
            : response.correct
              ? 'That’s it ✓'
              : 'Let’s try that one again.'}
        </p>
      </div>
    )
  }

  if (response.outcome === 'marked') {
    return (
      <div className="answer is-marked">
        <p className="label">You noted</p>
        <strong className="mark-label">{response.label}</strong>
        <p className="answer-meta">Private observation</p>
      </div>
    )
  }

  return (
    <div className="answer is-observation">
      <p className="label">{nickname} chose</p>
      <strong className="observation-value">
        {response.choiceLabels.join(', ')}
      </strong>
      {response.level !== undefined && (
        <p className="answer-meta">Level {response.level} of 5</p>
      )}
      {response.possible && response.possible.length > 0 && (
        <p className="possible">
          <span className="label">Worth exploring</span>
          {response.possible.join(' · ')}
        </p>
      )}
      <p className="answer-verdict is-quiet">
        Not marked — this is theirs to explain.
      </p>
    </div>
  )
}
