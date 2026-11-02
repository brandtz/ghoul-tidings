// Prize schedule, draws and claims. One clock drives raffle, lightning and theme.
import { randomInt } from 'node:crypto'
import { dueAt, midnightIndex, scheduleProgress } from '~~/shared/schedule'
import { db, log, uid, type Prize } from './db'
import { broadcast } from './bus'
import { Conflict, NotFound, Validation } from './errors'
import { currentRound } from './rounds'
import { grantPowerups } from './powerups'

const noticed = new Set<string>()
export const orderedPrizes = () => [...db().prizes].sort((a, b) => a.sortOrder - b.sortOrder)

export function effectivePausedMs() {
  const p = db().party
  return p.pausedMs + (p.state.pausedAt ? Date.now() - p.state.pausedAt : 0)
}

export function prizeDue(prize: Prize) {
  const p = db().party
  const list = orderedPrizes()
  const k = list.findIndex(x => x.id === prize.id) + 1
  return dueAt(k, list.length, p.startedAt ?? p.scheduledStart, effectivePausedMs(), p.durationMin)
}
export const midnightPrizeId = () => {
  const list = orderedPrizes()
  const flagged = list.findIndex(x => x.isMidnight)
  return list[midnightIndex(list.length, flagged)]?.id ?? null
}
export const nextPrize = () => orderedPrizes().find(x => x.status === 'pending') ?? null

function eligible(prizeId: string) {
  const d = db(); const now = Date.now()
  const win = d.party.settings.presenceMin * 60000
  const passed = new Set(d.draws.filter(x => x.prizeId === prizeId).map(x => x.playerId))
  const winners = new Set(d.draws.filter(x => x.status === 'offered' || x.status === 'claimed').map(x => x.playerId))
  return d.players.filter(p => !p.removedAt && !p.isHost && p.joinedAt <= now && now - p.lastSeenAt <= win
    && !passed.has(p.id) && !(d.party.settings.noRepeatWinners && winners.has(p.id)))
}

export function draw(prizeId: string) {
  const d = db(); const prize = d.prizes.find(x => x.id === prizeId)
  if (!prize) throw NotFound('Prize not found')
  if (prize.status === 'claimed' || prize.status === 'skipped') throw Conflict('This prize is closed')
  if (d.draws.some(x => x.prizeId === prizeId && x.status === 'offered')) return null
  const pool = eligible(prizeId)
  if (!pool.length) throw Validation('Nobody is eligible for this draw')
  const winner = pool[randomInt(pool.length)]!
  const now = Date.now()
  const row = { id: uid(), prizeId, playerId: winner.id, eligibleCount: pool.length, drawnAt: now, claimDeadline: now + d.party.settings.claimS * 1000, status: 'offered' as const }
  d.draws.push(row)
  prize.status = 'drawn'
  const st = d.party.state; const party = d.party
  st.raffleDeferred = false
  const beat = orderedPrizes().filter(x => x.status !== 'pending' && x.status !== 'skipped').length
  const isMidnight = midnightPrizeId() === prizeId
  // Every draw moves the look at least one beat, even when the host draws early.
  const beatFloor = beat / (d.prizes.length + 1)
  st.themeStep = Math.max(st.themeStep, beatFloor, scheduleProgress(now, party.startedAt ?? now, effectivePausedMs(), party.durationMin))
  const reel = pool.slice(0, 24).map(p => p.displayName)
  const data = { drawId: row.id, winner: winner.displayName, avatarKey: winner.avatarKey, playerId: winner.id, prize: prize.name, tier: prize.tier, isMidnight, beat, reel }
  log('raffle', `Draw ${beat} of ${d.prizes.length}: ${winner.displayName} · ${prize.name} (${pool.length} eligible)`, { drawId: row.id }, 'system')
  grantPowerups()
  broadcast('raffle.drawing', data)
  broadcast('raffle.winner', data)
  broadcast('theme.beat', { beat, isMidnight })
  return row
}

/** Conductor entry point. Fires one due draw unless a round is mid-flight. */
export function fireDueDraw() {
  const d = db(); const { state, status } = d.party
  if (status !== 'live' || state.partyPaused) return
  const prize = nextPrize()
  if (!prize || Date.now() < prizeDue(prize)) return
  const r = currentRound()
  if (r && r.phase !== 'revealed') {
    if (!state.raffleDeferred) { state.raffleDeferred = true; broadcast('raffle.deferred', { prizeId: prize.id }) }
    return
  }
  try { draw(prize.id) } catch (e: any) { state.raffleDeferred = false; if (!noticed.has(prize.id)) { noticed.add(prize.id); log('error', `Draw waiting: ${e.message}`) } }
}

export function expireClaims() {
  const d = db(); const now = Date.now()
  for (const r of d.draws) {
    if (r.status === 'offered' && now > r.claimDeadline) {
      r.status = 'expired'
      const who = d.players.find(p => p.id === r.playerId)?.displayName
      log('raffle', `Claim window ended: ${who}`, { drawId: r.id })
      broadcast('raffle.claimed', { drawId: r.id, expired: true })
    }
  }
}

export function claim(drawId: string, playerId: string) {
  const d = db(); const r = d.draws.find(x => x.id === drawId)
  if (!r || r.playerId !== playerId) throw NotFound('This prize is not yours to claim')
  if (r.status === 'claimed') return r
  if (r.status !== 'offered' || Date.now() > r.claimDeadline + 500) throw Conflict('The claim window has closed')
  r.status = 'claimed'
  const prize = d.prizes.find(x => x.id === r.prizeId)!
  prize.status = 'claimed'
  log('raffle', `Claimed: ${d.players.find(p => p.id === playerId)?.displayName} · ${prize.name}`, { drawId })
  broadcast('raffle.claimed', { drawId })
  return r
}

export function hostAction(prizeId: string, action: string) {
  const d = db(); const prize = d.prizes.find(x => x.id === prizeId)
  if (!prize) throw NotFound('Prize not found')
  const latest = [...d.draws].reverse().find(x => x.prizeId === prizeId)
  const r = currentRound()
  if ((action === 'draw' || action === 'redraw') && r && r.phase !== 'revealed') throw Validation('A round is open. Draw after the reveal.')
  switch (action) {
    case 'draw': return draw(prizeId)
    case 'skip':
      prize.status = 'skipped'
      log('raffle', `Skipped: ${prize.name}`, {}, 'host')
      broadcast('state.changed', {})
      return prize
    case 'redraw':
      if (latest && (latest.status === 'offered' || latest.status === 'expired')) latest.status = 'redrawn'
      prize.status = 'pending'
      return draw(prizeId)
    case 'mark-claimed':
      if (!latest) throw Validation('No winner to mark')
      latest.status = 'claimed'; prize.status = 'claimed'
      log('raffle', `Marked claimed by host: ${prize.name}`, {}, 'host')
      broadcast('raffle.claimed', { drawId: latest.id })
      return latest
    default: throw NotFound('Unknown raffle action')
  }
}

