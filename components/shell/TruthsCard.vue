<script setup lang="ts">
import { computed } from 'vue'
import { fmtClock } from '~~/shared/schedule'
import { useNow } from '~/composables/useCountdown'
import { usePartyStore } from '~/stores/party'

defineEmits<{ open: [] }>()
const store = usePartyStore()
const now = useNow(1000)
const win = computed(() => store.snap?.ttl)
const open = computed(() => !!win.value && now.value >= win.value.opensAt && now.value < win.value.closesAt)
const mine = computed(() => store.me?.ttl ?? null)
const closesIn = computed(() => {
  const ms = (win.value?.closesAt ?? 0) - now.value
  return ms < 3600_000 ? fmtClock(ms) : null
})
</script>

<template>
  <section v-if="open" class="card" style="padding:18px 16px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px">
    <svg aria-hidden="true" width="44" height="44" viewBox="0 0 44 44"><path d="M8 40 V20 a14 14 0 0 1 28 0 V40 l-5 -4 -4 4 -5 -4 -5 4 -4 -4Z" style="fill:var(--text)" /><circle cx="17" cy="21" r="3" fill="#0D0B1C" /><circle cx="27" cy="21" r="3" fill="#0D0B1C" /></svg>
    <div class="cinzel" style="font-size:24px;font-weight:700;line-height:1.15">Two Truths and a Lie</div>
    <template v-if="!mine">
      <div style="font-size:17px;font-weight:700;color:var(--muted);line-height:1.3">Submit yours for bonus points!</div>
      <button class="btn-gold" style="margin-top:6px" @click="$emit('open')">Submit yours</button>
    </template>
    <template v-else-if="mine.status === 'approved'">
      <div style="font-size:17px;font-weight:800;line-height:1.3;color:var(--border2)">✓ Approved, +750 paid</div>
      <div style="font-size:16px;font-weight:700;color:var(--muted)">Watch for your round.</div>
    </template>
    <template v-else>
      <div style="font-size:17px;font-weight:800;line-height:1.3;color:var(--border2)">✓ Submitted</div>
      <div style="font-size:16px;font-weight:700;color:var(--muted)">The host reviews it next.</div>
      <button class="btn-ghost" @click="$emit('open')">Edit yours</button>
    </template>
    <div v-if="closesIn" style="font-size:16px;font-weight:700;color:var(--muted)">Closes in {{ closesIn }}</div>
  </section>
</template>
