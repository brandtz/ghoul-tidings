import { defineGameHandler } from '~~/server/engine/store'
import { z } from 'zod'
import { NotFound } from '~~/server/engine/errors'
import { db, log, uid } from '~~/server/engine/db'
import { broadcast } from '~~/server/engine/bus'
import { requireAdmin } from '~~/server/engine/session'
import { envelope, parseBody } from '~~/server/engine/control'
import { applyScore } from '~~/server/engine/scores'
const schema = z.object({ playerId: z.string(), amount: z.number().int(), reason: z.string().trim().min(3, 'A reason is required') })
export default defineGameHandler(async (event) => {
  await requireAdmin(event)
  const b = await parseBody(event, schema)
  const p = db().players.find(x => x.id === b.playerId)
  if (!p) throw NotFound('Player not found')
  const id = uid()
  const ev = applyScore({ playerId: p.id, teamId: p.teamId, source: 'admin', basePoints: b.amount, refType: 'admin', refId: id, idempotencyKey: `admin:${id}`, reason: b.reason, createdBy: 'host', actionId: `admin:${id}`, actionLabel: `Adjust ${p.displayName}` })
  log('score', `Admin adjust ${b.amount > 0 ? '+' : ''}${ev?.deltaIndividual} to ${p.displayName} · reason: ${b.reason}`, { actionId: `admin:${id}`, reversible: true }, 'host')
  broadcast('scores.updated', {})
  return envelope()
})
