// Ghoul Bingo: classic 75-ball bingo. B 1-15, I 16-30, N 31-45, G 46-60, O 61-75.
// Cards are row-major 5x5 arrays with 0 as the FREE centre.
import { seededShuffle } from './phase2'

export type BallPattern = 'line' | 'corners' | 'blackout'
export const BALL_FREE = 12
export const LETTERS = ['B', 'I', 'N', 'G', 'O'] as const
export const PATTERN_LABEL: Record<BallPattern, string> = { line: 'Any line', corners: 'Four corners', blackout: 'Full card' }
export const PATTERN_HELP: Record<BallPattern, string> = {
  line: 'Five in a row: across, down or diagonal.',
  corners: 'All four corner squares.',
  blackout: 'Every square on the card.',
}
/** Game 1 is any line, game 2 four corners, then full cards. */
export const defaultPattern = (game: number): BallPattern => (game <= 1 ? 'line' : game === 2 ? 'corners' : 'blackout')

export const letterOf = (n: number) => LETTERS[Math.min(4, Math.floor((n - 1) / 15))]!
export const ballLabel = (n: number) => `${letterOf(n)} ${n}`

/** This player's card for this game. The same seed always gives the same card. */
export function ballCard(seed: string): number[] {
  const cols = LETTERS.map((_, c) => seededShuffle(Array.from({ length: 15 }, (_, i) => c * 15 + i + 1), `${seed}:${c}`).slice(0, 5))
  const card: number[] = []
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) card.push(r === 2 && c === 2 ? 0 : cols[c]![r]!)
  return card
}

const LINES: number[][] = (() => {
  const l: number[][] = []
  for (let i = 0; i < 5; i++) { l.push([0, 1, 2, 3, 4].map(n => i * 5 + n)); l.push([0, 1, 2, 3, 4].map(n => n * 5 + i)) }
  l.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20])
  return l
})()

/** Does this set of card positions complete the pattern? The centre always counts. */
export function meetsPattern(marked: Set<number>, pattern: BallPattern) {
  const has = (i: number) => i === BALL_FREE || marked.has(i)
  if (pattern === 'corners') return [0, 4, 20, 24].every(has)
  if (pattern === 'blackout') return Array.from({ length: 25 }, (_, i) => i).every(has)
  return LINES.some(l => l.every(has))
}
