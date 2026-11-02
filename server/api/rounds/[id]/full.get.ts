import { readFileSync } from 'node:fs'
import { Authorization, NotFound } from '~~/server/engine/errors'
import { db } from '~~/server/engine/db'
import { requireViewer } from '~~/server/engine/session'
import { uploadPath } from '~~/server/engine/images'
export default defineEventHandler(async (event) => {
  await requireViewer(event)
  const d = db()
  const r = d.rounds.find(x => x.id === getRouterParam(event, 'id'))
  if (!r || r.itemType !== 'guess') throw NotFound('Image not found')
  if (r.phase !== 'revealed') throw Authorization('Not released yet')
  setHeader(event, 'Content-Type', 'image/jpeg')
  return readFileSync(uploadPath(d.guess.find(x => x.id === r.itemId)!.fullPath))
})
