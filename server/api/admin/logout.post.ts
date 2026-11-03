import { defineGameHandler } from '~~/server/engine/store'
import { clearAdminSession } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
export default defineGameHandler((event) => { clearAdminSession(event); return envelope() })
