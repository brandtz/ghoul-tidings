<script setup lang="ts">
import { computed } from 'vue'
import { AVATAR_ART } from '~/composables/avatars'

const props = withDefaults(defineProps<{ avatarKey?: string; size?: number; ring?: string }>(), { avatarKey: 'skelly', size: 48, ring: '' })
const a = computed(() => AVATAR_ART[props.avatarKey] ?? AVATAR_ART.skelly!)
</script>

<template>
  <svg aria-hidden="true" :width="size" :height="size" viewBox="0 0 64 64" style="flex:none">
    <circle cx="32" cy="32" r="31" :fill="a.bg" :stroke="ring || 'none'" :stroke-width="ring ? 2.5 : 0" />
    <g v-html="a.art" />
  </svg>
</template>
