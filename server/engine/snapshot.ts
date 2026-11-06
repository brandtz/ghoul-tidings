// Builds what browsers may see. This is the secrecy boundary: correct answers,
// the lie and accepted guesses are only read here after a round is revealed.
import { guessValue, zoomStepAt } from '~~/shared/scoring'
import { bingoCard } from '~~/shared/phase2'
import type { Me, PublicRound, PublicSnapshot, WinnerEntry } from '~~/shared/types'
import { db, type Player } from './db'
import { board, playerTotals, teamBoard } from './scores'
import { GUESS_STEPS, currentRound, currentSegment, nextSegment, orderedSegments, segmentItems } from './rounds'
import { nextPrize, prizeDue } from './raffle'
import { eggBoard, hasUnlock } from './codes'

const PRESENCE_MS = () => db().party.settings.presenceMin * 60000
export const presentCount = () => {
  const now = Date.now()
  return db().players.filter(p => !p.removedAt && !p.isHost && now - p.lastSeenAt <= PRESENCE_MS()).length
}

function winners(): WinnerEntry[] {
  const d = db()
  return d.draws.filter(x => x.status !== 'redrawn' && x.status !== 'expired').sort((a, b) => b.drawnAt - a.drawnAt).map((x) => {
    const pl = d.players.find(p => p.id === x.playerId)
    const pr = d.prizes.find(p => p.id === x.prizeId)
    return { name: pl?.displayName ?? '?', avatarKey: pl?.avatarKey ?? 'skelly', prize: pr?.name ?? '', tier: pr?.tier ?? 'swag' }
  })
}

export function publicRound(): PublicRound | null {
  const d = db(); const r = currentRound()
  if (!r) return null
  const seg = currentSegment()
  const items = segmentItems(seg)
  const index = items.findIndex(i => i.id === r.itemId)
  const base: PublicRound = {
    id: r.id, itemType: r.itemType, phase: r.phase, opensAt: r.opensAt, locksAt: r.locksAt,
    index: index + 1, total: items.length, answeredCount: d.answers.filter(a => a.roundId === r.id).length,
  }
  if (r.itemType === 'trivia') {
    const q = d.trivia.find(x => x.id === r.itemId)!
    base.trivia = { prompt: q.prompt, options: q.options, category: q.category, timeLimitS: q.timeLimitS }
  } else if (r.itemType === 'guess') {
    const g = d.guess.find(x => x.id === r.itemId)!
    base.guess = { stepS: g.stepS, steps: GUESS_STEPS }
  } else {
    const t = d.ttl.find(x => x.id === r.itemId)!
    const s = d.players.find(p => p.id === t.playerId)!
    base.ttl = { subject: { id: s.id, name: s.displayName, avatarKey: s.avatarKey }, statements: r.displayOrder.map(i => t.statements[i]!) }
  }
  if (r.phase === 'revealed') base.reveal = r.revealData
  return base
}

