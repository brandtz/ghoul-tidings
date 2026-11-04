<script setup lang="ts">
// The Legendary reward: Doom shareware in js-dos. Teleported to <body> so it fills the real
// window, not the scaled stage. While open, Doom owns the keyboard and party sounds stand down.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { muted } from '~/composables/effectSound'
import { usePartyStore } from '~/stores/party'

const emit = defineEmits<{ close: [] }>()
const store = usePartyStore()
const host = ref<HTMLElement | null>(null)
const state = ref<'loading' | 'ready' | 'failed'>('loading')
// Phones have no keyboard for Doom, so they get a note instead of a 2 MB download.
const phone = window.matchMedia('(hover: none) and (pointer: coarse)').matches
const VOLUME = 0.7
let dos: any = null

let loader: Promise<void> | null = null
function loadJsDos() {
  if ((window as any).Dos) return Promise.resolve()
  return (loader ??= new Promise<void>((ok, fail) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/js-dos/js-dos.css'; document.head.appendChild(css)
    const js = document.createElement('script'); js.src = '/js-dos/js-dos.js'; js.onload = () => ok(); js.onerror = () => { loader = null; fail(new Error('js-dos')) }
    document.head.appendChild(js)
  }))
}

onMounted(async () => {
  store.legendaryOpen = true
  if (phone) return
  try {
    await loadJsDos()
    if (!host.value) return
    dos = (window as any).Dos(host.value, {
      url: '/api/legendary/bundle', pathPrefix: '/js-dos/emulators/',
      backend: 'dosbox', backendLocked: true, kiosk: true, noCloud: true, autoStart: true, autoSave: false,
      theme: 'dark', volume: muted.value ? 0 : VOLUME,
      // No pointer lock: a captured mouse can't reach "Back to the party". Doom plays fine on keys.
      mouseCapture: false,
    })
    state.value = 'ready'
  } catch { state.value = 'failed' }
})
watch(muted, m => dos?.setVolume?.(m ? 0 : VOLUME))
onBeforeUnmount(() => {
  store.legendaryOpen = false
  if (document.pointerLockElement) document.exitPointerLock()
  dos?.stop?.().catch?.(() => {}); dos = null
})
</script>

<template>
  <Teleport to="body">
    <div class="legendary" role="dialog" aria-modal="true" aria-label="Legendary: Doom">
      <header class="legendary-bar">
        <span class="legendary-title">LEGENDARY</span>
        <span v-if="phone" style="flex:1" />
        <span v-if="!phone" class="legendary-keys">Click the game first. Arrows move · Ctrl fires · Space opens doors · Shift runs · Esc for the menu</span>
        <button class="legendary-close" @click="emit('close')">Back to the party</button>
      </header>
      <div v-if="phone" class="legendary-note">
        <p>This one needs a keyboard.</p>
        <p>Open the party on a computer and it will be waiting for you there.</p>
      </div>
      <div v-else class="legendary-screen">
        <div ref="host" class="legendary-dos" />
        <div v-if="state === 'failed'" class="legendary-note">The cartridge would not load. Close this and try again.</div>
      </div>
      <footer class="legendary-foot">DOOM shareware v1.9 © id Software, shared as id intended. Running in js-dos.</footer>
    </div>
  </Teleport>
</template>
