<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '~/composables/useCountdown'
import { usePartyStore } from '~/stores/party'

defineEmits<{ board: [] }>()
const store = usePartyStore()
const now = useNow(1000)
const signOut = () => { if (window.confirm('Sign out? Join again with the same email to get your seat back.')) store.signOut() }
const shown = computed(() => (store.me?.score ?? 0) + (Date.now() < store.jokeUntil && now.value ? 1000000 : 0))
</script>

<template>
  <div v-if="store.me" class="score-pill">
    <Avatar :avatar-key="store.me.avatarKey" :size="40" />
    <span class="sr">You, {{ store.me.name }}</span>
    <span style="font-size:24px;font-weight:900">{{ shown.toLocaleString() }}</span>
    <span v-if="store.me.rank" style="font-size:19px;font-weight:700;color:var(--muted)">#{{ store.me.rank }} of {{ store.me.ofPlayers }}</span>
    <span v-if="store.snap?.paused.scoring" title="Scoring is paused" style="font-size:16px;font-weight:800;color:#BFE3F5">❄ Paused</span>
    <div style="flex:1" />
    <button class="btn-ghost" style="border-radius:999px" @click="$emit('board')">Leaderboard</button>
    <button class="btn-ghost" style="border-radius:999px;padding:0 14px;font-size:15px" @click="signOut">Sign out</button>
  </div>
</template>
