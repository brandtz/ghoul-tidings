<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNow } from '~/composables/useCountdown'
import { useAdminStore } from '~/stores/admin'

const admin = useAdminStore()
const now = useNow(1000)
const s = computed(() => admin.a)
const D = computed(() => s.value.party.durationMin)
const N = computed(() => s.value.prizes.length)
const tiers: Record<string, [string, string, string]> = { swag: ['#252A35', '#C4CAD6', 'Swag'], special: ['#2B2412', '#FFD27A', 'Special'], grand: ['#3A1A2C', '#FFA3D1', 'Grand'] }
const dueMin = (i: number) => (D.value * i) / (N.value + 1)
const fmtM = (m: number) => { const t = Math.round(m * 60); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` }
const elapsedPct = computed(() => { const st = s.value.party.startedAt; return st ? Math.min(100, ((now.value - st - s.value.party.pausedMs) / (D.value * 60000)) * 100) : 0 })
const status = (p: any) => {
  if (p.status === 'claimed') return ['#10281C', '#6EE7A8', `Claimed · ${p.draw?.winner ?? ''}`]
  if (p.status === 'skipped') return ['#1F232C', '#9AA3B2', 'Skipped']
  if (p.draw?.status === 'offered') return ['#3A2A12', '#FFB36B', `Offered · ${Math.max(0, Math.ceil((p.draw.claimDeadline - now.value) / 1000))} s`]
  if (p.draw?.status === 'expired') return ['#3A1519', '#FF8F94', 'Unclaimed']
  return ['#1F232C', '#C4CAD6', 'Pending']
}
const run = (p: any, a: string) => admin.post(`/api/admin/raffle/${p.id}/${a}`)
const save = (p: any, patch: any) => admin.content('prizes', 'save', { id: p.id, name: p.name, tier: p.tier, notes: p.notes, isMidnight: p.isMidnight, ...patch })
const adding = ref('')
const add = async () => { if (adding.value.trim()) { await admin.content('prizes', 'save', { name: adding.value.trim(), tier: 'swag' }); adding.value = '' } }
const move = (i: number, d: number) => {
  const ids = s.value.prizes.map((p: any) => p.id); const j = i + d
  if (j < 0 || j >= ids.length) return
  [ids[i], ids[j]] = [ids[j], ids[i]]
  admin.content('prizes', 'reorder', { ids })
}
const setLength = (e: Event) => admin.content('settings', 'save', { durationMin: Number((e.target as HTMLSelectElement).value) })
const setRepeat = (e: Event) => admin.content('settings', 'save', { noRepeatWinners: (e.target as HTMLInputElement).checked })
const canDraw = (p: any) => p.status === 'pending'
const offered = (p: any) => p.draw?.status === 'offered' || p.draw?.status === 'expired'
const remove = async (p: any) => { if (await admin.confirm(`Delete ${p.name}?`, 'Delete')) admin.content('prizes', 'delete', { id: p.id }) }
</script>

<template>
  <div class="flex items-center gap-4">
    <h1 class="m-0 text-[28px] font-extrabold">Prizes and raffle</h1>
    <span class="text-[15px] font-bold text-a-muted">Schedule recomputes when count, length or order changes</span>
    <div class="flex-1" />
    <form class="flex gap-2" @submit.prevent="add"><input v-model="adding" class="a-input" style="width:240px" placeholder="New prize name" aria-label="New prize name"><button class="a-btn primary">Add prize</button></form>
  </div>
  <section class="grid gap-3" style="grid-template-columns:repeat(4,minmax(0,1fr))">
    <label class="bg-a-panel rounded-xl flex flex-col gap-1.5 text-[13px] font-bold text-a-muted" style="padding:12px 14px">Party length
      <select class="a-input" :value="D" @change="setLength"><option :value="60">60 minutes</option><option :value="75">75 minutes</option><option :value="90">90 minutes</option></select>
    </label>
    <div class="bg-a-panel rounded-xl flex flex-col gap-1.5 text-[13px] font-bold text-a-muted" style="padding:12px 14px">Prize count<div class="text-[26px] font-extrabold text-a-text">{{ N }}</div></div>
    <div class="bg-a-panel rounded-xl flex flex-col gap-2 text-[15px] font-bold" style="padding:12px 14px">
      <label class="flex items-center gap-2.5" style="min-height:28px"><input type="checkbox" :checked="s.party.settings.noRepeatWinners" style="width:20px;height:20px;accent-color:#FF7A1A" @change="setRepeat">No repeat winners</label>
      <label class="flex items-center gap-2.5" style="min-height:28px"><input type="checkbox" checked disabled style="width:20px;height:20px;accent-color:#FF7A1A">Exclude host <span class="text-[13px] text-a-muted font-semibold">· always on</span></label>
    </div>
    <div class="bg-a-panel rounded-xl flex flex-col gap-2 text-[15px] font-bold" style="padding:12px 14px">
      <div class="flex justify-between items-center" style="min-height:28px">Presence window <span style="color:#FFB36B">{{ s.party.settings.presenceMin }} min</span></div>
      <div class="flex justify-between items-center" style="min-height:28px">Claim window <span style="color:#FFB36B">{{ s.party.settings.claimS }} s</span></div>
    </div>
  </section>

  <section aria-label="Draw timeline" class="bg-a-panel rounded-[14px]" style="padding:16px 22px 14px">
    <div class="flex items-center" style="margin-bottom:10px"><span class="a-eyebrow">Draw timeline · 0 to {{ D }} min</span></div>
    <div class="relative" style="height:58px;margin:0 8px">
      <div class="absolute left-0 right-0 rounded" style="top:20px;height:8px;background:#252A35" />
      <div class="absolute left-0 rounded" :style="{ width: `${elapsedPct}%` }" style="top:20px;height:8px;background:#FF7A1A" />
      <div v-for="(p, i) in s.prizes" :key="p.id" class="absolute" :style="{ left: `${((i + 1) / (N + 1)) * 100}%` }" style="top:0;width:0">
        <div class="absolute rounded-full box-border" :style="{ left: `${p.isMidnightDraw ? -13 : -9}px`, top: `${24 - (p.isMidnightDraw ? 13 : 9)}px`, width: `${p.isMidnightDraw ? 26 : 18}px`, height: `${p.isMidnightDraw ? 26 : 18}px`, background: p.status === 'pending' ? (p.isMidnightDraw ? '#241A35' : '#171A21') : '#FF7A1A', border: `3px solid ${p.isMidnightDraw ? '#F2B33D' : p.status === 'pending' ? '#5E6676' : '#FF7A1A'}` }" />
        <div class="absolute text-center text-sm font-bold" style="left:-30px;top:38px;width:60px" :style="{ color: p.isMidnightDraw ? '#F2B33D' : '#9AA3B2' }">{{ Math.round(dueMin(i + 1)) }} min</div>
      </div>
    </div>
  </section>

  <section aria-label="Prizes" class="bg-a-panel rounded-[14px] flex flex-col gap-1.5" style="padding:12px 14px">
    <div class="grid gap-2.5 text-[13px] font-extrabold text-a-muted uppercase" style="grid-template-columns:52px 26px 1.7fr 92px .9fr 58px 84px 132px 236px;padding:0 10px 4px;letter-spacing:.06em">
      <span /><span>#</span><span>Prize</span><span>Tier</span><span>Notes</span><span>Due</span><span>Beat</span><span>Status</span><span>Actions</span>
    </div>
    <div v-for="(p, i) in s.prizes" :key="p.id" class="grid gap-2.5 items-center rounded-[10px] box-border" style="grid-template-columns:52px 26px 1.7fr 92px .9fr 58px 84px 132px 236px;min-height:56px;padding:0 10px" :style="{ background: p.draw?.status === 'offered' ? '#1F232C' : 'transparent', border: `2px solid ${p.draw?.status === 'offered' ? '#FF7A1A' : 'transparent'}` }">
      <span class="flex"><button class="bg-transparent border-0 text-a-muted" style="width:26px;height:40px" :aria-label="`Move ${p.name} up`" @click="move(i, -1)">↑</button><button class="bg-transparent border-0 text-a-muted" style="width:26px;height:40px" :aria-label="`Move ${p.name} down`" @click="move(i, 1)">↓</button></span>
      <span class="text-base font-extrabold text-a-muted">{{ i + 1 }}</span>
      <input class="a-input" :value="p.name" :aria-label="`Prize ${i + 1} name`" style="border-color:transparent;background:transparent;padding:0 4px" @change="save(p, { name: ($event.target as HTMLInputElement).value })">
      <select class="a-input" :value="p.tier" :aria-label="`Prize ${i + 1} tier`" style="min-height:36px;padding:0 6px;font-size:13px;font-weight:800" :style="{ background: tiers[p.tier]![0], color: tiers[p.tier]![1], borderColor: 'transparent' }" @change="save(p, { tier: ($event.target as HTMLSelectElement).value })"><option value="swag">Swag</option><option value="special">Special</option><option value="grand">Grand</option></select>
      <input class="a-input" :value="p.notes" placeholder="—" :aria-label="`Prize ${i + 1} notes`" style="border-color:transparent;background:transparent;padding:0 4px;font-size:14px;color:#9AA3B2" @change="save(p, { notes: ($event.target as HTMLInputElement).value })">
      <span class="text-base font-extrabold">{{ fmtM(dueMin(i + 1)) }}</span>
      <span class="text-sm font-bold" :style="{ color: p.isMidnightDraw ? '#FFB36B' : '#C4CAD6' }">{{ p.isMidnightDraw ? 'Midnight' : 'Lightning' }}</span>
      <span class="a-chip truncate" style="max-width:100%" :style="{ background: status(p)[0], color: status(p)[1] }">{{ status(p)[2] }}</span>
      <div class="flex gap-1.5 justify-end">
        <template v-if="canDraw(p)">
          <button class="a-btn" style="min-height:40px;padding:0 12px;font-size:14px;font-weight:800" :disabled="s.party.status !== 'live'" @click="run(p, 'draw')">Draw now</button>
          <button class="a-btn" style="min-height:40px;padding:0 12px;font-size:14px;background:#1F232C" @click="run(p, 'skip')">Skip</button>
          <button class="a-btn" style="min-height:40px;padding:0 12px;font-size:14px;background:#1F232C" :aria-label="`Delete ${p.name}`" @click="remove(p)">✕</button>
        </template>
        <template v-else-if="offered(p)">
          <button class="a-btn" style="min-height:40px;padding:0 12px;font-size:14px;font-weight:800" @click="run(p, 'redraw')">Redraw</button>
          <button class="a-btn primary" style="min-height:40px;padding:0 12px;font-size:14px" @click="run(p, 'mark-claimed')">Mark claimed</button>
        </template>
      </div>
    </div>
  </section>
</template>
