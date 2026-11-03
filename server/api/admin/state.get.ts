import { defineGameHandler } from '~~/server/engine/store'
import { requireAdmin } from '~~/server/engine/session'
import { adminState } from '~~/server/engine/adminState'
export default defineGameHandler(async (event) => { await requireAdmin(event); return adminState() })
