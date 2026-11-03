import { defineGameHandler } from '~~/server/engine/store'
import { getFile } from '~~/server/engine/files'
import { Authorization, NotFound } from '~~/server/engine/errors'
import { db } from '~~/server/engine/db'
import { isAdmin, requireViewer } from '~~/server/engine/session'
export default defineGameHandler(async (event) => {
  await requireViewer(event)
  const d = db(); const id = getRouterParam(event, 'id')
  const isHost = await isAdmin(event)
  if (!isHost && d.party.state.presentation?.id !== id) throw Authorization('Slides are only visible during presentation mode')
  const deck = d.presentations.find(x => x.id === id)
  if (!deck) throw NotFound('Deck not found')
  setHeader(event, 'Content-Type', 'application/pdf')
  return getFile(deck.pdfPath)
})
