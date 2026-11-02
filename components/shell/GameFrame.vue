<script setup lang="ts">
defineProps<{ glowing?: boolean }>()
</script>

<template>
  <main class="game-frame" :class="{ 'beat-glow': glowing }" aria-label="Game area"><slot /></main>
</template>
