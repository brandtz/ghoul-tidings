import { createHmac } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import type { H3Event } from 'h3'
import { deleteCookie, getCookie, getRequestIP, setCookie } from 'h3'
import { useRuntimeConfig } from '#imports'
import { db } from './db'
import { Authorization, Conflict } from './errors'

const secret = () => new TextEncoder().encode(useRuntimeConfig().jwtSecret)

export const hashEmail = (email: string) =>
  createHmac('sha256', useRuntimeConfig().emailPepper).update(email.trim().toLowerCase()).digest('hex')

async function sign(claims: Record<string, any>, exp: string) {
  return new SignJWT(claims).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(exp).sign(secret())
}
async function verify(token?: string) {
  if (!token) return null
  try { return (await jwtVerify(token, secret())).payload as any } catch { return null }
}

const opts = { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production' } as const

export async function setPlayerSession(event: H3Event, playerId: string) {
  setCookie(event, 'gt_session', await sign({ sub: playerId, pid: db().party.id, role: 'player' }, '60d'), { ...opts, maxAge: 60 * 86400 })
}
export const clearPlayerSession = (event: H3Event) => deleteCookie(event, 'gt_session', opts)

export async function setAdminSession(event: H3Event) {
  setCookie(event, 'gt_admin', await sign({ role: 'admin' }, '12h'), { ...opts, maxAge: 12 * 3600 })
}
export const clearAdminSession = (event: H3Event) => deleteCookie(event, 'gt_admin', opts)

export async function isAdmin(event: H3Event) {
  return (await verify(getCookie(event, 'gt_admin')))?.role === 'admin'
}
export async function requireAdmin(event: H3Event) {
  if (!(await isAdmin(event))) throw Authorization('Host sign-in required')
}
export async function optionalPlayer(event: H3Event) {
  const c = await verify(getCookie(event, 'gt_session'))
  if (!c || c.pid !== db().party.id) return null
  const p = db().players.find(x => x.id === c.sub)
  return p ?? null
}
export async function requirePlayer(event: H3Event) {
  const p = await optionalPlayer(event)
  if (!p) throw Authorization('Your seat timed out')
  if (p.removedAt) throw Authorization('The host removed you from this party.')
  return p
}

/** Per IP, per minute. Kept with the party data so every server instance shares it. */
export function rateLimit(event: H3Event, action: string, perMinute: number) {
  const buckets = db().rate
  const key = `${action}:${getRequestIP(event, { xForwardedFor: true }) ?? 'local'}`
  const minute = Math.floor(Date.now() / 60000)
  for (const k in buckets) if (buckets[k]!.minute < minute - 1) delete buckets[k]
  const b = buckets[key]
  if (!b || b.minute !== minute) { buckets[key] = { minute, count: 1 }; return }
  if (++b.count > perMinute) throw Conflict('Too many tries. Wait a minute and try again.')
}

/** A signed-in player or the host, used for image and slide access. */
export async function requireViewer(event: H3Event) {
  if (await isAdmin(event)) return
  await requirePlayer(event)
}
