import { z } from 'zod'
import { defineGameHandler } from '~~/server/engine/store'
import { requirePlayer } from '~~/server/engine/session'
import { envelope, parseBody } from '~~/server/engine/control'
import { claimBalls } from '~~/server/engine/balls'

// Ghoul Bingo claim. Checked against the drawn balls on the spot; a win pays at once.
export default defineGameHandler(async (event) => {
  const p = await requirePlayer(event)
  const { marked } = await parseBody(event, z.object({ marked: z.array(z.number().int().min(0).max(24)).max(25) }))
  const r = claimBalls(p, marked)
  return envelope(r, [{ key: 'none', scope: 'personal', toast: `BINGO! +${r.points.toLocaleString()}` }])
})
