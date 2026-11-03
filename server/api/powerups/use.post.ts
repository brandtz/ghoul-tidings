import { defineGameHandler } from '~~/server/engine/store'
import { requirePlayer } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
import { usePowerup } from '~~/server/engine/powerups'

export default defineGameHandler(async (event) => {
  usePowerup(await requirePlayer(event))
  return envelope()
})
