import type { ReadingStage } from './phonics'

/**
 * Two-day mastery (spec §5 rule F, §25).
 *
 * A milestone is only secure once it has been demonstrated on at least two
 * *different days*. One good session is not mastery.
 *
 * This is teacher information. It is never shown to the child, never
 * becomes a badge, and the software never advances a child on its own —
 * the teacher decides.
 */

export type MasteryEvidence = {
  stage: ReadingStage
  /** ISO dates, one entry per day it was demonstrated. */
  days: string[]
}

/** Keyed by learner nickname, which is the only learner identity we hold. */
export type MasteryRecord = Record<string, MasteryEvidence[]>

const KEY = 'florie:reading-mastery'

export const today = (now = new Date()): string => now.toISOString().slice(0, 10)

export function loadMastery(): MasteryRecord {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as MasteryRecord) : {}
  } catch {
    return {}
  }
}

function save(record: MasteryRecord): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(record))
  } catch {
    /* private browsing — the lesson is unaffected */
  }
}

/** Records that a stage was demonstrated today. Same day twice is one day. */
export function recordEvidence(
  learner: string,
  stage: ReadingStage,
  day = today(),
  record = loadMastery(),
): MasteryRecord {
  const forLearner = record[learner] ?? []
  const existing = forLearner.find((entry) => entry.stage === stage)

  const next: MasteryEvidence[] = existing
    ? forLearner.map((entry) =>
        entry.stage === stage
          ? { ...entry, days: [...new Set([...entry.days, day])].sort() }
          : entry,
      )
    : [...forLearner, { stage, days: [day] }]

  const updated = { ...record, [learner]: next }
  save(updated)
  return updated
}

export function evidenceFor(
  learner: string,
  stage: ReadingStage,
  record = loadMastery(),
): MasteryEvidence {
  return (
    record[learner]?.find((entry) => entry.stage === stage) ?? {
      stage,
      days: [],
    }
  )
}

export type MasteryStatus = 'not-started' | 'emerging' | 'secure'

/** Two distinct days, and not one before. */
export function statusOf(evidence: MasteryEvidence): MasteryStatus {
  if (evidence.days.length === 0) return 'not-started'
  return evidence.days.length >= 2 ? 'secure' : 'emerging'
}

export const STATUS_LABELS: Record<MasteryStatus, string> = {
  'not-started': 'Not shown yet',
  emerging: 'Shown once — needs another day',
  secure: 'Secure',
}

/** "Tue 12 Aug" — short enough for the teacher panel. */
export function formatDay(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
