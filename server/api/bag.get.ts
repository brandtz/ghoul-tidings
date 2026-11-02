import { requirePlayer } from '~~/server/engine/session'
import { bagFor, hasUnlock } from '~~/server/engine/codes'
import { db } from '~~/server/engine/db'
import { Authorization } from '~~/server/engine/errors'

export default defineEventHandler(async (event) => {
  const p = await requirePlayer(event)
  if (!db().party.settings.flags.cheatSheet || !hasUnlock(p.id, 'bag')) throw Authorization('Nothing here')
  return { entries: bagFor(p) }
})
