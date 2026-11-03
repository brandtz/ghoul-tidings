import { defineGameHandler } from '~~/server/engine/store'
import { z } from 'zod'
import { NotFound } from '~~/server/engine/errors'
import { requireAdmin } from '~~/server/engine/session'
import { assertVersion, envelope, parseBody } from '~~/server/engine/control'
import { advance, lockRound, openRound, revealRound, skipRound } from '~~/server/engine/rounds'
export default defineGameHandler(async (event) => {
  await requireAdmin(event)
  const b = await parseBody(event, z.object({ v: z.number().optional() }))
  assertVersion(b.v)
  switch (getRouterParam(event, 'action')) {
    case 'open': openRound(); break
    case 'lock': lockRound(); break
    case 'reveal': revealRound(); break
    case 'next': advance(1); break
    case 'back': advance(-1); break
    case 'skip': skipRound(); break
    default: throw NotFound('Unknown round action')
  }
  return envelope()
})
