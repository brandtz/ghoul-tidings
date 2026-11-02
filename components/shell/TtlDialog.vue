<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { usePartyStore } from '~/stores/party'

const emit = defineEmits<{ close: [] }>()
const store = usePartyStore()
const mine = store.me?.ttl
const statements = ref<string[]>(mine ? [...mine.statements] : ['', '', ''])
const lie = ref(mine?.lieIndex ?? 2)
const busy = ref(false)
async function submit() {
  busy.value = true
  const ok = await store.act('/api/ttl', { statements: statements.value, lieIndex: lie.value })
  busy.value = false
  if (ok) { store.toast('Submitted. The host reviews it next.', 'treat'); emit('close') }
}
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') emit('close') }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="dim" @click="$emit('close')" />
  <section role="dialog" aria-label="Two Truths and a Lie" class="modal-card ov-card" style="position:absolute;left:560px;top:150px;width:800px;padding:26px 34px 28px">
    <button aria-label="Close" style="position:absolute;right:16px;top:16px;width:48px;height:48px;border-radius:50%;border:3px solid var(--border);background:#140E24;color:var(--text);font-size:24px;font-weight:900" @click="$emit('close')">×</button>
    <div style="display:flex;align-items:center;gap:14px">
      <h2 class="h-display" style="font-size:32px">Two Truths and a Lie</h2>
      <span style="background:#2B2412;color:#FFD27A;padding:4px 14px;border-radius:999px;font-size:18px;font-weight:800">+750</span>
    </div>
    <p style="margin:10px 0 14px;font-size:18px;font-weight:700;color:var(--muted)">Keep it fun and work-appropriate. The host reviews these before they're shown.</p>
    <form style="display:flex;flex-direction:column;gap:12px" @submit.prevent="submit">
      <div v-for="(_, i) in statements" :key="i" style="display:grid;grid-template-columns:1fr 150px;gap:10px;align-items:center">
        <input v-model="statements[i]" class="field" maxlength="120" required :aria-label="`Statement ${i + 1}`" :placeholder="`Statement ${i + 1}`">
        <label style="display:flex;align-items:center;gap:8px;font-size:17px;font-weight:800;min-height:44px;cursor:pointer">
          <input v-model="lie" type="radio" name="lie" :value="i" style="width:22px;height:22px;accent-color:#E0782A">This is the lie
        </label>
      </div>
      <button class="btn-gold" style="min-height:56px;font-size:22px;margin-top:4px" :disabled="busy">Submit for +750</button>
    </form>
  </section>
</template>
