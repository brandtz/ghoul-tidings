import { requirePlayer } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
import { claim } from '~~/server/engine/raffle'
export default defineEventHandler(async (event) => {
  const p = await requirePlayer(event)
  claim(getRouterParam(event, 'drawId')!, p.id)
  return envelope()
})
