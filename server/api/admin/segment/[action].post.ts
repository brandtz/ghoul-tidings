import { defineGameHandler } from '~~/server/engine/store'
import { z } from 'zod'
import { NotFound } from '~~/server/engine/errors'
import { requireAdmin } from '~~/server/engine/session'
import { assertVersion, envelope, parseBody } from '~~/server/engine/control'
import { endSegment, startSegment } from '~~/server/engine/rounds'
import { fireDueDraw } from '~~/server/engine/raffle'
export default defineGameHandler(async (event) => {
  await requireAdmin(event)
  const b = await parseBody(event, z.object({ v: z.number().optional(), segmentId: z.string().optional() }))
  assertVersion(b.v)
  const action = getRouterParam(event, 'action')
  if (action === 'start') startSegment(b.segmentId)
  else if (action === 'end') { endSegment(); fireDueDraw() }
  else throw NotFound('Unknown segment action')
  return envelope()
})
