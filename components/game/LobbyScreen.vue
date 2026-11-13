<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '~/composables/useCountdown'
import { usePartyStore } from '~/stores/party'

defineProps<{ stage?: boolean }>()
const store = usePartyStore()
const now = useNow(1000)
const until = computed(() => {
  const ms = Math.max(0, (store.snap?.party.scheduledStart ?? 0) - now.value)
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const time = [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].map(n => String(n).padStart(2, '0')).join(':')
  return { d, time, zero: ms === 0 }
})
const games = [['Holiday trivia', 'Four choices, ten seconds, faster pays more.'], ['Guess the Thing', 'A tight crop zooms out. Guess early for more.'], ['Meeting Bingo', 'Everyone gets a card. Dab your own, then call Bingo!']]
const teams = computed(() => !!store.snap?.flags.teams)
</script>

<template>
  <div class="screen scroll" style="gap:14px">
    <div style="text-align:center">
      <h1 class="h-display" style="font-size:42px">{{ store.snap?.party.name }}</h1>
      <div v-if="until.zero" style="font-size:26px;font-weight:900;margin-top:6px">Starting any moment now</div>
      <div v-else style="font-size:24px;font-weight:800;color:#B9B6D6;margin-top:6px">
        The party starts in <span style="color:#F3EEF9;font-size:32px;font-weight:900"><template v-if="until.d">{{ until.d }}d </template>{{ until.time }}</span>
      </div>
    </div>
    <JoinCard v-if="stage" style="margin-top:30px" />
    <template v-else>
      <TeamPanel v-if="teams" />
      <div class="tile-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        <div v-for="g in games" :key="g[0]" style="background:#10122A;border-radius:12px;padding:10px 14px">
          <div style="font-size:18px;font-weight:900">{{ g[0] }}</div>
          <div style="font-size:16px;font-weight:700;color:#B9B6D6;line-height:1.3">{{ g[1] }}</div>
        </div>
      </div>
      <div style="font-size:17px;font-weight:700;color:#B9B6D6;text-align:center">Gift card raffles run all party long, and winners keep their prize automatically. The top scorer and the best egg hunter win bigger gift cards at the finale.</div>
    </template>
  </div>
</template>
