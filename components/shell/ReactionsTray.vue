<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { REACTIONS, REACTION_ICON } from '~~/shared/catalog'
import { usePartyStore } from '~/stores/party'

const store = usePartyStore()
let pending: Record<string, number> = {}
let last = 0
let timer: ReturnType<typeof setTimeout> | null = null

function flush() {
  timer = null
  const counts = pending; pending = {}
  if (Object.keys(counts).length) $fetch('/api/react', { method: 'POST', body: { counts } }).catch(() => {})
}
function react(k: string) {
  const t = Date.now()
  if (t - last < 450) return
  last = t
  pending[k] = (pending[k] ?? 0) + 1
  store.reaction = { counts: { [k]: 1 }, n: t }
  if (!timer) timer = setTimeout(flush, 5000)
}
onBeforeUnmount(() => { if (timer) { clearTimeout(timer); flush() } })
</script>

<template>
  <div class="card fade-in" role="group" aria-label="Send a reaction" style="position:absolute;left:1272px;top:768px;display:flex;gap:6px;padding:6px 8px;border-radius:999px">
    <button v-for="k in REACTIONS" :key="k" :aria-label="k" style="width:48px;height:48px;border:0;border-radius:50%;background:#140E24;font-size:26px" @click="react(k)">{{ REACTION_ICON[k] }}</button>
  </div>
</template>
