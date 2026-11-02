<script setup lang="ts">
import { computed } from 'vue'
import { teamHex } from '~~/shared/catalog'
import { usePartyStore } from '~/stores/party'

defineProps<{ stage?: boolean }>()
const store = usePartyStore()
const f = computed(() => store.snap?.finale)
const podium = computed(() => { const p = f.value?.podium ?? []; return [p[1], p[0], p[2]] })
const heights = [150, 200, 120]
const places = [2, 1, 3]
</script>

<template>
  <div class="screen scroll" style="gap:12px;text-align:center">
    <h1 class="h-display" style="font-size:44px">Merry Ghoul Tidings</h1>
    <div style="display:flex;align-items:flex-end;justify-content:center;gap:16px">
      <template v-for="(r, i) in podium" :key="i">
        <div v-if="r" style="width:220px;display:flex;flex-direction:column;align-items:center;gap:6px">
          <Avatar :avatar-key="r.avatarKey" :size="72" ring="var(--border2)" />
          <div style="font-size:22px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">{{ r.name }}</div>
          <div :style="{ height: `${heights[i]}px` }" style="width:100%;border-radius:12px 12px 0 0;background:#15172F;border:3px solid var(--border);border-bottom:0;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center">
            <div class="cinzel" style="font-size:40px;font-weight:900;color:var(--border2)">{{ places[i] }}</div>
            <div style="font-size:20px;font-weight:900">{{ r.score.toLocaleString() }}</div>
            <div style="font-size:15px;font-weight:800;color:#FFD27A">Gift card</div>
          </div>
        </div>
      </template>
    </div>
    <div v-if="f?.teams.length" style="display:flex;flex-direction:column;gap:6px;text-align:left">
      <div class="chip">Team race, finish line</div>
      <div v-for="t in f.teams.slice(0, 5)" :key="t.id" style="display:flex;align-items:center;gap:10px;font-size:18px;font-weight:800">
        <span style="width:170px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ t.name }}</span>
        <div style="flex:1;height:12px;border-radius:6px;background:#1B1D38;overflow:hidden;border-right:4px solid #F3EEF9"><div :style="{ width: `${Math.max(2, t.position * 100)}%`, background: teamHex(t.colorKey) }" style="height:100%" /></div>
        <span style="width:80px;text-align:right">{{ t.score.toLocaleString() }}</span>
      </div>
    </div>
    <div v-if="f?.recap.length" style="font-size:18px;font-weight:700;color:#B9B6D6">
      Raffle winners: {{ f.recap.map(w => w.name).join(', ') }}
    </div>
    <div class="cinzel" style="font-size:26px;font-weight:700">Thanks for showing up for each other.</div>
  </div>
</template>
