// Request wrapper and Postgres persistence. The engine keeps working on one in-memory
// DB object; this file loads it from gt_rows, fetches only rows changed since the last
// request, and writes back the rows a request changed. Writes run one at a time under
// an advisory lock, so two serverless instances never interleave. Without a database
// URL the app keeps the local .data/party.json mode.
import postgres from 'postgres'
import type { EventHandler, H3Event } from 'h3'
import { defineEventHandler, isError } from 'h3'
import { useRuntimeConfig } from '#imports'
import { buildSeed } from './seed'
import { type DB, normalize } from './db'
import { publishOutbox } from './bus'

const ARRAYS = ['players', 'teams', 'segments', 'trivia', 'guess', 'ttl', 'rounds', 'answers', 'scoreEvents', 'prizes', 'draws', 'presentations', 'log', 'codes', 'redemptions', 'statusEffects', 'bingoClaims'] as const
const META = ['party', 'teamPowerups', 'unlocks', 'bingoClaimed', 'attemptTimes', 'lastScoringCode', 'missedAttempts', 'rate', 'busLight'] as const
const LOCK_KEY = 4242

const g = globalThis as any
interface Cache { seq: number; json: Map<string, string>; ord: Map<string, number> }
const key = (coll: string, id: string) => `${coll}\u0000${id}`

let sql: postgres.Sql | null = null
export function pgEnabled() {
  return !!useRuntimeConfig().databaseUrl
}
function conn() {
  if (!sql) sql = postgres(useRuntimeConfig().databaseUrl, { prepare: false, max: 2, idle_timeout: 20, connect_timeout: 10 })
  return sql
}

// One request at a time per process. Netlify runs one request per instance anyway;
// this keeps local dev honest and stops a read seeing a half-applied write.
let chain: Promise<unknown> = Promise.resolve()
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn)
  chain = run.catch(() => {})
  return run
}

function invalidate() { g.__gtDb = null; g.__gtCache = null }

type Row = { coll: string; id: string; data: any; ord: string; seq: string; deleted: boolean }

async function sync(q: postgres.Sql | postgres.TransactionSql) {
  const cache: Cache | null = g.__gtCache
  const since = cache && g.__gtDb ? cache.seq : -1
  const rows = await q<Row[]>`select coll, id, data, ord, seq, deleted from gt_rows where seq > ${since} order by ord`
  if (since < 0) {
    const d: any = {}
    for (const c of ARRAYS) d[c] = []
    const c2: Cache = { seq: 0, json: new Map(), ord: new Map() }
    for (const r of rows) apply(d, c2, r)
    g.__gtCache = c2
    g.__gtDb = rows.length ? finish(d) : null
    return
  }
  if (!rows.length) return
  const d = g.__gtDb
  const touched = new Set<string>()
  for (const r of rows) { apply(d, cache!, r); touched.add(r.coll) }
  for (const c of touched) if ((ARRAYS as readonly string[]).includes(c)) sortColl(d, cache!, c)
  normalize(d)
}

function apply(d: any, cache: Cache, r: Row) {
  const k = key(r.coll, r.id)
  cache.seq = Math.max(cache.seq, Number(r.seq))
  if (r.coll === '_meta') {
    if (r.deleted) { delete d[r.id]; cache.json.delete(k) } else { d[r.id] = r.data; cache.json.set(k, JSON.stringify(r.data)) }
    return
  }
  const arr: any[] = (d[r.coll] ??= [])
  const i = cache.json.has(k) ? arr.findIndex(x => x.id === r.id) : -1
  if (r.deleted) {
    if (i >= 0) arr.splice(i, 1)
    cache.json.delete(k); cache.ord.delete(k)
    return
  }
  if (i >= 0) arr[i] = r.data
  else arr.push(r.data)
  cache.json.set(k, JSON.stringify(r.data))
  cache.ord.set(k, Number(r.ord))
}

function sortColl(d: any, cache: Cache, coll: string) {
  const o = (x: any) => cache.ord.get(key(coll, x.id)) ?? Number.MAX_SAFE_INTEGER
  if (coll === 'log') d.log.sort((a: any, b: any) => b.createdAt - a.createdAt || o(b) - o(a))
  else d[coll].sort((a: any, b: any) => o(a) - o(b))
}

function finish(d: any): DB {
  for (const c of ARRAYS) d[c] ??= []
  d.log.sort((a: any, b: any) => b.createdAt - a.createdAt)
  return normalize(d)
}

