// Round lifecycle shared by all three games: open, answer, lock, reveal, next.
import { randomInt } from 'node:crypto'
import { guessValue, speedBonus, zoomStepAt } from '~~/shared/scoring'
import { isMatch } from '~~/shared/match'
import type { ItemType, SegmentType } from '~~/shared/types'
import { db, log, uid, save, type Answer, type Player, type Round, type Segment } from './db'
import { broadcast } from './bus'
import { Conflict, NotFound, Validation } from './errors'
import { applyScore } from './scores'
import { fireDueDraw } from './raffle'

const OPEN_BUFFER_MS = 1500
const RAFFLE_BEAT_MS = 8500
export const GUESS_STEPS = 6
const SELF_MARK_MS = 15000

export const orderedSegments = () => [...db().segments].sort((a, b) => a.sortOrder - b.sortOrder)
export const currentSegment = () => db().segments.find(s => s.id === db().party.state.segmentId) ?? null
export const currentRound = () => db().rounds.find(r => r.id === db().party.state.roundId) ?? null

export function segmentItems(seg: Segment | null): { id: string; type: ItemType }[] {
  if (!seg) return []
  const d = db()
  if (seg.type === 'trivia') return d.trivia.filter(q => q.segmentId === seg.id).sort((a, b) => a.sortOrder - b.sortOrder).map(q => ({ id: q.id, type: 'trivia' }))
  if (seg.type === 'guess') return d.guess.filter(g => g.segmentId === seg.id).sort((a, b) => a.sortOrder - b.sortOrder).map(g => ({ id: g.id, type: 'guess' }))
  if (seg.type === 'ttl') return d.ttl.filter(t => t.status === 'approved').sort((a, b) => a.playOrder - b.playOrder).map(t => ({ id: t.id, type: 'ttl' }))
  return []
}

export function nextSegment() {
  const { doneSegments, segmentId } = db().party.state
  return orderedSegments().find(s => !doneSegments.includes(s.id) && s.id !== segmentId) ?? null
}

export function startSegment(segmentId?: string) {
  const d = db(); const st = d.party.state
  if (st.roundId && currentRound()?.phase !== 'revealed') throw Validation('Finish the open round first')
  if (st.segmentId) endSegment(false)
  const seg = segmentId ? d.segments.find(s => s.id === segmentId) : nextSegment()
  if (!seg) throw NotFound('No segment left to start')
  st.segmentId = seg.id; st.itemIndex = 0; st.roundId = null
  if (seg.type === 'finale') st.themeStep = 1
  log('state', `Segment started: ${seg.title}`, { segmentId: seg.id }, 'host')
  broadcast('state.changed', { segment: seg.title })
  return seg
}

export function endSegment(announce = true) {
  const st = db().party.state; const seg = currentSegment()
  if (!seg) return
  if (!st.doneSegments.includes(seg.id)) st.doneSegments.push(seg.id)
  st.segmentId = null; st.roundId = null; st.itemIndex = -1; st.presentation = null
  log('state', `Segment ended: ${seg.title}`, { segmentId: seg.id }, 'host')
  if (announce) broadcast('state.changed', {})
}

function timeLimitFor(type: ItemType, itemId: string) {
  const d = db()
  if (type === 'trivia') return d.trivia.find(q => q.id === itemId)!.timeLimitS
  if (type === 'guess') return d.guess.find(g => g.id === itemId)!.stepS * GUESS_STEPS
  return 20
}

export function openRound() {
  const d = db(); const st = d.party.state; const seg = currentSegment()
  if (!seg) throw Validation('Start a segment first')
  if (st.roundId) throw Conflict('A round is already running')
  const item = segmentItems(seg)[st.itemIndex]
  if (!item) throw Validation('No items left in this segment')
  const now = Date.now()
  // The raffle beat never covers an open question: answers start once the overlay clears.
  const lastDraw = Math.max(0, ...d.draws.map(x => x.drawnAt))
  const opensAt = Math.max(now + OPEN_BUFFER_MS, lastDraw + RAFFLE_BEAT_MS)
  const order = [0, 1, 2]
  if (item.type === 'ttl') for (let i = 2; i > 0; i--) { const j = randomInt(i + 1); [order[i], order[j]] = [order[j]!, order[i]!] }
  const round: Round = {
    id: uid(), segmentId: seg.id, itemType: item.type, itemId: item.id, phase: 'open',
    opensAt, locksAt: opensAt + timeLimitFor(item.type, item.id) * 1000, revealedAt: null, displayOrder: order,
  }
  d.rounds.push(round); st.roundId = round.id
  log('state', `Round opened: ${seg.title} ${st.itemIndex + 1}`, { roundId: round.id }, 'host')
  broadcast('round.opened', { roundId: round.id })
  return round
}

