import { db } from '~~/server/engine/db'
export default defineEventHandler(() => {
  const d = db()
  return { slug: d.party.slug, name: d.party.name, flags: d.party.settings.flags }
})
