<script setup lang="ts">
// The bingo segment. Players see their card in the frame; the stage shows the calls.
import { computed } from 'vue'
import { usePartyStore } from '~/stores/party'

const props = defineProps<{ stage?: boolean }>()
const store = usePartyStore()
const b = computed(() => store.snap?.bingo)
const last = computed(() => b.value?.called.at(-1) ?? null)
const earlier = computed(() => [...(b.value?.called ?? [])].reverse().slice(1))
const hasCard = computed(() => !props.stage && !!store.me?.bingoCard)
</script>

<template>
  <div v-if="hasCard" class="screen scroll" style="padding:30px 40px 20px;gap:8px">
    <div style="display:flex;align-items:center;gap:12px">
      <h1 class="h-display" style="font-size:34px;margin:0">Meeting Bingo</h1>
      <div style="flex:1" />
      <span v-if="b?.winners.length" style="font-size:17px;font-weight:800;color:var(--muted)">{{ b.winners.length }} {{ b.winners.length === 1 ? 'bingo' : 'bingos' }} so far</span>
    </div>
    <BingoBoard :tile="88" />
  </div>
  <div v-else class="screen" style="align-items:center;text-align:center;gap:18px">
    <div class="chip" style="font-size:22px">Meeting Bingo</div>
    <template v-if="last">
      <div style="font-size:22px;font-weight:800;color:#B9B6D6">Latest call</div>
      <div class="cinzel" style="font-size:58px;font-weight:900;line-height:1.15;color:var(--border2)">{{ last }}</div>
    </template>
    <h1 v-else class="h-display" style="font-size:48px">Find your card. First call coming up.</h1>
    <div v-if="earlier.length" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-height:170px;overflow:hidden">
      <span v-for="c in earlier" :key="c" style="background:#15172F;border:2px solid #34375E;border-radius:10px;padding:6px 12px;font-size:18px;font-weight:800">{{ c }}</span>
    </div>
    <div style="flex:1" />
    <div v-if="b?.winners.length" style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:center">
      <span class="chip">Bingo!</span>
      <span v-for="w in b.winners" :key="w.name" style="display:flex;align-items:center;gap:8px;font-size:20px;font-weight:800"><Avatar :avatar-key="w.avatarKey" :size="36" />{{ w.name }}</span>
    </div>
    <div style="font-size:20px;font-weight:700;color:#B9B6D6">Dab your own card. Five in a row, then press Bingo! and the host checks it.</div>
  </div>
</template>
