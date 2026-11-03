import { defineGameHandler } from '~~/server/engine/store'
import { z } from 'zod'
import { requireAdmin } from '~~/server/engine/session'
import { envelope, parseBody, setPause } from '~~/server/engine/control'
export default defineGameHandler(async (event) => {
  await requireAdmin(event)
  const b = await parseBody(event, z.object({ kind: z.enum(['scoring', 'party']), on: z.boolean() }))
  setPause(b.kind, b.on)
  return envelope()
})
