<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { usePartyStore } from '~/stores/party'
import { KONAMI } from '~~/shared/catalog'

const emit = defineEmits<{ close: []; bag: []; bingo: [] }>()
const store = usePartyStore()
const flags = computed(() => store.snap?.flags ?? {})
const me = computed(() => store.me)
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') emit('close') }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="dim" style="background:rgba(5,3,12,.45)" @click="$emit('close')" />
  <section role="dialog" aria-label="Trick or Treat Codes" class="modal-card ov-card" style="position:absolute;left:580px;top:226px;width:760px;padding:30px 36px 34px;text-align:center">
    <button aria-label="Close" style="position:absolute;right:16px;top:16px;width:48px;height:48px;border-radius:50%;border:3px solid var(--border);background:#140E24;color:var(--text);font-size:24px;font-weight:900" @click="$emit('close')">×</button>
    <div style="display:flex;align-items:center;justify-content:center;gap:14px">
      <svg aria-hidden="true" width="40" height="40" viewBox="0 0 40 40"><ellipse cx="20" cy="23" rx="17" ry="13" fill="#E66B1F" /><rect x="18" y="5" width="5" height="9" rx="2" fill="#2F7A3A" /><path d="M10 20 l5 3 l-5 3Z M30 20 l-5 3 l5 3Z M14 31 l4 -4 l2 3 l2 -3 l4 4Z" fill="#FFD36B" /></svg>
      <span class="cinzel" style="font-size:36px;font-weight:700">Trick or Treat Codes</span>
    </div>
    <div style="margin-top:20px;font-size:22px;font-weight:700;line-height:1.45;color:var(--muted)">You found the Trick or Treat codes!<br>Try this one to get started:</div>
    <div style="margin:22px auto 0;display:flex;justify-content:center;gap:10px">
      <span v-for="(k, i) in KONAMI" :key="i" :style="{ background: i > 7 ? '#F2C14E' : '#241A48', color: i > 7 ? '#1A1204' : '#F3EEF9' }" style="width:52px;height:52px;border-radius:10px;border:2px solid #6A5AA8;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900">{{ k }}</span>
    </div>
    <div style="margin-top:24px;font-size:21px;font-weight:700;line-height:1.5">There are more codes to discover.<br><span style="color:var(--muted)">Some help, some are just for fun, and some might be a trick.</span></div>
    <div style="margin-top:14px;font-size:16px;font-weight:700;color:var(--muted)">Codes work anywhere except while you are typing in a box.</div>
    <div v-if="(me?.unlocks.bag && flags.cheatSheet) || (me?.unlocks.bingo && flags.bingo)" style="margin-top:14px;display:flex;gap:10px;justify-content:center">
      <button v-if="me?.unlocks.bag && flags.cheatSheet" class="btn-gold" @click="$emit('bag')">Open the bag</button>
      <button v-if="me?.unlocks.bingo && flags.bingo" class="btn-ghost" @click="$emit('bingo')">Bingo card</button>
    </div>
  </section>
</template>
