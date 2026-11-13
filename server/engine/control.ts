// Party-wide controls: go live, pause, conductor tick, demo crowd.
import { randomInt } from 'node:crypto'
import type { H3Event } from 'h3'
import { readBody } from 'h3'
import type { ZodType } from 'zod'
import { AVATAR_KEYS } from '~~/shared/catalog'
import { db, log, resetDb, teamsOn, uid, type Player } from './db'
import { broadcast } from './bus'
import { Conflict, Validation } from './errors'
import { fireDueDraw } from './raffle'
import { currentRound, lockRound, segmentItems, currentSegment, submitAnswer, startSegment } from './rounds'
import { ensureSeedImages } from './images'
import { createTeam } from './teams'

export async function parseBody<T>(event: H3Event, schema: ZodType<T>): Promise<T> {
  const raw = await readBody(event).catch(() => ({}))
  const r = schema.safeParse(raw ?? {})
  if (!r.success) throw Validation(r.error.issues[0]?.message ?? 'Invalid input')
  return r.data
}

/** No double-fire: two admin tabs pressing Space cannot both advance. */
export function assertVersion(v: number | undefined) {
  if (v !== undefined && v !== db().party.stateVersion) throw Conflict('The show moved on. Refreshed, press again if you still want this.')
}

/** Standard write envelope. Phase 2 personal effects ride in effects. */
export const envelope = (data: any = null, effects: any[] = []) => ({ data, effects, v: db().party.stateVersion })

export function goLive() {
  const p = db().party
  if (p.status === 'live') return
  p.status = 'live'
  p.startedAt = p.startedAt ?? Date.now()
  log('state', 'Party is live', {}, 'host')
  broadcast('state.changed', {})
}
export function endParty() {
  const p = db().party
  p.status = 'ended'
  p.state.themeStep = 1
  log('state', 'Party ended', {}, 'host')
  broadcast('state.changed', {})
}
export async function resetParty() {
  resetDb()
  await ensureSeedImages()
  broadcast('state.changed', { reset: true })
}

export function setPause(kind: 'scoring' | 'party', on: boolean) {
  const p = db().party; const st = p.state
  if (kind === 'scoring') st.scoringPaused = on
  else {
    if (on && !st.partyPaused) st.pausedAt = Date.now()
    if (!on && st.partyPaused && st.pausedAt) { p.pausedMs += Date.now() - st.pausedAt; st.pausedAt = null }
    st.partyPaused = on
  }
  log('state', `${kind === 'scoring' ? 'Scoring' : 'Party'} ${on ? 'paused' : 'resumed'}`, {}, 'host')
  broadcast('party.paused', { kind, on })
}

export function tick(conductorId: string) {
  const d = db(); const st = d.party.state; const now = Date.now()
  const c = st.conductor
  if (c && c.id !== conductorId && now - c.at < 5000) return { active: false }
  st.conductor = { id: conductorId, at: now }
  const r = currentRound()
  if (r?.phase === 'open' && now >= r.locksAt) lockRound()
  driveDemoCrowd()
  fireDueDraw()
  return { active: true }
}

// ---- Demo crowd, for testing the show without sixty coworkers ----
const NAMES = ['Dana K.', 'Marcus L.', 'Jo A.', 'Sam R.', 'Wei T.', 'Ines P.', 'Carlos M.', 'Nia B.', 'Theo G.', 'Ruth E.', 'Omar S.', 'Lena V.', 'Pat D.', 'Taylor M.', 'Morgan S.', 'Jamie L.', 'Chris P.', 'Alex R.']
const isDemo = (p: Player) => p.emailHash.startsWith('demo:')

export function addDemoCrowd() {
  const d = db()
  const names = NAMES.filter(n => !d.players.some(p => p.displayName === n))
  const teams = !teamsOn() || d.teams.filter(t => !t.deletedAt).length ? [] : [['Pumpkin Patrol', 'jack', 'pumpkin'], ['Moonlit Mob', 'elfbat', 'violet'], ['Frost Bites', 'franken', 'frost'], ['Holly Jollies', 'skelly', 'holly']]
  teams.forEach(([name, mascotKey, colorKey]) => createTeam(null, { name: name!, mascotKey: mascotKey!, colorKey: colorKey! }))
  const live = d.teams.filter(t => !t.deletedAt)
  names.forEach((n, i) => {
    const team = !teamsOn() || i % 4 === 3 ? null : live[i % live.length]
    const size = d.players.filter(p => p.teamId === team?.id).length
    const p: Player = { id: uid(), displayName: n, emailHash: `demo:${uid()}`, avatarKey: AVATAR_KEYS[i % AVATAR_KEYS.length]!, teamId: team && size < d.party.settings.teamCap ? team.id : null, isHost: false, removedAt: null, joinedAt: Date.now(), lastSeenAt: Date.now() }
    d.players.push(p)
  })
  log('join', `${names.length} demo players joined`, {}, 'host')
  broadcast('state.changed', {})
}

function driveDemoCrowd() {
  const d = db(); const now = Date.now()
  const crowd = d.players.filter(p => isDemo(p) && !p.removedAt)
  if (!crowd.length) return
  crowd.forEach((p) => { p.lastSeenAt = now })
  const r = currentRound()
  if (!r || r.phase !== 'open' || now < r.opensAt) return
  const seg = currentSegment(); const item = segmentItems(seg)[d.party.state.itemIndex]
  if (!item) return
  for (const p of crowd) {
    if (d.answers.some(a => a.roundId === r.id && a.playerId === p.id) || randomInt(4) !== 0) continue
    try {
      if (r.itemType === 'guess') {
        const g = d.guess.find(x => x.id === r.itemId)!
        submitAnswer(p, r.id, { text: randomInt(2) ? g.acceptedAnswers[0]! : 'gingerbread house' })
      } else if (r.itemType === 'trivia') {
        const q = d.trivia.find(x => x.id === r.itemId)!
        submitAnswer(p, r.id, { choice: randomInt(2) ? q.correctIndex : randomInt(4) })
      } else submitAnswer(p, r.id, { choice: randomInt(3) })
    } catch { /* subject of their own round */ }
  }
}

export { startSegment }
