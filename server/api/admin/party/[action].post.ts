import { z } from 'zod'
import { NotFound } from '~~/server/engine/errors'
import { requireAdmin } from '~~/server/engine/session'
import { addDemoCrowd, assertVersion, endParty, envelope, goLive, parseBody, resetParty } from '~~/server/engine/control'
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const action = getRouterParam(event, 'action')
  const b = await parseBody(event, z.object({ v: z.number().optional() }))
  switch (action) {
    case 'start': assertVersion(b.v); goLive(); break
    case 'end': assertVersion(b.v); endParty(); break
    case 'reset': await resetParty(); break
    case 'demo-crowd': addDemoCrowd(); break
    default: throw NotFound('Unknown party action')
  }
  return envelope()
})
