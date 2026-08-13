import { beforeEach, describe, expect, it } from 'vitest'
import {
  JoinError,
  createSession,
  findByCode,
  joinSession,
  normalizeSnapshot,
  saveLocal,
} from './sessionService'
import { DEFAULT_SETTINGS } from '../core/types'

beforeEach(() => localStorage.clear())

describe('join codes', () => {
  it('are six readable characters, skipping I, O, 0 and 1', async () => {
    const codes = new Set<string>()
    for (let i = 0; i < 60; i++) {
      const { code } = await createSession()
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
      codes.add(code)
    }
    // Not trivially guessable: 60 draws should not collide.
    expect(codes.size).toBe(60)
  })
})

describe('joining a lesson', () => {
  it('finds a waiting session by its code', async () => {
    const session = await createSession()
    expect(findByCode(session.code)?.id).toBe(session.id)
    expect(findByCode(session.code.toLowerCase())?.id).toBe(session.id)
  })

  it('rejects an unknown code', async () => {
    await expect(joinSession('ZZZZZZ', 'Samaya')).rejects.toBeInstanceOf(JoinError)
    await expect(joinSession('ZZZZZZ', 'Samaya')).rejects.toMatchObject({
      reason: 'invalid',
    })
  })

  it('refuses a lesson that has ended', async () => {
    const session = await createSession()
    saveLocal({ ...session, status: 'ended' })
    await expect(joinSession(session.code, 'Samaya')).rejects.toMatchObject({
      reason: 'ended',
    })
  })

  it('keeps a one-child lesson to one child', async () => {
    const session = await createSession()
    await joinSession(session.code, 'Samaya')
    await expect(joinSession(session.code, 'Alex')).rejects.toMatchObject({
      reason: 'full',
    })
    // The same child reconnecting is always welcome back.
    await expect(joinSession(session.code, 'Samaya')).resolves.toMatchObject({
      nickname: 'Samaya',
    })
  })

  it('marks the lesson active once someone joins', async () => {
    const session = await createSession()
    expect(session.status).toBe('waiting')
    const joined = await joinSession(session.code, 'Samaya')
    expect(joined.status).toBe('active')
  })
})

describe('normalizeSnapshot', () => {
  it('fills gaps in a partial payload rather than crashing', () => {
    const snapshot = normalizeSnapshot({ id: 'x', code: 'ABC123' })
    expect(snapshot.responses).toEqual([])
    expect(snapshot.discoveries).toEqual({})
    expect(snapshot.settings['flash-hide'].max).toBe(
      DEFAULT_SETTINGS['flash-hide'].max,
    )
    expect(snapshot.settings['number-line'].character).toBe('rabbit')
  })

  it('keeps stored settings and backfills any new ones', () => {
    const snapshot = normalizeSnapshot({
      id: 'x',
      settings: {
        'flash-hide': { max: 6 },
      } as never,
    })
    expect(snapshot.settings['flash-hide'].max).toBe(6)
    expect(snapshot.settings['flash-hide'].duration).toBe(1000)
    expect(snapshot.settings['ten-frame'].mode).toBe('build')
  })
})
