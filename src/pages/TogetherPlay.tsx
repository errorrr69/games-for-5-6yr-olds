import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { GameStage } from '../games'
import { createRound, easier, harder, replayRound, uid } from '../core/gameLogic'
import { DEFAULT_PHONICS } from '../core/phonics'
import { summarise } from '../core/summary'
import {
  DEFAULT_SETTINGS,
  GAME_IDS,
  GAME_NAMES,
  type Cue,
  type GameId,
  type ObjectiveResponse,
  type ObservationalResponse,
  type Response,
  type Round,
  type Settings,
} from '../core/types'
import type { AnswerOptions, ObservationInput } from '../games/shared'
import { postToMomzo, type RoundResult } from '../lib/bridge'

/**
 * How a finished round went.
 *
 * The bucket is a property of the ROUND, not of any single answer: it depends on
 * whether the child got there and on which attempt. So it can only be known once
 * the round closes — which is why `round_result` fires on close, not on answer.
 *
 * Same derivation as summary.ts, deliberately: Momzo's dashboard and Florie's
 * session panel must never disagree about what "got it first time" means.
 *
 * Returns null for a round with no right answer — most of Feelings & Focus —
 * because bucketing an observation would be marking it.
 */
export function bucketFor(
  responses: Response[],
  roundId: string,
): { bucket: RoundResult['bucket']; responseTimeMs?: number } | null {
  const mine = responses.filter(
    (r): r is ObjectiveResponse => r.roundId === roundId && r.outcome === 'objective',
  )
  if (mine.length === 0) return null
  const solved = mine.find((r) => r.correct)
  return {
    bucket: !solved ? 'stillExploring' : solved.attempt === 1 ? 'firstTime' : 'anotherLook',
    responseTimeMs: (solved ?? mine[mine.length - 1]).responseTimeMs,
  }
}

/**
 * Together mode — one game, one phone, a grown-up and a child in the same room.
 *
 * This route is a LOCAL TEACHER. Everything a live lesson gets from a second
 * device, it gets from the control strip instead: the grown-up decides when to
 * replay, ease off, push on, or move to something new.
 *
 * The software never advances the child on its own. That is `mastery.ts`'s rule
 * with the parent in the teacher's seat, and it is why there is no auto-next and
 * no timer here.
 *
 * No Supabase, no network, no session. The only thing that leaves is telemetry
 * on the Momzo bridge, and only when a host is present.
 */
