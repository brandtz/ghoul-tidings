<script setup lang="ts">
import { ref, watch } from 'vue'
import { REACTION_ICON } from '~~/shared/catalog'
import { usePartyStore } from '~/stores/party'

const props = defineProps<{ stage?: boolean }>()
const store = usePartyStore()
const items = ref<{ id: number; icon: string; left: number }[]>([])
let id = 0
watch(() => store.reaction, (r) => {
  if (!r || store.calm) return
  // Players see only their own taps; the stage shows everyone, capped so spam cannot freeze it.
  for (const [k, n] of Object.entries(r.counts)) {
    for (let i = 0; i < Math.min(n, 5) && items.value.length < 20; i++) {
      const row = { id: ++id, icon: REACTION_ICON[k] ?? '🎃', left: (props.stage ? 660 : 1200) + Math.random() * (props.stage ? 600 : 120) }
      items.value.push(row)
      setTimeout(() => { items.value = items.value.filter(x => x.id !== row.id) }, 2400)
    }
  }
})
</script>

<template>
  <div class="abs0 no-pe" aria-hidden="true">
    <span v-for="i in items" :key="i.id" class="rise" :style="{ left: `${i.left}px` }">{{ i.icon }}</span>
  </div>
</template>

<style scoped>
.rise { position: absolute; top: 830px; font-size: 40px; animation: rise 2.4s ease-out forwards; }
@keyframes rise { to { transform: translateY(-260px); opacity: 0; } }
</style>
