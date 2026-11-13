import { z } from 'zod'
import { defineGameHandler } from '~~/server/engine/store'
import { requirePlayer } from '~~/server/engine/session'
import { envelope, parseBody } from '~~/server/engine/control'
import { claimBingo } from '~~/server/engine/bingo'

// Sends the player's dabbed card to the host for review. Points land on approval.
export default defineGameHandler(async (event) => {
  const p = await requirePlayer(event)
  const { marked } = await parseBody(event, z.object({ marked: z.array(z.number().int().min(0).max(24)).max(25) }))
  claimBingo(p, marked)
  return envelope(null, [{ key: 'none', scope: 'personal', toast: 'Bingo called! The host is checking your card.' }])
})
