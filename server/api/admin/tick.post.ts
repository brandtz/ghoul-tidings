import { defineGameHandler } from '~~/server/engine/store'
import { z } from 'zod'
import { requireAdmin } from '~~/server/engine/session'
import { parseBody, tick } from '~~/server/engine/control'
export default defineGameHandler(async (event) => {
  await requireAdmin(event)
  const { id } = await parseBody(event, z.object({ id: z.string() }))
  return tick(id)
})
