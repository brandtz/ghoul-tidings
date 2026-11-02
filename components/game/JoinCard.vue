<script setup lang="ts">
import { onMounted, ref } from 'vue'
import QRCode from 'qrcode'
import { usePartyStore } from '~/stores/party'

const store = usePartyStore()
const svg = ref('')
onMounted(async () => {
  svg.value = await QRCode.toString(store.snap?.party.joinUrl ?? '', { type: 'svg', margin: 1, width: 220, color: { dark: '#090A16', light: '#F3EEF9' } })
})
</script>

<template>
  <div style="display:flex;align-items:center;gap:28px;justify-content:center">
    <div style="width:220px;height:220px;border-radius:12px;overflow:hidden;background:#F3EEF9" aria-hidden="true" v-html="svg" />
    <div>
      <div class="chip" style="font-size:22px">Join the party</div>
      <div style="font-size:34px;font-weight:900;word-break:break-all">{{ store.snap?.party.joinUrl }}</div>
      <div style="font-size:22px;font-weight:700;color:#B9B6D6">{{ store.snap?.joined ?? 0 }} here so far</div>
    </div>
  </div>
</template>
