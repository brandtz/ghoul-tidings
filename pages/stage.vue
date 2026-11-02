<script setup lang="ts">
// Neutral broadcast view for the host's screen share. Public snapshot only, no personal items.
import { computed, onMounted, ref } from 'vue'
import { usePartyStore } from '~/stores/party'

const store = usePartyStore()
const ready = ref(false)
onMounted(async () => {
  const { admin } = await $fetch<{ admin: boolean }>('/api/admin/me')
  if (!admin) return navigateTo('/admin/login?next=/stage')
  ready.value = true
  store.connect()
})
const progress = computed(() => store.snap?.theme.p ?? 0)
</script>

<template>
  <PartyShell v-if="ready" :progress="progress" stage><GameScreen stage /></PartyShell>
</template>
