import { ensureSeedImages } from '~~/server/engine/images'

export default defineNitroPlugin(() => {
  ensureSeedImages().catch(e => console.error('[seed] image generation failed', e))
})