function buildMe(p: Player, ranks: ReturnType<typeof board>, totals: Map<string, number>): Me {
  const d = db(); const r = currentRound()
  const rank = ranks.find(x => x.id === p.id)
  const a = r ? d.answers.find(x => x.roundId === r.id && x.playerId === p.id) : null
  let answer: Me['answer'] = null; let result: Me['result'] = null
  if (a) {
    answer = { ...a.payload, zoomStep: a.zoomStep, worth: a.zoomStep ? guessValue(a.zoomStep) : undefined }
    if (r?.phase === 'revealed') {
      const canSelf = r.itemType === 'guess' && !a.isCorrect && Date.now() < (r.revealedAt ?? 0) + 15000
      result = { points: a.points ?? 0, bonus: a.bonus, isCorrect: !!a.isCorrect, canSelfMark: canSelf, selfMarked: !!a.selfMark }
    }
  }
  const t = d.ttl.find(x => x.playerId === p.id)
  const offer = d.draws.find(x => x.playerId === p.id && x.status === 'offered')
  const prize = offer ? d.prizes.find(x => x.id === offer.prizeId) : null
  return {
    id: p.id, name: p.displayName, avatarKey: p.avatarKey, isHost: p.isHost,
    teamId: p.teamId, teamName: d.teams.find(x => x.id === p.teamId)?.name ?? null,
    score: totals.get(p.id) ?? 0, rank: rank?.rank ?? 0, ofPlayers: ranks.length,
    answer, result,
    ttl: t ? { statements: t.statements, lieIndex: t.lieIndex, status: t.status } : null,
    offer: offer && prize ? { drawId: offer.id, prizeName: prize.name, tier: prize.tier, deadline: offer.claimDeadline } : null,
    powerup: p.teamId ? d.teamPowerups[p.teamId] ?? null : null,
    unlocks: { bag: hasUnlock(p.id, 'bag'), console: hasUnlock(p.id, 'console'), bingo: hasUnlock(p.id, 'bingo'), legendary: !!d.party.settings.flags.legendary && hasUnlock(p.id, 'legendary') },
    bingoClaimed: d.bingoClaimed.includes(p.id),
    bingoCard: d.party.settings.flags.bingo && hasUnlock(p.id, 'bingo') ? bingoCard(d.party.settings.bingoSquares, p.id) : null,
  }
}

export function snapshot(player: Player | null): PublicSnapshot {
  const d = db(); const { party } = d; const st = party.state; const s = party.settings
  const ranks = board(); const totals = playerTotals(); const teams = teamBoard()
  const seg = currentSegment()
  const segs = orderedSegments()
  const next = nextSegment()
  const prize = nextPrize()
  const now = Date.now()
  const recent = winners()
  const pres = st.presentation ? d.presentations.find(x => x.id === st.presentation!.id) : null
  const latest = recent[0]
  return {
    v: party.stateVersion,
    serverNow: now,
    party: { name: party.name, slug: party.slug, status: party.status, scheduledStart: party.scheduledStart, startedAt: party.startedAt, durationMin: party.durationMin, joinUrl: s.joinUrl, teamCap: s.teamCap, maxTeams: s.maxTeams, soloMultiplier: s.soloMultiplier },
    paused: { scoring: st.scoringPaused, party: st.partyPaused },
    theme: { p: party.themeOverride ?? st.themeStep, override: party.themeOverride !== null },
    segment: seg ? { id: seg.id, type: seg.type, title: seg.title, index: segs.findIndex(x => x.id === seg.id) + 1, total: segs.length, itemCount: segmentItems(seg).length, itemIndex: st.itemIndex } : null,
    upNext: next ? { type: next.type, title: next.title } : null,
    round: publicRound(),
    raffle: {
      nextDueAt: party.status === 'live' && prize ? prizeDue(prize) : null,
      deferred: st.raffleDeferred,
      drawn: d.prizes.filter(x => x.status === 'drawn' || x.status === 'claimed').length,
      total: d.prizes.length,
      recent: recent.slice(0, 5),
    },
    recentWinner: latest ? { name: latest.name, avatarKey: latest.avatarKey } : null,
    hintRevealed: st.hintRevealed,
    ttl: { opensAt: s.ttlOpensAt, closesAt: s.ttlClosesAt, open: now >= s.ttlOpensAt && now < s.ttlClosesAt },
    top10: ranks.slice(0, 10),
    teams,
    spirit: { value: st.spirit, goal: st.spiritGoal },
    present: presentCount(),
    joined: d.players.filter(p => !p.removedAt).length,
    presentation: pres ? { id: pres.id, title: pres.title, page: st.presentation!.page, pageCount: pres.pageCount } : null,
    finale: seg?.type === 'finale' || party.status === 'ended' ? { podium: ranks.slice(0, 3), teams, recap: recent } : null,
    flags: s.flags,
    eggBoard: eggBoard(),
    me: player ? buildMe(player, ranks, totals) : null,
  }
}

export { zoomStepAt }
