import { clearPlayerSession } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
export default defineEventHandler((event) => { clearPlayerSession(event); return envelope() })
