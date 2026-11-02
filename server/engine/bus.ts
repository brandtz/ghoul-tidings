// In-process pub/sub. Stands in for the signed Supabase Broadcast channel: the
// server commits, then publishes. A client that misses a message refetches.
import { randomUUID } from 'node:crypto'
import type { BusMessage } from '~~/shared/types'
import { db, save } from './db'

type Listener = (m: BusMessage) => void
const g = globalThis as any
const listeners: Set<Listener> = g.__gtBus ?? (g.__gtBus = new Set())

export const subscribe = (fn: Listener) => { listeners.add(fn); return () => listeners.delete(fn) }
export const clientCount = () => listeners.size

/** bump marks a real state change. Light events (counts, reactions) leave the version alone. */
export function broadcast(type: string, data: any = {}, opts: { bump?: boolean } = {}) {
  const d = db()
  if (opts.bump !== false) d.party.stateVersion++
  save()
  const msg: BusMessage = { id: randomUUID(), v: d.party.stateVersion, type, data }
  for (const fn of listeners) { try { fn(msg) } catch { listeners.delete(fn) } }
  return msg
}
