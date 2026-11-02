<script setup lang="ts">
import { computed, resolveComponent } from 'vue'

const route = useRoute()
const section = computed(() => String(route.params.section))
const MAP: Record<string, string> = {
  'run-of-show': 'AdminRunOfShow', content: 'AdminContent', raffle: 'AdminRaffle', theme: 'AdminTheme', players: 'AdminPlayers',
  monitor: 'AdminMonitor', effects: 'AdminEffects', presentation: 'AdminPresentation', settings: 'AdminSettings',
}
const comps: Record<string, any> = {
  AdminRunOfShow: resolveComponent('AdminRunOfShow'), AdminContent: resolveComponent('AdminContent'), AdminRaffle: resolveComponent('AdminRaffle'),
  AdminTheme: resolveComponent('AdminTheme'), AdminPlayers: resolveComponent('AdminPlayers'), AdminMonitor: resolveComponent('AdminMonitor'),
  AdminEffects: resolveComponent('AdminEffects'), AdminPresentation: resolveComponent('AdminPresentation'), AdminSettings: resolveComponent('AdminSettings'),
}
const current = computed(() => comps[MAP[section.value] ?? 'AdminRunOfShow'])
useHead({ title: 'Ghoul Tidings host panel' })
</script>

<template>
  <AdminShell :section="section"><component :is="current" :key="section" /></AdminShell>
</template>
