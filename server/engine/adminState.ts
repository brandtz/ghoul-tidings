// Host-only view of the party. Contains answers, so it is never sent to a player
// and the stage thumbnail must keep reading the public snapshot instead.
import { db } from './db'
import { clientCount } from './bus'
import { lastAction, playerTotals, teamBoard } from './scores'
import { currentRound, currentSegment, orderedSegments, segmentItems } from './rounds'
import { midnightPrizeId, nextPrize, orderedPrizes, prizeDue } from './raffle'
import { presentCount } from './snapshot'

function itemDetail(id?: string, type?: string) {
  const d = db()
  if (!id) return null
  if (type === 'trivia') { const q = d.trivia.find(x => x.id === id)!; return { type, title: q.prompt, options: q.options, correctIndex: q.correctIndex, meta: `${q.category} · ${q.timeLimitS} s` } }
  if (type === 'guess') { const g = d.guess.find(x => x.id === id)!; return { type, title: 'Guess the Thing image', answer: g.answerDisplay, accepted: g.acceptedAnswers, imageId: g.id, meta: `${g.stepS} s per zoom` } }
  const t = d.ttl.find(x => x.id === id)!
  return { type, title: d.players.find(p => p.id === t.playerId)?.displayName ?? '?', options: t.statements, correctIndex: t.lieIndex, meta: '20 s · correct marks the lie' }
}

export function adminState() {
  const d = db(); const { party } = d; const st = party.state
  const totals = playerTotals(); const now = Date.now()
  const seg = currentSegment(); const r = currentRound()
  const items = segmentItems(seg)
  const undo = lastAction()
  const prize = nextPrize()
  const mid = midnightPrizeId()
  const ordered = orderedSegments()
  const nextSeg = ordered.find(s => !st.doneSegments.includes(s.id) && s.id !== seg?.id) ?? null
  return {
    v: party.stateVersion,
    serverNow: now,
    party: { name: party.name, status: party.status, startedAt: party.startedAt, scheduledStart: party.scheduledStart, durationMin: party.durationMin, pausedMs: party.pausedMs, themeOverride: party.themeOverride, settings: party.settings, state: st },
    segments: ordered.map((s) => {
      const list = segmentItems(s)
      const status = s.id === seg?.id ? 'Live' : st.doneSegments.includes(s.id) ? 'Done' : s.id === nextSeg?.id ? 'Up next' : s.type === 'finale' ? 'Locked' : 'Ready'
      const sub = s.type === 'trivia' ? `${list.length} questions` : s.type === 'guess' ? `${list.length} images · 5 s per zoom` : s.type === 'ttl' ? `${list.length} approved · 20 s each` : s.type === 'presentation' ? 'Slides' : s.type === 'finale' ? 'Podium, finish line, recap' : 'Join card on stage'
      return { id: s.id, type: s.type, title: s.title, status, sub: s.id === seg?.id && list.length ? `${sub} · now on ${st.itemIndex + 1}` : sub, itemCount: list.length }
    }),
    current: seg ? {
      segment: { id: seg.id, title: seg.title, type: seg.type }, itemIndex: st.itemIndex, itemCount: items.length,
      item: itemDetail(items[st.itemIndex]?.id, items[st.itemIndex]?.type),
      next: itemDetail(items[st.itemIndex + 1]?.id, items[st.itemIndex + 1]?.type),
      round: r ? { id: r.id, phase: r.phase, opensAt: r.opensAt, locksAt: r.locksAt, answered: d.answers.filter(a => a.roundId === r.id).length } : null,
    } : null,
    nextSegment: nextSeg ? { id: nextSeg.id, title: nextSeg.title, type: nextSeg.type } : null,
    trivia: d.trivia, guess: d.guess, presentations: d.presentations,
    ttl: d.ttl.map((t) => {
      const p = d.players.find(x => x.id === t.playerId)
      return { ...t, player: p?.displayName ?? '?', avatarKey: p?.avatarKey ?? 'skelly', teamName: d.teams.find(x => x.id === p?.teamId)?.name ?? 'Lone wolf' }
    }).sort((a, b) => a.playOrder - b.playOrder),
    prizes: orderedPrizes().map((p, i) => {
      const draw = [...d.draws].reverse().find(x => x.prizeId === p.id)
      return { ...p, index: i + 1, dueAt: prizeDue(p), isMidnightDraw: p.id === mid, draw: draw ? { id: draw.id, status: draw.status, claimDeadline: draw.claimDeadline, eligibleCount: draw.eligibleCount, winner: d.players.find(x => x.id === draw.playerId)?.displayName ?? '?' } : null }
    }),
    nextPrize: prize ? { id: prize.id, name: prize.name, tier: prize.tier, dueAt: prizeDue(prize), index: orderedPrizes().findIndex(x => x.id === prize.id) + 1 } : null,
    players: d.players.map(p => ({
      id: p.id, name: p.displayName, avatarKey: p.avatarKey, teamId: p.teamId, teamName: d.teams.find(t => t.id === p.teamId)?.name ?? 'Lone wolf',
      score: totals.get(p.id) ?? 0, lastSeenAt: p.lastSeenAt, joinedAt: p.joinedAt, removed: !!p.removedAt, isHost: p.isHost,
      status: p.removedAt ? 'Removed' : now - p.lastSeenAt <= party.settings.presenceMin * 60000 ? 'Present' : 'Away',
    })).sort((a, b) => b.score - a.score),
    teams: teamBoard(),
    log: d.log.slice(0, 200),
    present: presentCount(),
    clients: clientCount(),
    undo: undo ? { actionId: undo.actionId, label: undo.label, count: undo.count } : null,
    codes: d.codes.map(c => ({ id: c.id, scope: c.scope, rewardKey: c.rewardKey, label: c.label, listed: c.listed, enabled: c.enabled, canReveal: !!c.display, team: d.teams.find(t => t.id === c.ownerTeamId)?.name ?? null, uses: d.redemptions.filter(r => r.codeId === c.id).length })),
    missedAttempts: d.missedAttempts,
    powerups: Object.entries(d.teamPowerups).map(([teamId, kind]) => ({ team: d.teams.find(t => t.id === teamId)?.name ?? '?', kind })),
  }
}
