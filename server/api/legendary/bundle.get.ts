import { defineGameHandler } from '~~/server/engine/store'
import { db } from '~~/server/engine/db'
import { hasUnlock } from '~~/server/engine/codes'
import { Authorization, NotFound } from '~~/server/engine/errors'
import { isAdmin, requirePlayer } from '~~/server/engine/session'

// The Doom shareware bundle. Only for players who unlocked it while the host's switch is on.
// The host can always load it, to test before the party.
export default defineGameHandler(async (event) => {
  if (!(await isAdmin(event))) {
    const p = await requirePlayer(event)
    if (!db().party.settings.flags.legendary || !hasUnlock(p.id, 'legendary')) throw Authorization('Not unlocked')
  }
  const buf = await useStorage('assets:server').getItemRaw('legendary/doom-shareware.jsdos')
  if (!buf) throw NotFound('Bundle missing')
  setHeader(event, 'Content-Type', 'application/zip')
  setHeader(event, 'Cache-Control', 'private, max-age=3600')
  return buf
})
