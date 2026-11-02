// The pure half of ScoreService: pipeline modifiers and point formulas.
export type ScoreSource = 'trivia' | 'guess' | 'ttl_participation' | 'ttl_spot' | 'ttl_fool' | 'admin' | 'code' | 'powerup'

export interface ScoreSettings {
  soloMultiplier: number
  caps: Record<string, number>
}
export const DEFAULT_CAPS: Record<string, number> = {
  trivia: 2500, guess: 2500, ttl_participation: 2500, ttl_spot: 2500, ttl_fool: 2500, admin: 2500, code: 2000, powerup: 2000,
  code_individual: 500, powerup_individual: 500,
}

export interface ScoreCommand {
  playerId?: string | null
  teamId?: string | null
  source: ScoreSource
  basePoints: number
  /** Codes pay the team and the player different amounts. */
  individualPoints?: number
  refType: string
  refId: string
  idempotencyKey: string
  reason?: string
  actionId?: string
  actionLabel?: string
  createdBy?: string
}
export interface ScoreContext { scoringPaused: boolean; settings: ScoreSettings; teamFrozen?: boolean }
export interface Working extends ScoreCommand { deltaIndividual: number; deltaTeam: number }
export type Modifier = (c: Working, ctx: ScoreContext) => Working | { reject: string }

export const pauseModifier: Modifier = (c, ctx) =>
  ctx.scoringPaused && c.source !== 'admin' ? { reject: 'Scoring is paused' } : c

export const soloModifier: Modifier = (c, ctx) =>
  c.source === 'trivia' && !c.teamId ? { ...c, deltaIndividual: Math.round(c.deltaIndividual * ctx.settings.soloMultiplier) } : c

export const splitModifier: Modifier = c => ({ ...c, deltaIndividual: c.individualPoints ?? c.deltaIndividual, deltaTeam: c.teamId ? c.basePoints : 0 })

export const capModifier: Modifier = (c, ctx) => {
  const cap = ctx.settings.caps[c.source] ?? 2500
  const solo = ctx.settings.caps[`${c.source}_individual`] ?? cap
  const lim = (v: number, m: number) => Math.max(-m, Math.min(m, v))
  return { ...c, deltaIndividual: lim(c.deltaIndividual, solo), deltaTeam: lim(c.deltaTeam, cap) }
}

/** A frozen team keeps earning individual points, but its race gains stop. Debits still land. */
export const freezeModifier: Modifier = (c, ctx) => (ctx.teamFrozen && c.deltaTeam > 0 ? { ...c, deltaTeam: 0 } : c)

export const PIPELINE: Modifier[] = [pauseModifier, soloModifier, splitModifier, capModifier, freezeModifier]

export function runPipeline(cmd: ScoreCommand, ctx: ScoreContext, pipeline = PIPELINE) {
  let w: Working = { ...cmd, deltaIndividual: cmd.basePoints, deltaTeam: 0 }
  for (const m of pipeline) {
    const r = m(w, ctx)
    if ('reject' in r) return r
    w = r
  }
  return w
}

export const speedBonus = (remainingMs: number, limitMs: number) =>
  Math.round(500 * Math.max(0, Math.min(1, remainingMs / limitMs)))

export const guessValue = (step: number) => 1500 - 200 * (Math.max(1, Math.min(6, step)) - 1)

export const zoomStepAt = (elapsedMs: number, stepS: number) =>
  Math.max(1, Math.min(6, Math.floor(elapsedMs / (stepS * 1000)) + 1))

export const trackPosition = (teamScore: number, leaderScore: number) =>
  Math.max(teamScore, 0) / Math.max(leaderScore, 1000)
