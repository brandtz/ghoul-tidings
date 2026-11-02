import { requireAdmin } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
import { hostAction } from '~~/server/engine/raffle'
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  hostAction(getRouterParam(event, 'prizeId')!, getRouterParam(event, 'action')!)
  return envelope()
})
