<script setup lang="ts">
// One-shot global effects. The frame stays clear of particles while a question is open.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { EFFECTS } from '~/composables/effects'
import { usePartyStore } from '~/stores/party'

const props = defineProps<{ stage?: boolean }>()
const store = usePartyStore()
const el = ref<HTMLCanvasElement | null>(null)
const banner = ref<string | null>(null)
let raf = 0; let bannerT: ReturnType<typeof setTimeout>
interface P { x: number; y: number; vx: number; vy: number; r: number; c: string; rot: number; vr: number }
let parts: P[] = []; let kind = ''; let until = 0; let last = 0

const roundOpen = computed(() => { const r = store.snap?.round; return r && r.phase !== 'revealed' })
const cap = () => (props.stage ? 150 : 80)
const CONFETTI = ['#E0393E', '#F2C14E', '#2FA060', '#7FB7E8', '#FF8FC7', '#FF9A3D']

function spawn(k: string) {
  const n = cap(); parts = []
  for (let i = 0; i < n; i++) {
    if (k === 'snow') parts.push({ x: Math.random() * 1920, y: -Math.random() * 500, vx: Math.random() * 30 - 15, vy: 140 + Math.random() * 160, r: 2 + Math.random() * 4, c: '#fff', rot: 0, vr: 0 })
    else if (k === 'confetti') {
      const left = i % 2 === 0
      parts.push({ x: left ? 0 : 1920, y: Math.random() * 60, vx: (left ? 1 : -1) * (200 + Math.random() * 520), vy: 80 + Math.random() * 240, r: 5 + Math.random() * 5, c: CONFETTI[i % 6]!, rot: Math.random() * 6, vr: Math.random() * 8 - 4 })
    } else if (i < 24) parts.push({ x: -80 - Math.random() * 900, y: 60 + Math.random() * 760, vx: 340 + Math.random() * 200, vy: Math.random() * 30 - 15, r: 0.6 + Math.random() * 0.6, c: '#05040A', rot: 0, vr: 0 })
  }
}
function frame(t: number) {
  const ctx = el.value?.getContext('2d')
  if (!ctx) return
  const dt = Math.min(0.05, (t - last) / 1000); last = t
  ctx.clearRect(0, 0, 1920, 1080)
  for (const p of parts) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt
    if (kind === 'confetti') p.vy += 180 * dt
    ctx.save(); ctx.translate(p.x, p.y)
    ctx.fillStyle = p.c
    if (kind === 'snow') { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.fill() }
    else if (kind === 'confetti') { ctx.rotate(p.rot); ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r) }
    else {
      const flap = Math.sin(t / 70 + p.x) * 12
      ctx.scale(p.r, p.r); ctx.beginPath()
      ctx.moveTo(0, 0); ctx.quadraticCurveTo(-24, -14 - flap, -50, -6 - flap); ctx.quadraticCurveTo(-30, 6, 0, 10)
      ctx.quadraticCurveTo(30, 6, 50, -6 - flap); ctx.quadraticCurveTo(24, -14 - flap, 0, 0); ctx.fill()
    }
    ctx.restore()
  }
  if (roundOpen.value) ctx.clearRect(440, 96, 1040, 720)
  if (t < until) raf = requestAnimationFrame(frame)
  else ctx.clearRect(0, 0, 1920, 1080)
}

watch(() => store.effect, (e) => {
  if (!e) return
  const def = EFFECTS[e.key]
  if (!def) return
  if (def.layer === 'banner') {
    banner.value = e.text ?? ''
    clearTimeout(bannerT); bannerT = setTimeout(() => { banner.value = null }, def.durationMs)
    return
  }
  if (def.layer !== 'canvas' || store.calm) return
  cancelAnimationFrame(raf)
  kind = def.particles!; spawn(kind)
  last = performance.now(); until = last + def.durationMs
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <canvas ref="el" class="abs0 no-pe" width="1920" height="1080" aria-hidden="true" />
  <div v-if="banner !== null" role="status" class="fade-in card no-pe" style="position:absolute;left:560px;top:16px;width:800px;box-sizing:border-box;padding:10px 20px;text-align:center;font-size:26px;font-weight:900;z-index:5">{{ banner }}</div>
</template>
