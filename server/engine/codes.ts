// Trick-or-treat codes. Stored as HMAC hashes with a server pepper. The catalog comes
// from the git-ignored catalog/codes.local.json or the host panel, never from the repo.
import { createHmac, randomInt } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { useRuntimeConfig } from '#imports'
import { COOLDOWN_MS, EGG_INDIVIDUAL_MAX, REWARDS, STEAL_MAX, normalizeCode, seededShuffle, tailsFor } from '~~/shared/phase2'
import { db, log, uid, type CodeRow, type Player } from './db'
import { broadcast } from './bus'
import { Validation } from './errors'
import { activeEffect, applyScore } from './scores'

const STARTER = 'UUDDLRLRBA' // Public: the host hint prints it on every screen.
export const hashCode = (text: string) => createHmac('sha256', useRuntimeConfig().emailPepper).update(normalizeCode(text)).digest('hex')

export interface CatalogEntry { code: string; scope: CodeRow['scope']; reward: string; listed?: boolean; label?: string }

export function importCatalog(entries: CatalogEntry[]) {
  const d = db()
  let added = 0
  for (const e of entries) {
    if (!REWARDS[e.reward]) throw Validation(`Unknown reward: ${e.reward}`)
    const codeHash = hashCode(e.code)
    if (d.codes.some(c => c.codeHash === codeHash)) continue
    const text = normalizeCode(e.code)
    d.codes.push({
      id: uid(), codeHash, codeLength: text.length, scope: e.scope, ownerTeamId: null, rewardKey: e.reward, listed: !!e.listed, enabled: true,
      label: e.label ?? REWARDS[e.reward]!.toast, display: e.listed ? e.code : null,
    })
    added++
  }
  d.teams.filter(t => !t.deletedAt).forEach(t => assignTeamCodes(t.id))
  return added
}

export function loadLocalCatalog() {
  const file = resolve(process.cwd(), 'catalog/codes.local.json')
  if (db().codes.length || !existsSync(file)) return
  importCatalog(JSON.parse(readFileSync(file, 'utf8')))
}

/** Gives a team 2 to 3 private codes. Safe to re-run; it also backfills older teams. */
export function assignTeamCodes(teamId: string) {
  const d = db()
  let held = d.codes.filter(c => c.ownerTeamId === teamId).length
  const want = 2 + (teamId.charCodeAt(0) % 2)
  for (const c of d.codes) {
    if (held >= want) break
    if (c.scope === 'team' && !c.ownerTeamId) { c.ownerTeamId = teamId; held++ }
  }
}

const unlocks = (playerId: string) => (db().unlocks[playerId] ??= [])
export const hasUnlock = (playerId: string, key: string) => unlocks(playerId).includes(key)
const eggPoints = (playerId: string) => db().scoreEvents.filter(e => e.playerId === playerId && e.source === 'code').reduce((a, e) => a + e.deltaIndividual, 0)

const nothing = { outcome: 'nothing' as const, effects: [] as any[] }