export function lockRound() {
  const r = currentRound()
  if (!r || r.phase !== 'open') return null
  r.phase = 'locked'
  broadcast('round.locked', { roundId: r.id })
  return r
}

export function submitAnswer(player: Player, roundId: string, body: { choice?: number; text?: string }) {
  const d = db(); const r = d.rounds.find(x => x.id === roundId)
  if (!r) throw NotFound('Round not found')
  const now = Date.now()
  if (r.phase !== 'open' || now > r.locksAt + 500) throw Conflict('This round is closed')
  if (now < r.opensAt) throw Conflict('This round has not opened yet')
  if (d.answers.some(a => a.roundId === r.id && a.playerId === player.id)) throw Conflict('You already answered')
  if (r.itemType === 'ttl' && d.ttl.find(t => t.id === r.itemId)?.playerId === player.id) throw Conflict('You cannot vote on your own round')
  if (r.itemType === 'guess' ? !body.text?.trim() : !(typeof body.choice === 'number' && body.choice >= 0 && body.choice < (r.itemType === 'trivia' ? 4 : 3))) {
    throw Validation('That answer is not valid')
  }
  const a: Answer = { id: uid(), roundId: r.id, playerId: player.id, payload: body.text ? { text: body.text.trim().slice(0, 80) } : { choice: body.choice }, submittedAt: now }
  if (r.itemType === 'guess') {
    const stepS = d.guess.find(g => g.id === r.itemId)!.stepS
    a.zoomStep = zoomStepAt(now - r.opensAt, stepS)
  }
  d.answers.push(a)
  save()
  broadcast('answers.count', { roundId: r.id, count: d.answers.filter(x => x.roundId === r.id).length }, { bump: false })
  return a
}

export function revealRound() {
  const d = db(); const st = d.party.state; const r = currentRound()
  if (!r) throw Validation('No round to reveal')
  if (r.phase === 'revealed') return r
  if (st.scoringPaused) throw Validation('Scoring is paused. Resume it before revealing.')
  r.phase = 'revealed'; r.revealedAt = Date.now()
  const answers = d.answers.filter(a => a.roundId === r.id)
  const label = `Reveal ${roundLabel(r)}`
  const actionId = `reveal:${r.id}`
  const pay = (a: Answer, source: 'trivia' | 'guess' | 'ttl_spot', points: number) => {
    const p = d.players.find(x => x.id === a.playerId)
    if (!p) return 0
    const ev = applyScore({ playerId: p.id, teamId: p.teamId, source, basePoints: points, refType: 'round', refId: r.id, idempotencyKey: `round:${r.id}:player:${p.id}`, actionId, actionLabel: label })
    return ev?.deltaIndividual ?? 0
  }
  const firstCorrect = (list: Answer[]) => d.players.find(p => p.id === [...list].sort((a, b) => a.submittedAt - b.submittedAt)[0]?.playerId)?.displayName ?? null

  if (r.itemType === 'trivia') {
    const q = d.trivia.find(x => x.id === r.itemId)!
    const limit = q.timeLimitS * 1000
    const dist = [0, 0, 0, 0]
    for (const a of answers) {
      dist[a.payload.choice!]!++
      a.isCorrect = a.payload.choice === q.correctIndex
      if (a.isCorrect) {
        a.bonus = speedBonus(r.locksAt - a.submittedAt, limit)
        a.points = pay(a, 'trivia', d.party.settings.points.triviaBase + a.bonus)
      } else a.points = 0
    }
    r.revealData = { correctIndex: q.correctIndex, distribution: dist, fastest: firstCorrect(answers.filter(a => a.isCorrect)) }
  } else if (r.itemType === 'guess') {
    const g = d.guess.find(x => x.id === r.itemId)!
    for (const a of answers) {
      a.isCorrect = isMatch(a.payload.text ?? '', g.acceptedAnswers)
      a.points = a.isCorrect ? pay(a, 'guess', guessValue(a.zoomStep ?? 6)) : 0
    }
    const right = answers.filter(a => a.isCorrect)
    r.revealData = { answerDisplay: g.answerDisplay, correctCount: right.length, first: firstCorrect(right) }
  } else {
    const t = d.ttl.find(x => x.id === r.itemId)!
    const lieDisplayIndex = r.displayOrder.indexOf(t.lieIndex)
    const dist = [0, 0, 0]; let fooled = 0
    for (const a of answers) {
      dist[a.payload.choice!]!++
      a.isCorrect = a.payload.choice === lieDisplayIndex
      if (a.isCorrect) a.points = pay(a, 'ttl_spot', d.party.settings.points.ttlSpot)
      else { a.points = 0; fooled++ }
    }
    const subject = d.players.find(p => p.id === t.playerId)
    if (subject && fooled) {
      const pts = Math.min(d.party.settings.points.ttlFoolMax, fooled * d.party.settings.points.ttlFool)
      applyScore({ playerId: subject.id, teamId: subject.teamId, source: 'ttl_fool', basePoints: pts, refType: 'round', refId: r.id, idempotencyKey: `round:${r.id}:fool`, actionId, actionLabel: label })
    }
    r.revealData = { correctIndex: lieDisplayIndex, distribution: dist, fooled }
  }
  log('score', `${label} · ${answers.length} answers`, { roundId: r.id }, 'host')
  broadcast('round.revealed', { roundId: r.id })
  fireDueDraw()
  return r
}

