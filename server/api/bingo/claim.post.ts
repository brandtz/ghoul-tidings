import { BINGO_POINTS } from '~~/shared/phase2'
import { requirePlayer } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
import { db, log } from '~~/server/engine/db'
import { broadcast } from '~~/server/engine/bus'
import { Conflict } from '~~/server/engine/errors'
import { applyScore } from '~~/server/engine/scores'
import { hasUnlock } from '~~/server/engine/codes'

// Honor system, like self-mark: logged to the monitor where the host can reverse it.
export default defineEventHandler(async (event) => {
  const p = await requirePlayer(event)
  const d = db()
  if (!d.party.settings.flags.bingo || !hasUnlock(p.id, 'bingo')) throw Conflict('Nothing happens')
  if (d.bingoClaimed.includes(p.id)) throw Conflict('You already called bingo')
  d.bingoClaimed.push(p.id)
  const actionId = `bingo:${p.id}`
  applyScore({ playerId: p.id, teamId: p.teamId, source: 'code', basePoints: p.teamId ? BINGO_POINTS.team : 0, individualPoints: BINGO_POINTS.individual, refType: 'bingo', refId: p.id, idempotencyKey: actionId, actionId, actionLabel: `Bingo, ${p.displayName}` })
  log('code', `${p.displayName} called bingo`, { actionId, reversible: true }, p.displayName)
  broadcast('ticker', { kind: 'treat', text: `${p.displayName} called BINGO` }, { bump: false })
  broadcast('scores.updated', {})
  return envelope(null, [{ key: 'confetti', scope: 'personal', toast: 'Bingo!' }])
})
