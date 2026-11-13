<script setup lang="ts">
import { computed } from 'vue'
import { usePartyStore } from '~/stores/party'

defineEmits<{ open: [] }>()
const store = usePartyStore()
const line = computed(() => {
  const c = store.me?.bingoClaim
  if (c === 'approved') return 'Bingo confirmed. Nicely done.'
  if (c === 'pending') return 'The host is checking your card.'
  const n = store.snap?.bingo.called.length ?? 0
  return n ? `${n} squares called so far.` : 'Five in a row wins points.'
})
</script>

<template>
  <section v-if="store.me?.bingoCard" class="card fade-in" style="border-radius:16px;padding:10px 12px 10px 16px;display:flex;align-items:center;gap:10px;box-shadow:inset 0 0 20px #00000088">
    <div style="flex:1">
      <div class="cinzel" style="font-size:19px;font-weight:700;line-height:1.15">Bingo</div>
      <div style="font-size:15px;font-weight:700;color:var(--muted)">{{ line }}</div>
    </div>
    <button class="btn-gold" style="min-height:48px;padding:0 18px;font-size:18px" @click="$emit('open')">Card</button>
  </section>
</template>
