<script setup lang="ts">
import { ref } from 'vue'
import { APP_NAME, CHARACTERS } from '~~/shared/catalog'
import { usePartyStore } from '~/stores/party'

const store = usePartyStore()
const name = ref(''); const email = ref(''); const avatarKey = ref<string>('skelly')
const error = ref(''); const busy = ref(false)
async function join() {
  error.value = ''; busy.value = true
  try {
    const r = await $fetch<any>('/api/join', { method: 'POST', body: { name: name.value, email: email.value, avatarKey: avatarKey.value } })
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
        <label v-for="c in CHARACTERS" :key="c.key" :title="c.name" :style="avatarKey === c.key ? 'border-color:var(--border2);background:#241A48' : ''" style="border:3px solid #34375E;border-radius:14px;padding:8px 4px;text-align:center;cursor:pointer;background:#15172F;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:14px;font-weight:800;line-height:1.1;min-height:102px;box-sizing:border-box">
          <input v-model="avatarKey" type="radio" name="avatar" :value="c.key" class="sr">
          <Avatar :avatar-key="c.key" :size="60" />{{ c.name }}
        </label>
      </div>
    </fieldset>
    <div v-if="error" class="err" role="alert">{{ error }}</div>
    <button class="btn-gold" style="min-height:60px;font-size:24px" :disabled="busy">{{ busy ? 'Opening the gate…' : 'Enter the party' }}</button>
  </form>
</template>
