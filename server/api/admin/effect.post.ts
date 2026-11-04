import { defineGameHandler } from '~~/server/engine/store'
import { z } from 'zod'
import { log } from '~~/server/engine/db'
import { broadcast } from '~~/server/engine/bus'
import { requireAdmin } from '~~/server/engine/session'
import { envelope, parseBody } from '~~/server/engine/control'
const schema = z.object({ key: z.enum(['lightning', 'bats', 'snow', 'confetti', 'spirit', 'banner', 'sleigh']), text: z.string().max(80).optional() })
export default defineGameHandler(async (event) => {
  await requireAdmin(event)
  const b = await parseBody(event, schema)
  log('effect', `Effect fired: ${b.key}${b.text ? ` · ${b.text}` : ''}`, {}, 'host')
  broadcast('effect.global', b, { bump: false })
  return envelope()
})
