import { clearAdminSession } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
export default defineEventHandler((event) => { clearAdminSession(event); return envelope() })
