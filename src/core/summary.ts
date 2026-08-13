import {
  CATEGORY_ORDER,
  GAME_CATEGORY,
  GAME_NAMES,
  type GameCategory,
  type GameId,
  type Response,
} from './types'

/**
 * Observations only — never a grade, a rank, a percentage, or a label for
 * the child (maths spec §24, feelings spec §14/§16).
 *
 * "Behaviour score: 72%" is exactly what this must never produce.
 */
export type GameSummary = {
  game: GameId
  name: string
  category: GameCategory
  /** Questions with a right answer. */
  rounds: number
  firstTime: number
  anotherLook: number
  stillExploring: number
  /** Things the child noticed or chose, in their own words. */
  notes: string[]
  /** What the teacher observed off-screen. */
  gotIt: number
  neededAnother: number
}

const NOTE_INTROS: Partial<Record<string, string>> = {
  intensity: 'Placed the feeling at',
  emotion: 'Named',
  'body-clue': 'Noticed',
  strategy: 'Chose',
  'face-emotion': 'Read the face as',
  'face-clue': 'Used the clue',
  character: 'Picked out',
  reason: 'Because of',
  'next-step': 'Suggested',
  'other-view': 'For the other person, said',
  reflection: 'Afterwards said',
  protest: 'Corrected the teacher on',
  breathing: 'Completed breaths:',
}

/** Marks meaning the child did it on their own. */
const INDEPENDENT = new Set([
  'got-it',
  'froze',
  'read-independently',
  'self-corrected',
  'retold-independently',
])

/** Marks meaning they got there, but with a hand. Never a failure. */
const WITH_SUPPORT = new Set([
  'try-again',
  'needed-cue',
  'sounded-with-help',
  'needed-prompt',
  'guessed',
  'teacher-supplied',
  'retold-with-prompts',
])

export function summarise(responses: Response[]): GameSummary[] {
  const byGame = new Map<GameId, Response[]>()
  for (const response of responses) {
    byGame.set(response.game, [...(byGame.get(response.game) ?? []), response])
  }

  return [...byGame.entries()].map(([game, all]) => {
    const objective = new Map<string, Response[]>()
    const notes: string[] = []
    let gotIt = 0
    let neededAnother = 0

    for (const response of all) {
      if (response.outcome === 'objective') {
        if (response.kind === 'prediction') continue
        objective.set(response.roundId, [
          ...(objective.get(response.roundId) ?? []),
          response,
        ])
      } else if (response.outcome === 'observational') {
        const intro = NOTE_INTROS[response.field] ?? 'Chose'
        const words = response.choiceLabels.join(', ')
        if (words) notes.push(`${intro} ${words}`)
      } else if (INDEPENDENT.has(response.mark)) {
        gotIt += 1
      } else if (WITH_SUPPORT.has(response.mark)) {
        neededAnother += 1
      }
    }

    let firstTime = 0
    let anotherLook = 0
    let stillExploring = 0
    for (const tries of objective.values()) {
      const solved = tries.find((t) => t.outcome === 'objective' && t.correct)
      if (!solved) stillExploring += 1
      else if (solved.attempt === 1) firstTime += 1
      else anotherLook += 1
    }

    return {
      game,
      name: GAME_NAMES[game],
      category: GAME_CATEGORY[game],
      rounds: objective.size,
      firstTime,
      anotherLook,
      stillExploring,
      // A lesson can generate a lot of choices; keep the summary readable.
      notes: [...new Set(notes)].slice(0, 8),
      gotIt,
      neededAnother,
    }
  })
}

export const summaryByCategory = (
  responses: Response[],
): { category: GameCategory; entries: GameSummary[] }[] => {
  const all = summarise(responses)
  return CATEGORY_ORDER
    .map((category) => ({
      category,
      entries: all.filter((entry) => entry.category === category),
    }))
    .filter((group) => group.entries.length > 0)
}

export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60000))
  if (minutes < 1) return 'just started'
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}
