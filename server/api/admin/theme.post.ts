import { z } from 'zod'
import { db, log } from '~~/server/engine/db'
import { broadcast } from '~~/server/engine/bus'
import { requireAdmin } from '~~/server/engine/session'
import { envelope, parseBody } from '~~/server/engine/control'
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { p } = await parseBody(event, z.object({ p: z.number().min(0).max(1).nullable() }))
  db().party.themeOverride = p
  log('state', p === null ? 'Theme back on auto' : `Theme override ${p.toFixed(2)}`, {}, 'host')
  broadcast('state.changed', {})
  return envelope()
})
