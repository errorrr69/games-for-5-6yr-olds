/**
 * Gentle, optional sound. Synthesised with WebAudio so there are no
 * asset downloads and nothing can ever blast at full volume.
 *
 * Nothing here is required to play a game (spec §28).
 */

export type SoundName = 'click' | 'pop' | 'chime' | 'hop' | 'munch' | 'bloom'

const STORAGE_KEY = 'florie:sound'

let context: AudioContext | null = null

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setSoundEnabled(on: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    /* preferences are a nicety, not a requirement */
  }
}

type Tone = { freq: number; at: number; length: number; gain: number; type?: OscillatorType }

const VOICES: Record<SoundName, Tone[]> = {
  click: [{ freq: 440, at: 0, length: 0.06, gain: 0.05, type: 'triangle' }],
  pop: [{ freq: 620, at: 0, length: 0.09, gain: 0.07, type: 'sine' }],
  hop: [
    { freq: 520, at: 0, length: 0.08, gain: 0.06, type: 'sine' },
    { freq: 780, at: 0.06, length: 0.1, gain: 0.05, type: 'sine' },
  ],
  munch: [
    { freq: 180, at: 0, length: 0.09, gain: 0.06, type: 'square' },
    { freq: 140, at: 0.08, length: 0.1, gain: 0.05, type: 'square' },
  ],
  chime: [
    { freq: 660, at: 0, length: 0.18, gain: 0.06, type: 'sine' },
    { freq: 880, at: 0.1, length: 0.24, gain: 0.05, type: 'sine' },
    { freq: 1180, at: 0.2, length: 0.3, gain: 0.04, type: 'sine' },
  ],
  bloom: [
    { freq: 523, at: 0, length: 0.2, gain: 0.05, type: 'sine' },
    { freq: 659, at: 0.09, length: 0.22, gain: 0.05, type: 'sine' },
    { freq: 784, at: 0.18, length: 0.34, gain: 0.045, type: 'sine' },
  ],
}

export function play(name: SoundName): void {
  if (!soundEnabled()) return
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') void context.resume()
    const now = context.currentTime
    for (const tone of VOICES[name]) {
      const osc = context.createOscillator()
      const gain = context.createGain()
      osc.type = tone.type ?? 'sine'
      osc.frequency.value = tone.freq
      gain.gain.setValueAtTime(0.0001, now + tone.at)
      gain.gain.exponentialRampToValueAtTime(tone.gain, now + tone.at + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.at + tone.length)
      osc.connect(gain).connect(context.destination)
      osc.start(now + tone.at)
      osc.stop(now + tone.at + tone.length + 0.02)
    }
  } catch {
    /* audio is blocked or unavailable — the lesson carries on */
  }
}
