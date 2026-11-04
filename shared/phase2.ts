// Phase 2 rules that are safe to ship to clients: no code text lives here.
export type CodeScope = 'universal' | 'team' | 'secret' | 'solo'
export type PowerupKind = 'shield' | 'snowball' | 'rush' | 'sparkle'

export interface Reward {
  kind: 'treat' | 'trick' | 'neutral'
  team?: number
  individual?: number
  effect?: string
  theme?: number
  unlock?: 'bag' | 'console' | 'bingo' | 'legendary'
  egg?: boolean
  joke?: boolean
  toast: string
}

export const REWARDS: Record<string, Reward> = {
  treat_small: { kind: 'treat', team: 300, individual: 100, effect: 'confetti', toast: 'Treat! A small handful of candy.' },
  treat_medium: { kind: 'treat', team: 600, individual: 150, effect: 'confetti', toast: 'Treat! A full-size bar.' },
  treat_big: { kind: 'treat', team: 1000, individual: 250, effect: 'confetti', toast: 'Treat! The house with the good candy.' },
  egg_small: { kind: 'treat', team: 200, individual: 100, effect: 'confetti', egg: true, toast: 'You found an egg!' },
  egg_big: { kind: 'treat', team: 500, individual: 200, effect: 'confetti', egg: true, toast: 'You found a rare egg!' },
  gag_bats: { kind: 'neutral', effect: 'bats', toast: 'Something flutters past.' },
  gag_snow: { kind: 'neutral', effect: 'snow', toast: 'A sudden flurry, just for you.' },
  theme_christmas: { kind: 'neutral', theme: 1, toast: 'Your world jumps ahead to Christmas Eve.' },
  theme_halloween: { kind: 'neutral', theme: 0, toast: 'Your world slips back to Halloween.' },
  unlock_bag: { kind: 'treat', unlock: 'bag', effect: 'confetti', toast: 'You found the Trick-or-Treat Bag!' },
  unlock_console: { kind: 'neutral', unlock: 'console', toast: 'Something woke up. Press ~ to talk to it.' },
  unlock_bingo: { kind: 'neutral', unlock: 'bingo', toast: 'A bingo card slid out of the bag.' },
  // Boots the Doom shareware. Works only while the host's Legendary switch is on.
  legendary: { kind: 'treat', unlock: 'legendary', effect: 'lightning', toast: 'Legendary! Something ancient is booting up…' },
  joke_million: { kind: 'neutral', joke: true, effect: 'confetti', toast: '+1,000,000! Surely nothing will go wrong.' },
}

export const POWERUPS: Record<PowerupKind, { name: string; desc: string; durationMs: number }> = {
  shield: { name: 'Pumpkin Shield', desc: 'Blocks tricks that steal your team\'s points.', durationMs: 180_000 },
  snowball: { name: 'Snowball', desc: 'Freezes the leading team\'s gains for 30 seconds.', durationMs: 30_000 },
  rush: { name: 'Sugar Rush', desc: 'Copies half of other teams\' gains for 20 seconds.', durationMs: 20_000 },
  sparkle: { name: 'Victory Sparkle', desc: 'A little shine on your spot in the race.', durationMs: 120_000 },
}

export const TRAILING_POOL: PowerupKind[] = ['shield', 'snowball', 'rush']
export const COOLDOWN_MS = 8000
export const EGG_INDIVIDUAL_MAX = 1000
export const STEAL_MAX = 500
export const BINGO_POINTS = { team: 250, individual: 100 }

/** Teams ranked 0..n-1 by score. The top third are leaders and get cosmetics. */
export const rankBand = (rank: number, teams: number) => (rank < Math.max(1, Math.ceil(teams / 3)) ? 'leader' : 'trailing')

export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')

/** One tail per known code length. Nothing about a near miss can leak from this. */
export const tailsFor = (buffer: string, lengths: number[]) => {
  const b = normalizeCode(buffer).slice(-32)
  return [...new Set(lengths)].filter(l => l > 0 && l <= b.length).map(l => b.slice(-l))
}

/** Same order for a team every time, different between teams. */
export function seededShuffle<T>(list: T[], seed: string) {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    const j = Math.abs(h) % (i + 1)
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export const BINGO_SQUARES = [
  'You are on mute', 'Can you see my screen?', 'Dog in the background', 'Someone says "circle back"', 'Camera off, cat on', 'Next slide, please',
  'Who just joined?', 'Sorry, go ahead', 'Frozen face', 'Let\'s take that offline', 'Echo on the line', 'Wrong window shared',
  'FREE', 'Lunch on camera', 'Doorbell rings', 'Two people talk at once', 'Holiday sweater spotted', 'Virtual background glitch',
  'Someone says "quick question"', 'Coffee refill', 'Calendar pop-up', 'Kid cameo', 'Great job, team', 'Reaction spam', 'Running a few minutes late',
]

export const hasBingo = (marked: Set<number>) => {
  const lines: number[][] = []
  for (let i = 0; i < 5; i++) { lines.push([0, 1, 2, 3, 4].map(n => i * 5 + n)); lines.push([0, 1, 2, 3, 4].map(n => n * 5 + i)) }
  lines.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20])
  return lines.some(l => l.every(n => marked.has(n) || n === 12))
}
