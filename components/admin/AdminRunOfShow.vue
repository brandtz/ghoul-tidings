<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '~/composables/useCountdown'
import { useAdminStore } from '~/stores/admin'
import { usePartyStore } from '~/stores/party'

const admin = useAdminStore()
const party = usePartyStore()
const now = useNow(500)
const s = computed(() => admin.a)
const c = computed(() => s.value.current)
const r = computed(() => c.value?.round)
const LETTERS = 'ABCD'
const fmt = (ms: number) => { const t = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` }
const elapsed = computed(() => (s.value.party.startedAt ? fmt(now.value - s.value.party.startedAt - s.value.party.pausedMs) : '0:00'))
const chip: Record<string, [string, string]> = { Live: ['#3A2A12', '#FFB36B'], Done: ['#1F232C', '#9AA3B2'], 'Up next': ['#1F232C', '#E8EAF0'], Ready: ['#10281C', '#6EE7A8'], Locked: ['#1F232C', '#9AA3B2'] }
const phaseLabel = computed(() => (r.value ? r.value.phase.toUpperCase() : 'WAITING'))
const secsLeft = computed(() => (r.value?.phase === 'open' ? Math.max(0, Math.ceil((r.value.locksAt - now.value) / 1000)) : 0))
const answered = computed(() => r.value?.answered ?? 0)
const pct = computed(() => (s.value.present ? Math.min(100, (answered.value / s.value.present) * 100) : 0))
const act = (name: string) => admin.post(`/api/admin/round/${name}`, {}, true)
const startSeg = (id: string) => admin.post('/api/admin/segment/start', { segmentId: id }, true)
const has = computed(() => ({ open: !!c.value && !r.value && c.value.itemIndex < c.value.itemCount, lock: r.value?.phase === 'open', reveal: r.value?.phase === 'locked' && !s.value.party.state.scoringPaused, next: r.value?.phase === 'revealed', skip: !!c.value?.item, back: !r.value && (c.value?.itemIndex ?? 0) > 0 }))
const item = computed(() => c.value?.item)
const nextItem = computed(() => c.value?.next ?? null)
const correctShown = computed(() => r.value?.phase === 'revealed')
</script>

<template>
  <div class="flex items-center gap-4">
    <h1 class="m-0 text-[28px] font-extrabold">Run of show</h1>
    <span class="text-base font-bold bg-a-raised rounded-full" style="padding:6px 14px">Elapsed {{ elapsed }} / {{ s.party.durationMin }}:00</span>
    <span class="text-base font-bold text-a-muted">Theme progress {{ party.snap?.theme.p.toFixed(2) }} · {{ party.snap?.theme.override ? 'override' : 'auto' }}</span>
    <div class="flex-1" />
    <span class="flex items-center gap-2 text-base font-extrabold" :style="{ color: s.party.status === 'live' ? '#6EE7A8' : '#9AA3B2' }">
      <span class="rounded-full" style="width:10px;height:10px;background:currentColor" />{{ s.party.status.toUpperCase() }}
    </span>
  </div>

  <div class="ros-grid grid gap-5 flex-1 min-h-0" style="grid-template-columns:520px minmax(0,1fr)">
    <section aria-label="Segments" class="bg-a-panel rounded-2xl flex flex-col gap-2 overflow-y-auto" style="padding:14px">
      <div class="a-eyebrow" style="padding:2px 6px">Segments</div>
      <button
        v-for="(g, i) in s.segments" :key="g.id" class="flex items-center gap-3 rounded-xl text-left text-a-text"
        style="min-height:64px;padding:0 14px" :style="{ background: g.status === 'Live' ? '#1F232C' : '#171A21', border: `2px solid ${g.status === 'Live' ? '#FF7A1A' : 'transparent'}` }"
        :disabled="g.status === 'Live' || s.party.status !== 'live'" :title="`Start ${g.title}`" @click="startSeg(g.id)"
      >
        <span class="text-base font-extrabold text-a-muted" style="width:28px">{{ i + 1 }}</span>
        <span class="flex-1 min-w-0"><span class="block text-[17px] font-bold truncate">{{ g.title }}</span><span class="block text-sm font-semibold text-a-muted truncate">{{ g.sub }}</span></span>
        <span class="a-chip" :style="{ background: chip[g.status]?.[0], color: chip[g.status]?.[1] }">{{ g.status }}</span>
      </button>
    </section>

    <div class="flex flex-col gap-4 min-h-0 min-w-0">
      <section aria-label="Current item" class="bg-a-panel rounded-2xl flex flex-col gap-3.5" style="padding:20px 22px;border:2px solid #FF7A1A">
        <div class="flex items-center gap-3">
          <span class="text-sm font-extrabold text-a-accent uppercase" style="letter-spacing:.08em">Now · {{ c ? `${c.segment.title}${c.itemCount ? ` · ${c.itemIndex + 1} of ${c.itemCount}` : ''}` : s.party.status === 'live' ? 'Intermission' : 'Lobby' }}</span>
          <span class="a-chip" style="background:#3A2A12;color:#FFB36B">{{ phaseLabel }}</span>
          <div class="flex-1" />
          <span class="text-[15px] font-bold text-a-muted">Timer {{ fmt(secsLeft * 1000) }}</span>
        </div>
        <div class="text-2xl font-bold leading-snug">{{ item?.title ?? (c ? c.segment.title : 'Nothing running. Press the big button.') }}</div>
        <div v-if="item?.answer && correctShown" class="text-base font-bold text-a-ok">Answer: {{ item.answer }}</div>
        <div v-if="r" class="flex items-center gap-4">
          <div class="flex-1 rounded-md overflow-hidden bg-a-raised" style="height:14px"><div class="h-full bg-a-ok" :style="{ width: `${pct}%` }" /></div>
          <span class="text-[22px] font-extrabold">{{ answered }} <span class="text-[15px] font-semibold text-a-muted">of {{ s.present }} present answered</span></span>
        </div>
        <button v-if="admin.primary" class="flex items-center justify-center gap-4 rounded-2xl font-extrabold text-[28px]" style="min-height:84px;border:0;background:#FF7A1A;color:#140A05" :style="admin.primary.disabled ? 'opacity:.45' : ''" :disabled="admin.primary.disabled" @click="admin.primary.run()">
          {{ admin.primary.label }}
          <span class="text-[15px] font-extrabold rounded-lg" style="background:#140A05;color:#FFB36B;padding:4px 12px">Space</span>
        </button>
        <div v-if="admin.primary?.reason" class="text-[15px] font-bold" style="color:#FFD27A">{{ admin.primary.reason }}</div>
        <div class="grid gap-2" style="grid-template-columns:repeat(6,minmax(0,1fr))">
          <button class="a-btn" style="padding:0 4px;white-space:nowrap" :disabled="!has.open" @click="act('open')">Open</button>
          <button class="a-btn" style="padding:0 4px;white-space:nowrap" :disabled="!has.lock" @click="act('lock')">Lock now · L</button>
          <button class="a-btn" style="padding:0 4px;white-space:nowrap" :disabled="!has.reveal" @click="act('reveal')">Reveal · R</button>
          <button class="a-btn" style="padding:0 4px;white-space:nowrap" :disabled="!has.next" @click="act('next')">Next</button>
          <button class="a-btn" style="padding:0 4px;white-space:nowrap" :disabled="!has.skip" @click="act('skip')">Skip</button>
          <button class="a-btn" style="padding:0 4px;white-space:nowrap" :disabled="!has.back" @click="act('back')">Back</button>
        </div>
      </section>

      <section aria-label="Up next" class="bg-a-panel rounded-2xl flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto" style="padding:18px 22px">
        <div class="flex items-center gap-3">
          <span class="a-eyebrow">{{ nextItem && r ? `Next · ${c.itemIndex + 2} of ${c.itemCount}` : item && !r ? `Ready · ${c.itemIndex + 1} of ${c.itemCount}` : 'Next' }}</span>
          <div class="flex-1" />
          <span class="text-[13px] font-extrabold rounded-md text-white" style="padding:4px 10px;background:#E0393E;letter-spacing:.08em">HOST ONLY</span>
        </div>
        <template v-for="row in [r ? nextItem : item]" :key="row?.title">
          <template v-if="row">
            <div class="text-xl font-bold leading-snug">{{ row.title }}</div>
            <div v-if="row.options" class="grid grid-cols-2 gap-2.5">
              <div v-for="(o, i) in row.options" :key="i" class="flex items-center gap-2.5 rounded-[10px] text-base" style="min-height:48px;padding:0 14px" :style="i === row.correctIndex ? 'background:#10281C;border:2px solid #6EE7A8;font-weight:700' : 'background:#1F232C;font-weight:600'">
                <b :style="{ color: i === row.correctIndex ? '#6EE7A8' : '#9AA3B2' }">{{ LETTERS[i] }}</b>{{ o }}
                <span v-if="i === row.correctIndex" class="ml-auto text-[13px] font-extrabold text-a-ok">{{ row.type === 'ttl' ? 'THE LIE' : 'CORRECT' }}</span>
              </div>
            </div>
            <div v-if="row.answer" class="rounded-[10px] text-base font-bold" style="background:#10281C;border:2px solid #6EE7A8;padding:10px 14px">{{ row.answer }} <span class="font-semibold text-a-muted">· accepts {{ row.accepted.join(', ') }}</span></div>
            <div class="text-sm font-semibold text-a-muted">{{ row.meta }}</div>
          </template>
          <div v-else class="text-lg font-bold text-a-muted">{{ s.nextSegment ? `Then: ${s.nextSegment.title}` : 'End of the running order' }}</div>
        </template>
      </section>
    </div>
  </div>
</template>
