import { z } from 'zod'
import { Authorization } from '~~/server/engine/errors'
import { rateLimit, setAdminSession } from '~~/server/engine/session'
import { envelope, parseBody } from '~~/server/engine/control'
export default defineEventHandler(async (event) => {
  rateLimit(event, 'admin-login', 5)
  const { passcode } = await parseBody(event, z.object({ passcode: z.string() }))
  if (passcode !== useRuntimeConfig().adminPasscode) throw Authorization('That passcode is not right')
  await setAdminSession(event)
  return envelope()
})