export function redeem(player: Player, tail: string) {
  const d = db(); const { flags } = d.party.settings
  const now = Date.now()
  const stamps = (d.attemptTimes[player.id] ?? []).filter(t => now - t < 60000)
  d.attemptTimes[player.id] = stamps
  if (stamps.length >= 12) return nothing
  stamps.push(now)

  if (!flags.eggs) {
    const hit = normalizeCode(tail).endsWith(STARTER) && d.party.state.hintRevealed
    return hit ? { outcome: 'treat', effects: [{ key: 'confetti', scope: 'personal', toast: 'Treat! You found a code.' }] } : nothing
  }
  const live = d.codes.filter(c => c.enabled)
  const hashes = new Map(tailsFor(tail, live.map(c => c.codeLength)).map(t => [hashCode(t), t]))
  const code = live.find(c => hashes.has(c.codeHash))
  if (!code) { d.missedAttempts++; return nothing }
  if (code.scope === 'solo' && player.teamId) return nothing

  if (d.redemptions.some(r => r.codeId === code.id && (r.playerId === player.id || (code.scope === 'team' && r.teamId === player.teamId && player.teamId)))) {
    log('code', `${player.displayName} retried a used code: ${code.label}`, {}, player.displayName)
    return { outcome: 'duplicate', effects: [{ key: 'none', scope: 'personal', toast: 'Already in your bag.' }] }
  }
  const reward = REWARDS[code.rewardKey]!
  if (reward.unlock === 'legendary' && !flags.legendary) return nothing
  const scoring = code.scope === 'team' || !!reward.team
  if (scoring && now - (d.lastScoringCode[player.id] ?? 0) < COOLDOWN_MS) return { outcome: 'cooldown', effects: [{ key: 'none', scope: 'personal', toast: 'Your candy bucket needs a moment.' }] }

  const actionId = `code:${uid()}`
  const row = { id: uid(), codeId: code.id, playerId: player.id, teamId: player.teamId, outcome: 'treat' as 'treat' | 'trick' | 'duplicate', scoreEventId: null as string | null, createdAt: now }
  const effects: any[] = []

  if (code.scope === 'team' && code.ownerTeamId && code.ownerTeamId !== player.teamId) {
    row.outcome = 'trick'
    const stolen = trick(player, code.ownerTeamId, code.id, actionId)
    d.redemptions.push(row)
    log('code', `Trick: ${player.displayName} hit a team code (${stolen} moved)`, { actionId }, player.displayName)
    if (stolen) d.lastScoringCode[player.id] = now
    return { outcome: 'trick', effects: [{ key: 'bats', scope: 'personal', toast: stolen ? `Trick! ${stolen} points slipped to another team.` : 'Trick! Luckily you had nothing to lose.' }] }
  }

  if (reward.team || reward.individual) {
    const room = Math.max(0, EGG_INDIVIDUAL_MAX - eggPoints(player.id))
    const ev = applyScore({
      playerId: player.id, teamId: player.teamId, source: 'code', basePoints: player.teamId ? reward.team ?? 0 : 0, individualPoints: Math.min(room, reward.individual ?? 0),
      refType: 'code', refId: code.id, idempotencyKey: `code:${code.id}:player:${player.id}`, actionId, actionLabel: `Code, ${player.displayName}`,
    })
    row.scoreEventId = ev?.id ?? null
    d.lastScoringCode[player.id] = now
  }
  if (reward.unlock && !hasUnlock(player.id, reward.unlock)) unlocks(player.id).push(reward.unlock)
  if (reward.effect) effects.push({ key: reward.effect, scope: 'personal' })
  if (reward.theme !== undefined) effects.push({ key: 'theme', scope: 'personal', p: reward.theme, durationMs: 60000 })
  if (reward.joke) { effects.push({ key: 'joke', scope: 'personal', durationMs: 20000 }); broadcast('ticker', { kind: 'treat', text: `${player.displayName} just became a millionaire. Auditors notified.` }, { bump: false }) }
  effects.push({ key: 'none', scope: 'personal', toast: reward.toast })

  const firstEgg = reward.egg && !d.redemptions.some(r => REWARDS[d.codes.find(c => c.id === r.codeId)?.rewardKey ?? '']?.egg)
  d.redemptions.push(row)
  log('code', `${player.displayName} redeemed: ${code.label}`, { actionId, reversible: scoring }, player.displayName)
  if (firstEgg && d.party.settings.flags.eggHunt) broadcast('effect.global', { key: 'banner', text: 'The hunt is on!' }, { bump: false })
  if (reward.kind === 'treat') broadcast('ticker', { kind: reward.egg ? 'egg' : 'treat', text: `${player.displayName} found a ${reward.egg ? 'hidden egg' : 'treat'}` }, { bump: false })
  broadcast('scores.updated', {})
  return { outcome: reward.kind, effects }
}

/** Moves points from the user's team to the owner's. Solo players and shields lose nothing. */
function trick(player: Player, ownerTeamId: string, codeId: string, actionId: string) {
  if (!player.teamId) return 0
  if (activeEffect(player.teamId, 'shield')) { broadcast('ticker', { kind: 'steal', text: 'A Pumpkin Shield blocked a trick' }, { bump: false }); return 0 }
  const amount = Math.min(STEAL_MAX, 100 + randomInt(0, 4) * 100)
  const base = { source: 'code' as const, individualPoints: 0, refType: 'code', refId: `${codeId}:${player.id}`, actionId, actionLabel: `Trick on ${player.displayName}` }
  applyScore({ ...base, teamId: player.teamId, basePoints: -amount, idempotencyKey: `steal:${codeId}:${player.id}:debit` })
  applyScore({ ...base, teamId: ownerTeamId, basePoints: amount, idempotencyKey: `steal:${codeId}:${player.id}:credit` })
  broadcast('ticker', { kind: 'trick', text: 'A trick just moved points in the team race' }, { bump: false })
  broadcast('scores.updated', {})
  return amount
}

/** The listed subset for this player's team, in that team's shuffled order. */
export function bagFor(player: Player) {
  const d = db()
  const listed = d.codes.filter(c => c.listed && c.enabled && (c.scope !== 'team' || c.ownerTeamId === player.teamId) && (c.scope !== 'solo' || !player.teamId))
  const used = new Set(d.redemptions.filter(r => r.playerId === player.id).map(r => r.codeId))
  return seededShuffle(listed, player.teamId ?? player.id).map((c, i) => (i % 5 === 4
    ? { smudged: true, used: false }
    : { code: c.display, hint: REWARDS[c.rewardKey]!.kind === 'neutral' ? 'Curious' : 'Treat', used: used.has(c.id), smudged: false }))
}

export function eggBoard() {
  const d = db()
  if (!d.party.settings.flags.eggHunt) return null
  const counts = new Map<string, number>()
  for (const r of d.redemptions) if (REWARDS[d.codes.find(c => c.id === r.codeId)?.rewardKey ?? '']?.egg) counts.set(r.playerId, (counts.get(r.playerId) ?? 0) + 1)
  if (!counts.size) return null
  return [...counts].map(([id, eggs]) => { const p = d.players.find(x => x.id === id); return { name: p?.displayName ?? '?', avatarKey: p?.avatarKey ?? 'skelly', eggs } }).sort((a, b) => b.eggs - a.eggs).slice(0, 10)
}

/** Host reveal: shares one undiscovered listed code on every screen. */
export function revealCode(id: string) {
  const c = db().codes.find(x => x.id === id)
  if (!c?.display) throw Validation('Only listed codes can be revealed')
  broadcast('ticker', { kind: 'treat', text: `A code from the host: ${c.display}` }, { bump: false })
  log('code', `Host revealed a code: ${c.label}`, {}, 'host')
}
