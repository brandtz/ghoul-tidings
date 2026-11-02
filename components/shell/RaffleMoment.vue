<script setup lang="ts">
// The raffle beat, identical on every client: lightning, a short name reel, the winner card.
// The winner's own screen adds the Claim button and stays up until the claim window ends.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useNow } from '~/composables/useCountdown'
import { usePartyStore } from '~/stores/party'

const props = defineProps<{ personal?: boolean }>()
const store = usePartyStore()
const now = useNow(250)
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
  stage.value = 'reel'
  let i = 0
  const names = store.calm ? [m.winner] : (m.reel.length ? m.reel : [m.winner])
  reelName.value = names[0]!
  reelTimer = setInterval(() => { reelName.value = names[++i % names.length]! }, 110)
  timers.push(setTimeout(() => { if (reelTimer) clearInterval(reelTimer); stage.value = 'winner' }, store.calm ? 300 : 2200))
  timers.push(setTimeout(() => { stage.value = 'off'; store.moment = null }, 8000))
})
onBeforeUnmount(clear)

const offer = computed(() => (props.personal ? store.me?.offer ?? null : null))
const left = computed(() => (offer.value ? Math.max(0, Math.ceil((offer.value.deadline - now.value) / 1000)) : 0))
// After the 8 second beat the claim shrinks to a rail card, so it never blocks a question or slide.
const compactClaim = computed(() => !!offer.value && left.value > 0 && stage.value === 'off')
const visible = computed(() => stage.value !== 'off')
const winner = computed(() => store.moment)
const tierLabel = (t?: string) => (t === 'grand' ? 'Grand' : t === 'special' ? 'Special' : 'Swag')
const youWon = computed(() => !!offer.value && stage.value === 'winner')
const claim = () => store.act(`/api/raffle/${offer.value!.drawId}/claim`)
const prize = computed(() => offer.value?.prizeName ?? winner.value?.prize ?? '')
const tier = computed(() => tierLabel(offer.value?.tier ?? winner.value?.tier))
</script>

<template>
  <div v-if="visible" class="dim" />
  <section v-if="compactClaim" class="card fade-in claim-card" role="status" style="position:absolute;left:1528px;top:590px;width:260px;box-sizing:border-box;padding:12px 14px;text-align:center;display:flex;flex-direction:column;gap:8px">
    <div class="cinzel" style="font-size:22px;font-weight:900;color:var(--border2)">You won!</div>
    <div style="font-size:17px;font-weight:800;line-height:1.25">{{ prize }}</div>
    <button class="btn-gold" @click="claim">Claim it · {{ left }}s</button>
  </section>
  <slot name="lightning" />
  <div
    v-if="visible" role="status" aria-live="polite" class="fade-in ov-card"
    style="position:absolute;left:560px;top:262px;width:800px;height:380px;box-sizing:border-box;border-radius:24px;border:8px solid var(--border);background:radial-gradient(ellipse at 50% 20%, #1F1636 0%, #0B0814 80%);box-shadow:0 0 60px var(--glow), 0 0 0 4px #000000AA;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px"
  >
    <div style="position:absolute;top:-24px;left:40px;right:40px;height:30px;border-radius:16px 16px 6px 6px;background:#F4F0FA;opacity:.92" />
    <template v-if="stage === 'reel'">
      <div class="cinzel" style="font-size:48px;font-weight:900;color:var(--border2)">The cauldron stirs…</div>
      <div style="font-size:56px;font-weight:900">{{ reelName }}</div>
    </template>
    <template v-else-if="youWon">
      <div class="cinzel" style="font-size:56px;font-weight:900;color:var(--border2);line-height:1">YOU WON!</div>
      <div style="display:flex;align-items:center;gap:14px;font-size:28px;font-weight:800">
        <span style="background:#2B2412;color:#FFD27A;padding:4px 16px;border-radius:999px;font-size:20px">{{ tier }}</span>{{ prize }}
      </div>
      <button class="btn-gold" style="min-height:64px;font-size:26px;padding:0 44px" @click="claim">Claim it · {{ left }}s</button>
      <div style="font-size:19px;font-weight:700;color:var(--muted)">The host will follow up about delivery.</div>
    </template>
    <template v-else>
      <div class="cinzel" style="font-size:68px;font-weight:900;color:var(--border2);letter-spacing:.04em;line-height:1">RAFFLE WINNER!</div>
      <div style="display:flex;align-items:center;gap:22px">
        <Avatar :avatar-key="winner?.avatarKey" :size="96" ring="var(--border2)" />
        <span style="font-size:56px;font-weight:900">{{ winner?.winner }}</span>
      </div>
      <div style="display:flex;align-items:center;gap:14px;font-size:26px;font-weight:800">
        <span style="background:#2B2412;color:#FFD27A;padding:4px 16px;border-radius:999px;font-size:20px">{{ tier }}</span>{{ prize }}
      </div>
      <div style="font-size:19px;font-weight:700;color:var(--muted)">The host will follow up about delivery.</div>
    </template>
  </div>
</template>
