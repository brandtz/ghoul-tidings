<script setup lang="ts">
import { computed } from 'vue'
import { audible, muted, setMuted, unlockAudio } from '~/composables/effectSound'

// Browsers hold audio until the first tap, so a blocked page offers that tap here.
const blocked = computed(() => !muted.value && !audible.value)
const label = computed(() => (muted.value ? 'Unmute effect sounds' : blocked.value ? 'Turn on effect sounds' : 'Mute effect sounds'))
const click = () => { if (blocked.value) unlockAudio(); else setMuted(!muted.value) }
</script>

<template>
  <button class="mute-btn" :class="{ blocked }" :aria-pressed="muted" :aria-label="label" :title="label" @click="click">
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      <template v-if="muted || blocked"><path d="M17 9l5 6M22 9l-5 6" /></template>
      <template v-else><path d="M16.5 8.5a5 5 0 0 1 0 7" /><path d="M19 6a8.5 8.5 0 0 1 0 12" /></template>
    </svg>
    <span v-if="blocked" class="mute-hint">Tap for sound</span>
  </button>
</template>
