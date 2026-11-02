import { isAdmin } from '~~/server/engine/session'
export default defineEventHandler(async event => ({ admin: await isAdmin(event) }))
