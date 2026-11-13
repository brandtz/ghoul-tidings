<script setup lang="ts">
// A player's own bingo card. Dabs stay on this device; nothing is auto-marked from the
// calls, so players keep their own card. Bingo! sends the dabs to the host for review.
import { computed, ref, watch } from 'vue'
import { BINGO_FREE, hasBingo } from '~~/shared/phase2'
import { usePartyStore } from '~/stores/party'

const props = defineProps<{ tile?: number }>()
const store = usePartyStore()
const card = computed(() => store.me?.bingoCard ?? [])
const claim = computed(() => store.me?.bingoClaim ?? null)
const called = computed(() => store.snap?.bingo.called ?? [])
const recent = computed(() => [...called.value].reverse())
// Dabs are saved per card, so when the host edits the squares the old dabs don't carry over.
const key = computed(() => `gt_bingo:${[...card.value.join('|')].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7)}`)
const marked = ref(new Set<number>([BINGO_FREE]))
const load = () => { try { marked.value = new Set([BINGO_FREE, ...JSON.parse(localStorage.getItem(key.value) ?? '[]')]) } catch { marked.value = new Set([BINGO_FREE]) } }
watch(key, load, { immediate: true })
const locked = computed(() => claim.value === 'pending' || claim.value === 'approved')
function tap(i: number) {
  if (i === BINGO_FREE || locked.value) return
  const s = new Set(marked.value)
  if (s.has(i)) s.delete(i); else s.add(i)
  marked.value = s
  try { localStorage.setItem(key.value, JSON.stringify([...s])) } catch { /* private mode */ }
}
const line = computed(() => hasBingo(marked.value))
const busy = ref(false)
async function callBingo() {
  busy.value = true
  await store.act('/api/bingo/claim', { marked: [...marked.value] })
  busy.value = false
}
const h = computed(() => props.tile ?? 76)
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:10px">
    <div style="display:flex;align-items:baseline;gap:10px;min-height:28px;font-size:17px;font-weight:800;color:var(--muted);overflow:hidden">
      <span style="flex:none">{{ called.length ? `Called ${called.length}:` : 'No squares called yet.' }}</span>
      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
        <template v-for="(c, i) in recent.slice(0, 6)" :key="c"><b v-if="i === 0" style="color:var(--text)">{{ c }}</b><template v-else> · {{ c }}</template></template>
      </span>
    </div>
    <div class="bingo-grid" style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px">
      <button
        v-for="(s, i) in card" :key="i" :aria-pressed="marked.has(i)" :disabled="locked && i !== BINGO_FREE"
        style="border-radius:10px;border:2px solid #34375E;background:#15172F;color:#F3EEF9;font-size:15px;font-weight:800;line-height:1.2;padding:4px;opacity:1"
        :style="[{ minHeight: `${h}px` }, marked.has(i) ? 'background:var(--border);color:#140A05;border-color:var(--border2)' : '']"
        @click="tap(i)"
      >{{ s }}</button>
    </div>
    <div aria-live="polite" style="min-height:52px;display:flex;justify-content:center;align-items:center;gap:14px;text-align:center">
      <span v-if="claim === 'approved'" style="font-size:22px;font-weight:900;color:var(--border2)">BINGO confirmed! Points are on the board.</span>
      <span v-else-if="claim === 'pending'" style="font-size:20px;font-weight:800">Bingo called. The host is checking your card…</span>
      <template v-else>
        <button class="btn-gold" :class="{ pulse: line }" style="min-height:52px;font-size:22px;padding:0 34px" :disabled="!line || busy" @click="callBingo">Bingo!</button>
        <span style="font-size:16px;font-weight:700;color:var(--muted);max-width:420px;line-height:1.3">
          {{ claim === 'rejected' ? 'The host could not confirm your last card. Check your dabs against the calls and try again.' : line ? 'Five in a row. Press Bingo! to send your card to the host.' : 'Dab squares as they are called. Five in a row, then press Bingo!' }}
        </span>
      </template>
    </div>
  </div>
</template>
