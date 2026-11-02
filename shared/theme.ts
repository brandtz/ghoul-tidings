// One number, p from 0 to 1, drives every color and scene layer.
// Values come straight from renderVals() in Shell.dc.html and the handoff tables.
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const ramp = (p: number, a: number, b: number) => clamp((p - a) / (b - a))

const hex = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const mix = (a: string, b: string, t: number) => {
  const A = hex(a); const B = hex(b)
  return '#' + A.map((v, i) => Math.round(v + (B[i]! - v) * t).toString(16).padStart(2, '0')).join('')
}
const k3 = (p: number, a: string, b: string, c: string) => (p <= 0.5 ? mix(a, b, p / 0.5) : mix(b, c, (p - 0.5) / 0.5))

export const KEYFRAMES = {
  skyTop: ['#080914', '#1B0F2E', '#2A0A18'],
  skyMid: ['#24103F', '#3C183A', '#4B1025'],
  skyLow: ['#4B2380', '#79334C', '#9F2739'],
  moon: ['#F2A04A', '#F3E3D0', '#F0C8B8'],
  panel: ['#0D0B1C', '#150B1E', '#1E0A14'],
  border: ['#E0782A', '#D9AA60', '#D9AA60'],
  border2: ['#F2B33D', '#F3E3B8', '#F3E9D8'],
  text: ['#F3EEF9', '#F6EEF4', '#F3E9D8'],
  muted: ['#B9ADD0', '#D0BCCB', '#D9C3B0'],
  groundBack: ['#0A0813', '#1A0F22', '#2A0F1B'],
  groundFront: ['#120D1E', '#241528', '#341522'],
  snow: ['#E4DEF0', '#EDE3EE', '#F3E9D8'],
} as const
export type ColorToken = keyof typeof KEYFRAMES

export interface Theme {
  p: number
  colors: Record<ColorToken | 'glow' | 'panelFill', string>
  layers: Record<string, number>
}

export const layersAt = (p: number): Record<string, number> => ({
  stars: 0.8 * (1 - ramp(p, 0.55, 0.95)),
  skyline: 1 - ramp(p, 0.3, 0.8),
  fog: 1 - ramp(p, 0.1, 0.5),
  webs: 1 - ramp(p, 0.18, 0.5),
  bats: 1 - ramp(p, 0.2, 0.55),
  pumpkins: 1 - 0.65 * ramp(p, 0.4, 0.95),
  frost: ramp(p, 0.03, 0.22),
  caps: ramp(p, 0.04, 0.22),
  snowBack: 0.9 * ramp(p, 0.1, 0.75),
  snowFront: 0.95 * ramp(p, 0.3, 0.95),
  flakes: 0.9 * ramp(p, 0.05, 0.8),
  firBack: ramp(p, 0.22, 0.6),
  firFront: ramp(p, 0.45, 0.85),
  lights: ramp(p, 0.28, 0.65),
  garland: ramp(p, 0.36, 0.72),
  ornaments: ramp(p, 0.45, 0.85),
  gifts: ramp(p, 0.45, 0.9),
  snowman: ramp(p, 0.7, 0.95),
  bow: ramp(p, 0.6, 0.92),
  crest: 1 - ramp(p, 0.4, 0.75),
  sleigh: ramp(p, 0.84, 0.98),
})

// playerOverride is the Phase 2 personal-theme seam. The stage never passes it.
export function themeAt(progress: number, playerOverride?: number | null): Theme {
  const p = clamp(playerOverride ?? progress)
  const colors = {} as Theme['colors']
  for (const k of Object.keys(KEYFRAMES) as ColorToken[]) {
    const [a, b, c] = KEYFRAMES[k]
    colors[k] = k3(p, a, b, c)
  }
  colors.panelFill = colors.panel + 'F0' // 94% opaque
  colors.glow = colors.border + '55' // 33% alpha
  return { p, colors, layers: layersAt(p) }
}

/** WCAG relative-luminance contrast ratio for two #RRGGBB colors. */
export function contrast(a: string, b: string) {
  const lum = (h: string) => {
    const [r, g, bl] = hex(h).map((v) => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}
