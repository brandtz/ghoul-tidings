import { defineGameHandler } from '~~/server/engine/store'
import { putFile } from '~~/server/engine/files'
import { Validation } from '~~/server/engine/errors'
import { db, uid } from '~~/server/engine/db'
import { broadcast } from '~~/server/engine/bus'
import { requireAdmin } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
export default defineGameHandler(async (event) => {
  await requireAdmin(event)
  const parts = await readMultipartFormData(event)
  const file = parts?.find(p => p.name === 'file')
  if (!file?.data?.length) throw Validation('Choose a PDF')
  if (file.data.length > 5 * 1024 * 1024) throw Validation('Decks are limited to 5 MB. Export with compressed images.')
  const pageCount = Number(parts?.find(p => p.name === 'pageCount')?.data.toString('utf8') ?? 1)
  const title = parts?.find(p => p.name === 'title')?.data.toString('utf8') || file.filename || 'Deck'
  const name = `${uid()}.pdf`
  await putFile(name, file.data, 'application/pdf')
  db().presentations.push({ id: uid(), title, pdfPath: name, pageCount })
  broadcast('state.changed', {}, { bump: false })
  return envelope()
})
