<script setup lang="ts">
import { computed, ref } from 'vue'
import { POWERUPS, type PowerupKind } from '~~/shared/phase2'
import { usePartyStore } from '~/stores/party'

const store = usePartyStore()
const busy = ref(false)
const def = computed(() => (store.me?.powerup && store.snap?.flags.powerups ? POWERUPS[store.me.powerup as PowerupKind] : null))
async function use() {
  busy.value = true
  if (await store.act('/api/powerups/use')) store.toast(`${def.value?.name ?? 'Power-up'} used`, 'treat')
  busy.value = false
}
</script>

<template>
  <section v-if="def" class="card fade-in" style="padding:12px 14px;text-align:center;display:flex;flex-direction:column;gap:6px">
    <div class="cinzel" style="font-size:20px;font-weight:700;color:var(--border2)">{{ def.name }}</div>
    <div style="font-size:16px;font-weight:700;color:var(--muted);line-height:1.25">{{ def.desc }}</div>
    <button class="btn-gold" :disabled="busy" @click="use">Use</button>
  </section>
</template>
