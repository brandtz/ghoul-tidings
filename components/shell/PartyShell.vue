<script setup lang="ts">
// Fixed 1920 by 1080 stage scaled uniformly to the viewport, so positions never reflow.
// Under 1024 px wide (players only) it falls back to a stacked column.
import { computed, onBeforeUnmount, onMounted, provide, ref, toRef } from 'vue'
import { useThemeVars } from '~/composables/useTheme'
import { usePartyStore } from '~/stores/party'

const props = defineProps<{ progress: number; stage?: boolean; thumb?: boolean; fixedWidth?: number }>()
const store = usePartyStore()
const root = ref<HTMLElement | null>(null)
useThemeVars(root, toRef(props, 'progress'))
provide('gtStage', !!props.stage)
provide('gtStill', !!props.thumb)

const vw = ref(1920); const vh = ref(1080)
const measure = () => { vw.value = window.innerWidth; vh.value = window.innerHeight }
onMounted(() => { measure(); window.addEventListener('resize', measure) })
onBeforeUnmount(() => window.removeEventListener('resize', measure))

const stacked = computed(() => !props.stage && !props.thumb && vw.value < 1024)
const stageStyle = computed(() => {
  if (props.fixedWidth) return { transform: `scale(${props.fixedWidth / 1920})` }
  if (stacked.value) { const s = Math.max(vw.value / 1920, vh.value / 1080); return { transform: `scale(${s})` } }
  const s = Math.min(vw.value / 1920, vh.value / 1080)
  return { transform: `translate(${(vw.value - 1920 * s) / 2}px, ${(vh.value - 1080 * s) / 2}px) scale(${s})` }
})
</script>

<template>
  <div
    ref="root" class="gt-root"
    :class="{ calm: store.calm || thumb, stacked }"
    :style="fixedWidth ? { position: 'absolute', inset: 0 } : undefined"
  >
    <div class="gt-stage" :class="{ 'gt-backdrop': stacked }" :style="stageStyle">
      <SceneLayer />
      <ShellContent v-if="!stacked" :stage="stage" :thumb="thumb"><slot /></ShellContent>
    </div>
    <div v-if="stacked" class="stacked-col"><ShellContent stacked><slot /></ShellContent></div>
  </div>
</template>
