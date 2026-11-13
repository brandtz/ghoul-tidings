<script setup lang="ts">
// The raffle beat, identical on every client: lightning, a short name reel, the winner card.
// Winners keep their prize automatically; the winner's own screen just says so.
// Finale awards use the same beat with the award title and no reel.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { usePartyStore } from '~/stores/party'

const props = defineProps<{ personal?: boolean }>()
const store = usePartyStore()
const stage = ref<'off' | 'reel' | 'winner'>('off')
const reelName = ref('')
let timers: ReturnType<typeof setTimeout>[] = []
let reelTimer: ReturnType<typeof setInterval> | null = null

const clear = () => { timers.forEach(clearTimeout); timers = []; if (reelTimer) clearInterval(reelTimer); reelTimer = null }
watch(() => store.momentKey, () => {
  const m = store.moment
  if (!m) return
  clear()
  if (m.isMidnight) store.fireEffect('snow')
  if (m.award) store.fireEffect('confetti')
  const names = store.calm || m.award ? [m.winner] : (m.reel.length ? m.reel : [m.winner])
  const reelMs = store.calm ? 300 : m.award ? 1600 : 2200
  stage.value = 'reel'
  let i = 0
  reelName.value = m.award ? '' : names[0]!
  if (!m.award) reelTimer = setInterval(() => { reelName.value = names[++i % names.length]! }, 110)
  timers.push(setTimeout(() => { if (reelTimer) clearInterval(reelTimer); stage.value = 'winner' }, reelMs))
  timers.push(setTimeout(() => { stage.value = 'off'; store.moment = null }, 8000))
})
onBeforeUnmount(clear)

const visible = computed(() => stage.value !== 'off')
const winner = computed(() => store.moment)
const tierLabel = (t?: string) => (t === 'grand' ? 'Grand' : t === 'special' ? 'Special' : 'Raffle')
const youWon = computed(() => !!props.personal && !!winner.value && winner.value.playerId === store.me?.id && stage.value === 'winner')
const heading = computed(() => (winner.value?.award ? `${winner.value.award.toUpperCase()}!` : 'RAFFLE WINNER!'))
</script>

<template>
  <div v-if="visible" class="dim" />
  <slot name="lightning" />
  <div
    v-if="visible" role="status" aria-live="polite" class="fade-in ov-card"
    style="position:absolute;left:560px;top:262px;width:800px;height:380px;box-sizing:border-box;border-radius:24px;border:8px solid var(--border);background:radial-gradient(ellipse at 50% 20%, #1F1636 0%, #0B0814 80%);box-shadow:0 0 60px var(--glow), 0 0 0 4px #000000AA;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px"
  >
    <div style="position:absolute;top:-24px;left:40px;right:40px;height:30px;border-radius:16px 16px 6px 6px;background:#F4F0FA;opacity:.92" />
    <template v-if="stage === 'reel'">
      <template v-if="winner?.award">
        <div class="cinzel" style="font-size:40px;font-weight:900;color:var(--muted)">And the award for</div>
        <div class="cinzel" style="font-size:60px;font-weight:900;color:var(--border2)">{{ winner.award }}</div>
      </template>
      <template v-else>
        <div class="cinzel" style="font-size:48px;font-weight:900;color:var(--border2)">The cauldron stirs…</div>
        <div style="font-size:56px;font-weight:900">{{ reelName }}</div>
      </template>
    </template>
    <template v-else-if="youWon">
      <div class="cinzel" style="font-size:56px;font-weight:900;color:var(--border2);line-height:1">YOU WON!</div>
      <div style="display:flex;align-items:center;gap:14px;font-size:28px;font-weight:800">
        <span style="background:#2B2412;color:#FFD27A;padding:4px 16px;border-radius:999px;font-size:20px">{{ winner?.award ?? tierLabel(winner?.tier) }}</span>{{ winner?.prize }}
      </div>
      <div style="font-size:22px;font-weight:800">It's yours. Nothing to claim.</div>
      <div style="font-size:19px;font-weight:700;color:var(--muted)">The host will email your gift card after the party.</div>
    </template>
    <template v-else>
      <div class="cinzel" style="font-size:64px;font-weight:900;color:var(--border2);letter-spacing:.04em;line-height:1">{{ heading }}</div>
      <div style="display:flex;align-items:center;gap:22px">
        <Avatar :avatar-key="winner?.avatarKey" :size="96" ring="var(--border2)" />
        <span style="font-size:56px;font-weight:900">{{ winner?.winner }}</span>
      </div>
      <div style="display:flex;align-items:center;gap:14px;font-size:26px;font-weight:800">
        <span style="background:#2B2412;color:#FFD27A;padding:4px 16px;border-radius:999px;font-size:20px">{{ winner?.detail ?? tierLabel(winner?.tier) }}</span>{{ winner?.prize }}
      </div>
      <div style="font-size:19px;font-weight:700;color:var(--muted)">The host will email the gift card after the party.</div>
    </template>
  </div>
</template>
