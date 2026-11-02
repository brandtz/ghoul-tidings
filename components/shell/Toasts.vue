<script setup lang="ts">
import { usePartyStore } from '~/stores/party'
const store = usePartyStore()
</script>

<template>
  <div aria-live="polite" class="no-pe toasts" style="position:absolute;left:1240px;top:112px;width:232px;display:flex;flex-direction:column;gap:8px;align-items:flex-end;z-index:6">
    <div v-for="t in store.toasts" :key="t.id" class="card fade-in" :style="{ borderColor: t.kind === 'treat' ? '#6EE7A8' : t.kind === 'trick' ? '#FF8F94' : 'var(--border)' }" style="padding:8px 14px;font-size:17px;font-weight:800;width:100%;box-sizing:border-box">
      {{ t.kind === 'treat' ? '✓ ' : t.kind === 'trick' ? '! ' : '' }}{{ t.text }}
    </div>
  </div>
</template>