export function roundLabel(r: Round) {
  const prefix = r.itemType === 'trivia' ? 'Q' : r.itemType === 'guess' ? 'Guess ' : 'Two Truths '
  const seg = db().segments.find(s => s.id === r.segmentId) ?? null
  const i = segmentItems(seg).findIndex(x => x.id === r.itemId)
  return `${prefix}${i + 1}`
}

export function selfMark(player: Player, roundId: string) {
  const d = db(); const r = d.rounds.find(x => x.id === roundId)
  if (!r || r.itemType !== 'guess' || r.phase !== 'revealed') throw Conflict('Self-marking is closed')
  if (Date.now() > (r.revealedAt ?? 0) + SELF_MARK_MS) throw Conflict('Self-marking is closed')
  const a = d.answers.find(x => x.roundId === r.id && x.playerId === player.id)
  if (!a) throw Validation('You did not answer this round')
  if (a.isCorrect) throw Conflict('You already got this one')
  a.isCorrect = true; a.selfMark = true
  const actionId = `selfmark:${a.id}`
  const ev = applyScore({ playerId: player.id, teamId: player.teamId, source: 'guess', basePoints: guessValue(a.zoomStep ?? 6), refType: 'answer', refId: a.id, idempotencyKey: `round:${r.id}:player:${player.id}`, actionId, actionLabel: `Self-mark by ${player.displayName}` })
  a.points = ev?.deltaIndividual ?? 0
  log('self', `${player.displayName} self-marked "I got it" on ${roundLabel(r)}: "${a.payload.text}"`, { actionId, reversible: true }, player.displayName)
  broadcast('scores.updated', {})
  return a
}

export function advance(direction: 1 | -1 = 1) {
  const d = db(); const st = d.party.state; const seg = currentSegment()
  if (!seg) throw Validation('No segment running')
  const r = currentRound()
  if (r && r.phase !== 'revealed' && direction === 1) throw Validation('Reveal or skip this round first')
  st.roundId = null
  const items = segmentItems(seg)
  const next = st.itemIndex + direction
  if (direction === 1 && next >= items.length) { endSegment(); return }
  st.itemIndex = Math.max(0, next)
  broadcast('state.changed', {})
}

export function skipRound() {
  const d = db(); const st = d.party.state; const r = currentRound()
  if (r) {
    d.rounds = d.rounds.filter(x => x.id !== r.id)
    d.answers = d.answers.filter(a => a.roundId !== r.id)
    st.roundId = null
    log('state', 'Round skipped, no points paid', { roundId: r.id }, 'host')
  }
  advance(1)
  fireDueDraw()
}

export const liveSegmentTypes: SegmentType[] = ['trivia', 'guess', 'ttl']
