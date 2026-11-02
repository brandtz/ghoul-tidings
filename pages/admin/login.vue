<script setup lang="ts">
import { ref } from 'vue'

const route = useRoute()
const passcode = ref(''); const error = ref(''); const busy = ref(false)
async function login() {
  error.value = ''; busy.value = true
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: { passcode: passcode.value } })
    await navigateTo(String(route.query.next ?? '/admin/run-of-show'))
  } catch (e: any) { error.value = e?.data?.message ?? 'Sign-in failed' } finally { busy.value = false }
}
</script>

<template>
  <div class="admin flex items-center justify-center" style="min-height:100vh">
    <form class="bg-a-panel rounded-2xl flex flex-col gap-4" style="width:420px;padding:28px" @submit.prevent="login">
      <div><div class="text-[22px] font-extrabold text-a-accent">Ghoul Tidings</div><div class="text-sm font-semibold text-a-muted">Host panel · private</div></div>
      <label class="flex flex-col gap-1.5 text-[13px] font-bold text-a-muted">Passcode<input v-model="passcode" type="password" class="a-input" autofocus required autocomplete="current-password"></label>
      <div v-if="error" role="alert" class="font-bold" style="color:#FF8F94">{{ error }}</div>
      <button class="a-btn primary" style="min-height:48px" :disabled="busy">Sign in</button>
    </form>
  </div>
</template>
