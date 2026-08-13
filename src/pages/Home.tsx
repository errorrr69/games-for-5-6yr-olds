import { Link } from 'react-router-dom'
import { Shell } from '../components/common'
import { Berry, Character, Counter, Flower, Monster } from '../components/Illustrations'

export function Home() {
  return (
    <Shell>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Ages 5–7 · live · one to one</p>
          <h1>
            Little ideas.
            <br />
            <em>Big thinking.</em>
          </h1>
          <p className="lede">
            Warm, hands-on games for Florie and one small learner — numbers,
            feelings and focus, together in real time on two screens.
          </p>
          <Link className="button-primary" to="/teacher">
            Teacher login <span aria-hidden="true">→</span>
          </Link>
          <ul className="promises">
            <li>No timers</li>
            <li>No losing</li>
            <li>Just good thinking</li>
          </ul>
        </div>

        <div className="hero-art" aria-hidden="true">
          <span className="hero-sun">5</span>
          <span className="hero-bubble">2 + 3</span>
          <Monster mood="happy" className="hero-monster" />
          <span className="hero-float hero-float-1">
            <Berry />
          </span>
          <span className="hero-float hero-float-2">
            <Flower tone={2} />
          </span>
          <span className="hero-float hero-float-3">
            <Counter />
          </span>
          <span className="hero-float hero-float-4">
            <Character id="rabbit" />
          </span>
          <span className="hero-hill">
            {[1, 2, 3, 4, 5].map((n) => (
              <b key={n}>{n}</b>
            ))}
          </span>
        </div>
      </section>
    </Shell>
  )
}
