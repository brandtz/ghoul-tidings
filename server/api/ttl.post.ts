import { defineGameHandler } from '~~/server/engine/store'
import { z } from 'zod'
import { Conflict } from '~~/server/engine/errors'
import { db, log, uid } from '~~/server/engine/db'
import { broadcast } from '~~/server/engine/bus'
import { requirePlayer } from '~~/server/engine/session'
import { envelope, parseBody } from '~~/server/engine/control'
const schema = z.object({ statements: z.array(z.string().trim().min(1, 'Fill in all three statements').max(120)).length(3), lieIndex: z.number().int().min(0).max(2) })
export default defineGameHandler(async (event) => {
  const p = await requirePlayer(event)
  const b = await parseBody(event, schema)
  const d = db(); const now = Date.now(); const s = d.party.settings
  if (now < s.ttlOpensAt || now >= s.ttlClosesAt) throw Conflict('Two Truths submissions are closed')
  const row = d.ttl.find(t => t.playerId === p.id)
  if (row) { if (row.status === 'approved') throw Conflict('The host already approved this one'); Object.assign(row, b, { status: 'pending' }) }
  else { d.ttl.push({ id: uid(), playerId: p.id, ...b, status: 'pending', playOrder: d.ttl.length + 1, createdAt: now }); log('join', `${p.displayName} submitted Two Truths`, {}, p.displayName) }
  broadcast('state.changed', {}, { bump: false })
  return envelope()
})
