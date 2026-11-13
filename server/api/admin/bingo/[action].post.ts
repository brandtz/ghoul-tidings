import { z } from 'zod'
import { defineGameHandler } from '~~/server/engine/store'
import { NotFound } from '~~/server/engine/errors'
import { requireAdmin } from '~~/server/engine/session'
import { envelope, parseBody } from '~~/server/engine/control'
import { callSquare, closeBingo, openBingo, reviewClaim, uncallSquare } from '~~/server/engine/bingo'

export default defineGameHandler(async (event) => {
  await requireAdmin(event)
  const b = await parseBody(event, z.object({ id: z.string().optional(), square: z.string().max(60).optional() }))
  switch (getRouterParam(event, 'action')) {
    case 'open': openBingo(); break
    case 'close': closeBingo(); break
    case 'call': return envelope({ called: callSquare(b.square) })
    case 'uncall': if (b.square) uncallSquare(b.square); break
    case 'approve': reviewClaim(b.id ?? '', true); break
    case 'reject': reviewClaim(b.id ?? '', false); break
    default: throw NotFound('Unknown bingo action')
  }
  return envelope()
})