export function TogetherPlay() {
  const { gameId } = useParams()
  const game = GAME_IDS.includes(gameId as GameId) ? (gameId as GameId) : null

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [round, setRound] = useState<Round | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  /** Freeze Dance has no cue in together mode, so the grown-up calls the switch. */
  const [dancing, setDancing] = useState(true)
  /** A reading game returns null when the enabled sounds cannot support it. */
  const [unsupported, setUnsupported] = useState(false)

  const startedAt = useRef(Date.now())
  // Read inside cleanup, which must not re-run when they change.
  const latest = useRef({ responses, game })
  latest.current = { responses, game }

  /* --- Round lifecycle ------------------------------------------------ */

  const build = useCallback(
    (g: GameId, s: Settings, previous?: Round) => {
      const next = createRound(g, s, previous, DEFAULT_PHONICS)
      if (!next) {
        setUnsupported(true)
        return
      }
      setUnsupported(false)
      setRound(next)
    },
    [],
  )

  useEffect(() => {
    if (!game) return
    startedAt.current = Date.now()
    postToMomzo({ event: 'game_ready', game })
    build(game, DEFAULT_SETTINGS)
  }, [game, build])

  /** Close the open round and report how it went. */
  const closeRound = useCallback((closing: Round | null, all: Response[]) => {
    if (!closing || !latest.current.game) return
    const result = bucketFor(all, closing.id)
    if (!result) return // observational round — nothing to bucket
    postToMomzo({ event: 'round_result', game: latest.current.game, ...result })
  }, [])

  /** The rollup Momzo stores. Safe to call at any moment: summarise() is pure. */
  const sendSummary = useCallback(() => {
    const { responses: all, game: g } = latest.current
    if (!g) return
    const summary = summarise(all).find((s) => s.game === g)
    postToMomzo({
      event: 'session_summary',
      game: g,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      rounds: summary?.rounds ?? 0,
      firstTime: summary?.firstTime ?? 0,
      anotherLook: summary?.anotherLook ?? 0,
      stillExploring: summary?.stillExploring ?? 0,
      notes: summary?.notes ?? [],
    })
  }, [])

  /**
   * Keep the host's rollup CURRENT rather than sending it once on the way out.
   *
   * The way out is not a reliable moment. Momzo hosts this in a WebView and
   * closing the game destroys that WebView outright — React never unmounts, the
   * JS context simply stops, and an unmount-only summary is never sent. The host
   * then stores a session with a duration and no content, which is precisely what
   * shipped: 83 seconds of play, two solved rounds, `completed: false`.
   *
   * Re-sending after every answer removes the dependency on that moment entirely.
   * Whenever the WebView dies, the host is already holding an accurate rollup, and
   * it costs a handful of small messages per session. The host keeps the last one
   * it saw.
   *
   * This stays strictly one-way (rule 1): the host still never calls into the game.
   */
  useEffect(() => {
    if (!game || responses.length === 0) return
    sendSummary()
  }, [game, responses, sendSummary])

  /** Still sent on a clean unmount — the plain-browser and route-change case. */
  useEffect(() => {
    return () => sendSummary()
  }, [sendSummary])

  /* --- What the grown-up can do --------------------------------------- */

  const again = () => round && setRound(replayRound(round))

  const step = (direction: 'easier' | 'harder') => {
    if (!game || !round) return
    const next = (direction === 'easier' ? easier : harder)(game, settings)
    setSettings(next)
    closeRound(round, responses)
    build(game, next, round)
  }

  const nextRound = () => {
    if (!game || !round) return
    closeRound(round, responses)
    build(game, settings, round)
  }

  /* --- What the child does -------------------------------------------- */

  const nextAttempt = (roundId: string) =>
    responses.filter((r) => r.roundId === roundId).length + 1

  const onAnswer = (answer: number, options?: AnswerOptions) => {
    if (!round || round.expected === undefined) return
    const correct = options?.correct ?? answer === round.expected
    const response: ObjectiveResponse = {
      id: uid(),
      roundId: round.id,
      game: round.game,
      outcome: 'objective',
      answer,
      expected: round.expected,
      correct,
      attempt: nextAttempt(round.id),
      responseTimeMs: options?.responseTimeMs,
      kind: options?.kind,
      label: options?.label ?? (correct ? `${answer} ✓` : `${answer} → ${round.expected}`),
      at: Date.now(),
    }
    setResponses((prev) => [...prev, response])
  }

  const onObserve = (input: ObservationInput) => {
    if (!round) return
    const labels = input.choices.map((c) => c.label)
    const response: ObservationalResponse = {
      id: uid(),
      roundId: round.id,
      game: round.game,
      outcome: 'observational',
      field: input.field,
      choices: input.choices.map((c) => c.id),
      choiceLabels: labels,
      level: input.level,
      possible: input.possible,
      attempt: nextAttempt(round.id),
      label: input.label ?? labels.join(', '),
      at: Date.now(),
    }
    setResponses((prev) => [...prev, response])
  }

  /* --- Freeze Dance: the grown-up is the music ------------------------- */

  const freezeCue: Cue | undefined = useMemo(() => {
    if (game !== 'freeze-dance' || !round) return undefined
    return {
      id: `${round.id}-${dancing ? 'dance' : 'freeze'}`,
      roundId: round.id,
      kind: 'freeze',
      headline: dancing ? 'DANCE!' : 'FREEZE!',
      state: dancing ? 'dance' : 'freeze',
      sentAt: Date.now(),
    }
  }, [game, round, dancing])

  /* --- Render ---------------------------------------------------------- */

  if (!game) {
    return (
      <div className="stage">
        <h1>That game isn’t here</h1>
        <p className="feedback">Pick another one and we’ll play.</p>
      </div>
    )
  }

  return (
    <div className="together-play">
      {unsupported ? (
        <div className="stage">
          <h1>{GAME_NAMES[game]}</h1>
          <p className="feedback">
            This one needs a few more sounds switched on before we can play it.
          </p>
        </div>
      ) : round ? (
        <GameStage
          round={round}
          nickname=""
          cue={freezeCue}
          // No driver: the grown-up is in the room, so the copy names nobody.
          driver={undefined}
          discoveries={{}}
          onAnswer={onAnswer}
          onObserve={onObserve}
          onInteraction={() => undefined}
          onBond={() => undefined}
          onRoundChange={setRound}
        />
      ) : null}

      {/*
        The grown-up's strip. Deliberately theirs, not the child's: nothing here
        advances on its own, and there is no score anywhere on the screen.
      */}
      <div className="parent-strip" role="group" aria-label="Grown-up controls">
        {game === 'freeze-dance' && (
          <button
            type="button"
            className="parent-button parent-button-primary"
            onClick={() => setDancing((d) => !d)}
          >
            {dancing ? 'Freeze!' : 'Dance!'}
          </button>
        )}
        <button type="button" className="parent-button" onClick={again} disabled={!round}>
          Again
        </button>
        <button
          type="button"
          className="parent-button"
          onClick={() => step('easier')}
          disabled={!round}
        >
          Easier
        </button>
        <button
          type="button"
          className="parent-button"
          onClick={() => step('harder')}
          disabled={!round}
        >
          Harder
        </button>
        <button
          type="button"
          className="parent-button parent-button-next"
          onClick={nextRound}
          disabled={!round}
        >
          Next
          {/* Hidden from the accessible name, which stays plain "Next". */}
          <span className="go-arrow" aria-hidden="true">
            →
          </span>
        </button>
      </div>
    </div>
  )
}
