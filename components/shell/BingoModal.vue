<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BINGO_FREE, hasBingo } from '~~/shared/phase2'
import { usePartyStore } from '~/stores/party'

const emit = defineEmits<{ close: [] }>()
const store = usePartyStore()
const card = computed(() => store.me?.bingoCard ?? [])
// Marks are saved per card, so when the host edits the squares the old marks don't carry over.
const key = computed(() => `gt_bingo:${[...card.value.join('|')].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7)}`)
const marked = ref(new Set<number>([BINGO_FREE]))
const load = () => { try { marked.value = new Set([BINGO_FREE, ...JSON.parse(localStorage.getItem(key.value) ?? '[]')]) } catch { marked.value = new Set([BINGO_FREE]) } }
watch(key, load)
onMounted(() => {
  load()
  window.addEventListener('keydown', onKey)
})
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') emit('close') }
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
function tap(i: number) {
  if (i === BINGO_FREE) return
  const s = new Set(marked.value)
  if (s.has(i)) s.delete(i); else s.add(i)
  marked.value = s
  try { localStorage.setItem(key.value, JSON.stringify([...s])) } catch { /* private mode */ }
}
const won = computed(() => hasBingo(marked.value))
const claim = () => store.act('/api/bingo/claim')
</script>

<template>
  <div class="dim" @click="$emit('close')" />
  <section role="dialog" aria-label="Meeting bingo" class="modal-card ov-card" style="position:absolute;left:560px;top:90px;width:800px;padding:20px 26px;display:flex;flex-direction:column;gap:10px">
    <button aria-label="Close" style="position:absolute;right:14px;top:14px;width:48px;height:48px;border-radius:50%;border:3px solid var(--border);background:#140E24;color:var(--text);font-size:24px;font-weight:900" @click="$emit('close')">×</button>
    <h2 class="h-display" style="font-size:30px">Meeting Bingo</h2>
    <div class="tile-grid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">
      <button v-for="(s, i) in card" :key="i" :aria-pressed="marked.has(i)" :style="marked.has(i) ? 'background:var(--border);color:#140A05;border-color:var(--border2)' : ''" style="min-height:88px;border-radius:10px;border:2px solid #34375E;background:#15172F;color:#F3EEF9;font-size:15px;font-weight:800;line-height:1.2;padding:4px" @click="tap(i)">{{ s }}</button>
    </div>
    <div style="min-height:48px;display:flex;justify-content:center;align-items:center">
      <span v-if="store.me?.bingoClaimed" style="font-size:20px;font-weight:900">Bingo called. Nicely done.</span>
      <button v-else-if="won" class="btn-gold" @click="claim">Call bingo!</button>
      <span v-else style="font-size:17px;font-weight:700;color:var(--muted)">Five in a row wins a small bonus.</span>
    </div>
  </section>
</template>
