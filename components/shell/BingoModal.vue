<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

const emit = defineEmits<{ close: [] }>()
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') emit('close') }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="dim" @click="$emit('close')" />
  <section role="dialog" aria-label="Meeting bingo" class="modal-card ov-card" style="position:absolute;left:560px;top:80px;width:800px;padding:20px 26px;display:flex;flex-direction:column;gap:10px">
    <button aria-label="Close" style="position:absolute;right:14px;top:14px;width:48px;height:48px;border-radius:50%;border:3px solid var(--border);background:#140E24;color:var(--text);font-size:24px;font-weight:900" @click="$emit('close')">×</button>
    <h2 class="h-display" style="font-size:30px">Meeting Bingo</h2>
    <BingoBoard :tile="84" />
  </section>
</template>
