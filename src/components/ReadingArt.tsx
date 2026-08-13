import type { JSX } from 'react'
import type { MonsterLook } from '../core/types'

/**
 * Original artwork for Reading Adventures. All inline SVG.
 *
 * Pictures support meaning and enjoyment. They never carry the answer to a
 * decoding task — a child should be sounding words out, not guessing from
 * the picture (spec §5 rule A).
 */

type Art = { className?: string }

/* ------------------------------------------------------------------ *
 * Word pictures
 * ------------------------------------------------------------------ */

const P: Record<string, JSX.Element> = {
  cat: (
    <>
      <ellipse cx="50" cy="66" rx="26" ry="22" fill="#f9b571" />
      <path d="M30 40l5 16 13-8Z" fill="#f9b571" />
      <path d="M70 40l-5 16-13-8Z" fill="#f9b571" />
      <circle cx="50" cy="46" r="20" fill="#fcc98d" />
      <circle cx="43" cy="44" r="3" fill="#3d2140" />
      <circle cx="57" cy="44" r="3" fill="#3d2140" />
      <path d="M50 50l-3 3h6Z" fill="#ef7d8e" />
      <path d="M78 76c10-4 10-18 2-24" stroke="#f9b571" strokeWidth="7" fill="none" strokeLinecap="round" />
    </>
  ),
  dog: (
    <>
      <ellipse cx="50" cy="66" rx="27" ry="21" fill="#c98159" />
      <ellipse cx="28" cy="44" rx="8" ry="14" fill="#a86844" />
      <ellipse cx="72" cy="44" rx="8" ry="14" fill="#a86844" />
      <circle cx="50" cy="46" r="20" fill="#d99a70" />
      <circle cx="43" cy="43" r="3" fill="#3d2140" />
      <circle cx="57" cy="43" r="3" fill="#3d2140" />
      <ellipse cx="50" cy="53" rx="5" ry="4" fill="#3d2140" />
    </>
  ),
  sun: (
    <>
      <circle cx="50" cy="50" r="22" fill="#ffd166" />
      <g stroke="#f4a259" strokeWidth="6" strokeLinecap="round">
        <path d="M50 14v-8M50 86v8M14 50H6M86 50h8M25 25l-6-6M75 75l6 6M75 25l6-6M25 75l-6 6" />
      </g>
      <circle cx="43" cy="46" r="2.5" fill="#c98b1f" />
      <circle cx="57" cy="46" r="2.5" fill="#c98b1f" />
      <path d="M42 56q8 7 16 0" stroke="#c98b1f" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  map: (
    <>
      <path d="M14 26l24-8 24 8 24-8v56l-24 8-24-8-24 8Z" fill="#f6e2c9" />
      <path d="M38 18v56M62 26v56" stroke="#c9a97e" strokeWidth="3" />
      <path d="M24 46q14-10 26 0t26-6" stroke="#68b06f" strokeWidth="4" fill="none" />
      <path d="M56 60l4 8 8-4Z" fill="#e0455f" />
    </>
  ),
  fish: (
    <>
      <ellipse cx="46" cy="52" rx="28" ry="19" fill="#68b6d8" />
      <path d="M74 52l18-13v26Z" fill="#4a9bc0" />
      <circle cx="34" cy="47" r="4" fill="#fffaf2" />
      <circle cx="33" cy="47" r="2" fill="#3d2140" />
      <path d="M50 40q8 12 0 24" stroke="#4a9bc0" strokeWidth="3" fill="none" />
    </>
  ),
  pan: (
    <>
      <ellipse cx="42" cy="58" rx="28" ry="16" fill="#5b5b6b" />
      <ellipse cx="42" cy="54" rx="28" ry="14" fill="#7b7b8c" />
      <rect x="68" y="50" width="26" height="8" rx="4" fill="#3d2140" />
    </>
  ),
  pin: (
    <>
      <circle cx="50" cy="30" r="12" fill="#e0455f" />
      <path d="M50 40v42" stroke="#9aa0aa" strokeWidth="6" strokeLinecap="round" />
      <circle cx="46" cy="26" r="4" fill="#ff97a8" />
    </>
  ),
  tin: (
    <>
      <rect x="28" y="30" width="44" height="46" rx="4" fill="#9aa0aa" />
      <ellipse cx="50" cy="30" rx="22" ry="7" fill="#c4cad2" />
      <rect x="30" y="44" width="40" height="16" fill="#e0455f" />
    </>
  ),
  mat: (
    <>
      <rect x="16" y="42" width="68" height="26" rx="4" fill="#c98159" />
      <path d="M16 50h68M16 60h68" stroke="#a86844" strokeWidth="3" />
      <path d="M10 42h6v26h-6ZM84 42h6v26h-6Z" fill="#a86844" />
    </>
  ),
  dot: <circle cx="50" cy="50" r="24" fill="#7a5aa8" />,
  cap: (
    <>
      <path d="M22 58a28 28 0 0 1 56 0Z" fill="#2f6ea8" />
      <path d="M78 58h14a6 6 0 0 1-6 6H78Z" fill="#255c8c" />
      <circle cx="50" cy="30" r="5" fill="#255c8c" />
    </>
  ),
  can: (
    <>
      <rect x="30" y="26" width="40" height="52" rx="5" fill="#c4cad2" />
      <ellipse cx="50" cy="26" rx="20" ry="6" fill="#e2e6eb" />
      <rect x="32" y="42" width="36" height="20" fill="#68b06f" />
    </>
  ),
  top: (
    <>
      <path d="M50 20l22 26-22 34-22-34Z" fill="#ef7d8e" />
      <path d="M50 20l22 26H28Z" fill="#ff9fae" />
      <path d="M50 80v10" stroke="#7a5aa8" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  pot: (
    <>
      <path d="M26 40h48l-6 40H32Z" fill="#5b5b6b" />
      <rect x="20" y="34" width="60" height="8" rx="4" fill="#7b7b8c" />
      <rect x="44" y="22" width="12" height="12" rx="4" fill="#7b7b8c" />
    </>
  ),
  mop: (
    <>
      <path d="M46 20h8v40h-8Z" fill="#c9a97e" />
      <path d="M30 58h40l-6 26H36Z" fill="#f2e2b8" />
      <path d="M36 58v26M50 58v26M64 58v26" stroke="#d9c48e" strokeWidth="3" />
    </>
  ),
  rug: (
    <>
      <ellipse cx="50" cy="56" rx="34" ry="20" fill="#ef7d8e" />
      <ellipse cx="50" cy="56" rx="22" ry="12" fill="#ffd166" />
      <ellipse cx="50" cy="56" rx="10" ry="5" fill="#68b6d8" />
    </>
  ),
  rat: (
    <>
      <ellipse cx="48" cy="60" rx="26" ry="17" fill="#9aa0aa" />
      <circle cx="26" cy="52" r="12" fill="#aeb4bd" />
      <circle cx="24" cy="41" r="6" fill="#c8b0b8" />
      <circle cx="21" cy="50" r="2.5" fill="#3d2140" />
      <path d="M74 62q14 4 12 16" stroke="#9aa0aa" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  ),
  net: (
    <>
      <path d="M30 30h40v30a20 20 0 0 1-40 0Z" fill="none" stroke="#7a5aa8" strokeWidth="4" />
      <path d="M38 30v34M50 30v38M62 30v34M30 44h40M32 56h36" stroke="#a48fe0" strokeWidth="3" />
      <path d="M50 68v20" stroke="#c9a97e" strokeWidth="6" strokeLinecap="round" />
    </>
  ),
  pen: (
    <>
      <path d="M24 74l6-18 38-38 12 12-38 38Z" fill="#2f6ea8" />
      <path d="M24 74l6-18 6 6Z" fill="#3d2140" />
      <path d="M68 18l12 12" stroke="#c4cad2" strokeWidth="8" />
    </>
  ),
  cup: (
    <>
      <path d="M28 34h40v26a20 20 0 0 1-40 0Z" fill="#fffaf2" stroke="#c4cad2" strokeWidth="3" />
      <path d="M68 40h10a10 10 0 0 1 0 20h-10" fill="none" stroke="#c4cad2" strokeWidth="4" />
      <path d="M30 40h36v10H30Z" fill="#e0455f" />
    </>
  ),
  nut: (
    <>
      <path d="M50 22l24 14v28L50 78 26 64V36Z" fill="#c9a97e" />
      <circle cx="50" cy="50" r="12" fill="#a8865c" />
    </>
  ),
  duck: (
    <>
      <ellipse cx="52" cy="62" rx="26" ry="18" fill="#ffd166" />
      <circle cx="32" cy="44" r="14" fill="#ffd166" />
      <path d="M18 44h-12l6 6Z" fill="#f4a259" />
      <path d="M20 42h-14a4 4 0 0 0 0 8h14Z" fill="#f4a259" />
      <circle cx="28" cy="41" r="2.5" fill="#3d2140" />
    </>
  ),
  sock: (
    <>
      <path d="M36 18h20v34l18 16a12 12 0 0 1-16 18L34 66V18Z" fill="#68b6d8" />
      <rect x="34" y="18" width="24" height="10" fill="#4a9bc0" />
    </>
  ),
  hat: (
    <>
      <ellipse cx="50" cy="66" rx="36" ry="9" fill="#7a5aa8" />
      <path d="M30 66V38a20 20 0 0 1 40 0v28Z" fill="#8f77d0" />
      <rect x="28" y="56" width="44" height="8" fill="#5b4890" />
    </>
  ),
  hen: (
    <>
      <ellipse cx="52" cy="58" rx="26" ry="22" fill="#e0455f" />
      <circle cx="32" cy="38" r="13" fill="#e8617f" />
      <path d="M28 24q6-8 10 0Z" fill="#c0304a" />
      <path d="M20 40h-8l6 5Z" fill="#ffd166" />
      <circle cx="28" cy="36" r="2.5" fill="#3d2140" />
      <path d="M42 76v8M62 76v8" stroke="#ffd166" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  bat: (
    <>
      <path d="M40 82l6 6 34-46-8-6Z" fill="#c9a97e" />
      <rect x="34" y="76" width="14" height="14" rx="4" fill="#8a6a44" transform="rotate(-38 41 83)" />
    </>
  ),
  bag: (
    <>
      <path d="M26 40h48v42H26Z" fill="#c98159" />
      <path d="M38 40V30a12 12 0 0 1 24 0v10" fill="none" stroke="#8a6a44" strokeWidth="4" />
    </>
  ),
  bed: (
    <>
      <rect x="16" y="46" width="68" height="24" rx="4" fill="#c98159" />
      <rect x="16" y="34" width="16" height="36" rx="4" fill="#a86844" />
      <rect x="30" y="44" width="26" height="12" rx="4" fill="#fffaf2" />
      <path d="M56 44h26v12H56Z" fill="#68b6d8" />
    </>
  ),
  bus: (
    <>
      <rect x="14" y="34" width="72" height="34" rx="6" fill="#ffd166" />
      <rect x="20" y="40" width="18" height="14" rx="3" fill="#cfe6f5" />
      <rect x="42" y="40" width="18" height="14" rx="3" fill="#cfe6f5" />
      <rect x="64" y="40" width="16" height="14" rx="3" fill="#cfe6f5" />
      <circle cx="30" cy="70" r="8" fill="#3d2140" />
      <circle cx="70" cy="70" r="8" fill="#3d2140" />
    </>
  ),
  fan: (
    <>
      <circle cx="50" cy="46" r="26" fill="#cfe6f5" />
      <g fill="#68b6d8">
        <path d="M50 46l0-24a24 24 0 0 1 20 12Z" />
        <path d="M50 46l20 12a24 24 0 0 1-24 12Z" />
        <path d="M50 46l-16 22a24 24 0 0 1-4-34Z" />
      </g>
      <circle cx="50" cy="46" r="5" fill="#5b5b6b" />
      <path d="M50 72v14" stroke="#5b5b6b" strokeWidth="6" />
    </>
  ),
  log: (
    <>
      <rect x="14" y="40" width="72" height="26" rx="13" fill="#a86844" />
      <ellipse cx="14" cy="53" rx="8" ry="13" fill="#c9a97e" />
      <ellipse cx="14" cy="53" rx="4" ry="7" fill="#a86844" />
    </>
  ),
  leg: (
    <>
      <path d="M44 16h14v40l16 20-10 10-20-24Z" fill="#f8d9b0" />
      <path d="M44 78h30v10H40Z" fill="#2f6ea8" />
    </>
  ),
  jam: (
    <>
      <path d="M30 34h40v48H30Z" fill="#e0455f" />
      <rect x="26" y="26" width="48" height="10" rx="3" fill="#c0304a" />
      <rect x="34" y="46" width="32" height="18" rx="3" fill="#fffaf2" />
    </>
  ),
  van: (
    <>
      <path d="M12 40h44v28H12Z" fill="#68b06f" />
      <path d="M56 46h18l12 14v8H56Z" fill="#8fc97a" />
      <rect x="60" y="48" width="14" height="10" rx="2" fill="#cfe6f5" />
      <circle cx="28" cy="70" r="8" fill="#3d2140" />
      <circle cx="70" cy="70" r="8" fill="#3d2140" />
    </>
  ),
  web: (
    <>
      <g stroke="#9aa0aa" strokeWidth="3" fill="none">
        <path d="M50 12v76M12 50h76M22 22l56 56M78 22L22 78" />
        <circle cx="50" cy="50" r="14" />
        <circle cx="50" cy="50" r="26" />
        <circle cx="50" cy="50" r="36" />
      </g>
    </>
  ),
  box: (
    <>
      <path d="M20 40h60v42H20Z" fill="#c9a97e" />
      <path d="M20 40l10-14h40l10 14Z" fill="#dcc49a" />
      <path d="M50 26v56" stroke="#a8865c" strokeWidth="3" />
    </>
  ),
  fox: (
    <>
      <path d="M28 40l-6-18 18 8Z" fill="#f4a259" />
      <path d="M72 40l6-18-18 8Z" fill="#f4a259" />
      <ellipse cx="50" cy="58" rx="24" ry="22" fill="#f4a259" />
      <path d="M50 40q-16 6-16 22t16 18q16-2 16-18t-16-22Z" fill="#fdf5ec" />
      <circle cx="42" cy="52" r="3" fill="#3d2140" />
      <circle cx="58" cy="52" r="3" fill="#3d2140" />
      <path d="M50 62l-3 3h6Z" fill="#3d2140" />
    </>
  ),
  zip: (
    <>
      <rect x="42" y="14" width="16" height="60" rx="3" fill="#9aa0aa" />
      <path d="M36 20h6M36 30h6M36 40h6M58 20h6M58 30h6M58 40h6" stroke="#c4cad2" strokeWidth="4" />
      <rect x="40" y="60" width="20" height="16" rx="4" fill="#5b5b6b" />
    </>
  ),
  ship: (
    <>
      <path d="M16 62h68l-10 18H26Z" fill="#c98159" />
      <path d="M50 14v46" stroke="#8a6a44" strokeWidth="5" />
      <path d="M52 18l24 18-24 10Z" fill="#fffaf2" />
      <path d="M48 24L28 38l20 8Z" fill="#e0455f" />
    </>
  ),
  mug: (
    <>
      <rect x="26" y="34" width="40" height="44" rx="6" fill="#68b6d8" />
      <path d="M66 44h8a10 10 0 0 1 0 20h-8" fill="none" stroke="#68b6d8" strokeWidth="6" />
      <ellipse cx="46" cy="34" rx="20" ry="5" fill="#4a9bc0" />
    </>
  ),
  tap: (
    <>
      <rect x="30" y="24" width="10" height="40" fill="#c4cad2" />
      <path d="M30 30h34v10H40v14h-10Z" fill="#c4cad2" />
      <rect x="20" y="18" width="30" height="8" rx="4" fill="#9aa0aa" />
      <path d="M62 42v18" stroke="#68b6d8" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  tape: (
    <>
      <circle cx="50" cy="50" r="30" fill="#ffd166" />
      <circle cx="50" cy="50" r="12" fill="#fffaf2" />
      <path d="M74 60l16 10-6 8-18-8Z" fill="#f4a259" />
    </>
  ),
  cape: (
    <>
      <path d="M50 18l30 16-10 46H30L20 34Z" fill="#e0455f" />
      <path d="M50 18l30 16-14 4-16-8-16 8-14-4Z" fill="#c0304a" />
    </>
  ),
  kite: (
    <>
      <path d="M50 12l26 26-26 34-26-34Z" fill="#7a5aa8" />
      <path d="M50 12v60M24 38h52" stroke="#a48fe0" strokeWidth="3" />
      <path d="M50 72q10 8 0 16t0 12" stroke="#c9a97e" strokeWidth="3" fill="none" />
    </>
  ),
  stop: (
    <>
      <path d="M32 18h36l14 14v36l-14 14H32L18 68V32Z" fill="#e0455f" />
      <rect x="30" y="44" width="40" height="8" rx="3" fill="#fffaf2" />
    </>
  ),
  frog: (
    <>
      <ellipse cx="50" cy="62" rx="30" ry="22" fill="#6fbf73" />
      <circle cx="34" cy="36" r="13" fill="#6fbf73" />
      <circle cx="66" cy="36" r="13" fill="#6fbf73" />
      <circle cx="34" cy="35" r="8" fill="#fffaf2" />
      <circle cx="66" cy="35" r="8" fill="#fffaf2" />
      <circle cx="35" cy="37" r="4" fill="#3d2140" />
      <circle cx="65" cy="37" r="4" fill="#3d2140" />
      <path d="M34 62q16 12 32 0" stroke="#2f6b3a" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  ),
  flag: (
    <>
      <path d="M30 14v72" stroke="#8a6a44" strokeWidth="6" strokeLinecap="round" />
      <path d="M34 18h44l-10 14 10 14H34Z" fill="#e0455f" />
    </>
  ),
  crab: (
    <>
      <ellipse cx="50" cy="54" rx="26" ry="18" fill="#e0455f" />
      <circle cx="42" cy="48" r="4" fill="#fffaf2" />
      <circle cx="58" cy="48" r="4" fill="#fffaf2" />
      <circle cx="42" cy="48" r="2" fill="#3d2140" />
      <circle cx="58" cy="48" r="2" fill="#3d2140" />
      <path d="M24 46l-14-10 4 14ZM76 46l14-10-4 14Z" fill="#c0304a" />
      <path d="M30 70l-8 12M70 70l8 12" stroke="#c0304a" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  drum: (
    <>
      <rect x="22" y="42" width="56" height="30" rx="4" fill="#e0455f" />
      <ellipse cx="50" cy="42" rx="28" ry="9" fill="#f2e2b8" />
      <path d="M22 46l56 22M78 46L22 68" stroke="#fffaf2" strokeWidth="3" />
      <path d="M60 20l14 18M76 22l-14 16" stroke="#c9a97e" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  nest: (
    <>
      <ellipse cx="50" cy="62" rx="34" ry="18" fill="#c9a97e" />
      <ellipse cx="50" cy="58" rx="24" ry="10" fill="#a8865c" />
      <circle cx="42" cy="56" r="7" fill="#fffaf2" />
      <circle cx="56" cy="56" r="7" fill="#fffaf2" />
    </>
  ),
  lamp: (
    <>
      <path d="M30 40h40l-8-20H38Z" fill="#ffd166" />
      <path d="M50 40v34" stroke="#9aa0aa" strokeWidth="5" />
      <ellipse cx="50" cy="78" rx="20" ry="6" fill="#5b5b6b" />
    </>
  ),
  hand: (
    <>
      <rect x="30" y="44" width="40" height="34" rx="14" fill="#f3c9a2" />
      <rect x="32" y="20" width="10" height="30" rx="5" fill="#f7d4b0" />
      <rect x="45" y="14" width="10" height="36" rx="5" fill="#f7d4b0" />
      <rect x="58" y="20" width="10" height="30" rx="5" fill="#f7d4b0" />
      <rect x="16" y="46" width="18" height="10" rx="5" fill="#f3c9a2" transform="rotate(-20 25 51)" />
    </>
  ),
}

/** A picture for a word, or a friendly placeholder when we have none. */
export function WordPicture({
  word,
  className,
  decorative,
}: Art & { word?: string; decorative?: boolean }) {
  const shapes = word ? P[word] : undefined
  return (
    <svg
      viewBox="0 0 100 100"
      className={['art word-picture', className].filter(Boolean).join(' ')}
      // When a caption already names the picture, the image itself is
      // decorative — otherwise a screen reader announces the word twice.
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': word ?? 'picture' })}
    >
      {shapes ?? (
        <>
          <circle cx="50" cy="50" r="30" fill="#e9e2d6" />
          <path d="M40 44a10 10 0 1 1 12 12v6" stroke="#9aa0aa" strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="52" cy="70" r="3.5" fill="#9aa0aa" />
        </>
      )}
    </svg>
  )
}

export const hasPicture = (word?: string): boolean => !!word && word in P

/* ------------------------------------------------------------------ *
 * Robo
 * ------------------------------------------------------------------ */

export function Robot({
  talking,
  className,
}: Art & { talking?: boolean }) {
  return (
    <svg
      viewBox="0 0 160 170"
      className={['art art-robot', talking ? 'is-talking' : '', className]
        .filter(Boolean)
        .join(' ')}
      role="img"
      aria-label="Robo the robot"
    >
      <path d="M80 16v14" stroke="#9aa0aa" strokeWidth="5" strokeLinecap="round" />
      <circle cx="80" cy="12" r="8" fill="#ffd166" />
      <rect x="30" y="30" width="100" height="72" rx="20" fill="#8fb4d8" />
      <rect x="42" y="44" width="76" height="40" rx="14" fill="#22354a" />
      <circle cx="63" cy="64" r="9" fill="#7ee8d8" />
      <circle cx="97" cy="64" r="9" fill="#7ee8d8" />
      <circle cx="65" cy="61" r="3" fill="#fffaf2" />
      <circle cx="99" cy="61" r="3" fill="#fffaf2" />
      <rect x="20" y="52" width="12" height="26" rx="6" fill="#6b8fb0" />
      <rect x="128" y="52" width="12" height="26" rx="6" fill="#6b8fb0" />
      <rect x="46" y="106" width="68" height="44" rx="12" fill="#a8c6e2" />
      <rect x="58" y="118" width="44" height="20" rx="6" fill="#22354a" />
      <circle cx="70" cy="128" r="4" fill="#ef7d8e" />
      <circle cx="82" cy="128" r="4" fill="#ffd166" />
      <circle cx="94" cy="128" r="4" fill="#7ee8d8" />
      <rect x="52" y="150" width="18" height="14" rx="5" fill="#6b8fb0" />
      <rect x="90" y="150" width="18" height="14" rx="5" fill="#6b8fb0" />
    </svg>
  )
}

/** One pulse per sound. Deliberately no letters — R1 stays letter-free. */
export function SoundPulses({ count, active }: { count: number; active: number }) {
  return (
    <div className="sound-pulses" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`sound-pulse ${i === active ? 'is-active' : ''}`}
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Monster Name Lab
 * ------------------------------------------------------------------ */

const MONSTER_COLOURS = ['#8f77d0', '#68b06f', '#e8617f', '#f4a259', '#68b6d8']

export function LabMonster({ look, className }: Art & { look: MonsterLook }) {
  const body = MONSTER_COLOURS[look.colour % MONSTER_COLOURS.length]
  return (
    <svg
      viewBox="0 0 180 180"
      className={['art art-lab-monster', className].filter(Boolean).join(' ')}
      role="img"
      aria-label="A freshly made monster"
    >
      {Array.from({ length: look.horns }, (_, i) => (
        <path
          key={i}
          d={`M${58 + i * 32} 40l${6} -28l${8} 28Z`}
          fill="#ffd166"
        />
      ))}
      {Array.from({ length: look.feet }, (_, i) => (
        <ellipse
          key={i}
          cx={look.feet === 1 ? 90 : 62 + i * 56}
          cy="164"
          rx="20"
          ry="11"
          fill="#3d2140"
          opacity=".7"
        />
      ))}
      <path
        d="M90 30c40 0 66 30 66 72s-26 62-66 62-66-22-66-62 26-72 66-72Z"
        fill={body}
      />
      <ellipse cx="90" cy="122" rx="40" ry="30" fill="#fffaf2" opacity=".25" />
      {Array.from({ length: look.eyes }, (_, i) => {
        const spread = look.eyes === 1 ? 0 : look.eyes === 2 ? 26 : 32
        const cx = 90 + (i - (look.eyes - 1) / 2) * spread
        return (
          <g key={i}>
            <circle cx={cx} cy="82" r="17" fill="#fffaf2" />
            <circle cx={cx + 2} cy="85" r="8" fill="#3d2140" />
            <circle cx={cx + 5} cy="80" r="3" fill="#fffaf2" />
          </g>
        )
      })}
      <path d="M66 122q24 20 48 0" stroke="#3d2140" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M74 122v8M90 126v8M106 122v8" stroke="#3d2140" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Scenery and small props
 * ------------------------------------------------------------------ */

export function SafariBackdrop({ variant }: { variant: string }) {
  const walls: Record<string, string> = {
    room: '#f3e6d2',
    kitchen: '#e6eff5',
    garden: '#dff0e4',
  }
  return (
    <svg viewBox="0 0 400 220" className="scene-backdrop" preserveAspectRatio="none" aria-hidden="true">
      <rect width="400" height="220" fill={walls[variant] ?? '#f3e6d2'} />
      {variant === 'garden' ? (
        <>
          <rect y="150" width="400" height="70" fill="#a7d59a" />
          <path d="M0 150q90-40 180 0Z" fill="#8fc97a" />
        </>
      ) : (
        <>
          <rect y="160" width="400" height="60" fill="#d9bf95" />
          <rect y="156" width="400" height="6" fill="#b89a6e" />
        </>
      )}
    </svg>
  )
}

export function StoryScene({ variant }: { variant: string }) {
  const skies: Record<string, string> = {
    room: '#f6e9d8',
    garden: '#dff0f7',
    kitchen: '#eef4f9',
    sea: '#cfe8f5',
  }
  return (
    <svg viewBox="0 0 400 160" className="story-scene" preserveAspectRatio="none" aria-hidden="true">
      <rect width="400" height="160" fill={skies[variant] ?? '#f6e9d8'} />
      {variant === 'sea' && (
        <>
          <path d="M0 110q40-16 80 0t80 0 80 0 80 0 80 0v50H0Z" fill="#68b6d8" />
          <circle cx="330" cy="40" r="22" fill="#ffd166" />
        </>
      )}
      {variant === 'garden' && (
        <>
          <rect y="110" width="400" height="50" fill="#a7d59a" />
          <circle cx="340" cy="36" r="22" fill="#ffd166" />
        </>
      )}
      {variant === 'room' && <rect y="120" width="400" height="40" fill="#d9bf95" />}
      {variant === 'kitchen' && <rect y="120" width="400" height="40" fill="#c9d6df" />}
    </svg>
  )
}

export function Gem({ className }: Art) {
  return (
    <svg viewBox="0 0 80 80" className={['art', className].filter(Boolean).join(' ')} aria-hidden="true">
      <path d="M24 12h32l16 20-32 38L8 32Z" fill="#68b6d8" />
      <path d="M24 12l-16 20h64L56 12ZM40 70L24 32h32Z" fill="#8fd4ec" />
      <path d="M8 32h64L40 70Z" fill="#4a9bc0" opacity=".45" />
    </svg>
  )
}

export function Carriage({
  label,
  filled,
  className,
}: Art & { label?: string; filled?: boolean }) {
  return (
    <span className={['carriage', filled ? 'is-filled' : '', className].filter(Boolean).join(' ')}>
      <span className="carriage-body">{label ?? ''}</span>
      <span className="carriage-wheels" aria-hidden="true">
        <i />
        <i />
      </span>
    </span>
  )
}

export function Engine({ className }: Art) {
  return (
    <svg viewBox="0 0 120 90" className={['art art-engine', className].filter(Boolean).join(' ')} aria-hidden="true">
      <rect x="14" y="34" width="70" height="34" rx="8" fill="#e0455f" />
      <rect x="84" y="20" width="24" height="48" rx="6" fill="#c0304a" />
      <rect x="24" y="12" width="16" height="24" rx="4" fill="#c0304a" />
      <circle cx="34" cy="74" r="10" fill="#3d2140" />
      <circle cx="70" cy="74" r="10" fill="#3d2140" />
      <circle cx="96" cy="74" r="8" fill="#3d2140" />
    </svg>
  )
}

export function Wand({ className }: Art) {
  return (
    <svg viewBox="0 0 100 100" className={['art', className].filter(Boolean).join(' ')} aria-hidden="true">
      <path d="M22 82L66 38" stroke="#5b4890" strokeWidth="8" strokeLinecap="round" />
      <path d="M72 12l6 16 16 6-16 6-6 16-6-16-16-6 16-6Z" fill="#ffd166" />
    </svg>
  )
}

export function Ladder({ rungs, done, className }: Art & { rungs: number; done: number }) {
  return (
    <svg
      viewBox="0 0 100 220"
      className={['art art-ladder', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <path d="M28 210V20M72 210V20" stroke="#c9a97e" strokeWidth="9" strokeLinecap="round" />
      {Array.from({ length: rungs }, (_, i) => (
        <path
          key={i}
          d={`M28 ${196 - i * (176 / Math.max(1, rungs))}h44`}
          stroke={i < done ? '#e8613c' : '#e2d3ba'}
          strokeWidth="9"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

export function Detective({ tone, label }: { tone: number; label: string }) {
  const colours = ['#68b6d8', '#f4a259', '#8f77d0']
  const colour = colours[tone % colours.length]
  return (
    <svg viewBox="0 0 100 110" className="art art-detective" aria-hidden="true">
      <ellipse cx="50" cy="24" rx="34" ry="9" fill={colour} />
      <path d="M28 24V16a22 22 0 0 1 44 0v8Z" fill={colour} />
      <circle cx="50" cy="58" r="24" fill="#f8d9b0" />
      <circle cx="42" cy="54" r="3.4" fill="#3d2140" />
      <circle cx="58" cy="54" r="3.4" fill="#3d2140" />
      <path d="M40 68q10 8 20 0" stroke="#3d2140" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M26 88h48v18H26Z" fill={colour} />
      <text
        x="50"
        y="101"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="#fffaf2"
        fontFamily="inherit"
      >
        {label}
      </text>
    </svg>
  )
}
