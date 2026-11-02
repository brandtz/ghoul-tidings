import { z } from 'zod'
import { requirePlayer } from '~~/server/engine/session'
import { envelope, parseBody } from '~~/server/engine/control'
import { createTeam } from '~~/server/engine/teams'
const schema = z.object({ name: z.string().trim().min(2, 'Team name needs at least 2 characters').max(24), mascotKey: z.string(), colorKey: z.string() })
export default defineEventHandler(async (event) => {
  const p = await requirePlayer(event)
  return envelope(createTeam(p, await parseBody(event, schema)))
})
