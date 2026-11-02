<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '~/composables/useCountdown'
import { useAdminStore } from '~/stores/admin'
import { usePartyStore } from '~/stores/party'

const admin = useAdminStore()
const party = usePartyStore()
const now = useNow(500)
const s = computed(() => admin.a)
const st = computed(() => s.value?.party.state)
const fmt = (ms: number) => { const t = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` }
const stateLabel = computed(() => {
  const x = s.value
  if (!x) return ''
  if (x.party.status !== 'live') return x.party.status === 'ended' ? 'Ended' : 'Lobby'
  if (st.value.partyPaused) return 'Paused'
  if (!x.current) return 'Intermission'
  return `${x.current.segment.title}${x.current.round ? ` · ${x.current.round.phase}` : ''}`
})
async function broadcastMessage() {
  const text = window.prompt('Message for every screen (80 characters)')
  if (text) admin.post('/api/admin/effect', { key: 'banner', text: text.slice(0, 80) })
}
</script>

<template>
  <aside v-if="s" aria-label="Live" class="bg-a-nav flex flex-col gap-3.5 overflow-y-auto" style="padding:20px">
    <div class="a-eyebrow">Live · what everyone sees</div>
    <!-- Public snapshot only: this thumbnail can never hold a correct answer. -->
    <div class="relative overflow-hidden rounded-xl" style="aspect-ratio:16/9;border:2px solid #2A2236;background:#0E0A14;flex:none">
      <div style="position:absolute;inset:0;overflow:hidden" role="img" aria-label="Stage preview thumbnail">
        <PartyShell :progress="party.snap?.theme.p ?? 0" stage thumb :fixed-width="376"><GameScreen stage /></PartyShell>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-2.5">
      <div class="rounded-xl bg-a-panel" style="padding:12px 14px"><div class="text-[13px] font-bold text-a-muted">State</div><div class="text-[17px] font-extrabold truncate">{{ stateLabel }}</div></div>
      <div class="rounded-xl bg-a-panel" style="padding:12px 14px"><div class="text-[13px] font-bold text-a-muted">Present</div><div class="text-[18px] font-extrabold">{{ s.present }} players</div></div>
      <div class="rounded-xl bg-a-panel" style="padding:12px 14px"><div class="text-[13px] font-bold text-a-muted">Scoring</div><div class="text-[18px] font-extrabold" :style="{ color: st.scoringPaused ? '#FFD27A' : '#6EE7A8' }">{{ st.scoringPaused ? 'Paused' : 'Running' }}</div></div>
      <div class="rounded-xl bg-a-panel" style="padding:12px 14px"><div class="text-[13px] font-bold text-a-muted">Conductor</div><div class="text-[18px] font-extrabold" :style="{ color: admin.conductor.ok ? '#6EE7A8' : '#FF8F94' }">{{ admin.conductor.label }}</div></div>
    </div>
    <div v-if="s.nextPrize" class="rounded-xl bg-a-panel flex flex-col gap-1" style="padding:14px 16px">
      <div class="text-[13px] font-bold text-a-muted uppercase" style="letter-spacing:.06em">Next raffle · draw {{ s.nextPrize.index }} of {{ s.prizes.length }}</div>
      <div class="flex items-baseline gap-3">
        <span class="text-[18px] font-extrabold truncate capitalize">{{ s.nextPrize.tier }} · {{ s.nextPrize.name }}</span>
        <span class="text-[28px] font-extrabold ml-auto">{{ s.party.status === 'live' ? fmt(s.nextPrize.dueAt - now) : '—' }}</span>
      </div>
      <div class="text-sm font-semibold text-a-muted">{{ st.raffleDeferred ? 'Waiting for the reveal' : 'Waits for the reveal if a round is open' }}</div>
    </div>
    <div class="flex-1" />
    <div class="a-eyebrow">Panic controls</div>
    <div class="grid grid-cols-2 gap-2.5">
      <button class="rounded-xl font-extrabold text-base" style="min-height:60px;border:0;background:#2B2412;color:#FFD27A" @click="admin.pause('scoring')">{{ st.scoringPaused ? 'Resume scoring' : 'Pause scoring' }}</button>
      <button class="rounded-xl font-extrabold text-base" style="min-height:60px;border:0;background:#2B2412;color:#FFD27A" @click="admin.pause('party')">{{ st.partyPaused ? 'Resume party' : 'Pause party' }} <span class="text-[13px] opacity-80">· P</span></button>
      <button class="rounded-xl font-extrabold text-[15px] leading-tight bg-a-raised text-a-text" style="min-height:60px;border:0" :disabled="!s.undo" @click="admin.undo">Undo last<br><span class="text-[13px] font-semibold text-a-muted">{{ s.undo ? `${s.undo.label}, ${s.undo.count} ${s.undo.count === 1 ? 'event' : 'events'}` : 'Nothing to undo' }}</span></button>
      <button class="rounded-xl font-extrabold text-base bg-a-raised text-a-text" style="min-height:60px;border:0" @click="broadcastMessage">Broadcast message</button>
    </div>
    <div class="text-[13px] font-semibold text-a-muted leading-snug">Pausing is reversible and shows an undo toast. Undo asks to confirm because it reverses points on every screen.</div>
  </aside>
</template>
