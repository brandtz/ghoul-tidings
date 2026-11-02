// ScoreService: the only code that writes score events.
import { runPipeline, type ScoreCommand } from '~~/shared/scoring'
import type { BoardRow, TeamRow } from '~~/shared/types'
import { trackPosition } from '~~/shared/scoring'
import { db, log, uid } from './db'

export function applyScore(cmd: ScoreCommand) {
  const d = db()
  const prior = d.scoreEvents.find(e => e.idempotencyKey === cmd.idempotencyKey)
  if (prior) return prior
  const { settings, state } = d.party
  const r = runPipeline(cmd, { scoringPaused: state.scoringPaused, teamFrozen: !!cmd.teamId && !!activeEffect(cmd.teamId, 'frozen'), settings: { soloMultiplier: settings.soloMultiplier, caps: settings.caps } })
  if ('reject' in r) return null
  const ev = {
    id: uid(), playerId: r.playerId ?? null, teamId: r.teamId ?? null, deltaIndividual: r.deltaIndividual, deltaTeam: r.deltaTeam,
    source: r.source, refType: r.refType, refId: r.refId, idempotencyKey: r.idempotencyKey, reason: r.reason, createdBy: r.createdBy,
    actionId: r.actionId, actionLabel: r.actionLabel, createdAt: Date.now(),
  }
  d.scoreEvents.push(ev)
  copyToRushTeams(ev)
  return ev
}

export const activeEffect = (teamId: string, kind: string) => {
  const now = Date.now()
  return db().statusEffects.find(e => e.targetId === teamId && e.kind === kind && e.startsAt <= now && now < e.endsAt) ?? null
}

/** Sugar Rush: teams with it active copy half of what other teams gain. */
function copyToRushTeams(ev: { id: string; teamId: string | null; deltaTeam: number; source: string; actionId?: string; actionLabel?: string }) {
  if (ev.deltaTeam <= 0 || ev.source === 'powerup') return
  const now = Date.now()
  for (const fx of db().statusEffects) {
    if (fx.kind !== 'rush' || fx.targetId === ev.teamId || now < fx.startsAt || now >= fx.endsAt) continue
    applyScore({ teamId: fx.targetId, source: 'powerup', basePoints: Math.round(ev.deltaTeam / 2), individualPoints: 0, refType: 'score_event', refId: ev.id, idempotencyKey: `rush:${ev.id}:${fx.targetId}`, actionId: ev.actionId, actionLabel: ev.actionLabel })
  }
}

export function playerTotals() {
  const m = new Map<string, number>()
  for (const e of db().scoreEvents) if (e.playerId) m.set(e.playerId, (m.get(e.playerId) ?? 0) + e.deltaIndividual)
  return m
}
export function teamTotals() {
  const m = new Map<string, number>()
  for (const e of db().scoreEvents) if (e.teamId) m.set(e.teamId, (m.get(e.teamId) ?? 0) + e.deltaTeam)
  return m
}

/** Individual board. Excludes removed players and the host. Ties share a rank. */
export function board(): BoardRow[] {
  const d = db(); const totals = playerTotals()
  const teamName = (id: string | null) => d.teams.find(t => t.id === id)?.name ?? null
  const rows = d.players.filter(p => !p.removedAt && !p.isHost)
    .map(p => ({ id: p.id, name: p.displayName, avatarKey: p.avatarKey, score: totals.get(p.id) ?? 0, rank: 0, teamName: teamName(p.teamId) }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  let rank = 0; let last = Number.NaN
  rows.forEach((r, i) => { if (r.score !== last) { rank = i + 1; last = r.score } r.rank = rank })
  return rows
}

export function teamBoard(): TeamRow[] {
  const d = db(); const totals = teamTotals()
  const teams = d.teams.filter(t => !t.deletedAt)
  const leader = Math.max(0, ...teams.map(t => totals.get(t.id) ?? 0))
  return teams.map((t) => {
    const members = d.players.filter(p => p.teamId === t.id && !p.removedAt)
    const score = totals.get(t.id) ?? 0
    return { id: t.id, name: t.name, mascotKey: t.mascotKey, colorKey: t.colorKey, size: members.length, score, members: members.map(m => ({ name: m.displayName, avatarKey: m.avatarKey })), position: trackPosition(score, leader), effects: ['shield', 'frozen', 'rush', 'sparkle'].filter(k => activeEffect(t.id, k)) }
  }).sort((a, b) => b.score - a.score)
}

/** Most recent score action that has not been reversed yet. */
export function lastAction() {
  const d = db()
  const reversed = new Set(d.scoreEvents.filter(e => e.reversesId).map(e => e.reversesId))
  for (let i = d.scoreEvents.length - 1; i >= 0; i--) {
    const e = d.scoreEvents[i]!
    if (e.reversesId || reversed.has(e.id)) continue
    const actionId = e.actionId ?? e.id
    const events = d.scoreEvents.filter(x => (x.actionId ?? x.id) === actionId && !x.reversesId && !reversed.has(x.id))
    return { actionId, label: e.actionLabel ?? `${e.source} event`, count: events.length, events }
  }
  return null
}

export function reverseAction(actionId: string, actor = 'host') {
  const d = db()
  const reversed = new Set(d.scoreEvents.filter(e => e.reversesId).map(e => e.reversesId))
  const events = d.scoreEvents.filter(x => (x.actionId ?? x.id) === actionId && !x.reversesId && !reversed.has(x.id))
  for (const e of events) {
    d.scoreEvents.push({
      ...e, id: uid(), deltaIndividual: -e.deltaIndividual, deltaTeam: -e.deltaTeam, reversesId: e.id,
      idempotencyKey: `reverse:${e.id}`, createdBy: actor, reason: 'Undo', createdAt: Date.now(),
    })
  }
  if (events.length) log('score', `Undo: ${events[0]!.actionLabel ?? events[0]!.source} · ${events.length} events reversed`, { actionId }, actor)
  return events.length
}
