import type { JSX } from 'react'
import { FACES, type FaceDefinition } from '../core/feelings'

/**
 * Original artwork for Feelings & Focus. All inline SVG.
 *
 * Privacy note (spec §8): nothing here touches a camera. Faces are drawn
 * from a definition, never captured, uploaded, or analysed.
 */

type Art = { className?: string }

/* ------------------------------------------------------------------ *
 * Faces
 * ------------------------------------------------------------------ */

const BROWS: Record<FaceDefinition['brows'], JSX.Element> = {
  neutral: (
    <g stroke="#4a3a2f" strokeWidth="5" strokeLinecap="round">
      <path d="M30 38h16" />
      <path d="M74 38h16" />
    </g>
  ),
  raised: (
    <g stroke="#4a3a2f" strokeWidth="5" strokeLinecap="round" fill="none">
      <path d="M30 32q8-7 16 0" />
      <path d="M74 32q8-7 16 0" />
    </g>
  ),
  furrowed: (
    <g stroke="#4a3a2f" strokeWidth="5" strokeLinecap="round">
      <path d="M30 32l16 9" />
      <path d="M90 32l-16 9" />
    </g>
  ),
  worried: (
    <g stroke="#4a3a2f" strokeWidth="5" strokeLinecap="round">
      <path d="M30 40l16-8" />
      <path d="M90 40l-16-8" />
    </g>
  ),
  soft: (
    <g stroke="#4a3a2f" strokeWidth="5" strokeLinecap="round" fill="none">
      <path d="M31 36q7-4 14 0" />
      <path d="M75 36q7-4 14 0" />
    </g>
  ),
}

function Eyes({ style }: { style: FaceDefinition['eyes'] }) {
  if (style === 'closed') {
    return (
      <g stroke="#3d2f26" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M30 56q8 8 16 0" />
        <path d="M74 56q8 8 16 0" />
      </g>
    )
  }
  const radius = style === 'wide' ? 11 : style === 'narrow' ? 6 : 9
  return (
    <>
      <ellipse cx="38" cy="56" rx={radius} ry={style === 'narrow' ? 5 : radius} fill="#fffaf2" />
      <ellipse cx="82" cy="56" rx={radius} ry={style === 'narrow' ? 5 : radius} fill="#fffaf2" />
      <circle cx="39" cy="57" r={style === 'narrow' ? 4 : 5.5} fill="#3d2f26" />
      <circle cx="83" cy="57" r={style === 'narrow' ? 4 : 5.5} fill="#3d2f26" />
      <circle cx="41" cy="54" r="2" fill="#fffaf2" />
      <circle cx="85" cy="54" r="2" fill="#fffaf2" />
      {style === 'teary' && (
        <g fill="#7ec4e8">
          <path d="M33 66q4 10 0 12-4-2 0-12Z" />
          <path d="M77 68q4 9 0 11-4-2 0-11Z" />
        </g>
      )}
    </>
  )
}

const MOUTHS: Record<FaceDefinition['mouth'], JSX.Element> = {
  smile: (
    <path d="M46 82q14 12 28 0" stroke="#4a3a2f" strokeWidth="5" fill="none" strokeLinecap="round" />
  ),
  'big-smile': (
    <>
      <path d="M42 80h36a18 18 0 0 1-36 0Z" fill="#4a3a2f" />
      <path d="M52 90h16a8 8 0 0 1-16 0Z" fill="#ef7d8e" />
    </>
  ),
  'small-smile': (
    <path d="M52 84q8 6 16 0" stroke="#4a3a2f" strokeWidth="5" fill="none" strokeLinecap="round" />
  ),
  flat: (
    <path d="M48 84h24" stroke="#4a3a2f" strokeWidth="5" fill="none" strokeLinecap="round" />
  ),
  frown: (
    <path d="M46 90q14-12 28 0" stroke="#4a3a2f" strokeWidth="5" fill="none" strokeLinecap="round" />
  ),
  open: <ellipse cx="60" cy="86" rx="11" ry="14" fill="#4a3a2f" />,
  wobble: (
    <path
      d="M46 86q7-7 14 0t14 0"
      stroke="#4a3a2f"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
  ),
}

