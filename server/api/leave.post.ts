import { defineGameHandler } from '~~/server/engine/store'
import { clearPlayerSession } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
export default defineGameHandler((event) => { clearPlayerSession(event); return envelope() })
