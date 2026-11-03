import { defineGameHandler } from '~~/server/engine/store'
import { z } from 'zod'
import { requirePlayer } from '~~/server/engine/session'
import { envelope, parseBody } from '~~/server/engine/control'
import { submitAnswer } from '~~/server/engine/rounds'
const schema = z.object({ choice: z.number().int().optional(), text: z.string().max(80).optional() })
export default defineGameHandler(async (event) => {
  const p = await requirePlayer(event)
  const a = submitAnswer(p, getRouterParam(event, 'id')!, await parseBody(event, schema))
  return envelope({ zoomStep: a.zoomStep })
})
