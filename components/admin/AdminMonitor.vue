<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAdminStore } from '~/stores/admin'

const admin = useAdminStore()
const s = computed(() => admin.a)
const filter = ref('all')
const groups: Record<string, string[]> = { joins: ['join'], answers: ['answer'], scores: ['score', 'self'], raffle: ['raffle'], bingo: ['bingo'], errors: ['error'], codes: ['code'] }
const count = (k: string) => (k === 'all' ? s.value.log.length : s.value.log.filter((e: any) => groups[k]!.includes(e.type)).length)
const events = computed(() => s.value.log.filter((e: any) => !e.dismissed && (filter.value === 'all' || groups[filter.value]!.includes(e.type))))
const C: Record<string, [string, string, string]> = {
  join: ['#10281C', '#6EE7A8', 'Join'], answer: ['#1F232C', '#C4CAD6', 'Answer'], score: ['#2B2412', '#FFD27A', 'Score'], raffle: ['#3A1A2C', '#FFA3D1', 'Raffle'],
  error: ['#3A1519', '#FF8F94', 'Error'], self: ['#3A2A12', '#FFB36B', 'Self-mark'], code: ['#1E2B4A', '#8FC0FF', 'Code'], bingo: ['#2B2412', '#FFD27A', 'Bingo'], state: ['#1F232C', '#C4CAD6', 'Show'], effect: ['#1F232C', '#C4CAD6', 'Effect'],
}
const time = (t: number) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }).replace(/\s?[AP]M/i, '')
const reverse = async (e: any) => { if (await admin.confirm(`Reverse this? ${e.text}`, 'Reverse')) admin.post('/api/admin/scores/reverse', { actionId: e.data.actionId, logId: e.id }) }
const dismiss = (e: any) => admin.content('log', 'dismiss', { id: e.id })
const cols = 'grid-template-columns:96px 120px minmax(0,1fr) 160px'
</script>

<template>
  <div class="flex items-center gap-4">
    <h1 class="m-0 text-[28px] font-extrabold">Live monitor</h1>
    <span class="flex items-center gap-2 text-[15px] font-bold text-a-ok"><span class="rounded-full bg-a-ok" style="width:10px;height:10px" />Streaming · {{ s.clients }} clients connected</span>
  </div>
  <div class="flex gap-2 flex-wrap" role="tablist">
    <button v-for="f in [['all', 'All'], ['joins', 'Joins'], ['answers', 'Answers'], ['scores', 'Scores'], ['raffle', 'Raffle'], ['bingo', 'Bingo'], ['errors', 'Errors'], ['codes', 'Code attempts']]" :key="f[0]" role="tab" :aria-selected="filter === f[0]" class="rounded-full text-[15px] font-extrabold" style="min-height:44px;padding:0 18px" :style="filter === f[0] ? 'border:2px solid #FF7A1A;background:#2A2F3B;color:#fff' : 'border:2px solid #2B303B;background:transparent;color:#C4CAD6'" @click="filter = f[0]!">{{ f[1] }}<span class="font-bold text-a-muted" style="margin-left:8px">{{ count(f[0]!) }}</span></button>
  </div>
  <section aria-label="Event feed" class="bg-a-panel rounded-[14px] flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto" style="padding:12px 14px">
    <div class="grid gap-3 text-[13px] font-extrabold text-a-muted uppercase" :style="cols" style="padding:0 10px 6px;letter-spacing:.06em"><span>Time</span><span>Type</span><span>Event</span><span class="text-right">Action</span></div>
    <div v-if="!events.length" class="text-a-muted font-bold" style="padding:14px">Nothing here yet.</div>
    <div v-for="e in events" :key="e.id" class="grid gap-3 items-center rounded-[10px] box-border" :style="[cols, { background: e.type === 'self' || e.type === 'error' ? '#1F232C' : 'transparent', border: `2px solid ${e.type === 'self' ? '#FF7A1A' : 'transparent'}` }]" style="min-height:48px;padding:0 10px">
      <span class="text-[15px] font-bold text-a-muted">{{ time(e.createdAt) }}</span>
      <span class="a-chip" :style="{ background: (C[e.type] ?? C.state!)[0], color: (C[e.type] ?? C.state!)[1] }">{{ (C[e.type] ?? C.state!)[2] }}</span>
      <span class="text-base font-semibold truncate" :title="e.text">{{ e.text }}</span>
      <span class="text-right">
        <button v-if="e.data?.reversible" class="a-btn" style="min-height:36px;padding:0 14px;font-size:14px;font-weight:800" @click="reverse(e)">Reverse</button>
        <button v-else-if="e.type === 'error'" class="a-btn" style="min-height:36px;padding:0 14px;font-size:14px;font-weight:800" @click="dismiss(e)">Dismiss</button>
      </span>
    </div>
  </section>
</template>
