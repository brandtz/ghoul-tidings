<script setup lang="ts">
// One bingo ball, coloured by its column letter.
import { computed } from 'vue'
import { letterOf } from '~~/shared/balls'

const props = defineProps<{ n: number; size?: number; pop?: boolean }>()
const COLORS: Record<string, string> = { B: '#3D8BFF', I: '#FF4D5E', N: '#B9B6D6', G: '#2FC46F', O: '#FFB020' }
const size = computed(() => props.size ?? 64)
const color = computed(() => COLORS[letterOf(props.n)]!)
</script>

<template>
  <div
    class="bingo-ball" :class="{ 'ball-pop': pop }"
    :style="{ width: `${size}px`, height: `${size}px`, background: `radial-gradient(circle at 35% 30%, #FFFFFF66, transparent 40%), ${color}` }"
    :aria-label="`${letterOf(n)} ${n}`"
  >
    <div class="bingo-ball-face" :style="{ width: `${size * 0.66}px`, height: `${size * 0.66}px` }">
      <span :style="{ fontSize: `${size * 0.17}px` }">{{ letterOf(n) }}</span>
      <b :style="{ fontSize: `${size * 0.3}px` }">{{ n }}</b>
    </div>
  </div>
</template>

<style scoped>
.bingo-ball { flex: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 -6px 14px #00000055, 0 6px 18px #00000088; }
.bingo-ball-face { border-radius: 50%; background: #FFFDF7; color: #140A05; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1; }
.bingo-ball-face span { font-weight: 800; opacity: .7; }
.bingo-ball-face b { font-weight: 900; }
.ball-pop { animation: ballPop .6s cubic-bezier(.2, 1.6, .4, 1); }
@keyframes ballPop { from { transform: scale(.2) rotate(-200deg); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .ball-pop { animation: none; } }
</style>
