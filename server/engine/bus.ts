// Live updates. The server commits, then publishes. With Supabase configured, each
// message is signed with the ES256 key and sent through Realtime broadcast; browsers
// drop anything that fails the signature check. Without it, an in-process listener
// set feeds the local /api/stream. A client that misses a message refetches.
import { randomUUID } from 'node:crypto'
import { CompactSign, importJWK, type CryptoKey } from 'jose'
import { useRuntimeConfig } from '#imports'
import type { BusMessage } from '~~/shared/types'
import { db, save } from './db'

type Listener = (m: BusMessage) => void
const g = globalThis as any
const listeners: Set<Listener> = g.__gtBus ?? (g.__gtBus = new Set())
const outbox: BusMessage[] = g.__gtOutbox ?? (g.__gtOutbox = [])

export const subscribe = (fn: Listener) => { listeners.add(fn); return () => listeners.delete(fn) }
export const clientCount = () => listeners.size

export const TOPIC = 'gt-party'
// Light messages fan out to every screen. At most one per type per window keeps a
// burst of answers or reactions inside the Realtime message quota; polling covers the gap.
const LIGHT_MS = 1200

/** bump marks a real state change. Light events (counts, reactions) leave the version alone. */
export function broadcast(type: string, data: any = {}, opts: { bump?: boolean } = {}) {
  const d = db()
  if (opts.bump !== false) d.party.stateVersion++
  save()
  const msg: BusMessage = { id: randomUUID(), v: d.party.stateVersion, type, data }
  if (opts.bump === false && g.__gtPg) {
    const now = Date.now()
    if (now - (d.busLight[type] ?? 0) < LIGHT_MS) return msg
    d.busLight[type] = now
  }
  outbox.push(msg)
  return msg
}

// Nuxt parses JSON-looking env values, so a key may arrive as an object.
const asJson = (v: unknown) => typeof v === 'string' ? JSON.parse(v) : v as any

let key: CryptoKey | Uint8Array | null = null
async function signer() {
  if (!key) key = await importJWK(asJson(useRuntimeConfig().broadcastPrivateKey), 'ES256')
  return key
}

/** Runs after the write commits. Never fails the request. */
export async function publishOutbox() {
  const msgs = outbox.splice(0)
  if (!msgs.length) return
  const cfg = useRuntimeConfig()
  if (!cfg.public.supabaseUrl || !cfg.supabaseSecretKey || !cfg.broadcastPrivateKey) {
    for (const m of msgs) for (const fn of listeners) { try { fn(m) } catch { listeners.delete(fn) } }
    return
  }
  try {
    const k = await signer()
    const exp = Date.now() + 60_000
    const messages = await Promise.all(msgs.map(async m => ({
      topic: TOPIC, event: 'm', private: false,
      payload: { jws: await new CompactSign(new TextEncoder().encode(JSON.stringify({ ...m, exp }))).setProtectedHeader({ alg: 'ES256' }).sign(k) },
    })))
    const r = await fetch(`${cfg.public.supabaseUrl}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: cfg.supabaseSecretKey },
      body: JSON.stringify({ messages }),
      signal: AbortSignal.timeout(4000),
    })
    if (!r.ok) console.error('[bus] broadcast failed', r.status, (await r.text()).slice(0, 200))
  } catch (e) {
    console.error('[bus] broadcast failed', e)
  }
}
