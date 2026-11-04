// Effect registry. Phase 2 adds new effects here with no plumbing changes.
export interface EffectDef {
  scope: 'global' | 'personal'
  layer: 'canvas' | 'lightning' | 'banner' | 'sprite'
  durationMs: number
  particles?: 'snow' | 'confetti' | 'bats'
  reducedMotion: 'none' | 'glow' | 'fade'
}
export const EFFECTS: Record<string, EffectDef> = {}
export function registerEffect(key: string, def: EffectDef) { EFFECTS[key] = def }

registerEffect('lightning', { scope: 'global', layer: 'lightning', durationMs: 900, reducedMotion: 'glow' })
registerEffect('snow', { scope: 'global', layer: 'canvas', durationMs: 6000, particles: 'snow', reducedMotion: 'none' })
registerEffect('bats', { scope: 'global', layer: 'canvas', durationMs: 6000, particles: 'bats', reducedMotion: 'none' })
registerEffect('confetti', { scope: 'global', layer: 'canvas', durationMs: 5000, particles: 'confetti', reducedMotion: 'none' })
registerEffect('spirit', { scope: 'global', layer: 'canvas', durationMs: 4000, particles: 'confetti', reducedMotion: 'none' })
registerEffect('banner', { scope: 'global', layer: 'banner', durationMs: 6000, reducedMotion: 'fade' })
registerEffect('sleigh', { scope: 'global', layer: 'sprite', durationMs: 7500, reducedMotion: 'none' })
