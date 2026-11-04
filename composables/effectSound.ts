// Effect sounds, synthesized like the host chime so no audio assets ship.
// Every screen with a live shell plays them. Each viewer can mute; the choice sticks per device.
import { ref } from 'vue'

const KEY = 'gt_muted'
export const muted = ref(false)
/** False until the browser lets this page play audio, which needs one tap or key press. */
export const audible = ref(false)
let ctx: AudioContext | null = null
let master: GainNode | null = null

function ac() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination)
    ctx.onstatechange = () => { audible.value = ctx!.state === 'running' }
    audible.value = ctx.state === 'running'
  }
  return ctx
}
export function unlockAudio() { ac().resume().catch(() => {}) }

let wired = false
export function initEffectSound() {
  try { muted.value = localStorage.getItem(KEY) === '1' } catch {}
  if (wired) return
  wired = true
  const unlock = () => { unlockAudio(); if (audible.value) { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock) } }
  window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock)
  ac()
}
export function setMuted(v: boolean) {
  muted.value = v
  try { localStorage.setItem(KEY, v ? '1' : '0') } catch {}
  if (!v) unlockAudio()
}

// ---- building blocks ----
type Wave = OscillatorType
function tone(f: number, at: number, len: number, o: { gain?: number; type?: Wave; to?: number; attack?: number } = {}) {
  const c = ac(); const t = c.currentTime + at
  const osc = c.createOscillator(); const g = c.createGain()
  osc.type = o.type ?? 'sine'; osc.frequency.setValueAtTime(f, t)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + len)
  const a = o.attack ?? 0.005
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.gain ?? 0.2, t + a)
  g.gain.exponentialRampToValueAtTime(0.0001, t + len)
  osc.connect(g).connect(master!); osc.start(t); osc.stop(t + len + 0.05)
}
let noiseBuf: AudioBuffer | null = null
function noise(at: number, len: number, o: { gain?: number; type?: BiquadFilterType; freq?: number; q?: number; to?: number; attack?: number } = {}) {
  const c = ac(); const t = c.currentTime + at
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true
  const f = c.createBiquadFilter(); f.type = o.type ?? 'lowpass'; f.frequency.setValueAtTime(o.freq ?? 1000, t); f.Q.value = o.q ?? 1
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + len)
  const g = c.createGain(); const a = o.attack ?? 0.005
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.gain ?? 0.3, t + a)
  g.gain.exponentialRampToValueAtTime(0.0001, t + len)
  src.connect(f).connect(g).connect(master!); src.start(t, Math.random()); src.stop(t + len + 0.05)
}
const bell = (f: number, at: number, len = 0.9, gain = 0.12) => {
  tone(f, at, len, { gain, type: 'sine' }); tone(f * 2.76, at, len * 0.4, { gain: gain * 0.35 }); tone(f * 5.4, at, len * 0.2, { gain: gain * 0.15 })
}
const jingle = (at: number, gain = 0.08) => noise(at, 0.12, { type: 'highpass', freq: 6500, q: 2, gain })

// ---- one sound per effect ----
const SOUNDS: Record<string, (p: number) => void> = {
  lightning() {
    noise(0, 0.25, { type: 'highpass', freq: 1200, gain: 0.35 })
    noise(0.15, 2.4, { type: 'lowpass', freq: 600, to: 80, gain: 0.5, attack: 0.08 })
    tone(48, 0.15, 2.2, { gain: 0.25, type: 'triangle', to: 32, attack: 0.1 })
  },
  bats() {
    for (let i = 0; i < 14; i++) {
      const at = i * 0.22 + Math.random() * 0.1
      tone(3800 + Math.random() * 2200, at, 0.07, { gain: 0.05, to: 2400 })
      noise(at, 0.09, { type: 'bandpass', freq: 900, q: 0.8, gain: 0.08 })
    }
  },
  snow() {
    const notes = [1568, 1760, 2093, 2349, 2637, 3136]
    for (let i = 0; i < 16; i++) bell(notes[Math.floor(Math.random() * notes.length)]!, i * 0.28 + Math.random() * 0.1, 1.1, 0.05)
    noise(0, 4, { type: 'bandpass', freq: 5000, q: 0.5, gain: 0.02, attack: 1.2 })
  },
  confetti() {
    noise(0, 0.08, { type: 'bandpass', freq: 1800, q: 1.2, gain: 0.6 }); noise(0.18, 0.08, { type: 'bandpass', freq: 2200, q: 1.2, gain: 0.5 })
    tone(330, 0.3, 0.6, { type: 'sawtooth', gain: 0.06, to: 880, attack: 0.04 })
    ;[784, 988, 1175, 1568].forEach((f, i) => bell(f, 0.9 + i * 0.09, 0.8, 0.08))
  },
  spirit() {
    ;[523, 659, 784].forEach((f, i) => tone(f, i * 0.14, 0.3, { type: 'triangle', gain: 0.16 }))
    tone(1047, 0.42, 1.1, { type: 'triangle', gain: 0.18 }); tone(784, 0.42, 1.1, { type: 'triangle', gain: 0.1 })
    tone(659, 0.42, 1.1, { type: 'square', gain: 0.03 })
  },
  // Spooky side: an eerie two-note swoop. Christmas side: a bright bell call.
  banner(p) {
    if (p < 0.5) {
      tone(440, 0, 0.9, { type: 'sine', gain: 0.12, to: 660, attack: 0.15 }); tone(466, 0.7, 1.2, { type: 'sine', gain: 0.1, to: 330, attack: 0.1 })
      tone(220, 0, 1.8, { type: 'triangle', gain: 0.05, attack: 0.3 })
    } else {
      bell(1319, 0, 1.2, 0.14); bell(1047, 0.25, 1.6, 0.14)
      for (let i = 0; i < 6; i++) jingle(i * 0.12, 0.05)
    }
  },
  sleigh() {
    for (let i = 0; i < 36; i++) jingle(i * 0.2 + (i % 2) * 0.05, 0.07)
    // The opening of Jingle Bells (1857, public domain) on bells, then a low "ho ho ho".
    const E = 659; const G = 784; const C = 523; const D = 587; const F = 698
    const tune: [number, number][] = [[E, 0], [E, 0.3], [E, 0.6], [E, 1.2], [E, 1.5], [E, 1.8], [E, 2.4], [G, 2.7], [C, 3.0], [D, 3.3], [E, 3.6], [F, 4.5], [F, 4.8]]
    for (const [f, at] of tune) bell(f, at + 0.4, 0.7, 0.1)
    for (let i = 0; i < 3; i++) {
      tone(150 - i * 12, 5.6 + i * 0.45, 0.35, { type: 'sawtooth', gain: 0.05, to: 110 - i * 10, attack: 0.03 })
      noise(5.6 + i * 0.45, 0.3, { type: 'bandpass', freq: 520, q: 4, gain: 0.08, attack: 0.03 })
    }
  },
}
export const SOUND_KEYS = Object.keys(SOUNDS)

export function playEffectSound(key: string, p = 0) {
  if (muted.value || !SOUNDS[key]) return
  const c = ac()
  // Still locked: try to resume for next time, but a late sound would be out of sync.
  if (c.state !== 'running') { c.resume().catch(() => {}); return }
  try { SOUNDS[key]!(p) } catch { /* audio is best effort */ }
}
