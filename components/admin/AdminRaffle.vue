<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNow } from '~/composables/useCountdown'
import { useAdminStore } from '~/stores/admin'

const admin = useAdminStore()
const now = useNow(1000)
const s = computed(() => admin.a)
const D = computed(() => s.value.party.durationMin)
const raffles = computed(() => s.value.prizes.filter((p: any) => p.kind === 'raffle'))
const N = computed(() => raffles.value.length)
const awards = computed(() => s.value.prizes.length - N.value)
const tiers: Record<string, [string, string, string]> = { swag: ['#252A35', '#C4CAD6', 'Standard'], special: ['#2B2412', '#FFD27A', 'Special'], grand: ['#3A1A2C', '#FFA3D1', 'Grand'] }
const KINDS: Record<string, string> = { raffle: 'Random draw', top_score: 'Best score', most_eggs: 'Most eggs' }
const dueMin = (i: number) => (D.value * i) / (N.value + 1)
const fmtM = (m: number) => { const t = Math.round(m * 60); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` }
const elapsedPct = computed(() => { const st = s.value.party.startedAt; return st ? Math.min(100, ((now.value - st - s.value.party.pausedMs) / (D.value * 60000)) * 100) : 0 })
const status = (p: any) => {
  if (p.status === 'claimed') return ['#10281C', '#6EE7A8', `Won · ${p.draw?.winner ?? ''}`]
  if (p.status === 'skipped') return ['#1F232C', '#9AA3B2', 'Skipped']
  if (p.kind !== 'raffle') return p.leader ? ['#1E2B4A', '#8FC0FF', `Leading · ${p.leader.name}`] : ['#1F232C', '#C4CAD6', 'Nobody yet']
  return ['#1F232C', '#C4CAD6', 'Pending']
}
const run = (p: any, a: string) => admin.post(`/api/admin/raffle/${p.id}/${a}`)
const awardNow = async (p: any) => {
  if (!p.leader) return
  const tie = p.leader.tied.length ? ` Tied with ${p.leader.tied.join(', ')}; it goes to whoever got there first.` : ''
  if (await admin.confirm(`Award ${p.name} to ${p.leader.name} (${p.leader.detail})?${tie}`, 'Award')) run(p, 'draw')
}
const redraw = async (p: any) => {
  const what = p.kind === 'raffle' ? `Redraw ${p.name}? ${p.draw?.winner} loses it and someone else present wins.` : `Re-award ${p.name} to whoever leads right now?`
  if (await admin.confirm(what, p.kind === 'raffle' ? 'Redraw' : 'Re-award')) run(p, 'redraw')
}
const save = (p: any, patch: any) => admin.content('prizes', 'save', { id: p.id, name: p.name, tier: p.tier, kind: p.kind, notes: p.notes, isMidnight: p.isMidnight, ...patch })
const adding = ref('')
const add = async () => { if (adding.value.trim()) { await admin.content('prizes', 'save', { name: adding.value.trim(), tier: 'swag', kind: 'raffle' }); adding.value = '' } }
const move = (i: number, d: number) => {
  const ids = s.value.prizes.map((p: any) => p.id); const j = i + d
  if (j < 0 || j >= ids.length) return
  [ids[i], ids[j]] = [ids[j], ids[i]]
  admin.content('prizes', 'reorder', { ids })
}
const setLength = (e: Event) => admin.content('settings', 'save', { durationMin: Number((e.target as HTMLSelectElement).value) })
const setRepeat = (e: Event) => admin.content('settings', 'save', { noRepeatWinners: (e.target as HTMLInputElement).checked })
const editing = ref<any>(null)
const openEdit = (p: any) => { editing.value = { id: p.id, name: p.name, tier: p.tier, kind: p.kind, notes: p.notes ?? '' } }
const saveEdit = async () => {
  const e = editing.value; const p = s.value.prizes.find((x: any) => x.id === e.id)
  if (!e.name.trim() || !p) return
  if (await save(p, { name: e.name.trim(), tier: e.tier, kind: e.kind, notes: e.notes.trim() })) editing.value = null
}
const remove = async (p: any) => { if (await admin.confirm(`Delete ${p.name}?`, 'Delete')) admin.content('prizes', 'delete', { id: p.id }) }
const time = (t: number) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
const cols = 'grid-template-columns:44px 26px minmax(140px,1fr) 104px 128px 120px 230px'
</script>

<template>
  <div class="flex items-center gap-4">
    <h1 class="m-0 text-[28px] font-extrabold">Prizes and raffle</h1>
    <span class="text-[15px] font-bold text-a-muted">Winners keep their prize the moment they are drawn. No claiming.</span>
    <div class="flex-1" />
    <form class="flex gap-2" @submit.prevent="add"><input v-model="adding" class="a-input" style="width:240px" placeholder="New prize name" aria-label="New prize name"><button class="a-btn primary">Add prize</button></form>
  </div>
  <section class="grid gap-3" style="grid-template-columns:repeat(4,minmax(0,1fr))">
    <label class="bg-a-panel rounded-xl flex flex-col gap-1.5 text-[13px] font-bold text-a-muted" style="padding:12px 14px">Party length
      <select class="a-input" :value="D" @change="setLength"><option :value="60">60 minutes</option><option :value="75">75 minutes</option><option :value="90">90 minutes</option></select>
    </label>
    <div class="bg-a-panel rounded-xl flex flex-col gap-1.5 text-[13px] font-bold text-a-muted" style="padding:12px 14px">Prizes
      <div class="text-[22px] font-extrabold text-a-text">{{ N }} draws · {{ awards }} awards</div>
      <div v-if="N">One draw about every {{ Math.round(D / (N + 1)) }} min. Awards at the finale.</div>
    </div>
    <div class="bg-a-panel rounded-xl flex flex-col gap-2 text-[15px] font-bold" style="padding:12px 14px">
      <label class="flex items-center gap-2.5" style="min-height:28px"><input type="checkbox" :checked="s.party.settings.noRepeatWinners" style="width:20px;height:20px;accent-color:#FF7A1A" @change="setRepeat">No repeat raffle winners</label>
      <label class="flex items-center gap-2.5" style="min-height:28px"><input type="checkbox" checked disabled style="width:20px;height:20px;accent-color:#FF7A1A">Exclude host <span class="text-[13px] text-a-muted font-semibold">· always on</span></label>
    </div>
    <div class="bg-a-panel rounded-xl flex flex-col gap-2 text-[15px] font-bold" style="padding:12px 14px">
      <div class="flex justify-between items-center" style="min-height:28px">Presence window <span style="color:#FFB36B">{{ s.party.settings.presenceMin }} min</span></div>
      <div class="text-[13px] font-semibold text-a-muted">Only players seen in this window can be drawn.</div>
    </div>
  </section>

  <section aria-label="Winners so far" class="bg-a-panel rounded-[14px] flex flex-col gap-1.5" style="padding:14px 18px">
    <div class="flex items-center gap-3"><span class="a-eyebrow">Winners so far · {{ s.winners.length }}</span><span class="text-[13px] font-semibold text-a-muted">Newest first. Email each winner their gift card after the party.</span></div>
    <div v-if="!s.winners.length" class="text-a-muted font-bold" style="padding:4px 0">Nobody yet.</div>
    <div class="grid gap-x-6 gap-y-1" style="grid-template-columns:repeat(2,minmax(0,1fr))">
      <div v-for="w in s.winners" :key="w.at" class="flex items-center gap-2.5" style="min-height:40px">
        <Avatar :avatar-key="w.avatarKey" :size="28" />
        <span class="text-base font-extrabold truncate">{{ w.name }}</span>
        <span class="text-[15px] font-semibold truncate" style="color:#FFD27A">{{ w.prize }}</span>
        <span class="ml-auto text-sm font-semibold text-a-muted">{{ time(w.at) }}</span>
      </div>
    </div>
  </section>

  <section aria-label="Draw timeline" class="bg-a-panel rounded-[14px]" style="padding:16px 22px 14px">
    <div class="flex items-center" style="margin-bottom:10px"><span class="a-eyebrow">Random draw timeline · 0 to {{ D }} min</span></div>
    <div class="relative" style="height:58px;margin:0 8px">
      <div class="absolute left-0 right-0 rounded" style="top:20px;height:8px;background:#252A35" />
      <div class="absolute left-0 rounded" :style="{ width: `${elapsedPct}%` }" style="top:20px;height:8px;background:#FF7A1A" />
      <div v-for="(p, i) in raffles" :key="p.id" class="absolute" :style="{ left: `${((i + 1) / (N + 1)) * 100}%` }" style="top:0;width:0">
        <div class="absolute rounded-full box-border" :style="{ left: `${p.isMidnightDraw ? -13 : -9}px`, top: `${24 - (p.isMidnightDraw ? 13 : 9)}px`, width: `${p.isMidnightDraw ? 26 : 18}px`, height: `${p.isMidnightDraw ? 26 : 18}px`, background: p.status === 'pending' ? (p.isMidnightDraw ? '#241A35' : '#171A21') : '#FF7A1A', border: `3px solid ${p.isMidnightDraw ? '#F2B33D' : p.status === 'pending' ? '#5E6676' : '#FF7A1A'}` }" />
        <div class="absolute text-center text-sm font-bold" style="left:-30px;top:38px;width:60px" :style="{ color: p.isMidnightDraw ? '#F2B33D' : '#9AA3B2' }">{{ Math.round(dueMin(i + 1)) }} min</div>
      </div>
    </div>
  </section>

  <section aria-label="Prizes" class="bg-a-panel rounded-[14px] flex flex-col gap-1.5" style="padding:12px 14px">
    <div class="grid gap-2.5 text-[13px] font-extrabold text-a-muted uppercase" :style="cols" style="padding:0 10px 4px;letter-spacing:.06em">
      <span /><span>#</span><span>Prize</span><span>Type</span><span>Due</span><span>Status</span><span class="text-right">Actions</span>
    </div>
    <div v-for="(p, i) in s.prizes" :key="p.id" class="grid gap-2.5 items-center rounded-[10px] box-border" :style="cols" style="min-height:56px;padding:0 10px">
      <span class="flex"><button class="bg-transparent border-0 text-a-muted" style="width:26px;height:40px" :aria-label="`Move ${p.name} up`" @click="move(i, -1)">↑</button><button class="bg-transparent border-0 text-a-muted" style="width:26px;height:40px" :aria-label="`Move ${p.name} down`" @click="move(i, 1)">↓</button></span>
      <span class="text-base font-extrabold text-a-muted">{{ p.index || '★' }}</span>
      <span class="truncate" :title="p.notes ? `${p.name} · ${p.notes}` : p.name"><span class="block text-base font-extrabold truncate">{{ p.name }}</span><span v-if="p.notes" class="block text-[13px] font-semibold truncate" style="color:#9AA3B2">{{ p.notes }}</span></span>
      <span class="a-chip" :style="{ background: tiers[p.tier]![0], color: tiers[p.tier]![1] }">{{ KINDS[p.kind] }}</span>
      <span class="text-base font-extrabold whitespace-nowrap">{{ p.kind === 'raffle' ? fmtM(dueMin(p.index)) : 'Finale' }}<span v-if="p.isMidnightDraw" class="text-sm font-bold" style="color:#FFB36B"> · Midnight</span></span>
      <span class="a-chip truncate" style="max-width:100%" :title="p.leader ? `${p.leader.detail}${p.leader.tied.length ? `, tied with ${p.leader.tied.join(', ')}` : ''}` : ''" :style="{ background: status(p)[0], color: status(p)[1] }">{{ status(p)[2] }}</span>
      <div class="flex gap-1.5 justify-end whitespace-nowrap">
        <button class="a-btn" style="min-height:40px;padding:0 12px;font-size:14px;background:#1F232C" :aria-label="`Edit ${p.name}`" @click="openEdit(p)">Edit</button>
        <template v-if="p.status === 'pending'">
          <button v-if="p.kind === 'raffle'" class="a-btn" style="min-height:40px;padding:0 12px;font-size:14px;font-weight:800" :disabled="s.party.status !== 'live'" @click="run(p, 'draw')">Draw now</button>
          <button v-else class="a-btn" style="min-height:40px;padding:0 12px;font-size:14px;font-weight:800" :disabled="s.party.status !== 'live' || !p.leader" @click="awardNow(p)">Award now</button>
          <button class="a-btn" style="min-height:40px;padding:0 12px;font-size:14px;background:#1F232C" @click="run(p, 'skip')">Skip</button>
        </template>
        <button v-else-if="p.status === 'claimed'" class="a-btn" style="min-height:40px;padding:0 12px;font-size:14px;font-weight:800" @click="redraw(p)">{{ p.kind === 'raffle' ? 'Redraw' : 'Re-award' }}</button>
        <button v-else-if="p.status === 'skipped'" class="a-btn" style="min-height:40px;padding:0 12px;font-size:14px" @click="run(p, 'unskip')">Unskip</button>
      </div>
      <form v-if="editing?.id === p.id" class="flex gap-2 items-end" style="grid-column:1 / -1;padding:6px 0 10px 88px" @submit.prevent="saveEdit">
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted" style="flex:2">Prize name<input v-model="editing.name" class="a-input" required maxlength="80"></label>
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Type<select v-model="editing.kind" class="a-input"><option value="raffle">Random draw</option><option value="top_score">Best score award</option><option value="most_eggs">Most eggs award</option></select></label>
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Look<select v-model="editing.tier" class="a-input"><option value="swag">Standard</option><option value="special">Special</option><option value="grand">Grand</option></select></label>
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted" style="flex:1.5">Notes<input v-model="editing.notes" class="a-input" placeholder="Optional, host only" maxlength="120"></label>
        <button class="a-btn primary">Save</button><button type="button" class="a-btn" @click="editing = null">Cancel</button>
        <button v-if="p.status === 'pending'" type="button" class="a-btn danger" @click="remove(p); editing = null">Delete</button>
      </form>
    </div>
    <div class="text-[13px] font-semibold text-a-muted" style="padding:6px 10px 0">Random draws fire on the timeline and wait for a round to finish. Awards go out from Run of show during the finale, or with Award now. Best score ties go to whoever reached the score first; egg ties go to whoever found their last egg first.</div>
  </section>
</template>
