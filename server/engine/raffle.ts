// Prize schedule, draws and finale awards. One clock drives raffle, lightning and theme.
// A drawn winner keeps the prize straight away: there is no claim step.
import { randomInt } from 'node:crypto'
import { REWARDS } from '~~/shared/phase2'
import { dueAt, midnightIndex, scheduleProgress } from '~~/shared/schedule'
import { db, log, uid, type Player, type Prize } from './db'
import { broadcast } from './bus'
import { Conflict, NotFound, Validation } from './errors'
import { currentRound } from './rounds'
import { grantPowerups } from './powerups'
import { board } from './scores'

const noticed = new Set<string>()
export const orderedPrizes = () => [...db().prizes].sort((a, b) => a.sortOrder - b.sortOrder)
/** Random draws only. Finale awards sit outside the schedule. */
export const rafflePrizes = () => orderedPrizes().filter(p => p.kind === 'raffle')
export const awardPrizes = () => orderedPrizes().filter(p => p.kind !== 'raffle')

export function effectivePausedMs() {
  const p = db().party
  return p.pausedMs + (p.state.pausedAt ? Date.now() - p.state.pausedAt : 0)
}

export function prizeDue(prize: Prize) {
  const p = db().party
  const list = rafflePrizes()
  const k = list.findIndex(x => x.id === prize.id) + 1
  if (!k) return null
  return dueAt(k, list.length, p.startedAt ?? p.scheduledStart, effectivePausedMs(), p.durationMin)
}
export const midnightPrizeId = () => {
  const list = rafflePrizes()
  const flagged = list.findIndex(x => x.isMidnight)
  return list[midnightIndex(list.length, flagged)]?.id ?? null
}
export const nextPrize = () => rafflePrizes().find(x => x.status === 'pending') ?? null

function eligible(prizeId: string) {
  const d = db(); const now = Date.now()
  const win = d.party.settings.presenceMin * 60000
  const passed = new Set(d.draws.filter(x => x.prizeId === prizeId).map(x => x.playerId))
  const raffleIds = new Set(rafflePrizes().map(p => p.id))
  const winners = new Set(d.draws.filter(x => x.status === 'claimed' && raffleIds.has(x.prizeId)).map(x => x.playerId))
  return d.players.filter(p => !p.removedAt && !p.isHost && p.joinedAt <= now && now - p.lastSeenAt <= win
    && !passed.has(p.id) && !(d.party.settings.noRepeatWinners && winners.has(p.id)))
}

function record(prize: Prize, winner: Player, eligibleCount: number) {
  const d = db()
  const row = { id: uid(), prizeId: prize.id, playerId: winner.id, eligibleCount, drawnAt: Date.now(), status: 'claimed' as const }
  d.draws.push(row)
  prize.status = 'claimed'
  return row
}

export function draw(prizeId: string) {
  const d = db(); const prize = d.prizes.find(x => x.id === prizeId)
  if (!prize) throw NotFound('Prize not found')
  if (prize.kind !== 'raffle') return award(prizeId)
  if (prize.status !== 'pending') throw Conflict('This prize is already handed out')
  const pool = eligible(prizeId)
  if (!pool.length) throw Validation('Nobody is eligible for this draw')
  const winner = pool[randomInt(pool.length)]!
  const now = Date.now()
  const row = record(prize, winner, pool.length)
  const st = d.party.state; const party = d.party
  st.raffleDeferred = false
  const raffles = rafflePrizes()
  const beat = raffles.filter(x => x.status !== 'pending' && x.status !== 'skipped').length
  const isMidnight = midnightPrizeId() === prizeId
  // Every draw moves the look at least one beat, even when the host draws early.
  const beatFloor = beat / (raffles.length + 1)
  st.themeStep = Math.max(st.themeStep, beatFloor, scheduleProgress(now, party.startedAt ?? now, effectivePausedMs(), party.durationMin))
  const reel = pool.slice(0, 24).map(p => p.displayName)
  const data = { drawId: row.id, winner: winner.displayName, avatarKey: winner.avatarKey, playerId: winner.id, prize: prize.name, tier: prize.tier, kind: prize.kind, isMidnight, beat, reel }
  log('raffle', `Draw ${beat} of ${raffles.length}: ${winner.displayName} won ${prize.name} (${pool.length} eligible)`, { drawId: row.id }, 'system')
  grantPowerups()
  broadcast('raffle.drawing', data)
  broadcast('raffle.winner', data)
  broadcast('theme.beat', { beat, isMidnight })
  return row
}

const isEgg = (codeId: string) => !!REWARDS[db().codes.find(c => c.id === codeId)?.rewardKey ?? '']?.egg

/**
 * Who a finale award goes to right now. Ties go to whoever got there first:
 * for best score, the earlier last score change; for eggs, the earlier last egg.
 */
