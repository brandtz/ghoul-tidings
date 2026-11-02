import { requireAdmin } from '~~/server/engine/session'
import { adminState } from '~~/server/engine/adminState'
export default defineEventHandler(async (event) => { await requireAdmin(event); return adminState() })
