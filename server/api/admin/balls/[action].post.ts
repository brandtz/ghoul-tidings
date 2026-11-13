import { z } from 'zod'
import { defineGameHandler } from '~~/server/engine/store'
import { NotFound } from '~~/server/engine/errors'
import { requireAdmin } from '~~/server/engine/session'
import { envelope, parseBody } from '~~/server/engine/control'
import { drawBall, finishGame, newGame, setAuto, undoBall } from '~~/server/engine/balls'

export default defineGameHandler(async (event) => {
  await requireAdmin(event)
  const b = await parseBody(event, z.object({ pattern: z.enum(['line', 'corners', 'blackout']).optional(), on: z.boolean().optional(), everyS: z.number().min(3).max(30).optional() }))
  switch (getRouterParam(event, 'action')) {
    case 'new': newGame(b.pattern); break
    case 'draw': return envelope({ ball: drawBall() })
    case 'undo': undoBall(); break
    case 'auto': setAuto(!!b.on, b.everyS); break
    case 'finish': finishGame(); break
    default: throw NotFound('Unknown bingo action')
  }
  return envelope()
})
