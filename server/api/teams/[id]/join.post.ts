import { requirePlayer } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
import { joinTeam } from '~~/server/engine/teams'
export default defineEventHandler(async (event) => {
  joinTeam(await requirePlayer(event), getRouterParam(event, 'id')!)
  return envelope()
})
