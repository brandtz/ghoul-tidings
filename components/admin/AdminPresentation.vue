<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAdminStore } from '~/stores/admin'

const admin = useAdminStore()
const s = computed(() => admin.a)
const live = computed(() => s.value.party.state.presentation)
const deck = computed(() => s.value.presentations.find((d: any) => d.id === live.value?.id))
const busy = ref(false)
async function upload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  busy.value = true
  try {
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
    const f = new FormData()
    f.append('file', file); f.append('pageCount', String(doc.numPages)); f.append('title', file.name.replace(/\.pdf$/i, ''))
    await admin.post('/api/admin/upload/deck', f)
  } catch { admin.error = 'That PDF could not be read' } finally { busy.value = false }
}
const start = (id: string) => admin.post('/api/admin/presentation/start', { id })
const go = (d: number) => admin.post('/api/admin/presentation/goto', { page: live.value.page + d })
const end = () => admin.post('/api/admin/presentation/end')
</script>

<template>
  <div class="flex items-center gap-4">
    <h1 class="m-0 text-[28px] font-extrabold">Presentation</h1>
    <span class="text-[15px] font-bold text-a-muted">PDF decks up to 25 MB. In PowerPoint, use Save as PDF.</span>
    <div class="flex-1" />
    <label class="a-btn primary flex items-center cursor-pointer">{{ busy ? 'Uploading…' : 'Upload PDF' }}<input type="file" accept="application/pdf" class="sr" @change="upload"></label>
  </div>
  <template v-if="live">
    <div class="grid gap-4 flex-1 min-h-0" style="grid-template-columns:minmax(0,1fr) 340px">
      <section class="bg-a-panel rounded-2xl" style="padding:14px"><PdfSlide :deck-id="live.id" :page="live.page" /></section>
      <div class="flex flex-col gap-3">
        <section class="bg-a-panel rounded-2xl flex flex-col gap-2" style="padding:12px">
          <div class="a-eyebrow">Next slide</div>
          <div style="height:170px"><PdfSlide v-if="live.page < deck.pageCount" :deck-id="live.id" :page="live.page + 1" /><div v-else class="text-a-muted font-bold">Last slide</div></div>
        </section>
        <div class="text-[40px] font-extrabold text-center">{{ live.page }} / {{ deck.pageCount }}</div>
        <div class="grid grid-cols-2 gap-2">
          <button class="a-btn" style="min-height:60px" :disabled="live.page <= 1" @click="go(-1)">← Previous</button>
          <button class="a-btn primary" style="min-height:60px" :disabled="live.page >= deck.pageCount" @click="go(1)">Next →</button>
        </div>
        <button class="a-btn danger" @click="end">End presentation</button>
      </div>
    </div>
  </template>
  <section v-else class="bg-a-panel rounded-2xl flex flex-col gap-2" style="padding:14px 18px">
    <div class="a-eyebrow">Decks</div>
    <div v-if="!s.presentations.length" class="text-a-muted font-bold">No decks yet.</div>
    <div v-for="d in s.presentations" :key="d.id" class="flex items-center gap-3 bg-a-raised rounded-[10px]" style="min-height:56px;padding:0 14px">
      <span class="font-bold flex-1">{{ d.title }}</span><span class="text-sm font-semibold text-a-muted">{{ d.pageCount }} slides</span>
      <button class="a-btn primary" @click="start(d.id)">Start on every screen</button>
    </div>
  </section>
</template>
