import { AVATAR_KEYS } from '~~/shared/catalog'
import { z } from 'zod'
import { Authorization, Conflict } from '~~/server/engine/errors'
import { db, log, save, uid } from '~~/server/engine/db'
import { broadcast } from '~~/server/engine/bus'
import { hashEmail, rateLimit, setPlayerSession } from '~~/server/engine/session'
import { envelope, parseBody } from '~~/server/engine/control'
const schema = z.object({
  name: z.string().trim().min(2, 'Name needs at least 2 characters').max(24),
  email: z.string().trim().email('Enter your work email'),
  avatarKey: z.enum(AVATAR_KEYS as [string, ...string[]]),
})
export default defineEventHandler(async (event) => {
  rateLimit(event, 'join', 10)
  const b = await parseBody(event, schema)
  const d = db()
  if (d.party.status === 'ended') throw Conflict("The party's over. Thanks for haunting!")
  const emailHash = hashEmail(b.email)
  let p = d.players.find(x => x.emailHash === emailHash)
  const welcomeBack = !!p
  if (p) {
    if (p.removedAt) throw Authorization('The host removed you from this party.')
    if (p.displayName.toLowerCase() !== b.name.toLowerCase()) throw Conflict('That email already has a seat under a different name.')
    p.lastSeenAt = Date.now()
  } else {
    p = { id: uid(), displayName: b.name, emailHash, avatarKey: b.avatarKey, teamId: null, isHost: false, removedAt: null, joinedAt: Date.now(), lastSeenAt: Date.now() }
    d.players.push(p)
    log('join', `${p.displayName} joined`, {}, p.displayName)
    broadcast('state.changed', {}, { bump: false })
  }
  await setPlayerSession(event, p.id)
  save()
  return envelope({ welcomeBack, name: p.displayName })
})
