// Admin content CRUD, grouped by kind. Every action logs and broadcasts.
import { z } from 'zod'
import { TEAM_COLORS } from '~~/shared/catalog'
import { BINGO_MIN } from '~~/shared/phase2'
import { db, log, uid } from './db'
import { broadcast } from './bus'
import { NotFound, Validation } from './errors'
import { applyScore } from './scores'
import { moveTeam } from './teams'
import { importCatalog, revealCode } from './codes'

const id = z.object({ id: z.string() })
const order = z.object({ ids: z.array(z.string()) })
const trivia = z.object({
  id: z.string().optional(), segmentId: z.string(), prompt: z.string().min(1).max(200), options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3), category: z.string().default(''), timeLimitS: z.number().int().min(5).max(60).default(10),
})

function csvRows(text: string) {
  const rows: string[][] = []; let row: string[] = []; let cur = ''; let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++ } else if (c === '"') q = false; else cur += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(cur); cur = '' }
    else if (c === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = '' }
    else cur += c
  }
  if (cur || row.length) { row.push(cur); rows.push(row) }
  return rows.filter(r => r.some(Boolean))
}

type Handler = (input: any) => any
const notify = () => broadcast('state.changed', {})

export const CONTENT: Record<string, Record<string, Handler>> = {
  trivia: {
    save(raw) {
      const q = trivia.parse(raw); const d = db()
      if (q.id) {
        const row = d.trivia.find(x => x.id === q.id)
        if (!row) throw NotFound('Question not found')
        Object.assign(row, q)
      } else d.trivia.push({ ...q, id: uid(), sortOrder: d.trivia.filter(x => x.segmentId === q.segmentId).length + 1 })
    },
    delete(raw) { const { id: i } = id.parse(raw); db().trivia = db().trivia.filter(x => x.id !== i) },
    reorder(raw) { const { ids } = order.parse(raw); ids.forEach((i, n) => { const q = db().trivia.find(x => x.id === i); if (q) q.sortOrder = n + 1 }) },
    import(raw) {
      const { segmentId, csv } = z.object({ segmentId: z.string(), csv: z.string() }).parse(raw)
      const rows = csvRows(csv).filter(r => r[0]?.toLowerCase() !== 'prompt')
      let n = 0
      for (const r of rows) {
        const [prompt, a, b, c, dd, correct, category, seconds] = r
        const idx = 'abcd'.indexOf((correct ?? '').trim().toLowerCase())
        if (!prompt || !a || !b || !c || !dd || idx < 0) throw Validation(`Row ${n + 1} is missing a field or its correct letter`)
        const q = trivia.parse({ segmentId, prompt, options: [a, b, c, dd], correctIndex: idx, category, timeLimitS: Number(seconds) || 10 })
        db().trivia.push({ ...q, id: uid(), sortOrder: db().trivia.filter(x => x.segmentId === segmentId).length + 1 })
        n++
      }
      return { imported: n }
    },
  },
  guess: {
    save(raw) {
      const { id: i, answerDisplay, acceptedAnswers, stepS } = z.object({ id: z.string(), answerDisplay: z.string().min(1), acceptedAnswers: z.array(z.string()).min(1), stepS: z.number().int().min(2).max(15).default(5) }).parse(raw)
      const g = db().guess.find(x => x.id === i)
      if (!g) throw NotFound('Item not found')
      Object.assign(g, { answerDisplay, acceptedAnswers, stepS })
    },
    delete(raw) { const { id: i } = id.parse(raw); db().guess = db().guess.filter(x => x.id !== i) },
  },
  ttl: {
    approve(raw) {
      const { id: i } = id.parse(raw); const d = db(); const t = d.ttl.find(x => x.id === i)
      if (!t) throw NotFound('Submission not found')
      t.status = 'approved'
      t.playOrder = Math.max(0, ...d.ttl.map(x => x.playOrder)) + 1
      const p = d.players.find(x => x.id === t.playerId)
      if (p) {
        applyScore({ playerId: p.id, teamId: p.teamId, source: 'ttl_participation', basePoints: d.party.settings.points.ttlParticipation, refType: 'ttl', refId: t.id, idempotencyKey: `ttl:${t.id}:participation`, actionId: `ttl:${t.id}`, actionLabel: `Two Truths bonus, ${p.displayName}` })
        log('score', `${p.displayName} +750 · Two Truths approved`, {}, 'host')
      }
    },
    hide(raw) { const { id: i } = id.parse(raw); const t = db().ttl.find(x => x.id === i); if (t) t.status = 'hidden' },
    pending(raw) { const { id: i } = id.parse(raw); const t = db().ttl.find(x => x.id === i); if (t) t.status = 'pending' },
    edit(raw) {
      const { id: i, statements, lieIndex } = z.object({ id: z.string(), statements: z.array(z.string().min(1).max(120)).length(3), lieIndex: z.number().int().min(0).max(2) }).parse(raw)
      const t = db().ttl.find(x => x.id === i)
      if (!t) throw NotFound('Submission not found')
      t.statements = statements; t.lieIndex = lieIndex
    },
    reorder(raw) { const { ids } = order.parse(raw); ids.forEach((i, n) => { const t = db().ttl.find(x => x.id === i); if (t) t.playOrder = n + 1 }) },
  },
  prizes: {
    save(raw) {
      const p = z.object({ id: z.string().optional(), name: z.string().min(1), tier: z.enum(['swag', 'special', 'grand']), kind: z.enum(['raffle', 'top_score', 'most_eggs']).default('raffle'), notes: z.string().default(''), isMidnight: z.boolean().default(false) }).parse(raw)
      const d = db()
      if (p.isMidnight) d.prizes.forEach((x) => { x.isMidnight = false })
      if (p.id) Object.assign(d.prizes.find(x => x.id === p.id) ?? {}, p)
      else d.prizes.push({ ...p, id: uid(), sortOrder: d.prizes.length + 1, status: 'pending' })
    },
    delete(raw) { const { id: i } = id.parse(raw); db().prizes = db().prizes.filter(x => x.id !== i) },
    reorder(raw) { const { ids } = order.parse(raw); ids.forEach((i, n) => { const p = db().prizes.find(x => x.id === i); if (p) p.sortOrder = n + 1 }) },
  },
  settings: {
    save(raw) {
      const s = z.object({
        name: z.string().min(1).optional(), durationMin: z.number().int().min(1).max(180).optional(), scheduledStart: z.number().optional(),
        joinUrl: z.string().optional(), flags: z.record(z.string(), z.boolean()).optional(), teamCap: z.number().int().min(2).max(20).optional(), maxTeams: z.number().int().min(2).max(10).optional(),
        soloMultiplier: z.number().min(1).max(3).optional(), noRepeatWinners: z.boolean().optional(),
        ttlOpensAt: z.number().optional(), ttlClosesAt: z.number().optional(), points: z.record(z.string(), z.number()).optional(),
        caps: z.record(z.string(), z.number()).optional(), hostSound: z.object({ chime: z.boolean(), sting: z.boolean() }).optional(),
        bingoSquares: z.array(z.string().trim().min(1).max(60)).optional(),
      }).parse(raw)
      if (s.bingoSquares) {
        s.bingoSquares = [...new Set(s.bingoSquares.filter(x => x.toUpperCase() !== 'FREE'))]
        if (s.bingoSquares.length < BINGO_MIN) throw Validation(`Bingo needs at least ${BINGO_MIN} different squares (you have ${s.bingoSquares.length})`)
        if (s.bingoSquares.length > 100) throw Validation('Keep bingo to 100 squares or fewer')
      }
      const p = db().party
      if (s.name) p.name = s.name
      if (s.durationMin) p.durationMin = s.durationMin
      if (s.scheduledStart) p.scheduledStart = s.scheduledStart
      const { name: _n, durationMin: _d, scheduledStart: _s, points, caps, flags: _f, ...rest } = s
      Object.assign(p.settings, rest)
      if (points) Object.assign(p.settings.points, points)
      if (caps) Object.assign(p.settings.caps, caps)
      if (s.flags) Object.assign(p.settings.flags, s.flags)
    },
  },
  players: {
    rename(raw) { const r = z.object({ id: z.string(), name: z.string().min(2).max(24) }).parse(raw); const p = db().players.find(x => x.id === r.id); if (p) p.displayName = r.name },
    move(raw) { const r = z.object({ id: z.string(), teamId: z.string().nullable() }).parse(raw); moveTeam(r.id, r.teamId) },
    remove(raw) {
      const { id: i } = id.parse(raw); const p = db().players.find(x => x.id === i)
      if (p) { p.removedAt = Date.now(); log('join', `Removed by host: ${p.displayName}`, {}, 'host') }
    },
    restore(raw) { const { id: i } = id.parse(raw); const p = db().players.find(x => x.id === i); if (p) p.removedAt = null },
    setHost(raw) { const r = z.object({ id: z.string(), isHost: z.boolean() }).parse(raw); const p = db().players.find(x => x.id === r.id); if (p) p.isHost = r.isHost },
  },
  teams: {
    save(raw) {
      const r = z.object({ id: z.string(), name: z.string().min(2).max(24), colorKey: z.enum(TEAM_COLORS.map(c => c.key) as [string, ...string[]]) }).parse(raw)
      const d = db(); const t = d.teams.find(x => x.id === r.id)
      if (!t) throw NotFound('Team not found')
      if (d.teams.some(x => x.id !== t.id && !x.deletedAt && x.colorKey === r.colorKey)) throw Validation('That color is taken')
      t.name = r.name; t.colorKey = r.colorKey
    },
    disband(raw) {
      const { id: i } = id.parse(raw); const d = db(); const t = d.teams.find(x => x.id === i)
      if (t) { t.deletedAt = Date.now(); d.players.forEach((p) => { if (p.teamId === i) p.teamId = null }) }
    },
  },
  codes: {
    import(raw) {
      const { json } = z.object({ json: z.string() }).parse(raw)
      let entries: any
      try { entries = JSON.parse(json) } catch { throw Validation('That is not valid JSON') }
      const list = z.array(z.object({ code: z.string().min(3).max(32), scope: z.enum(['universal', 'team', 'secret', 'solo']), reward: z.string(), listed: z.boolean().optional(), label: z.string().optional() })).parse(entries)
      return { imported: importCatalog(list) }
    },
    toggle(raw) { const r = z.object({ id: z.string(), enabled: z.boolean() }).parse(raw); const c = db().codes.find(x => x.id === r.id); if (c) c.enabled = r.enabled },
    reveal(raw) { revealCode(id.parse(raw).id) },
  },
  log: {
    dismiss(raw) { const { id: i } = id.parse(raw); const e = db().log.find(x => x.id === i); if (e) e.dismissed = true },
  },
  segments: {
    reorder(raw) { const { ids } = order.parse(raw); ids.forEach((i, n) => { const s = db().segments.find(x => x.id === i); if (s) s.sortOrder = n + 1 }) },
  },
}

export function runContent(kind: string, action: string, input: any) {
  const fn = CONTENT[kind]?.[action]
  if (!fn) throw NotFound(`Unknown content action ${kind}/${action}`)
  try {
    const out = fn(input)
    notify()
    return out ?? null
  } catch (e: any) {
    if (e?.issues) throw Validation(e.issues[0]?.message ?? 'Invalid input')
    throw e
  }
}
