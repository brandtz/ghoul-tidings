<script setup lang="ts">
import { computed } from 'vue'
import { fmtClock } from '~~/shared/schedule'
import { useNow } from '~/composables/useCountdown'
import { usePartyStore } from '~/stores/party'

const store = usePartyStore()
const now = useNow(250)
const raffle = computed(() => store.snap?.raffle)
const remaining = computed(() => (raffle.value?.nextDueAt ?? 0) - now.value)
const state = computed(() => {
  const r = raffle.value
  if (!r || store.snap?.party.status !== 'live') return 'prelive'
  if (store.moment) return 'drawing'
  if (r.deferred) return 'waiting'
  if (r.nextDueAt === null) return 'done'
  if (remaining.value <= 0) return 'waiting'
  return remaining.value <= 10000 ? 'final' : 'idle'
})
</script>

<template>
  <section class="card" style="padding:16px 16px 18px;text-align:center">
    <div class="card-label">{{ state === 'final' ? 'Almost time!' : 'Next raffle in' }}</div>
    <div
      v-if="state === 'idle' || state === 'final'"
      role="timer" :aria-live="state === 'final' ? 'polite' : 'off'" :class="{ pulse: state === 'final' }"
      style="margin-top:8px;border:2px solid var(--border);border-radius:12px;background:#07060F;padding:6px 0 8px;font-size:58px;font-weight:900;line-height:1.1;letter-spacing:.04em"
    >{{ fmtClock(remaining) }}</div>
    <div v-else style="margin-top:8px;border:2px solid var(--border);border-radius:12px;background:#07060F;padding:14px 8px;font-size:22px;font-weight:900;line-height:1.25;min-height:44px">
      <template v-if="state === 'waiting'">Drawing after this round</template>
      <template v-else-if="state === 'drawing'">Drawing…</template>
      <template v-else-if="state === 'done'">All prizes drawn</template>
      <template v-else>Starts with the party</template>
    </div>
  </section>
</template>
