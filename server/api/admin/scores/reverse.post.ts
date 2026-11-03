import { defineGameHandler } from '~~/server/engine/store'
import { z } from 'zod'
import { db, log } from '~~/server/engine/db'
import { broadcast } from '~~/server/engine/bus'
import { requireAdmin } from '~~/server/engine/session'
import { envelope, parseBody } from '~~/server/engine/control'
import { reverseAction } from '~~/server/engine/scores'
export default defineGameHandler(async (event) => {
  await requireAdmin(event)
  const { actionId, logId } = await parseBody(event, z.object({ actionId: z.string(), logId: z.string().optional() }))
  const n = reverseAction(actionId)
  const row = db().log.find(x => x.id === logId)
  if (row) row.dismissed = true
  broadcast('scores.updated', {})
  return envelope({ reversed: n })
})
