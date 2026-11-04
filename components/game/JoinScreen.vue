<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { APP_NAME, CHARACTERS, FROG } from '~~/shared/catalog'
import { usePartyStore } from '~/stores/party'

const LAST = 'gt_last_seat'
const store = usePartyStore()
const name = ref(''); const email = ref(''); const avatarKey = ref<string>('skelly')
// Returning players keep their saved ghoul unless they tap a different one here.
const picked = ref(false)
const error = ref(''); const busy = ref(false)
const choices = computed(() => (store.frogUnlocked ? [...CHARACTERS, FROG] : CHARACTERS))
// Phones rarely send key events, so the phrase also works typed into the name field.
watch(name, (v) => { if (v.toLowerCase().replace(/[^a-z]/g, '') === FROG.phrase) { name.value = ''; store.frogUnlocked = true } })
watch(() => store.frogUnlocked, (on) => { if (on) { avatarKey.value = FROG.key; picked.value = true } }, { immediate: true })
// After signing out on this device, the form comes back filled in.
onMounted(() => {
  try {
    const last = JSON.parse(localStorage.getItem(LAST) ?? 'null')
    if (last?.email) { name.value = last.name ?? ''; email.value = last.email; if (!picked.value && last.avatarKey) avatarKey.value = last.avatarKey }
  } catch {}
})
const pick = (key: string) => { avatarKey.value = key; picked.value = true }
async function join() {
  error.value = ''; busy.value = true
  try {
    const r = await $fetch<any>('/api/join', { method: 'POST', body: { name: name.value, email: email.value, avatarKey: picked.value ? avatarKey.value : undefined } })
    try { localStorage.setItem(LAST, JSON.stringify({ name: r.data.name, email: email.value.trim(), avatarKey: r.data.avatarKey })) } catch {}
    if (r.data.welcomeBack) store.toast(`Welcome back, ${r.data.name}.`, 'treat')
    await store.refresh()
  } catch (e: any) { error.value = e?.data?.message ?? 'That did not work. Try again.' } finally { busy.value = false }
}
</script>

<template>
  <form class="screen scroll" style="gap:14px" @submit.prevent="join">
    <h1 class="h-display" style="font-size:46px;text-align:center">{{ store.snap?.party.name ?? APP_NAME }}</h1>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="tile-grid">
      <label style="display:flex;flex-direction:column;gap:6px;font-size:18px;font-weight:800;color:#B9B6D6">Display name
        <input v-model="name" class="field" maxlength="24" required autocomplete="name"></label>
      <label style="display:flex;flex-direction:column;gap:6px;font-size:18px;font-weight:800;color:#B9B6D6">Work email
        <input v-model="email" class="field" type="email" required autocomplete="email"></label>
    </div>
    <p style="margin:0;font-size:17px;font-weight:700;color:#B9B6D6">No password. Your email just lets you come back to the same seat.</p>
    <fieldset style="border:0;padding:0;margin:0">
      <legend style="font-size:18px;font-weight:800;color:#B9B6D6;margin-bottom:8px">Pick your ghoul</legend>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px" class="avatars">
        <label v-for="c in choices" :key="c.key" :title="c.name" class="pick" :class="{ on: avatarKey === c.key }">
          <input :checked="avatarKey === c.key" type="radio" name="avatar" :value="c.key" class="sr" @change="pick(c.key)">
          <span v-if="avatarKey === c.key" class="pick-check" aria-hidden="true">✓</span>
          <Avatar :avatar-key="c.key" :size="60" />{{ c.name }}
        </label>
      </div>
    </fieldset>
    <div v-if="error" class="err" role="alert">{{ error }}</div>
    <button class="btn-gold" style="min-height:60px;font-size:24px" :disabled="busy">{{ busy ? 'Opening the gate…' : 'Enter the party' }}</button>
  </form>
</template>