/** The face shapes alone, on a 120x120 grid, with no <svg> wrapper. */
export function FaceShapes({ face }: { face: string }) {
  const definition = FACES.find((f) => f.id === face) ?? FACES[0]
  return (
    <>
      <circle cx="60" cy="60" r="52" fill="#f8d9b0" />
      <path d="M8 60a52 52 0 0 1 104 0Z" fill="#fbe3c4" />
      {definition.extra === 'blush' && (
        <>
          <ellipse cx="26" cy="74" rx="10" ry="7" fill="#ef7d8e" opacity=".45" />
          <ellipse cx="94" cy="74" rx="10" ry="7" fill="#ef7d8e" opacity=".45" />
        </>
      )}
      {BROWS[definition.brows]}
      <Eyes style={definition.eyes} />
      {MOUTHS[definition.mouth]}
      {definition.extra === 'sweat' && (
        <path d="M100 34q6 12 0 14-6-2 0-14Z" fill="#7ec4e8" />
      )}
      {definition.extra === 'sparkle' && (
        <path d="M100 26l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#ffd166" />
      )}
    </>
  )
}

export function Face({
  face,
  className,
  size = 'normal',
}: Art & { face: string; size?: 'normal' | 'large' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={['art art-face', `is-${size}`, className].filter(Boolean).join(' ')}
      role="img"
      aria-label="A drawn face"
    >
      <FaceShapes face={face} />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Feeling Thermometer
 * ------------------------------------------------------------------ */

/** Warm gradient, but the words say "how big", never "how good". */
const LEVEL_COLOURS = ['#7fc49a', '#b9d47f', '#ffd166', '#f4a259', '#ef7d6a']

export function Thermometer({
  level,
  className,
}: Art & { level: number }) {
  return (
    <svg
      viewBox="0 0 80 200"
      className={['art art-thermometer', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <rect x="26" y="8" width="28" height="150" rx="14" fill="#f1e6d6" />
      {LEVEL_COLOURS.map((colour, i) => {
        const filled = 5 - i <= level
        return (
          <rect
            key={i}
            x="30"
            y={14 + i * 28}
            width="20"
            height="24"
            rx="10"
            fill={colour}
            opacity={filled ? 1 : 0.22}
          />
        )
      })}
      <circle cx="40" cy="170" r="24" fill={LEVEL_COLOURS[5 - level] ?? '#f1e6d6'} />
      <circle cx="33" cy="163" r="6" fill="#fff" opacity=".45" />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Body Detective silhouette
 * ------------------------------------------------------------------ */

export function BodyOutline({ className }: Art) {
  return (
    <svg
      viewBox="0 0 200 320"
      className={['art art-body', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <circle cx="100" cy="42" r="34" fill="#f8d9b0" />
      <path
        d="M100 78c26 0 44 14 48 38l8 62c1 9-5 15-13 15h-6l-5 96c0 8-6 13-14 13s-14-5-14-13l-4-58-4 58c0 8-6 13-14 13s-14-5-14-13l-5-96h-6c-8 0-14-6-13-15l8-62c4-24 22-38 48-38Z"
        fill="#fbe3c4"
      />
      <path
        d="M100 78c26 0 44 14 48 38l8 62c1 9-5 15-13 15h-6l-2 38H65l-2-38h-6c-8 0-14-6-13-15l8-62c4-24 22-38 48-38Z"
        fill="#cfe6f5"
        opacity=".55"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * The Opposite Game — brain brakes
 * ------------------------------------------------------------------ */

export function SwitchArrows({ className }: Art) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={['art', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <rect x="8" y="18" width="104" height="34" rx="17" fill="#cfe6f5" />
      <rect x="8" y="68" width="104" height="34" rx="17" fill="#ffe3a3" />
      <path d="M84 26l16 9-16 9Z" fill="#2f6ea8" />
      <path d="M36 76l-16 9 16 9Z" fill="#c98b1f" />
      <circle cx="30" cy="35" r="9" fill="#2f6ea8" />
      <circle cx="90" cy="85" r="9" fill="#c98b1f" />
    </svg>
  )
}

export function BrainBrakes({ engaged }: { engaged: boolean }) {
  return (
    <svg viewBox="0 0 140 100" className="art art-brakes" aria-hidden="true">
      <path
        d="M40 20c-14 0-24 10-24 24 0 8 4 15 10 19 1 12 11 21 24 21h20c13 0 23-9 24-21 6-4 10-11 10-19 0-14-10-24-24-24-4-7-12-11-20-11s-16 4-20 11Z"
        fill={engaged ? '#cfe6f5' : '#ffd9c7'}
      />
      <g stroke={engaged ? '#2f6ea8' : '#d1502f'} strokeWidth="5" fill="none" strokeLinecap="round">
        <path d="M50 44q10-8 20 0" />
        <path d="M80 56q8 6 16 0" />
      </g>
      <text
        x="70"
        y="94"
        textAnchor="middle"
        fontSize="17"
        fontWeight="700"
        fill={engaged ? '#2f6ea8' : '#d1502f'}
        fontFamily="inherit"
      >
        {engaged ? 'BRAKE' : 'GO'}
      </text>
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Rock the Buddy
 * ------------------------------------------------------------------ */

export function Buddy({ asleep, className }: Art & { asleep?: boolean }) {
  return (
    <svg
      viewBox="0 0 140 120"
      className={['art art-buddy', className].filter(Boolean).join(' ')}
      role="img"
      aria-label={asleep ? 'A sleeping buddy' : 'A sleepy buddy'}
    >
      <ellipse cx="70" cy="108" rx="52" ry="9" fill="#3b3358" opacity=".18" />
      <circle cx="34" cy="46" r="16" fill="#b79ae8" />
      <circle cx="106" cy="46" r="16" fill="#b79ae8" />
      <circle cx="34" cy="46" r="8" fill="#d9c8f5" />
      <circle cx="106" cy="46" r="8" fill="#d9c8f5" />
      <ellipse cx="70" cy="66" rx="44" ry="40" fill="#c5b0ef" />
      <ellipse cx="70" cy="76" rx="28" ry="24" fill="#e2d6f8" />
      <g stroke="#4a3a6f" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M52 58q7 7 14 0" />
        <path d="M76 58q7 7 14 0" />
      </g>
      <ellipse cx="70" cy="70" rx="6" ry="4" fill="#a184d8" />
      <ellipse cx="44" cy="72" rx="8" ry="5" fill="#ef7d8e" opacity=".4" />
      <ellipse cx="96" cy="72" rx="8" ry="5" fill="#ef7d8e" opacity=".4" />
      {asleep && (
        <g fill="#8f7cc4" fontFamily="inherit" fontWeight="700">
          <text x="112" y="26" fontSize="16">
            z
          </text>
          <text x="122" y="14" fontSize="12">
            z
          </text>
        </g>
      )}
    </svg>
  )
}

export function NightSky() {
  return (
    <svg viewBox="0 0 400 140" className="art scene" aria-hidden="true" preserveAspectRatio="none">
      <circle cx="330" cy="42" r="26" fill="#ffe9b0" />
      <circle cx="318" cy="36" r="22" fill="#e8eaf8" />
      {[
        [40, 40],
        [96, 78],
        [160, 30],
        [230, 62],
        [286, 96],
        [370, 96],
      ].map(([x, y], i) => (
        <path
          key={i}
          d={`M${x} ${y - 6}l2 4 4 2-4 2-2 4-2-4-4-2 4-2Z`}
          fill="#fff3c4"
          opacity=".85"
        />
      ))}
      <ellipse cx="120" cy="120" rx="70" ry="22" fill="#fff" opacity=".18" />
      <ellipse cx="290" cy="126" rx="80" ry="20" fill="#fff" opacity=".14" />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Freeze Dance
 * ------------------------------------------------------------------ */

export function DancingShapes({ frozen }: { frozen: boolean }) {
  const shapes = [
    { cx: 18, fill: '#ef7d8e' },
    { cx: 34, fill: '#ffd166' },
    { cx: 50, fill: '#7fc49a' },
    { cx: 66, fill: '#7ec4e8' },
    { cx: 82, fill: '#b79ae8' },
  ]
  return (
    <div className={`dance-floor ${frozen ? 'is-frozen' : 'is-dancing'}`} aria-hidden="true">
      {shapes.map((shape, i) => (
        <span
          key={shape.cx}
          className="dance-shape"
          style={{ background: shape.fill, animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  )
}

export function Snowflake({ className }: Art) {
  return (
    <svg
      viewBox="0 0 60 60"
      className={['art', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <g stroke="#7ec4e8" strokeWidth="4" strokeLinecap="round">
        <path d="M30 6v48" />
        <path d="M9 18l42 24" />
        <path d="M51 18L9 42" />
        <path d="M30 14l-7 7M30 14l7 7" />
        <path d="M30 46l-7-7M30 46l7-7" />
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Scavenger Hunt scenery
 * ------------------------------------------------------------------ */

export function MiniScene({ className }: Art) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={['art', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <rect x="6" y="14" width="108" height="92" rx="14" fill="#fff3d9" />
      <rect x="6" y="14" width="108" height="30" rx="14" fill="#cfe6f5" />
      <circle cx="38" cy="70" r="15" fill="#f8d9b0" />
      <circle cx="80" cy="70" r="15" fill="#f8d9b0" />
      <path d="M23 106q15-18 30 0Z" fill="#ef7d8e" />
      <path d="M65 106q15-18 30 0Z" fill="#7fc49a" />
    </svg>
  )
}

const BACKDROPS: Record<string, JSX.Element> = {
  party: (
    <>
      <rect x="0" y="0" width="400" height="150" fill="#fdeef2" />
      <g stroke="#e8a0b4" strokeWidth="3" fill="none">
        <path d="M0 22q50 26 100 0t100 0 100 0 100 0" />
      </g>
      {[40, 110, 180, 250, 320].map((x, i) => (
        <path
          key={x}
          d={`M${x} 22l-9 18h18Z`}
          fill={['#ef7d8e', '#ffd166', '#7fc49a', '#7ec4e8', '#b79ae8'][i]}
        />
      ))}
      <rect x="0" y="150" width="400" height="70" fill="#f6e2c9" />
    </>
  ),
  classroom: (
    <>
      <rect x="0" y="0" width="400" height="150" fill="#eef4f9" />
      <rect x="24" y="22" width="120" height="70" rx="8" fill="#7fa88f" />
      <rect x="270" y="30" width="90" height="60" rx="8" fill="#f6e2c9" />
      <rect x="0" y="150" width="400" height="70" fill="#e7d6bd" />
    </>
  ),
  outdoors: (
    <>
      <rect x="0" y="0" width="400" height="150" fill="#dff0f7" />
      <circle cx="330" cy="36" r="26" fill="#ffd166" />
      <ellipse cx="90" cy="42" rx="42" ry="18" fill="#fff" opacity=".85" />
      <ellipse cx="126" cy="36" rx="30" ry="15" fill="#fff" opacity=".85" />
      <rect x="0" y="150" width="400" height="70" fill="#a7d59a" />
      <path d="M0 150q80-34 160 0Z" fill="#8fc97a" />
    </>
  ),
  playroom: (
    <>
      <rect x="0" y="0" width="400" height="150" fill="#fdf1e2" />
      <rect x="30" y="60" width="70" height="34" rx="6" fill="#cfe6f5" />
      <rect x="300" y="52" width="60" height="42" rx="6" fill="#ffe3a3" />
      <rect x="0" y="150" width="400" height="70" fill="#f0dcc0" />
    </>
  ),
}

export function SceneBackdrop({ variant }: { variant: string }) {
  return (
    <svg
      viewBox="0 0 400 220"
      className="scene-backdrop"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {BACKDROPS[variant] ?? BACKDROPS.playroom}
    </svg>
  )
}

/** A small person in a scene. Deliberately generic — no real child. */
export function SceneFigureArt({
  face,
  pose,
  tint,
}: {
  face: string
  pose: string
  tint: number
}) {
  const shirts = ['#ef7d8e', '#7ec4e8', '#7fc49a', '#ffd166', '#b79ae8']
  const shirt = shirts[tint % shirts.length]
  const lean = pose === 'slumped' ? 8 : pose === 'reaching' ? -6 : 0
  return (
    <svg viewBox="0 0 80 120" className="figure-art" aria-hidden="true">
      <g transform={`rotate(${lean} 40 110)`}>
        {pose === 'sitting' ? (
          <path d="M18 118v-22a22 22 0 0 1 44 0v22Z" fill={shirt} />
        ) : (
          <path d="M22 118V84a18 18 0 0 1 36 0v34Z" fill={shirt} />
        )}
        {pose === 'covering-ears' ? (
          <>
            <circle cx="16" cy="56" r="9" fill="#f8d9b0" />
            <circle cx="64" cy="56" r="9" fill="#f8d9b0" />
          </>
        ) : pose === 'reaching' ? (
          <circle cx="70" cy="74" r="8" fill="#f8d9b0" />
        ) : pose === 'waving' ? (
          <circle cx="68" cy="60" r="8" fill="#f8d9b0" />
        ) : null}
        <g transform="translate(10 2) scale(0.5)">
          <FaceShapes face={face} />
        </g>
      </g>
    </svg>
  )
}
