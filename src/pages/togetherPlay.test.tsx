import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { TogetherPlay, bucketFor } from './TogetherPlay'
import { postToMomzo, isEmbedded, type BridgeEvent } from '../lib/bridge'
import type { ObjectiveResponse, ObservationalResponse, Response } from '../core/types'

afterEach(cleanup)

/* ------------------------------------------------------------------ *
 * The bridge — the only thing that leaves the SPA
 * ------------------------------------------------------------------ */

type Host = { sent: BridgeEvent[] }

function attachHost(): Host {
  const host: Host = { sent: [] }
  ;(window as unknown as Record<string, unknown>).MomzoBridge = {
    postMessage: (message: string) => host.sent.push(JSON.parse(message)),
  }
  return host
}

const detachHost = () => {
  delete (window as unknown as Record<string, unknown>).MomzoBridge
}

describe('the Momzo bridge', () => {
  afterEach(detachHost)

  it('does nothing at all with no host, so /play still works in a browser', () => {
    detachHost()
    expect(isEmbedded()).toBe(false)
    expect(() => postToMomzo({ event: 'game_ready', game: 'ten-frame' })).not.toThrow()
  })

  it('never lets a telemetry failure interrupt a child mid-game', () => {
    ;(window as unknown as Record<string, unknown>).MomzoBridge = {
      postMessage: () => {
        throw new Error('host went away')
      },
    }
    expect(() => postToMomzo({ event: 'game_ready', game: 'ten-frame' })).not.toThrow()
  })

  it('sends JSON the host can parse', () => {
    const host = attachHost()
    postToMomzo({ event: 'game_ready', game: 'ten-frame' })
    expect(host.sent).toEqual([{ event: 'game_ready', game: 'ten-frame' }])
  })
})

/* ------------------------------------------------------------------ *
 * Buckets — Momzo's dashboard and Florie's panel must agree
 * ------------------------------------------------------------------ */

const objective = (patch: Partial<ObjectiveResponse>): ObjectiveResponse => ({
  id: 'x',
  roundId: 'r1',
  game: 'ten-frame',
  outcome: 'objective',
  answer: 1,
  expected: 1,
  correct: true,
  attempt: 1,
  label: '',
  at: 0,
  ...patch,
})

describe('bucketFor', () => {
  it('calls a first-attempt success "first time"', () => {
    expect(bucketFor([objective({ attempt: 1, correct: true })], 'r1')?.bucket).toBe('firstTime')
  })

  it('calls a later success "another look", never a failure', () => {
    const responses: Response[] = [
      objective({ id: 'a', attempt: 1, correct: false }),
      objective({ id: 'b', attempt: 2, correct: true }),
    ]
    expect(bucketFor(responses, 'r1')?.bucket).toBe('anotherLook')
  })

  it('calls a round they never solved "still exploring"', () => {
    const responses: Response[] = [
      objective({ id: 'a', attempt: 1, correct: false }),
      objective({ id: 'b', attempt: 2, correct: false }),
    ]
    expect(bucketFor(responses, 'r1')?.bucket).toBe('stillExploring')
  })

  it('reports the time of the answer that landed', () => {
    const responses: Response[] = [
      objective({ id: 'a', attempt: 1, correct: false, responseTimeMs: 900 }),
      objective({ id: 'b', attempt: 2, correct: true, responseTimeMs: 4200 }),
    ]
    expect(bucketFor(responses, 'r1')?.responseTimeMs).toBe(4200)
  })

  it('ignores other rounds', () => {
    const responses: Response[] = [
      objective({ id: 'a', roundId: 'other', attempt: 1, correct: false }),
      objective({ id: 'b', roundId: 'r1', attempt: 1, correct: true }),
    ]
    expect(bucketFor(responses, 'r1')?.bucket).toBe('firstTime')
  })

  it('refuses to bucket an observation — that would be marking it', () => {
    const watched: ObservationalResponse = {
      id: 'o',
      roundId: 'r1',
      game: 'feeling-thermometer',
      outcome: 'observational',
      field: 'emotion',
      choices: ['worried'],
      choiceLabels: ['Worried'],
      attempt: 1,
      label: 'Worried',
      at: 0,
    }
    expect(bucketFor([watched], 'r1')).toBeNull()
  })
})

/* ------------------------------------------------------------------ *
 * The route
 * ------------------------------------------------------------------ */

function playing(gameId: string) {
  return render(
    <MemoryRouter initialEntries={[`/play/${gameId}`]}>
      <Routes>
        <Route path="/play/:gameId" element={<TogetherPlay />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('/play/:gameId', () => {
  let host: Host

  beforeEach(() => {
    host = attachHost()
  })
  afterEach(detachHost)

  it('announces which game opened', () => {
    playing('ten-frame')
    expect(host.sent[0]).toEqual({ event: 'game_ready', game: 'ten-frame' })
  })

  it('gives the grown-up the controls, and never advances on its own', () => {
    playing('ten-frame')
    for (const label of ['Again', 'Easier', 'Harder', 'Next']) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy()
    }
    // Nothing auto-advanced: one game_ready and no round_result yet.
    expect(host.sent.filter((e) => e.event === 'round_result')).toHaveLength(0)
  })

  it('sends the rollup when the grown-up leaves', () => {
    const { unmount } = playing('ten-frame')
    unmount()
    const summary = host.sent.find((e) => e.event === 'session_summary')
    expect(summary).toBeTruthy()
    expect(summary).toMatchObject({ game: 'ten-frame', rounds: 0, firstTime: 0 })
  })

  it('gives Freeze Dance a switch, because the family brings the music', () => {
    playing('freeze-dance')
    const button = screen.getByRole('button', { name: /Freeze!/ })
    expect(screen.getByText(/DANCE!/)).toBeTruthy()
    fireEvent.click(button)
    expect(screen.getByText(/FREEZE!/)).toBeTruthy()
  })

  it('does not offer a Freeze switch to games that are not Freeze Dance', () => {
    playing('ten-frame')
    expect(screen.queryByRole('button', { name: /Freeze!/ })).toBeNull()
  })

  it('says so kindly when the game id is not one we have', () => {
    playing('not-a-real-game')
    expect(screen.getByText(/isn’t here/)).toBeTruthy()
    expect(host.sent).toHaveLength(0)
  })

  it('names nobody — the grown-up is in the room', () => {
    playing('opposite-game')
    expect(screen.queryByText(/Florie/)).toBeNull()
  })
})
