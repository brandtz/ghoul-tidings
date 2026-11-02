<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { guessValue, zoomStepAt } from '~~/shared/scoring'
import { useNow } from '~/composables/useCountdown'
import { usePartyStore } from '~/stores/party'

const props = defineProps<{ stage?: boolean }>()
const store = usePartyStore()
const now = useNow(200)
const round = computed(() => store.snap!.round!)
const stepS = computed(() => round.value.guess!.stepS)
const step = computed(() => zoomStepAt(Math.max(0, now.value - round.value.opensAt), stepS.value))
const reveal = computed(() => round.value.reveal)
const answer = computed(() => store.me?.answer ?? null)
const result = computed(() => store.me?.result ?? null)
const text = ref('')
const canAnswer = computed(() => !props.stage && round.value.phase === 'open' && !answer.value)
const src = computed(() => (reveal.value ? `/api/rounds/${round.value.id}/full` : `/api/rounds/${round.value.id}/crop/${step.value}`))
const submit = () => { if (text.value.trim() && canAnswer.value) store.act(`/api/rounds/${round.value.id}/answer`, { text: text.value }) }
const selfMark = () => store.act(`/api/rounds/${round.value.id}/self-mark`)
const declined = ref(false)
// Preload the next crop just as the server releases it, so steps crossfade without a gap.
watch(step, (s) => { if (s < 6) setTimeout(() => { new Image().src = `/api/rounds/${round.value.id}/crop/${s + 1}` }, Math.max(0, stepS.value * 1000 - 1200)) })
</script>

<template>
  <div class="screen" style="gap:16px">
    <RoundTimer :label="`Image ${round.index} of ${round.total}`" :opens-at="round.opensAt" :locks-at="round.locksAt" :phase="round.phase" />
    <div style="display:grid;grid-template-columns:1fr 150px;gap:16px;flex:1;min-height:0" class="guess-grid">
      <div style="position:relative;border-radius:14px;overflow:hidden;background:#07060F;aspect-ratio:16/9;align-self:center;border:3px solid #34375E">
        <img :key="src" :src="src" alt="A zoomed-in picture to guess" class="fade-in" style="width:100%;height:100%;object-fit:cover;display:block">
      </div>
      <ol style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;justify-content:center" aria-label="Points per zoom">
        <li v-for="s in 6" :key="s" :style="{ background: s === (answer?.zoomStep ?? step) ? 'var(--border)' : '#15172F', color: s === (answer?.zoomStep ?? step) ? '#140A05' : s < step ? '#6A6890' : '#F3EEF9' }" style="display:flex;justify-content:space-between;border-radius:8px;padding:6px 12px;font-size:19px;font-weight:900"><span>Zoom {{ s }}</span><span>{{ guessValue(s).toLocaleString() }}</span></li>
      </ol>
    </div>
    <div aria-live="polite" style="min-height:64px;display:flex;flex-direction:column;gap:8px">
      <template v-if="reveal">
        <div class="result" :class="{ ok: stage || result?.isCorrect }">
          <span class="cinzel">{{ reveal.answerDisplay }}</span>
          <template v-if="stage"> · {{ reveal.correctCount }} got it<template v-if="reveal.first">, first was {{ reveal.first }}</template></template>
          <template v-else-if="result?.isCorrect"> · +{{ result.points.toLocaleString() }}</template>
          <template v-else-if="answer"> · Not a match</template>
        </div>
        <div v-if="result?.canSelfMark && !declined && !stage" style="display:flex;gap:10px;justify-content:center;align-items:center">
          <span style="font-size:19px;font-weight:800">Close? You said "{{ answer?.text }}"</span>
          <button class="btn-gold" @click="selfMark">I got it</button>
          <button class="btn-ghost" @click="declined = true">Nope</button>
        </div>
      </template>
      <div v-else-if="stage" class="result">{{ store.answered }} locked in</div>
      <div v-else-if="answer" class="result">Locked: "{{ answer.text }}" at zoom {{ answer.zoomStep }}, worth {{ answer.worth?.toLocaleString() }}</div>
      <div v-else-if="round.phase !== 'open'" class="result">Time's up. The next one's yours.</div>
      <form v-else style="display:flex;gap:12px" @submit.prevent="submit">
        <input v-model="text" class="field" maxlength="80" placeholder="What is it?" aria-label="Your guess" autocomplete="off">
        <button class="btn-gold" style="min-height:52px" :disabled="!text.trim()">Submit</button>
      </form>
    </div>
  </div>
</template>
