import { Validation } from '~~/server/engine/errors'
import { broadcast } from '~~/server/engine/bus'
import { requireAdmin } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
import { lastAction, reverseAction } from '~~/server/engine/scores'
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const a = lastAction()
  if (!a) throw Validation('Nothing to undo')
  const n = reverseAction(a.actionId)
  broadcast('scores.updated', {})
  return envelope({ reversed: n, label: a.label })
})
