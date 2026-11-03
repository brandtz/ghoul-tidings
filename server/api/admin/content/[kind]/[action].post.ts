import { defineGameHandler } from '~~/server/engine/store'
import { requireAdmin } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
import { runContent } from '~~/server/engine/content'
export default defineGameHandler(async (event) => {
  await requireAdmin(event)
  const input = await readBody(event).catch(() => ({}))
  return envelope(runContent(getRouterParam(event, 'kind')!, getRouterParam(event, 'action')!, input))
})
