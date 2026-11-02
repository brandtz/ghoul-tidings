<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAdminStore } from '~/stores/admin'
import { usePartyStore } from '~/stores/party'

const admin = useAdminStore()
const party = usePartyStore()
const s = computed(() => admin.a)
const p = ref(party.snap?.theme.p ?? 0)
watch(() => party.snap?.theme.p, (v) => { if (v !== undefined) p.value = v })
const stages = [['Halloween', 0], ['First frost', 0.08], ['Midpoint', 0.5], ['Late transition', 0.83], ['Finale', 1]] as const
const set = (v: number | null) => admin.post('/api/admin/theme', { p: v })
const override = computed(() => party.snap?.theme.override)
const fmt = (at: number) => (s.value.party.startedAt ? new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—')
</script>

<template>
  <div class="flex items-center gap-4">
    <h1 class="m-0 text-[28px] font-extrabold">Theme</h1>
    <span class="text-[15px] font-bold text-a-muted">The look steps at each raffle beat. An override moves every screen at once.</span>
  </div>
  <section class="bg-a-panel rounded-2xl flex flex-col gap-4" style="padding:20px 22px">
    <div class="flex items-center gap-4">
      <span class="a-eyebrow">Progress</span>
      <span class="text-[28px] font-extrabold">{{ p.toFixed(2) }}</span>
      <span class="a-chip" :style="override ? 'background:#3A2A12;color:#FFB36B' : 'background:#10281C;color:#6EE7A8'">{{ override ? 'Override' : 'Auto' }}</span>
      <div class="flex-1" />
      <button class="a-btn primary" :disabled="!override" @click="set(null)">Resume auto</button>
    </div>
    <input v-model.number="p" type="range" min="0" max="1" step="0.01" aria-label="Theme progress" style="accent-color:#FF7A1A;height:32px" @change="set(p)">
    <div class="grid grid-cols-5 gap-2.5"><button v-for="k in stages" :key="k[0]" class="a-btn" @click="set(k[1])">{{ k[0] }} · {{ k[1] }}</button></div>
  </section>
  <section class="bg-a-panel rounded-2xl flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto" style="padding:14px 18px">
    <div class="a-eyebrow" style="margin-bottom:6px">Beat list</div>
    <div v-for="b in s.prizes" :key="b.id" class="flex items-center gap-3 rounded-[10px] bg-a-raised" style="min-height:48px;padding:0 14px">
      <span class="font-extrabold text-a-muted" style="width:28px">{{ b.index }}</span>
      <span class="font-bold flex-1 truncate">{{ b.name }}</span>
      <span class="text-sm font-bold" :style="{ color: b.isMidnightDraw ? '#FFB36B' : '#C4CAD6' }">{{ b.isMidnightDraw ? 'Midnight: lightning plus snow burst' : 'Lightning beat' }}</span>
      <span class="text-sm font-bold text-a-muted" style="width:90px;text-align:right">{{ fmt(b.dueAt) }}</span>
      <span class="a-chip capitalize" style="background:#1F232C;color:#C4CAD6">{{ b.status }}</span>
    </div>
  </section>
</template>
