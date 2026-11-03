import { defineGameHandler } from '~~/server/engine/store'
import { z } from 'zod'
import { db } from '~~/server/engine/db'
import { broadcast } from '~~/server/engine/bus'
import { requirePlayer } from '~~/server/engine/session'
import { envelope, parseBody } from '~~/server/engine/control'
const schema = z.object({ counts: z.record(z.string(), z.number().int().min(0).max(10)) })
export default defineGameHandler(async (event) => {
  await requirePlayer(event)
  const { counts } = await parseBody(event, schema)
  const total = Math.min(10, Object.values(counts).reduce((a, b) => a + b, 0))
  const st = db().party.state
  st.spirit += total
  broadcast('react', { counts }, { bump: false })
  if (st.spirit >= st.spiritGoal) {
    st.spiritGoal += db().party.settings.spiritGoal
    broadcast('effect.global', { key: 'confetti', spirit: true }, { bump: false })
  }
  broadcast('spirit.updated', { value: st.spirit, goal: st.spiritGoal }, { bump: false })
  return envelope()
})