/** Writes every row that differs from what was loaded. */
async function persist(tx: postgres.TransactionSql) {
  const d = g.__gtDb as any
  const cache: Cache = g.__gtCache
  const colls: string[] = []; const ids: string[] = []; const datas: string[] = []; const dels: boolean[] = []
  const seen = new Set<string>()
  const push = (coll: string, id: string, json: string | null) => { colls.push(coll); ids.push(id); datas.push(json ?? 'null'); dels.push(json === null) }
  for (const c of ARRAYS) {
    for (const item of d[c] as any[]) {
      const k = key(c, item.id); seen.add(k)
      const json = JSON.stringify(item)
      if (cache.json.get(k) !== json) push(c, item.id, json)
    }
  }
  for (const m of META) {
    const k = key('_meta', m); seen.add(k)
    if (d[m] === undefined) continue
    const json = JSON.stringify(d[m])
    if (cache.json.get(k) !== json) push('_meta', m, json)
  }
  for (const k of cache.json.keys()) {
    if (seen.has(k)) continue
    const [c, id] = k.split('\u0000') as [string, string]
    push(c, id, null)
  }
  if (!colls.length) return
  // One JSON parameter; the row data strings are spliced in as they are, already JSON.
  const batch = `[${colls.map((c, n) => `{"c":${JSON.stringify(c)},"i":${JSON.stringify(ids[n])},"del":${dels[n]},"x":${datas[n]}}`).join(',')}]`
  const out = await tx<{ coll: string; id: string; ord: string; seq: string }[]>`
    insert into gt_rows (coll, id, data, ord, seq, deleted)
    select c, i, coalesce(x, 'null'::jsonb), nextval('gt_seq'), nextval('gt_seq'), del
    from jsonb_to_recordset(${batch}::text::jsonb) as t(c text, i text, x jsonb, del boolean)
    on conflict (coll, id) do update set data = excluded.data, seq = excluded.seq, deleted = excluded.deleted
    returning coll, id, ord, seq`
  const sent = new Map(colls.map((c, n) => [key(c, ids[n]!), n]))
  for (const r of out) {
    const k = key(r.coll, r.id); const n = sent.get(k)!
    cache.seq = Math.max(cache.seq, Number(r.seq))
    if (dels[n]) { cache.json.delete(k); cache.ord.delete(k) } else { cache.json.set(k, datas[n]!); cache.ord.set(k, Number(r.ord)) }
  }
}

const isClientError = (e: unknown) => isError(e) && e.statusCode < 500

async function runPg<T>(event: H3Event, fn: () => Promise<T>): Promise<T> {
  const write = event.method !== 'GET' && event.method !== 'HEAD'
  const q = conn()
  if (!write) {
    await sync(q)
    if (g.__gtDb) return fn()
  }
  let failure: unknown = null
  let result!: T
  try {
    await q.begin(async (tx) => {
      // A stuck holder must never freeze the party: waiters give up, and an idle
      // transaction is killed by Postgres.
      await tx`select set_config('lock_timeout', '9s', true), set_config('idle_in_transaction_session_timeout', '20s', true)`
      const T = (s: string) => process.env.GT_TRACE && console.log('[trace]', event.path, s, Date.now() % 100000)
      T('begin')
      await tx`select pg_advisory_xact_lock(${LOCK_KEY})`
      T('locked')
      await sync(tx)
      T('synced')
      if (!g.__gtDb) await seedEmpty()
      try { result = await fn() } catch (e) {
        if (!isClientError(e)) throw e
        failure = e
      }
      T('handled')
      await persist(tx)
      T('persisted')
    })
  } catch (e) {
    invalidate()
    throw e
  }
  await publishOutbox()
  if (failure) throw failure
  return result
}

async function seedEmpty() {
  g.__gtDb = normalize(buildSeed())
  const { ensureSeedImages } = await import('./images')
  await ensureSeedImages()
}

async function runFile<T>(fn: () => Promise<T>): Promise<T> {
  if (!g.__gtSeeded) {
    g.__gtSeeded = true
    const { ensureSeedImages } = await import('./images')
    await ensureSeedImages().catch(e => console.error('[seed] image generation failed', e))
  }
  try { return await fn() } finally { await publishOutbox() }
}

/** Every API route goes through this instead of defineEventHandler. */
export function defineGameHandler<T>(fn: (event: H3Event) => T | Promise<T>): EventHandler {
  return defineEventHandler((event) => {
    if (event.path.startsWith('/api/stream')) return fn(event)
    g.__gtPg = pgEnabled()
    const t0 = Date.now()
    return serial(() => {
      const waited = Date.now() - t0
      const done = () => { const ms = Date.now() - t0; if (ms > 3000) console.warn(`[store] slow ${event.method} ${event.path} ${ms}ms (queued ${waited}ms)`) }
      const run = g.__gtPg ? runPg(event, async () => fn(event)) : runFile(async () => fn(event))
      return run.finally(done)
    })
  })
}
