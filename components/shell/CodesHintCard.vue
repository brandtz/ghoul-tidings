<script setup lang="ts">
import { usePartyStore } from '~/stores/party'

defineEmits<{ open: [] }>()
const store = usePartyStore()
</script>

<template>
  <section v-if="store.snap?.hintRevealed" class="card fade-in" style="border-radius:16px;padding:10px 12px 10px 16px;display:flex;align-items:center;gap:10px;box-shadow:inset 0 0 20px #00000088">
    <div class="cinzel" style="font-size:19px;font-weight:700;line-height:1.15;color:var(--border2);flex:1">Trick or Treat Codes</div>
    <button aria-label="Open the Trick or Treat hint" style="width:48px;height:48px;border-radius:50%;border:3px solid var(--border);background:#140E24;color:var(--border2);font-size:26px;font-weight:900" @click="$emit('open')">?</button>
  </section>
</template>
