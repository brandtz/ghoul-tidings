<script setup lang="ts">
import { usePartyStore } from '~/stores/party'
const store = usePartyStore()
</script>

<template>
  <div v-if="!store.connected" role="status" class="card no-pe" style="position:absolute;left:660px;top:24px;width:600px;box-sizing:border-box;padding:8px 16px;text-align:center;font-size:20px;font-weight:800;z-index:6">
    Lost the signal. Reconnecting…
  </div>
</template>
