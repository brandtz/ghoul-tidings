<script setup lang="ts">
// Host controls for Ghoul Bingo, the 75-ball game. Claims are checked by the server
// against the drawn balls, so there is nothing to review: winners appear here.
import { computed, ref } from 'vue'
import { ballLabel, defaultPattern, PATTERN_LABEL, type BallPattern } from '~~/shared/balls'
import { useAdminStore } from '~/stores/admin'

const admin = useAdminStore()
const g = computed(() => admin.a.balls)
const last = computed(() => g.value.drawn.at(-1) ?? null)
const post = (action: string, body: any = {}) => admin.post(`/api/admin/balls/${action}`, body)
const pick = ref<BallPattern | ''>('')
const nextPattern = computed<BallPattern>(() => pick.value || defaultPattern(g.value.game + 1))
const start = () => post('new', { pattern: nextPattern.value })
const speed = ref<number>(g.value.everyS ?? 8)
const toggleAuto = () => post('auto', { on: !g.value.auto, everyS: speed.value })
const undo = async () => { if (await admin.confirm(`Take back ${ballLabel(last.value!)}? It goes back in the machine.`, 'Take back')) post('undo') }
const finish = async () => {
  if (g.value.status === 'playing' && !(await admin.confirm(`End game ${g.value.game} with no winner?`, 'End game'))) return
  post('finish')
}
const endSeg = async () => {
  if (g.value.status === 'playing' && !(await admin.confirm('A game is still running. End Ghoul Bingo anyway?', 'End segment'))) return
  admin.post('/api/admin/segment/end', {}, true)
}
</script>

<template>
  <section aria-label="Ghoul Bingo" class="bg-a-panel rounded-2xl flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto" style="padding:16px 20px" :style="g.status === 'won' ? 'border:2px solid #6EE7A8' : ''">
    <div class="flex items-center gap-3 flex-wrap">
      <span class="a-eyebrow">Ghoul Bingo</span>
      <span v-if="g.game" class="a-chip">Game {{ g.game }} · {{ PATTERN_LABEL[g.pattern as BallPattern] }}</span>
      <span class="a-chip" :style="g.status === 'playing' ? 'background:#10281C;color:#6EE7A8' : g.status === 'won' ? 'background:#3A2A12;color:#FFB36B' : 'background:#1F232C;color:#9AA3B2'">{{ g.status === 'playing' ? 'Playing' : g.status === 'won' ? 'Bingo!' : 'Between games' }}</span>
      <span class="text-[15px] font-bold text-a-muted">{{ g.drawn.length }} of 75 drawn</span>
      <span v-if="g.falseCalls" class="text-sm font-semibold text-a-muted">{{ g.falseCalls }} false {{ g.falseCalls === 1 ? 'call' : 'calls' }}</span>
      <div class="flex-1" />
      <button class="a-btn" @click="endSeg">End segment</button>
    </div>

    <!-- Controls -->
    <div v-if="g.status === 'playing'" class="flex items-center gap-3 flex-wrap">
      <button class="a-btn primary" :disabled="g.drawn.length >= 75" @click="post('draw')">Draw a ball</button>
      <button class="a-btn" :class="{ ok: g.auto }" @click="toggleAuto">{{ g.auto ? 'Stop auto-draw' : 'Start auto-draw' }}</button>
      <div class="flex items-center gap-1 text-sm font-bold text-a-muted">every
        <button
          v-for="s in [5, 8, 12]" :key="s" class="a-btn" style="min-height:36px;padding:0 10px"
          :style="speed === s ? 'background:#3A2A12;color:#FFB36B;border-color:#FF7A1A' : ''"
          :aria-pressed="speed === s" @click="speed = s; g.auto && post('auto', { on: true, everyS: s })"
        >{{ s }} s</button>
      </div>
      <button class="a-btn" :disabled="!last" @click="undo">Take back last ball</button>
      <div class="flex-1" />
      <button class="a-btn" @click="finish">End game, no winner</button>
    </div>
    <div v-else-if="g.status === 'won'" class="flex items-center gap-3 flex-wrap rounded-xl" style="background:#10281C;padding:12px 14px">
      <span class="text-lg font-extrabold" style="color:#6EE7A8">BINGO! {{ g.winners.map((w: any) => w.name).join(', ') }}</span>
      <span class="text-sm font-semibold text-a-muted">on {{ ballLabel(g.winnerBalls[0]) }} · +{{ admin.a.party.settings.points.ballsWin.toLocaleString() }} each · checked automatically. Same-ball claims stay open for 15 seconds.</span>
      <div class="flex-1" />
      <button class="a-btn primary" @click="post('finish')">Finish game {{ g.game }}</button>
    </div>
    <div v-else class="flex items-center gap-3 flex-wrap">
      <label class="flex items-center gap-2 text-sm font-bold text-a-muted">Next game
        <select v-model="pick" class="a-input" style="min-height:40px;padding:0 8px">
          <option value="">{{ PATTERN_LABEL[defaultPattern(g.game + 1)] }} (default)</option>
          <option v-for="(label, p) in PATTERN_LABEL" :key="p" :value="p">{{ label }}</option>
        </select>
      </label>
      <button class="a-btn primary" @click="start">Start game {{ g.game + 1 }}: {{ PATTERN_LABEL[nextPattern] }}</button>
      <span class="text-sm font-semibold text-a-muted">Everyone gets a fresh card.</span>
    </div>

    <!-- Drawn balls, newest first. The full 75-number board is on the stage. -->
    <div v-if="g.game" class="flex flex-col gap-2">
      <div class="flex items-baseline gap-3">
        <span class="text-[13px] font-bold text-a-muted">Last ball</span>
        <span class="text-4xl font-black" :class="last ? 'text-a-accent' : 'text-a-muted'">{{ last ? ballLabel(last) : '—' }}</span>
      </div>
      <div v-if="g.drawn.length > 1" class="flex flex-wrap gap-1">
        <span v-for="n in [...g.drawn].reverse().slice(1)" :key="n" class="rounded-md text-[13px] font-bold" style="background:#3A2A12;color:#FFB36B;padding:3px 7px">{{ ballLabel(n) }}</span>
      </div>
    </div>

    <div v-if="g.history.length" class="flex flex-col gap-1">
      <div class="text-[13px] font-bold text-a-muted">Finished games</div>
      <div v-for="h in [...g.history].reverse()" :key="h.game" class="text-[15px] font-bold">
        Game {{ h.game }}: {{ h.winners.join(', ') || 'no winner' }}
        <span class="text-sm font-semibold text-a-muted">· {{ PATTERN_LABEL[h.pattern as BallPattern] }}, {{ h.balls }} balls</span>
      </div>
    </div>
    <div class="text-[13px] font-semibold text-a-muted">Space draws the next ball. Players dab their own cards; Bingo! is checked against the drawn balls on the spot and pays {{ admin.a.party.settings.points.ballsWin.toLocaleString() }}. Auto-draw pauses while a raffle winner is on screen. Points can be reversed from the Live monitor.</div>
  </section>
</template>
