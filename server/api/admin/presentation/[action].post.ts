import { z } from 'zod'
import { NotFound, Validation } from '~~/server/engine/errors'
import { db } from '~~/server/engine/db'
import { broadcast } from '~~/server/engine/bus'
import { requireAdmin } from '~~/server/engine/session'
import { envelope, parseBody } from '~~/server/engine/control'
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const b = await parseBody(event, z.object({ id: z.string().optional(), page: z.number().int().optional(), pageCount: z.number().int().optional() }))
  const d = db(); const st = d.party.state
  const action = getRouterParam(event, 'action')
  if (action === 'start') {
    const deck = d.presentations.find(x => x.id === b.id) ?? d.presentations[0]
    if (!deck) throw Validation('Upload a deck first')
    if (b.pageCount) deck.pageCount = b.pageCount
    st.presentation = { id: deck.id, page: 1 }
    broadcast('presentation.slide', { page: 1 })
  } else if (action === 'goto') {
    if (!st.presentation) throw Validation('No deck is live')
    const deck = d.presentations.find(x => x.id === st.presentation!.id)!
    st.presentation.page = Math.max(1, Math.min(deck.pageCount, b.page ?? 1))
    broadcast('presentation.slide', { page: st.presentation.page })
  } else if (action === 'end') {
    st.presentation = null
    broadcast('presentation.slide', { page: null })
  } else throw NotFound('Unknown presentation action')
  return envelope()
})
