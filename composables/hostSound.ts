// The two sounds the host may enable, synthesized so no audio assets ship.
function tone(ctx: AudioContext, freq: number, at: number, length: number, gain = 0.2) {
  const osc = ctx.createOscillator(); const g = ctx.createGain()
  osc.type = 'sine'; osc.frequency.value = freq
  g.gain.setValueAtTime(gain, ctx.currentTime + at)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + length)
  osc.connect(g).connect(ctx.destination)
  osc.start(ctx.currentTime + at); osc.stop(ctx.currentTime + at + length)
}
export function playSting() {
  const ctx = new AudioContext()
  ;[523, 659, 784].forEach((f, i) => tone(ctx, f, i * 0.12, 0.5))
}
export function playChime() {
  const ctx = new AudioContext()
  for (let i = 0; i < 12; i++) { tone(ctx, 440, i * 0.6, 1.4, 0.18); tone(ctx, 880, i * 0.6, 0.8, 0.06) }
}
