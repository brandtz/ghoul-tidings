import { defineGameHandler } from '~~/server/engine/store'
import { requireAdmin } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
import { hostAction } from '~~/server/engine/raffle'
export default defineGameHandler(async (event) => {
  await requireAdmin(event)
  hostAction(getRouterParam(event, 'prizeId')!, getRouterParam(event, 'action')!)
  return envelope()
})
