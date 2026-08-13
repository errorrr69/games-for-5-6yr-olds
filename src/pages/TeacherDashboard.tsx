import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shell } from '../components/common'
import { Monster } from '../components/Illustrations'
import { isDemo, supabase } from '../lib/supabase'
import { createSession } from '../realtime/sessionService'

export function TeacherDashboard() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [signedIn, setSignedIn] = useState(isDemo)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isDemo || !supabase) return
    void supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user))
  }, [])

  async function signIn() {
    if (isDemo || !supabase) {
      setSignedIn(true)
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/teacher` },
    })
    setBusy(false)
    setMessage(
      error ? error.message : 'Check your email for a secure sign-in link.',
    )
  }

  async function start() {
    setBusy(true)
    try {
      const session = await createSession()
      navigate(`/teacher/session/${session.id}`)
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not start a session.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell>
      <section className="dashboard">
        <Monster mood="happy" className="dashboard-monster" />
        <p className="eyebrow">Florie’s classroom</p>
        <h1>{signedIn ? 'Ready for some maths?' : 'Welcome back, Florie.'}</h1>

        {!signedIn ? (
          <div className="card login-card">
            <label>
              <span>Email address</span>
              <input
                type="email"
                value={email}
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="button-primary"
              disabled={!email || busy}
              onClick={signIn}
            >
              Send secure sign-in link
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="start-session"
              onClick={start}
              disabled={busy}
            >
              <span className="start-session-plus" aria-hidden="true">
                +
              </span>
              <span>
                <strong>Start a new session</strong>
                <small>A private room for one learner</small>
              </span>
            </button>
            {isDemo && (
              <p className="demo-note">
                Demo mode — perfect for trying both sides in two windows of this
                browser. Add Supabase keys for two different computers.
              </p>
            )}
          </>
        )}

        {message && <p className="notice">{message}</p>}
      </section>
    </Shell>
  )
}
