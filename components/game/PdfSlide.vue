<script setup lang="ts">
// Renders one PDF page to a canvas with pdf.js, loaded only when a deck is live.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{ deckId: string; page: number }>()
const canvas = ref<HTMLCanvasElement | null>(null)
const loading = ref(true)
const failed = ref(false)
let doc: any = null
let task: any = null

async function load() {
  loading.value = true; failed.value = false
  try {
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
    doc = await pdfjs.getDocument({ url: `/api/presentations/${props.deckId}/pdf`, withCredentials: true }).promise
    await render()
  } catch { failed.value = true; loading.value = false }
}
async function render() {
  if (!doc || !canvas.value) return
  loading.value = true
  try {
    const page = await doc.getPage(Math.min(props.page, doc.numPages))
    const box = canvas.value.parentElement!.getBoundingClientRect()
    const base = page.getViewport({ scale: 1 })
    const vp = page.getViewport({ scale: Math.max(box.width / base.width, 1.4) * 1.5 })
    const c = canvas.value
    c.width = vp.width; c.height = vp.height
    task?.cancel?.()
    task = page.render({ canvas: c, canvasContext: c.getContext('2d'), viewport: vp })
    await task.promise
  } catch (e: any) { if (e?.name !== 'RenderingCancelledException') failed.value = true }
  loading.value = false
}
onMounted(load)
watch(() => props.page, render)
watch(() => props.deckId, load)
onBeforeUnmount(() => { task?.cancel?.(); doc?.destroy?.() })
</script>

<template>
  <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative">
    <canvas ref="canvas" style="max-width:100%;max-height:100%;border-radius:8px" />
    <div v-if="failed" style="position:absolute;font-size:22px;font-weight:800">This slide could not load.</div>
    <div v-else-if="loading" style="position:absolute;font-size:18px;font-weight:700;opacity:.7">Loading slide…</div>
  </div>
</template>
