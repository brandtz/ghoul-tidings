import { Authorization } from '~~/server/engine/errors'
import { optionalPlayer } from '~~/server/engine/session'
import { snapshot } from '~~/server/engine/snapshot'
export default defineEventHandler(async (event) => {
  const p = await optionalPlayer(event)
  if (p?.removedAt) throw Authorization('The host removed you from this party.')
  return snapshot(p)
})
