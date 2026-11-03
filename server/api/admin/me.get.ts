import { defineGameHandler } from '~~/server/engine/store'
import { isAdmin } from '~~/server/engine/session'
export default defineGameHandler(async event => ({ admin: await isAdmin(event) }))
