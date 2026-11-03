import { defineGameHandler } from '~~/server/engine/store'
import { getFile } from '~~/server/engine/files'
import { NotFound } from '~~/server/engine/errors'
import { db } from '~~/server/engine/db'
import { requireAdmin } from '~~/server/engine/session'
export default defineGameHandler(async (event) => {
  await requireAdmin(event)
  const g = db().guess.find(x => x.id === getRouterParam(event, 'id'))
  const step = Number(getRouterParam(event, 'step'))
  if (!g) throw NotFound('Image not found')
  const name = step === 0 ? g.fullPath : g.cropPaths[step - 1]
  if (!name) throw NotFound('Image not ready')
  setHeader(event, 'Content-Type', 'image/jpeg')
  return getFile(name)
})
