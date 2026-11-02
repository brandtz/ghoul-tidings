<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '~/composables/useCountdown'

const props = defineProps<{ label: string; opensAt: number; locksAt: number; phase: string }>()
const now = useNow(100)
const left = computed(() => Math.max(0, props.locksAt - now.value))
const total = computed(() => props.locksAt - props.opensAt)
const waiting = computed(() => now.value < props.opensAt)
const pct = computed(() => (props.phase === 'open' ? Math.min(100, (left.value / total.value) * 100) : 0))
const secs = computed(() => Math.ceil(Math.min(left.value, total.value) / 1000))
</script>

<template>
  <div style="display:flex;align-items:center;gap:20px">
    <span class="chip" style="font-size:22px">{{ label }}</span>
    <div class="track" :class="{ low: secs <= 3 }"><div :style="{ width: `${pct}%` }" /></div>
    <span role="timer" :class="{ pulse: phase === 'open' && secs <= 3 }" style="font-size:32px;font-weight:900;min-width:60px;text-align:right">{{ phase !== 'open' ? '0s' : waiting ? 'Ready' : `${secs}s` }}</span>
  </div>
</template>