export function awardLeader(kind: Prize['kind']) {
  const d = db()
  const live = new Map(d.players.filter(p => !p.removedAt && !p.isHost).map(p => [p.id, p]))
  let rows: { player: Player; value: number; at: number }[] = []
  if (kind === 'top_score') {
    const last = new Map<string, number>()
    for (const e of d.scoreEvents) if (e.playerId && e.deltaIndividual) last.set(e.playerId, Math.max(last.get(e.playerId) ?? 0, e.createdAt))
    rows = board().filter(r => r.score > 0).map(r => ({ player: live.get(r.id)!, value: r.score, at: last.get(r.id) ?? 0 }))
  } else if (kind === 'most_eggs') {
    const tally = new Map<string, { value: number; at: number }>()
    for (const r of d.redemptions) {
      if (!live.has(r.playerId) || !isEgg(r.codeId)) continue
      const t = tally.get(r.playerId) ?? { value: 0, at: 0 }
      tally.set(r.playerId, { value: t.value + 1, at: Math.max(t.at, r.createdAt) })
    }
    rows = [...tally].map(([id, t]) => ({ player: live.get(id)!, ...t }))
  }
  rows = rows.filter(r => r.player).sort((a, b) => b.value - a.value || a.at - b.at)
  const top = rows[0]
  if (!top) return null
  const tied = rows.filter(r => r.value === top.value && r !== top).map(r => r.player.displayName)
  const detail = kind === 'top_score' ? `${top.value.toLocaleString()} points` : `${top.value} ${top.value === 1 ? 'egg' : 'eggs'}`
  return { player: top.player, value: top.value, detail, tied }
}

export const AWARD_TITLE: Record<string, string> = { top_score: 'Best score', most_eggs: 'Most eggs found' }

export function award(prizeId: string) {
  const d = db(); const prize = d.prizes.find(x => x.id === prizeId)
  if (!prize) throw NotFound('Prize not found')
  if (prize.kind === 'raffle') throw Validation('That prize is a random draw')
  if (prize.status !== 'pending') throw Conflict('This prize is already handed out')
  const lead = awardLeader(prize.kind)
  if (!lead) throw Validation(prize.kind === 'top_score' ? 'Nobody has scored yet' : 'Nobody has found an egg yet')
  const row = record(prize, lead.player, 1)
  const data = { drawId: row.id, winner: lead.player.displayName, avatarKey: lead.player.avatarKey, playerId: lead.player.id, prize: prize.name, tier: prize.tier, kind: prize.kind, award: AWARD_TITLE[prize.kind], detail: lead.detail, isMidnight: false, beat: 0, reel: [] as string[] }
  log('raffle', `Award, ${AWARD_TITLE[prize.kind]}: ${lead.player.displayName} won ${prize.name} (${lead.detail}${lead.tied.length ? `, tie broken over ${lead.tied.join(', ')}` : ''})`, { drawId: row.id }, 'host')
  broadcast('raffle.drawing', data)
  broadcast('raffle.winner', data)
  return row
}

/** Conductor entry point. Fires one due draw unless a round is mid-flight. */
export function fireDueDraw() {
  const d = db(); const { state, status } = d.party
  if (status !== 'live' || state.partyPaused) return
  const prize = nextPrize()
  const due = prize ? prizeDue(prize) : null
  if (!prize || due === null || Date.now() < due) return
  const r = currentRound()
  if (r && r.phase !== 'revealed') {
    if (!state.raffleDeferred) { state.raffleDeferred = true; broadcast('raffle.deferred', { prizeId: prize.id }) }
    return
  }
  try { draw(prize.id) } catch (e: any) { state.raffleDeferred = false; if (!noticed.has(prize.id)) { noticed.add(prize.id); log('error', `Draw waiting: ${e.message}`) } }
}

export function hostAction(prizeId: string, action: string) {
  const d = db(); const prize = d.prizes.find(x => x.id === prizeId)
  if (!prize) throw NotFound('Prize not found')
  const latest = [...d.draws].reverse().find(x => x.prizeId === prizeId && x.status !== 'redrawn')
  const r = currentRound()
  if ((action === 'draw' || action === 'redraw') && r && r.phase !== 'revealed') throw Validation('A round is open. Draw after the reveal.')
  switch (action) {
    case 'draw': return draw(prizeId)
    case 'skip':
      prize.status = 'skipped'
      log('raffle', `Skipped: ${prize.name}`, {}, 'host')
      broadcast('state.changed', {})
      return prize
    case 'unskip':
      if (prize.status === 'skipped') prize.status = 'pending'
      broadcast('state.changed', {})
      return prize
    case 'redraw': {
      // For a no-show, or after a score correction changes who leads an award.
      if (latest) latest.status = 'redrawn'
      const was = d.players.find(p => p.id === latest?.playerId)?.displayName
      if (was) log('raffle', `Redraw: ${was} gives back ${prize.name}`, {}, 'host')
      prize.status = 'pending'
      return draw(prizeId)
    }
    default: throw NotFound('Unknown raffle action')
  }
}
