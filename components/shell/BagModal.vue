<script setup lang="ts">
// The Trick-or-Treat Bag: an old strategy-guide page with some entries smudged.
import { onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits<{ close: [] }>()
const entries = ref<any[] | null>(null)
const failed = ref(false)
onMounted(async () => {
  try { entries.value = (await $fetch<any>('/api/bag')).entries } catch { failed.value = true }
  window.addEventListener('keydown', onKey)
})
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') emit('close') }
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="dim" @click="$emit('close')" />
  <section role="dialog" aria-label="Trick-or-Treat Bag" class="ov-card page">
    <button aria-label="Close" class="x" @click="$emit('close')">×</button>
    <h2 class="cinzel" style="margin:0;font-size:32px;font-weight:900">The Trick-or-Treat Bag</h2>
    <p style="margin:4px 0 12px;font-size:17px;font-weight:700;font-style:italic">Unofficial field guide, third printing</p>
    <div v-if="failed" style="font-size:20px;font-weight:800">The bag is empty for now.</div>
    <ul v-else class="list">
      <li v-for="(e, i) in entries ?? []" :key="i" :class="{ used: e.used }">
        <template v-if="e.smudged"><span class="smudge" aria-label="Smudged entry" /></template>
        <template v-else><b>{{ e.code }}</b><span>{{ e.used ? 'Collected' : e.hint }}</span></template>
      </li>
    </ul>
    <p style="margin:12px 0 0;font-size:15px;font-weight:700;font-style:italic">Other codes may exist. We couldn't confirm. Each page is a little different, and borrowed codes can bite.</p>
  </section>
</template>

<style scoped>
.page { position: absolute; left: 560px; top: 110px; width: 800px; max-height: 720px; overflow-y: auto; box-sizing: border-box; padding: 24px 32px; color: #2B1B0E; background: #E9D9B4; border: 7px solid #6B4423; border-radius: 10px 22px 14px 18px; box-shadow: 0 0 0 4px #000000AA, 0 20px 50px #000C; }
.x { position: absolute; right: 12px; top: 12px; width: 48px; height: 48px; border-radius: 50%; border: 3px solid #6B4423; background: #F4E9CF; color: #2B1B0E; font-size: 24px; font-weight: 900; }
.list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 22px; }
li { display: flex; justify-content: space-between; gap: 10px; min-height: 34px; align-items: center; border-bottom: 2px dotted #6B4423; font-size: 18px; font-weight: 700; }
li.used b { text-decoration: line-through; }
b { font-family: Consolas, 'Courier New', monospace; font-size: 19px; letter-spacing: .03em; word-break: break-all; }
.smudge { display: block; width: 100%; height: 20px; border-radius: 10px; background: radial-gradient(ellipse, #5A3A1E 20%, #5A3A1E00 75%); filter: blur(2px); }
</style>
