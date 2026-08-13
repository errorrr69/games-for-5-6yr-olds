import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Shell } from '../components/common'
import { Berry, Counter, Flower, Monster } from '../components/Illustrations'
import { play } from '../core/sound'
import { JoinError, joinSession } from '../realtime/sessionService'

const MESSAGES: Record<JoinError['reason'], string> = {
  invalid: 'That lesson link doesn’t seem to work. Ask Florie for a new one.',
  ended: 'This lesson has finished.',
  full: 'Someone is already playing in this lesson.',
  unknown: 'We couldn’t open that lesson. Ask Florie for a new link.',
}

export function Join() {
  const { joinCode = '' } = useParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    const nickname = name.trim()
    if (!nickname) return
    setBusy(true)
    setError('')
    try {
      const session = await joinSession(joinCode, nickname)
      sessionStorage.setItem(`florie:student:${session.id}`, nickname)
      play('chime')
      navigate(`/student/session/${session.id}`)
    } catch (problem) {
      setError(
        problem instanceof JoinError
          ? MESSAGES[problem.reason]
          : MESSAGES.unknown,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell variant="student">
      <section className="join-page card">
        <div className="join-art" aria-hidden="true">
          <span>
            <Berry />
          </span>
          <Monster mood="happy" />
          <span>
            <Flower tone={1} />
          </span>
          <span>
            <Counter />
          </span>
        </div>

        <h1>Hi there! 👋</h1>
        <p>What shall Florie call you?</p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <input
            autoFocus
            maxLength={24}
            value={name}
            aria-label="Your first name"
            placeholder="Your first name"
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="submit"
            className="button-primary button-wide"
            disabled={!name.trim() || busy}
          >
            Join Florie’s game <span aria-hidden="true">→</span>
          </button>
        </form>

        {error && <p className="friendly-error">{error}</p>}
        <small>Just your first name — nothing else.</small>
      </section>
    </Shell>
  )
}
