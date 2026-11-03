import { defineGameHandler } from '~~/server/engine/store'
import { db } from '~~/server/engine/db'
export default defineGameHandler(() => {
  const d = db()
  return { slug: d.party.slug, name: d.party.name, flags: d.party.settings.flags }
})
