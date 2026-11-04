<script setup lang="ts">
// Participant view. The join and lobby screens sit inside the frame on a static p = 0 shell.
import { computed, onMounted } from 'vue'
import { useKeyBuffer } from '~/composables/useKeyBuffer'
import { useFrogCode } from '~/composables/useFrogCode'
import { usePartyStore } from '~/stores/party'

const store = usePartyStore()
useKeyBuffer()
useFrogCode()
onMounted(() => store.connect({ heartbeat: true }))
// The personal override is the player's own; the stage page never reads it.
const progress = computed(() => (store.me ? store.personalP ?? store.snap?.theme.p ?? 0 : 0))
const rejoin = async () => { await $fetch('/api/leave', { method: 'POST' }); store.sessionError = null; store.refresh() }
const removed = computed(() => store.sessionError?.includes('removed'))
</script>

<template>
  <PartyShell :progress="progress">
    <div v-if="store.sessionError" class="screen" style="align-items:center;justify-content:center;text-align:center">
      <h1 class="h-display" style="font-size:44px">{{ removed ? 'Party closed for you' : 'Your seat timed out' }}</h1>
      <p style="font-size:24px;font-weight:700;color:#B9B6D6">{{ store.sessionError }}</p>
      <button v-if="!removed" class="btn-gold" @click="rejoin">Rejoin</button>
    </div>
    <GameScreen v-else />
  </PartyShell>
</template>
