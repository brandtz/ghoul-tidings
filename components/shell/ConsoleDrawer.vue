<script setup lang="ts">
// The secret console: a haunted green-screen that slides up from the bottom edge.
// It exists in the DOM only after a player unlocks it, and opens with the ~ key.
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { usePartyStore } from '~/stores/party'

const store = usePartyStore()
const open = ref(false)
const text = ref('')
const input = ref<HTMLInputElement | null>(null)
const lines = ref<string[]>(['GHOUL-DOS 1.31', 'THE CRYPT IS LISTENING.'])

async function toggle() {
  open.value = !open.value
  if (open.value) { await nextTick(); input.value?.focus() }
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) { open.value = false; return }
  if (e.key !== '~' && e.key !== '`') return
  const t = e.target as HTMLElement
  if (t.closest?.('input,textarea,select,[role=dialog]') && t !== input.value) return
  e.preventDefault()
  toggle()
}
async function send() {
  const v = text.value.trim()
  if (!v) return
  text.value = ''
  lines.value = [...lines.value.slice(-5), `> ${v.toUpperCase()}`]
  const r = await store.act('/api/redeem', { tail: v })
  const reply = r?.effects?.find((f: any) => f.toast)?.toast
  lines.value = [...lines.value.slice(-5), (reply ?? 'NOTHING HAPPENS.').toUpperCase()]
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <section v-if="open" aria-label="Secret console" class="console ov-card">
    <div class="out"><div v-for="(l, i) in lines" :key="i">{{ l }}</div></div>
    <form class="row" @submit.prevent="send">
      <span aria-hidden="true">&gt;</span>
      <input ref="input" v-model="text" maxlength="32" aria-label="Console input" autocomplete="off" spellcheck="false">
      <span class="cursor" aria-hidden="true" />
    </form>
  </section>
</template>

<style scoped>
.console { position: absolute; left: 480px; top: 894px; width: 960px; height: 186px; box-sizing: border-box; padding: 14px 20px; background: #03140A; border: 3px solid #2F9E5B; border-bottom: 0; border-radius: 14px 14px 0 0; color: #7CF5A6; font: 700 20px/1.3 Consolas, 'Courier New', monospace; display: flex; flex-direction: column; justify-content: flex-end; z-index: 8; animation: up 200ms ease-out; }
.out { overflow: hidden; }
.row { display: flex; align-items: center; gap: 10px; min-height: 44px; }
input { flex: 1; min-width: 0; background: transparent; border: 0; outline: none; color: inherit; font: inherit; text-transform: uppercase; caret-color: transparent; min-height: 44px; }
input:focus-visible { box-shadow: 0 2px 0 #7CF5A6; }
.cursor { width: 12px; height: 22px; background: #7CF5A6; animation: blink 1s steps(2) infinite; }
.calm .cursor { animation: none; }
@keyframes up { from { transform: translateY(100%); } }
@keyframes blink { 50% { opacity: 0; } }
</style>
