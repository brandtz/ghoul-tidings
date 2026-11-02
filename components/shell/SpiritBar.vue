<script setup lang="ts">
import { computed } from 'vue'
import { usePartyStore } from '~/stores/party'

const store = usePartyStore()
const pct = computed(() => { const s = store.snap?.spirit; return s ? Math.min(100, (s.value / s.goal) * 100) : 0 })
</script>

<template>
  <div class="score-pill" style="left:560px;width:800px;padding:0 24px;gap:14px">
    <span style="font-size:20px;font-weight:800;color:var(--muted);white-space:nowrap">Holiday Spirit</span>
    <div style="flex:1;height:14px;border-radius:7px;background:#07060F;overflow:hidden"><div :style="{ width: `${pct}%` }" style="height:100%;background:var(--border2);transition:width 400ms" /></div>
    <span style="font-size:20px;font-weight:800;white-space:nowrap">{{ store.snap?.present ?? 0 }} playing<template v-if="store.snap?.round"> · {{ store.answered }} answered</template></span>
  </div>
</template>
