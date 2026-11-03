import { defineGameHandler } from '~~/server/engine/store'
import { db, save } from '~~/server/engine/db'
import { requirePlayer } from '~~/server/engine/session'
export default defineGameHandler(async (event) => {
  const p = await requirePlayer(event)
  p.lastSeenAt = Date.now()
  save()
  return { v: db().party.stateVersion }
})
