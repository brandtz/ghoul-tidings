<script setup lang="ts">
import { ref } from 'vue'
import { usePartyStore } from '~/stores/party'

defineProps<{ stage?: boolean }>()
const store = usePartyStore()
const showTeams = ref(false)
</script>

<template>
  <div class="screen scroll" style="justify-content:center;text-align:center;gap:18px">
    <template v-if="!showTeams">
      <div class="chip" style="font-size:22px">Up next</div>
      <h1 class="h-display" style="font-size:52px">{{ store.snap?.upNext?.title ?? 'Stay tuned' }}</h1>
      <JoinCard v-if="stage" />
      <div v-if="store.snap?.raffle.recent.length" style="display:flex;flex-direction:column;gap:6px;align-items:center">
        <div class="chip">Recent raffle winners</div>
        <div style="display:flex;gap:18px;flex-wrap:wrap;justify-content:center">
          <span v-for="w in store.snap.raffle.recent.slice(0, 3)" :key="w.name + w.at" style="display:flex;align-items:center;gap:8px;font-size:20px;font-weight:800"><Avatar :avatar-key="w.avatarKey" :size="36" />{{ w.name }} <span style="font-size:16px;color:#B9B6D6">{{ w.prize }}</span></span>
        </div>
      </div>
      <button v-if="!stage && store.snap?.flags.teams" class="btn-ghost" style="align-self:center" @click="showTeams = true">Change team</button>
    </template>
    <template v-else>
      <TeamPanel />
      <button class="btn-ghost" style="align-self:center" @click="showTeams = false">Done</button>
    </template>
  </div>
</template>
