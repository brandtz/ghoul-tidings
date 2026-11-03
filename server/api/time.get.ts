import { defineGameHandler } from '~~/server/engine/store'
export default defineGameHandler(() => ({ now: Date.now() }))
