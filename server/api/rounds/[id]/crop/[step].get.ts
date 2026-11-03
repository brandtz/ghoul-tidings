import { defineGameHandler } from '~~/server/engine/store'
import { getFile } from '~~/server/engine/files'
import { Authorization, NotFound } from '~~/server/engine/errors'
import { db } from '~~/server/engine/db'
import { requireViewer } from '~~/server/engine/session'
// A crop is released only once its zoom step has started, so none can be fetched early.
export default defineGameHandler(async (event) => {
  await requireViewer(event)
  const d = db()
  const r = d.rounds.find(x => x.id === getRouterParam(event, 'id'))
  const step = Number(getRouterParam(event, 'step'))
  if (!r || r.itemType !== 'guess' || !(step >= 1 && step <= 6)) throw NotFound('Crop not found')
  const g = d.guess.find(x => x.id === r.itemId)!
  if (r.phase !== 'revealed' && Date.now() < r.opensAt + (step - 1) * g.stepS * 1000 - 1500) throw Authorization('Not released yet')
  setHeader(event, 'Content-Type', 'image/jpeg')
  setHeader(event, 'Cache-Control', 'private, max-age=300')
  return getFile(g.cropPaths[step - 1]!)
})
