import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Shell, Waiting } from '../components/common'
import { Monster } from '../components/Illustrations'
import { uid } from '../core/gameLogic'
import {
  GAME_NAMES,
  type Bond,
  type Interaction,
  type ObjectiveResponse,
  type ObservationalResponse,
  type Round,
} from '../core/types'
import { GameStage } from '../games'
import type { AnswerOptions, ObservationInput } from '../games/shared'
import { useSession } from '../realtime/useSession'

export function StudentSession() {
  const { sessionId } = useParams()
  const nickname = sessionId
    ? (sessionStorage.getItem(`florie:student:${sessionId}`) ?? '')
    : ''

  const { snapshot, peerState, emit, loading } = useSession(
    sessionId,
    'student',
    nickname || undefined,
  )

  const round = snapshot?.round
  const nextAttempt = useCallback(
    (roundId: string) =>
      (snapshot?.responses.filter((r) => r.roundId === roundId).length ?? 0) + 1,
    [snapshot?.responses],
  )

  const onAnswer = useCallback(
    (answer: number, options?: AnswerOptions) => {
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
      emit({ type: 'response:submitted', response })
    },
    [round, nextAttempt, emit],
  )

  /**
   * Feelings, body clues, strategies, character picks. Deliberately has no
   * `correct` field anywhere in its path (feelings spec §3).
   */
  const onObserve = useCallback(
    (input: ObservationInput) => {
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
      emit({ type: 'response:submitted', response })
    },
    [round, nextAttempt, emit],
  )

  const onInteraction = useCallback(
    (patch: Omit<Interaction, 'game' | 'roundId'>) => {
      if (!round) return
      emit({
        type: 'interaction:update',
        interaction: { ...patch, game: round.game, roundId: round.id },
      })
    },
    [round, emit],
  )

  const onBond = useCallback(
    (target: number, bond: Bond) => emit({ type: 'bond:discovered', target, bond }),
    [emit],
  )

  const onRoundChange = useCallback(
    (next: Round) => emit({ type: 'round:update', round: next }),
    [emit],
  )

  if (!nickname) {
    return (
      <Shell variant="student">
        <div className="card empty-card">
          <h1>This lesson needs a fresh link from Florie.</h1>
          <p>Ask Florie to send the join link again.</p>
        </div>
      </Shell>
    )
  }

  if (loading && !snapshot) {
    return (
      <Shell variant="student">
        <Waiting title="Getting your lesson ready…" />
      </Shell>
    )
  }

  if (snapshot?.status === 'ended') {
    return (
      <Shell variant="student">
        <section className="finished">
          <Monster mood="full" />
          <h1>Great playing today, {nickname}!</h1>
          <p>Your brain did some lovely thinking.</p>
        </section>
      </Shell>
    )
  }

  return (
    <Shell
      variant="student"
      aside={
        <p className="student-badge">
          <span>Hi, {nickname}!</span>
          <strong>
            {snapshot?.game ? GAME_NAMES[snapshot.game] : 'Getting ready…'}
          </strong>
        </p>
      }
    >
      {peerState === 'reconnecting' && (
        <p className="notice notice-gentle">Florie will be back in a moment…</p>
      )}

      {snapshot?.status === 'paused' ? (
        <Waiting title="Let’s take a little break." detail="Florie will start again soon." />
      ) : round && snapshot ? (
        <GameStage
          round={round}
          nickname={nickname}
          cue={snapshot.cue}
          // A live lesson has a teacher the child can name. Together mode leaves
          // this undefined, and the copy speaks to the grown-up in the room instead.
          driver="Florie"
          discoveries={snapshot.discoveries}
          onAnswer={onAnswer}
          onObserve={onObserve}
          onInteraction={onInteraction}
          onBond={onBond}
          onRoundChange={onRoundChange}
        />
      ) : (
        <Waiting
          title={
            snapshot?.game
              ? 'Florie is getting your game ready…'
              : 'Florie is choosing your first game…'
          }
          detail="You’re in exactly the right place."
        />
      )}
    </Shell>
  )
}
