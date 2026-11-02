<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '~/composables/useCountdown'
import { usePartyStore } from '~/stores/party'

const props = defineProps<{ stage?: boolean }>()
const store = usePartyStore()
const now = useNow(100)
const round = computed(() => store.snap!.round!)
const t = computed(() => round.value.ttl!)
const isSubject = computed(() => store.me?.id === t.value.subject.id)
const picked = computed(() => store.me?.answer?.choice ?? null)
const reveal = computed(() => round.value.reveal)
const canVote = computed(() => !props.stage && !isSubject.value && round.value.phase === 'open' && picked.value === null && now.value >= round.value.opensAt && now.value < round.value.locksAt)
const total = computed(() => reveal.value?.distribution?.reduce((a, b) => a + b, 0) ?? 0)
const share = (i: number) => (total.value ? Math.round(((reveal.value!.distribution![i] ?? 0) / total.value) * 100) : 0)
const vote = (i: number) => { if (canVote.value) store.act(`/api/rounds/${round.value.id}/answer`, { choice: i }) }
</script>

<template>
  <div class="screen" style="gap:16px">
    <RoundTimer :label="`Round ${round.index} of ${round.total}`" :opens-at="round.opensAt" :locks-at="round.locksAt" :phase="round.phase" />
    <div style="display:flex;align-items:center;justify-content:center;gap:16px">
      <Avatar :avatar-key="t.subject.avatarKey" :size="72" ring="var(--border2)" />
      <div><div class="chip">Which one is the lie?</div><div class="cinzel" style="font-size:36px;font-weight:700">{{ t.subject.name }}</div></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;flex:1;justify-content:center">
      <component
        :is="stage ? 'div' : 'button'" v-for="(s, i) in t.statements" :key="i" class="tile"
        :class="{ picked: picked === i && !reveal, right: reveal?.correctIndex === i, dimmed: !!reveal && reveal.correctIndex !== i }"
        :disabled="stage ? undefined : !canVote" style="font-size:28px;min-height:96px" @click="vote(i)"
      >
        <span v-if="reveal" class="share" :style="{ width: `${share(i)}%` }" />
        <span class="badge" style="background:#241A48;color:#F3EEF9">{{ i + 1 }}</span>
        <span style="flex:1">{{ s }}</span>
        <span v-if="reveal" style="font-size:20px;font-weight:900;white-space:nowrap">{{ reveal.correctIndex === i ? 'TRICK' : 'TREAT' }} · {{ share(i) }}%</span>
      </component>
    </div>
    <div aria-live="polite" style="min-height:56px">
      <div v-if="stage" class="result" :class="{ ok: reveal }">{{ reveal ? `${reveal.fooled} fooled` : `${store.answered} voted` }}</div>
      <div v-else-if="isSubject" class="result">{{ reveal ? `You fooled ${reveal.fooled}!` : "It's your round! Watch them squirm." }}</div>
      <template v-else-if="reveal">
        <div v-if="store.me?.result?.isCorrect" class="result ok">You spotted it! +{{ store.me.result.points }}</div>
        <div v-else class="result">Fooled you.</div>
      </template>
      <div v-else-if="picked !== null" class="result">Locked in. Reveal coming.</div>
      <div v-else class="result" style="color:#B9B6D6;font-size:20px">{{ store.answered }} voted</div>
    </div>
  </div>
</template>
