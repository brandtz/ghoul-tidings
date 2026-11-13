<script setup lang="ts">
// Decides what fills the frame. The frame itself never moves or resizes.
import { computed, watch } from 'vue'
import { usePartyStore } from '~/stores/party'

const props = defineProps<{ stage?: boolean }>()
const store = usePartyStore()
const s = computed(() => store.snap)
const view = computed(() => {
  const x = s.value
  if (!x) return 'loading'
  if (!x.me && !props.stage) return 'join'
  if (x.party.status === 'ended' || x.segment?.type === 'finale') return 'finale'
  if (x.paused.party) return 'paused'
  if (x.party.status !== 'live') return 'lobby'
  if (x.presentation) return 'slides'
  if (x.round) return x.round.itemType
  if (x.segment?.type === 'bingo') return 'bingo'
  if (x.segment && x.segment.itemCount > 0) return 'ready'
  return 'intermission'
})
// Phones keep scroll position between screens otherwise.
watch(view, () => window.scrollTo(0, 0))
</script>

<template>
  <div v-if="view === 'loading'" class="screen" style="align-items:center;justify-content:center">
    <div class="h-display flick" style="font-size:36px">Lighting the candles…</div>
  </div>
  <JoinScreen v-else-if="view === 'join'" />
  <FinaleView v-else-if="view === 'finale'" :stage="stage" />
  <div v-else-if="view === 'paused'" class="screen" style="align-items:center;justify-content:center;text-align:center">
    <h1 class="h-display" style="font-size:48px">Quick intermission</h1>
    <p style="font-size:26px;font-weight:700;color:#B9B6D6">The host is fixing something. Back in a moment.</p>
  </div>
  <LobbyScreen v-else-if="view === 'lobby'" :stage="stage" />
  <PresentationView v-else-if="view === 'slides'" />
  <TriviaGame v-else-if="view === 'trivia'" :key="s!.round!.id" :stage="stage" />
  <GuessGame v-else-if="view === 'guess'" :key="s!.round!.id" :stage="stage" />
  <TruthsGame v-else-if="view === 'ttl'" :key="s!.round!.id" :stage="stage" />
  <BingoGame v-else-if="view === 'bingo'" :stage="stage" />
  <div v-else-if="view === 'ready'" class="screen" style="align-items:center;justify-content:center;text-align:center">
    <div class="chip">{{ s!.segment!.title }}</div>
    <h1 class="h-display" style="font-size:52px">Get ready</h1>
    <p style="font-size:26px;font-weight:700;color:#B9B6D6">Round {{ s!.segment!.itemIndex + 1 }} of {{ s!.segment!.itemCount }} is coming up.</p>
  </div>
  <IntermissionView v-else :stage="stage" />
</template>
