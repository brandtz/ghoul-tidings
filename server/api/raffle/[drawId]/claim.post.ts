import { defineGameHandler } from '~~/server/engine/store'
import { requirePlayer } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
import { claim } from '~~/server/engine/raffle'
export default defineGameHandler(async (event) => {
  const p = await requirePlayer(event)
  claim(getRouterParam(event, 'drawId')!, p.id)
  return envelope()
})
