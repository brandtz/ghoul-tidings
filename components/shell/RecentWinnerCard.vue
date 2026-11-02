<script setup lang="ts">
import { usePartyStore } from '~/stores/party'
const store = usePartyStore()
</script>

<template>
  <section class="card" style="padding:14px 16px 16px;box-shadow:inset 0 0 24px #00000088">
    <div class="card-label">Recent winner</div>
    <div class="inner-pill" style="margin-top:10px;display:flex;align-items:center;gap:8px;padding:8px 8px;min-height:48px">
      <template v-if="store.snap?.recentWinner">
        <Avatar :avatar-key="store.snap.recentWinner.avatarKey" :size="44" ring="var(--border)" />
        <span style="font-size:20px;font-weight:800;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ store.snap.recentWinner.name }}</span>
        <svg aria-hidden="true" width="30" height="30" viewBox="0 0 30 30" style="flex:none"><rect x="4" y="12" width="22" height="15" rx="2" fill="#B5202F" /><rect x="13" y="12" width="4" height="15" fill="#F2C14E" /><rect x="3" y="8" width="24" height="6" rx="2" fill="#D13445" /><path d="M15 8 C8 -2 2 6 15 8 C28 6 22 -2 15 8Z" fill="#F2C14E" /></svg>
      </template>
      <span v-else style="font-size:18px;font-weight:700;color:var(--muted);flex:1;text-align:center">Nobody yet. Could be you.</span>
    </div>
  </section>
</template>
