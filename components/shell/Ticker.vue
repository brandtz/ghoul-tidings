<script setup lang="ts">
import { usePartyStore } from '~/stores/party'
const store = usePartyStore()
const icon: Record<string, string> = { treat: '🍬', trick: '🕷', steal: '🛡', egg: '🥚', powerup: '✨' }
</script>

<template>
  <div v-if="store.ticker" :key="store.ticker.n" role="status" class="card fade-in no-pe ticker" style="position:absolute;left:560px;top:1000px;width:800px;box-sizing:border-box;padding:8px 18px;text-align:center;font-size:21px;font-weight:800;z-index:5">
    {{ icon[store.ticker.kind] ?? '' }} {{ store.ticker.text }}
  </div>
</template>
