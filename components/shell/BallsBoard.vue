<script setup lang="ts">
// A player's Ghoul Bingo card. Dabs stay on this device and nothing is dabbed for you:
// watch the balls, dab your numbers, press Bingo! when the pattern is complete.
// The server checks the claim against the drawn balls straight away.
import { computed, ref, watch } from 'vue'
import { BALL_FREE, LETTERS, meetsPattern, PATTERN_HELP, PATTERN_LABEL } from '~~/shared/balls'
import { usePartyStore } from '~/stores/party'

const props = defineProps<{ tile?: number }>()
const store = usePartyStore()
const b = computed(() => store.snap?.balls)
const card = computed(() => store.me?.balls.card ?? [])
const won = computed(() => !!store.me?.balls.won)
const key = computed(() => `gt_balls:${b.value?.game ?? 0}:${card.value.join('.')}`)
const marked = ref(new Set<number>([BALL_FREE]))
const load = () => { try { marked.value = new Set([BALL_FREE, ...JSON.parse(localStorage.getItem(key.value) ?? '[]')]) } catch { marked.value = new Set([BALL_FREE]) } }
watch(key, load, { immediate: true })
const closed = computed(() => won.value || b.value?.status === 'idle')
function tap(i: number) {
  if (i === BALL_FREE || closed.value) return
  const s = new Set(marked.value)
  if (s.has(i)) s.delete(i); else s.add(i)
  marked.value = s
  try { localStorage.setItem(key.value, JSON.stringify([...s])) } catch { /* private mode */ }
}
const ready = computed(() => !!b.value && meetsPattern(marked.value, b.value.pattern))
const busy = ref(false)
async function callBingo() {
  busy.value = true
  await store.act('/api/balls/claim', { marked: [...marked.value] })
  busy.value = false
}
const h = computed(() => props.tile ?? 72)
const late = computed(() => b.value?.status === 'won' && !won.value)
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:8px">
    <div class="balls-grid" style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px">
      <div v-for="l in LETTERS" :key="l" class="cinzel" style="text-align:center;font-size:30px;font-weight:900;color:var(--border2);line-height:1.1">{{ l }}</div>
      <button
        v-for="(n, i) in card" :key="i" :aria-pressed="marked.has(i)" :class="{ 'free-sq': i === BALL_FREE }" :aria-label="i === BALL_FREE ? 'Free space' : `${LETTERS[i % 5]} ${n}`"
        :disabled="closed && i !== BALL_FREE"
        style="position:relative;border-radius:12px;border:2px solid #34375E;background:#F3EEF9;color:#140A05;font-weight:900;padding:0;opacity:1;overflow:hidden"
        :style="{ height: `${h}px`, fontSize: i === BALL_FREE ? `${h * 0.24}px` : `${h * 0.44}px` }"
        @click="tap(i)"
      >
        <span style="position:relative;z-index:1">{{ i === BALL_FREE ? 'FREE' : n }}</span>
        <span v-if="marked.has(i)" class="dab" aria-hidden="true" />
      </button>
    </div>
    <div aria-live="polite" style="min-height:56px;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:14px;text-align:center">
      <span v-if="won" style="font-size:24px;font-weight:900;color:var(--border2)">BINGO! You won game {{ b?.game }}. Points are on the board.</span>
      <span v-else-if="b?.status === 'idle'" style="font-size:20px;font-weight:800;color:var(--muted)">Game over. A fresh card comes with the next game.</span>
      <template v-else>
        <button class="btn-gold" :class="{ pulse: ready }" style="min-height:56px;font-size:26px;padding:0 40px" :disabled="!ready || busy" @click="callBingo">Bingo!</button>
        <span style="font-size:16px;font-weight:700;color:var(--muted);max-width:420px;line-height:1.3">
          <template v-if="late">Someone has bingo! If you have it on the same ball, press Bingo! now.</template>
          <template v-else-if="ready">{{ PATTERN_LABEL[b!.pattern] }} complete. Press Bingo!</template>
          <template v-else>{{ PATTERN_LABEL[b!.pattern] }}: {{ PATTERN_HELP[b!.pattern] }} Tap a number to dab it.</template>
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dab { position: absolute; inset: 10%; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #FF9A4D, #E2551B 70%); opacity: .82; mix-blend-mode: multiply; animation: dabIn .18s ease-out; }
@keyframes dabIn { from { transform: scale(1.5); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .dab { animation: none; } }
</style>
