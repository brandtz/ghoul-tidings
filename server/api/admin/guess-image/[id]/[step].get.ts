import { readFileSync } from 'node:fs'
import { NotFound } from '~~/server/engine/errors'
import { db } from '~~/server/engine/db'
import { requireAdmin } from '~~/server/engine/session'
import { uploadPath } from '~~/server/engine/images'
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const g = db().guess.find(x => x.id === getRouterParam(event, 'id'))
  const step = Number(getRouterParam(event, 'step'))
  if (!g) throw NotFound('Image not found')
  const name = step === 0 ? g.fullPath : g.cropPaths[step - 1]
  if (!name) throw NotFound('Image not ready')
  setHeader(event, 'Content-Type', 'image/jpeg')
  return readFileSync(uploadPath(name))
})
