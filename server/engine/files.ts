// Uploaded files: Guess the Thing crops and slide decks. With Supabase configured they
// live in the private gt-uploads bucket and are served only through the gated routes.
// Without it they sit in .data/uploads.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { useRuntimeConfig } from '#imports'
import { UPLOAD_DIR } from './db'
import { ExternalService, NotFound } from './errors'

const BUCKET = 'gt-uploads'
// Names are random and never rewritten, so a warm instance can keep what it served.
const memo = new Map<string, Buffer>()
const MEMO_MAX = 120

function remote() {
  const c = useRuntimeConfig()
  return c.public.supabaseUrl && c.supabaseSecretKey ? { url: `${c.public.supabaseUrl}/storage/v1/object/${BUCKET}`, key: c.supabaseSecretKey } : null
}

export async function putFile(name: string, body: Buffer, contentType: string) {
  const r = remote()
  if (!r) { mkdirSync(UPLOAD_DIR, { recursive: true }); writeFileSync(resolve(UPLOAD_DIR, name), body); return }
  const res = await fetch(`${r.url}/${name}`, { method: 'POST', headers: { apikey: r.key, 'content-type': contentType, 'x-upsert': 'true' }, body: new Uint8Array(body), signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw ExternalService(`Upload failed (${res.status})`)
}

export async function getFile(name: string): Promise<Buffer> {
  const hit = memo.get(name)
  if (hit) return hit
  const r = remote()
  let buf: Buffer
  if (!r) {
    const p = resolve(UPLOAD_DIR, name)
    if (!existsSync(p)) throw NotFound('File not found')
    buf = readFileSync(p)
  } else {
    const res = await fetch(`${r.url}/${name}`, { headers: { apikey: r.key }, signal: AbortSignal.timeout(8000) })
    if (res.status === 400 || res.status === 404) throw NotFound('File not found')
    if (!res.ok) throw ExternalService(`Could not load the file (${res.status})`)
    buf = Buffer.from(await res.arrayBuffer())
  }
  if (memo.size >= MEMO_MAX) memo.delete(memo.keys().next().value!)
  memo.set(name, buf)
  return buf
}

export async function hasFile(name: string) {
  try { await getFile(name); return true } catch { return false }
}
