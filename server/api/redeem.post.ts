import { z } from 'zod'
import { parseBody, envelope } from '~~/server/engine/control'
import { requirePlayer } from '~~/server/engine/session'
import { redeem } from '~~/server/engine/codes'

// A miss answers exactly like any other miss, so nothing hints at a near guess.
export default defineEventHandler(async (event) => {
  const p = await requirePlayer(event)
  const { tail } = await parseBody(event, z.object({ tail: z.string().max(64) }))
  const r = redeem(p, tail)
  return envelope({ outcome: r.outcome === 'nothing' ? 'nothing' : 'hit' }, r.effects)
})
