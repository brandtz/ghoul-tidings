<script setup lang="ts">
// Fixed 1920 by 1080 stage scaled uniformly to the viewport, so positions never reflow.
// Under 1024 px wide (players only) it falls back to a stacked column.
import { computed, onBeforeUnmount, onMounted, provide, ref, toRef } from 'vue'
import { useThemeVars } from '~/composables/useTheme'
import { usePartyStore } from '~/stores/party'

const props = defineProps<{ progress: number; stage?: boolean; thumb?: boolean; fixedWidth?: number }>()
const store = usePartyStore()
const root = ref<HTMLElement | null>(null)
// Effects read the shown theme position, so a banner dresses for the half the party is in.
provide('gtProgress', useThemeVars(root, toRef(props, 'progress')))
provide('gtStage', !!props.stage)
provide('gtStill', !!props.thumb)

const vw = ref(1920); const vh = ref(1080)
// An on-screen keyboard resizes the window. Re-laying out then would rebuild the focused
// field and close the keyboard again, so hold the layout until typing ends.
const typing = () => !!document.activeElement?.matches('input:not([type=radio]):not([type=checkbox]),textarea,select,[contenteditable]')
const measure = () => {
  if (typing()) return
  // clientWidth is the layout width, which pinch zoom and focus zoom leave alone.
  vw.value = document.documentElement.clientWidth || window.innerWidth; vh.value = window.innerHeight
}
const settle = () => setTimeout(measure, 300)
onMounted(() => { measure(); window.addEventListener('resize', measure); window.addEventListener('focusout', settle) })
onBeforeUnmount(() => { window.removeEventListener('resize', measure); window.removeEventListener('focusout', settle) })

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
    <!-- Stacked, the clip keeps the 1920 px backdrop from widening the phone page. -->
    <div :class="stacked ? 'gt-clip' : 'gt-pass'">
      <div class="gt-stage" :class="{ 'gt-backdrop': stacked }" :style="stageStyle">
        <SceneLayer />
        <ShellContent v-if="!stacked" :stage="stage" :thumb="thumb"><slot /></ShellContent>
      </div>
    </div>
    <div v-if="stacked" class="stacked-col"><ShellContent stacked><slot /></ShellContent></div>
  </div>
</template>
