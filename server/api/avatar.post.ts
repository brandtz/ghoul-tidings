import { defineGameHandler } from '~~/server/engine/store'
import { z } from 'zod'
import { JOINABLE_AVATAR_KEYS } from '~~/shared/catalog'
import { log, save } from '~~/server/engine/db'
import { broadcast } from '~~/server/engine/bus'
import { requirePlayer } from '~~/server/engine/session'
import { envelope, parseBody } from '~~/server/engine/control'

// Only the Wednesday frog cheat calls this today.
export default defineGameHandler(async (event) => {
  const p = await requirePlayer(event)
  const { avatarKey } = await parseBody(event, z.object({ avatarKey: z.enum(JOINABLE_AVATAR_KEYS as [string, ...string[]]) }))
  if (p.avatarKey !== avatarKey) {
    p.avatarKey = avatarKey
    log('avatar', `${p.displayName} changed avatar to ${avatarKey}`, {}, p.displayName)
    broadcast('state.changed', {})
  }
  save()
  return envelope({ avatarKey }, avatarKey === 'wednesday' ? [{ key: 'confetti', scope: 'personal', toast: 'It is Wednesday, my dudes.' }] : [])
})
