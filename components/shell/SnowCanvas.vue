<script setup lang="ts">
// Ambient snow on one canvas. Capped at 80 for players and 150 on stage, about 30 fps,
// still under Calm mode, and rAF pauses by itself in a hidden tab.
import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePartyStore } from '~/stores/party'

const stage = inject('gtStage', false)
const still = inject('gtStill', false)
const store = usePartyStore()
const el = ref<HTMLCanvasElement | null>(null)
let raf = 0; let last = 0
const COUNT = stage ? 150 : 80
let s = 7
const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
const flakes = Array.from({ length: COUNT }, () => ({ x: rnd() * 1920, y: rnd() * 1080, r: 1.5 + rnd() * 3, v: 18 + rnd() * 34, d: rnd() * 6 }))

function draw(dt: number) {
  const ctx = el.value?.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, 1920, 1080)
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  for (const f of flakes) {
    f.y += f.v * dt
    f.x += Math.sin(f.y / 70 + f.d) * 8 * dt
    if (f.y > 1090) { f.y = -10; f.x = rnd() * 1920 }
    ctx.moveTo(f.x + f.r, f.y)
    ctx.arc(f.x, f.y, f.r, 0, 6.283)
  }
  ctx.fill()
}
function loop(t: number) {
  raf = requestAnimationFrame(loop)
  if (t - last < 33) return
  const dt = Math.min(0.1, (t - last) / 1000); last = t
  draw(dt)
}
const run = () => {
  cancelAnimationFrame(raf)
  draw(0)
  if (!store.calm && !still) { last = performance.now(); raf = requestAnimationFrame(loop) }
}
onMounted(run)
watch(() => store.calm, run)
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <canvas ref="el" class="abs0 no-pe" width="1920" height="1080" aria-hidden="true" style="opacity:var(--o-flakes)" />
</template>
