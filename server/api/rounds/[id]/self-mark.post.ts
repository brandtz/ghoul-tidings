import { defineGameHandler } from '~~/server/engine/store'
import { requirePlayer } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
import { selfMark } from '~~/server/engine/rounds'
export default defineGameHandler(async (event) => {
  const a = selfMark(await requirePlayer(event), getRouterParam(event, 'id')!)
  return envelope({ points: a.points })
})
