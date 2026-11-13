// Bingo. The host opens it with the bingo segment and calls squares from the pool.
// Players dab their own cards (kept on their device), then press Bingo! to send the
// card for review. The host sees which dabs were actually called and approves or rejects.
import { BINGO_FREE, bingoCard, hasBingo } from '~~/shared/phase2'
import type { BingoClaimStatus } from '~~/shared/types'
import { db, log, uid, type BingoClaim, type Player } from './db'
import { broadcast } from './bus'
import { Conflict, NotFound, Validation } from './errors'
import { applyScore } from './scores'

const state = () => db().party.state.bingo
const name = (id: string) => db().players.find(p => p.id === id)?.displayName ?? '?'

export function bingoPublic() {
  const d = db(); const b = state()
  const winners = d.bingoClaims.filter(c => c.status === 'approved').sort((a, b) => (a.reviewedAt ?? 0) - (b.reviewedAt ?? 0)).map((c) => {
    const p = d.players.find(x => x.id === c.playerId)
    return { name: p?.displayName ?? '?', avatarKey: p?.avatarKey ?? 'skelly' }
  })
  return { open: b.open, called: b.called, winners, pending: d.bingoClaims.filter(c => c.status === 'pending').length }
}

/** approved beats pending beats a rejected card, so a winner always reads as a winner. */
export function myBingoClaim(playerId: string): BingoClaimStatus | null {
  const mine = db().bingoClaims.filter(c => c.playerId === playerId)
  if (mine.some(c => c.status === 'approved')) return 'approved'
  if (mine.some(c => c.status === 'pending')) return 'pending'
  return mine.length ? 'rejected' : null
}

export function openBingo() {
  const b = state()
  if (b.open) return
  b.open = true
  log('bingo', 'Bingo is open. Every player has a card.', {}, 'host')
  broadcast('state.changed', {})
}

export function closeBingo() {
  state().open = false
  log('bingo', 'Bingo closed', {}, 'host')
  broadcast('state.changed', {})
}

export function callSquare(square?: string) {
  const b = state(); const pool = db().party.settings.bingoSquares
  if (!b.open) throw Conflict('Open bingo first')
  const left = pool.filter(x => !b.called.includes(x))
  if (!left.length) throw Validation('Every square has been called')
  let pick = square?.trim()
  if (pick) {
    if (!pool.includes(pick)) throw NotFound('That square is not in the pool')
    if (b.called.includes(pick)) return pick
  } else pick = left[Math.floor(Math.random() * left.length)]!
  b.called.push(pick)
  log('bingo', `Called: ${pick} (${b.called.length} of ${pool.length})`, {}, 'host')
  broadcast('ticker', { kind: 'treat', text: `Bingo call: ${pick}` }, { bump: false })
  broadcast('state.changed', {})
  return pick
}

export function uncallSquare(square: string) {
  const b = state()
  b.called = b.called.filter(x => x !== square)
  log('bingo', `Call taken back: ${square}`, {}, 'host')
  broadcast('state.changed', {})
}

export function claimBingo(player: Player, marked: number[]) {
  const d = db()
  if (!state().open) throw Conflict('Bingo is closed')
  const status = myBingoClaim(player.id)
  if (status === 'approved') throw Conflict('You already have a bingo. Nicely done.')
  if (status === 'pending') throw Conflict('Your card is with the host')
  const dabs = new Set(marked.filter(i => Number.isInteger(i) && i >= 0 && i < 25))
  dabs.add(BINGO_FREE)
  if (!hasBingo(dabs)) throw Validation('No five in a row yet. Keep dabbing.')
  const claim: BingoClaim = { id: uid(), playerId: player.id, card: bingoCard(d.party.settings.bingoSquares, player.id), marked: [...dabs].sort((a, b) => a - b), status: 'pending', createdAt: Date.now(), reviewedAt: null }
  d.bingoClaims.push(claim)
  log('bingo', `${player.displayName} called BINGO. Review the card in Run of show.`, { claimId: claim.id }, player.displayName)
  broadcast('ticker', { kind: 'treat', text: `${player.displayName} called BINGO! The host is checking the card…` }, { bump: false })
  broadcast('state.changed', {})
  return claim
}

/** Checks a claim against the calls: which dabs were never called, and whether a called line exists. */
export function checkClaim(c: BingoClaim) {
  const called = new Set(state().called)
  const good = new Set(c.marked.filter(i => i === BINGO_FREE || called.has(c.card[i]!)))
  return { verified: hasBingo(good), uncalled: c.marked.filter(i => !good.has(i)) }
}

export function reviewClaim(id: string, approve: boolean) {
  const d = db(); const c = d.bingoClaims.find(x => x.id === id)
  if (!c) throw NotFound('Claim not found')
  if (c.status !== 'pending') throw Conflict('That card was already reviewed')
  const who = name(c.playerId)
  c.reviewedAt = Date.now()
  if (!approve) {
    c.status = 'rejected'
    log('bingo', `Bingo not confirmed for ${who}. They can keep playing.`, {}, 'host')
    broadcast('state.changed', {})
    return c
  }
  const first = !d.bingoClaims.some(x => x.status === 'approved')
  c.status = 'approved'
  const p = d.players.find(x => x.id === c.playerId)
  const pts = d.party.settings.points.bingo + (first ? d.party.settings.points.bingoFirst : 0)
  const actionId = `bingo:${c.id}`
  if (p) applyScore({ playerId: p.id, teamId: p.teamId, source: 'bingo', basePoints: pts, refType: 'bingo', refId: c.id, idempotencyKey: actionId, actionId, actionLabel: `Bingo, ${who}` })
  log('score', `Bingo confirmed: ${who} +${pts}${first ? ' (first bingo)' : ''}`, { actionId, reversible: true }, 'host')
  broadcast('effect.global', { key: 'banner', text: `BINGO! ${who}` }, { bump: false })
  broadcast('ticker', { kind: 'treat', text: `${who} has BINGO! +${pts.toLocaleString()}` }, { bump: false })
  broadcast('scores.updated', {})
  return c
}
