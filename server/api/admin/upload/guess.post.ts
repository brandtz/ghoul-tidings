import { defineGameHandler } from '~~/server/engine/store'
import { Validation } from '~~/server/engine/errors'
import { db, uid } from '~~/server/engine/db'
import { broadcast } from '~~/server/engine/bus'
import { requireAdmin } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
import { cutCrops } from '~~/server/engine/images'
export default defineGameHandler(async (event) => {
  await requireAdmin(event)
  const parts = await readMultipartFormData(event)
  const f = (n: string) => parts?.find(p => p.name === n)
  const file = f('file')
  if (!file?.data?.length) throw Validation('Choose an image')
  const text = (n: string) => f(n)?.data.toString('utf8') ?? ''
  const focalX = Number(text('focalX') || 0.5); const focalY = Number(text('focalY') || 0.5)
  const d = db()
  const segmentId = text('segmentId') || d.segments.find(s => s.type === 'guess')!.id
  const answerDisplay = text('answerDisplay') || 'New image'
  const accepted = text('accepted').split(',').map(s => s.trim()).filter(Boolean)
  const paths = await cutCrops(file.data, focalX, focalY)
  d.guess.push({ id: uid(), segmentId, sortOrder: d.guess.filter(g => g.segmentId === segmentId).length + 1, answerDisplay, acceptedAnswers: accepted.length ? accepted : [answerDisplay], focalX, focalY, stepS: 5, ...paths })
  broadcast('state.changed', {}, { bump: false })
  return envelope()
})
