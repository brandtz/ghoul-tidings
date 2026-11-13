<script setup lang="ts">
// Host bingo controls: call squares, review claimed cards, open or close the game.
// A claim shows each dab against the calls: green was called, red was not.
import { computed } from 'vue'
import { useAdminStore } from '~/stores/admin'

const props = defineProps<{ compact?: boolean }>()
const admin = useAdminStore()
const b = computed(() => admin.a.bingo)
const called = computed(() => new Set<string>(b.value.called))
const left = computed(() => b.value.pool.length - b.value.called.length)
const pending = computed(() => b.value.claims.filter((c: any) => c.status === 'pending'))
const reviewed = computed(() => b.value.claims.filter((c: any) => c.status !== 'pending'))
const isSeg = computed(() => admin.a.current?.segment.type === 'bingo')
const post = (action: string, body: any = {}) => admin.post(`/api/admin/bingo/${action}`, body)
const call = (square?: string) => post('call', square ? { square } : {})
const uncall = async (square: string) => { if (await admin.confirm(`Take back the call "${square}"?`, 'Take back')) post('uncall', { square }) }
const close = async () => { if (await admin.confirm('Close bingo? Cards disappear from every screen. Reviewed results stay.', 'Close bingo')) post('close') }
const approve = (c: any) => post('approve', { id: c.id })
const reject = async (c: any) => { if (await admin.confirm(`Reject ${c.player}'s card? They keep playing and can call again.`, 'Reject')) post('reject', { id: c.id }) }
const cellStyle = (c: any, i: number) => {
  const dab = c.marked.includes(i)
  if (i === b.value.free) return 'background:#2A2F3B;color:#9AA3B2'
  if (!dab) return called.value.has(c.card[i]) ? 'background:#171A21;color:#6EE7A8;border:1px dashed #2E6B4C' : 'background:#171A21;color:#5E6676'
  return called.value.has(c.card[i]) ? 'background:#10281C;color:#6EE7A8;border:1px solid #6EE7A8' : 'background:#3A1519;color:#FF8F94;border:1px solid #FF8F94'
}
const time = (t: number) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
</script>

<template>
  <section aria-label="Bingo" class="bg-a-panel rounded-2xl flex flex-col gap-3 min-h-0" :class="compact ? '' : 'flex-1 overflow-y-auto'" style="padding:16px 20px" :style="pending.length ? 'border:2px solid #FF7A1A' : ''">
    <div class="flex items-center gap-3 flex-wrap">
      <span class="a-eyebrow">Bingo</span>
      <span class="a-chip" :style="b.open ? 'background:#10281C;color:#6EE7A8' : 'background:#1F232C;color:#9AA3B2'">{{ b.open ? 'Open' : 'Closed' }}</span>
      <span class="text-[15px] font-bold text-a-muted">{{ b.called.length }} of {{ b.pool.length }} called</span>
      <span v-if="pending.length" class="a-chip" style="background:#3A2A12;color:#FFB36B">{{ pending.length }} to review</span>
      <div class="flex-1" />
      <template v-if="b.open">
        <button class="a-btn primary" :disabled="!left" @click="call()">Call a random square</button>
        <button v-if="!compact" class="a-btn" @click="close">Close bingo</button>
      </template>
      <button v-else class="a-btn primary" @click="post('open')">Open bingo</button>
      <button v-if="isSeg && !compact" class="a-btn" @click="admin.post('/api/admin/segment/end', {}, true)">End segment</button>
    </div>

    <div v-if="b.called.length" class="text-base font-bold">Latest call: <span class="text-a-accent">{{ b.called[b.called.length - 1] }}</span></div>

    <article v-for="c in pending" :key="c.id" class="rounded-xl flex flex-col gap-2.5" style="background:#1F232C;padding:12px 14px">
      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-lg font-extrabold">{{ c.player }}</span>
        <span class="text-sm font-semibold text-a-muted">called bingo at {{ time(c.createdAt) }}</span>
        <span v-if="c.verified && !c.uncalled.length" class="a-chip" style="background:#10281C;color:#6EE7A8">Every dab was called · line confirmed</span>
        <span v-else-if="c.verified" class="a-chip" style="background:#2B2412;color:#FFD27A">Has a called line · {{ c.uncalled.length }} extra {{ c.uncalled.length === 1 ? 'dab' : 'dabs' }} not called</span>
        <span v-else class="a-chip" style="background:#3A1519;color:#FF8F94">No called line · {{ c.uncalled.length }} {{ c.uncalled.length === 1 ? 'dab' : 'dabs' }} not called yet</span>
        <div class="flex-1" />
        <button class="a-btn ok" @click="approve(c)">Approve +{{ (admin.a.party.settings.points.bingo + (b.claims.some((x: any) => x.status === 'approved') ? 0 : admin.a.party.settings.points.bingoFirst)).toLocaleString() }}</button>
        <button class="a-btn" @click="reject(c)">Reject</button>
      </div>
      <div class="grid gap-1" style="grid-template-columns:repeat(5,minmax(0,1fr))">
        <div v-for="(sq, i) in c.card" :key="i" class="rounded-md text-[11px] font-bold leading-tight flex items-center justify-center text-center box-border overflow-hidden" style="height:46px;padding:2px 3px;overflow-wrap:anywhere" :style="cellStyle(c, i)" :title="sq"><span style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">{{ sq }}</span></div>
      </div>
      <div class="text-[13px] font-semibold text-a-muted">Green: dabbed and called. Red: dabbed but never called. Dashed: called but not dabbed.</div>
    </article>

    <template v-if="!compact">
      <div v-if="b.open || b.called.length" class="flex flex-col gap-2">
        <div class="text-[13px] font-bold text-a-muted">Squares · click one to call it, click a called one to take it back</div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="sq in b.pool" :key="sq" class="rounded-lg text-sm font-bold"
            style="min-height:36px;padding:0 10px;border:2px solid transparent"
            :style="called.has(sq) ? 'background:#3A2A12;color:#FFB36B;border-color:#FF7A1A' : 'background:#1F232C;color:#C4CAD6'"
            :disabled="!b.open && !called.has(sq)" @click="called.has(sq) ? uncall(sq) : call(sq)"
          >{{ sq }}</button>
        </div>
      </div>
      <div v-if="reviewed.length" class="flex flex-col gap-1">
        <div class="text-[13px] font-bold text-a-muted">Reviewed</div>
        <div v-for="c in reviewed" :key="c.id" class="flex items-center gap-3 text-[15px] font-bold">
          <span class="a-chip" :style="c.status === 'approved' ? 'background:#10281C;color:#6EE7A8' : 'background:#1F232C;color:#9AA3B2'">{{ c.status === 'approved' ? 'Bingo' : 'Rejected' }}</span>
          {{ c.player }} <span class="text-sm font-semibold text-a-muted">{{ time(c.createdAt) }}</span>
        </div>
      </div>
      <div class="text-[13px] font-semibold text-a-muted">First confirmed bingo pays {{ (admin.a.party.settings.points.bingo + admin.a.party.settings.points.bingoFirst).toLocaleString() }}, later ones {{ admin.a.party.settings.points.bingo.toLocaleString() }}. Points can be reversed from the Live monitor. Edit the squares under Content, Bingo.</div>
    </template>
  </section>
</template>
