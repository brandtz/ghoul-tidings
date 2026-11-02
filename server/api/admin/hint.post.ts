import { db, log } from '~~/server/engine/db'
import { broadcast } from '~~/server/engine/bus'
import { requireAdmin } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  db().party.state.hintRevealed = true
  log('state', 'Trick or Treat hint revealed', {}, 'host')
  broadcast('hint.revealed', {})
  return envelope()
})
