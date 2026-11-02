<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { ANSWER_IDS } from '~~/shared/catalog'
import { useNow } from '~/composables/useCountdown'
import { usePartyStore } from '~/stores/party'

const props = defineProps<{ stage?: boolean }>()
const store = usePartyStore()
const now = useNow(100)
const round = computed(() => store.snap!.round!)
const q = computed(() => round.value.trivia!)
const me = computed(() => store.me)
const picked = computed(() => me.value?.answer?.choice ?? null)
const reveal = computed(() => round.value.reveal)
const canAnswer = computed(() => !props.stage && round.value.phase === 'open' && picked.value === null && now.value >= round.value.opensAt && now.value < round.value.locksAt)
const total = computed(() => reveal.value?.distribution?.reduce((a, b) => a + b, 0) ?? 0)
const share = (i: number) => (total.value ? Math.round(((reveal.value!.distribution![i] ?? 0) / total.value) * 100) : 0)
const pick = (i: number) => { if (canAnswer.value) store.act(`/api/rounds/${round.value.id}/answer`, { choice: i }) }
const tileClass = (i: number) => ({
  picked: picked.value === i && !reveal.value,
  right: reveal.value?.correctIndex === i,
  dimmed: (picked.value !== null && picked.value !== i && !reveal.value) || (!!reveal.value && reveal.value.correctIndex !== i),
})
function onKey(e: KeyboardEvent) {
  if ((e.target as HTMLElement).closest?.('input,textarea')) return
  const i = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase())
  if (i >= 0) pick(i)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="screen" style="gap:20px">
    <RoundTimer :label="`Question ${round.index} of ${round.total}`" :opens-at="round.opensAt" :locks-at="round.locksAt" :phase="round.phase" />
    <div style="text-align:center;font-size:18px;font-weight:800;color:#B9B6D6;margin-bottom:-14px">{{ q.category }}</div>
    <div class="cinzel h-q" style="font-size:38px;font-weight:700;line-height:1.25;text-align:center;flex:1;display:flex;align-items:center;justify-content:center;color:#F3EEF9">{{ q.prompt }}</div>
    <div class="tile-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">
      <component :is="stage ? 'div' : 'button'" v-for="(o, i) in q.options" :key="i" class="tile" :class="tileClass(i)" :disabled="stage ? undefined : !canAnswer" @click="pick(i)">
        <span v-if="reveal" class="share" :style="{ width: `${share(i)}%` }" />
        <span class="badge" :style="{ background: ANSWER_IDS[i]!.color, color: ANSWER_IDS[i]!.ink }">{{ ANSWER_IDS[i]!.letter }}</span>
        <span style="flex:1">{{ o }}</span>
        <span v-if="reveal" style="font-size:22px;font-weight:900">{{ reveal.correctIndex === i ? '✓ ' : '' }}{{ share(i) }}%</span>
      </component>
    </div>
    <div aria-live="polite" style="min-height:56px">
      <template v-if="stage">
        <div class="result" :class="{ ok: reveal }">{{ reveal ? (reveal.fastest ? `Fastest correct: ${reveal.fastest}` : 'That was a tough one') : `${store.answered} answered` }}</div>
      </template>
      <template v-else-if="reveal">
        <div v-if="me?.result?.isCorrect" class="result ok">+{{ me.result.points.toLocaleString() }}<span v-if="me.result.bonus" style="font-size:19px;color:#B9B6D6"> ({{ (me.result.points - me.result.bonus).toLocaleString() }} + {{ me.result.bonus }} speed)</span></div>
        <div v-else-if="picked !== null" class="result">Not this time.</div>
        <div v-else class="result">Time's up. The next one's yours.</div>
      </template>
      <div v-else-if="picked !== null" class="result">Locked in. Reveal coming.</div>
      <div v-else-if="round.phase !== 'open'" class="result">Time's up. The next one's yours.</div>
      <div v-else class="result" style="color:#B9B6D6;font-size:20px">{{ store.answered }} answered · press 1 to 4 or tap an answer</div>
    </div>
  </div>
</template>
