<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNow } from '~/composables/useCountdown'
import { useAdminStore } from '~/stores/admin'

const admin = useAdminStore()
const s = computed(() => admin.a)
const tab = ref<'trivia' | 'guess' | 'ttl' | 'codes'>('ttl')
const now = useNow(1000)
const closesIn = computed(() => { const m = s.value.party.settings.ttlClosesAt - now.value; if (m <= 0) return 'closed'; const t = Math.floor(m / 1000); return t > 5400 ? `${Math.round(t / 3600)} h` : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` })
const counts = computed(() => { const c: Record<string, number> = { approved: 0, pending: 0, hidden: 0 }; s.value.ttl.forEach((t: any) => { c[t.status]!++ }); return c })
const chips: Record<string, [string, string]> = { approved: ['#10281C', '#6EE7A8'], pending: ['#3A2A12', '#FFB36B'], hidden: ['#1F232C', '#9AA3B2'] }

// Two Truths
const editing = ref<string | null>(null)
const draft = ref<{ statements: string[]; lieIndex: number }>({ statements: [], lieIndex: 0 })
const startEdit = (t: any) => { editing.value = t.id; draft.value = { statements: [...t.statements], lieIndex: t.lieIndex } }
const saveEdit = async (t: any) => { await admin.content('ttl', 'edit', { id: t.id, ...draft.value }); editing.value = null }
const moveTtl = (i: number, d: number) => {
  const ids = s.value.ttl.map((t: any) => t.id); const j = i + d
  if (j < 0 || j >= ids.length) return
  [ids[i], ids[j]] = [ids[j], ids[i]]
  admin.content('ttl', 'reorder', { ids })
}

// Trivia
const triviaSegs = computed(() => s.value.segments.filter((g: any) => g.type === 'trivia'))
const seg = ref('')
const segId = computed(() => seg.value || triviaSegs.value[0]?.id)
const qs = computed(() => s.value.trivia.filter((q: any) => q.segmentId === segId.value).sort((a: any, b: any) => a.sortOrder - b.sortOrder))
const blank = () => ({ prompt: '', options: ['', '', '', ''], correctIndex: 0, category: '', timeLimitS: 10 })
const q = ref<any>(null)
const saveQ = async () => { if (await admin.content('trivia', 'save', { ...q.value, segmentId: segId.value })) q.value = null }
const delQ = async (x: any) => { if (await admin.confirm('Delete this question?', 'Delete')) admin.content('trivia', 'delete', { id: x.id }) }
const moveQ = (i: number, d: number) => {
  const ids = qs.value.map((x: any) => x.id); const j = i + d
  if (j < 0 || j >= ids.length) return
  [ids[i], ids[j]] = [ids[j], ids[i]]
  admin.content('trivia', 'reorder', { ids })
}
const csv = ref(''); const showCsv = ref(false)
const importCsv = async () => {
  const r = await admin.content('trivia', 'import', { segmentId: segId.value, csv: csv.value })
  if (r) { admin.flash(`Imported ${r.data.imported} questions`); csv.value = ''; showCsv.value = false }
}

// Guess the Thing
const guessSeg = computed(() => s.value.segments.find((g: any) => g.type === 'guess'))
const items = computed(() => s.value.guess.filter((g: any) => g.segmentId === guessSeg.value?.id).sort((a: any, b: any) => a.sortOrder - b.sortOrder))
const up = ref({ file: null as File | null, url: '', answer: '', accepted: '', x: 0.5, y: 0.5 })
const pickFile = (e: Event) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) { up.value.file = f; up.value.url = URL.createObjectURL(f) } }
const pickFocal = (e: MouseEvent) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); up.value.x = (e.clientX - r.left) / r.width; up.value.y = (e.clientY - r.top) / r.height }
async function upload() {
  const f = new FormData()
  f.append('file', up.value.file!); f.append('answerDisplay', up.value.answer); f.append('accepted', up.value.accepted)
  f.append('focalX', String(up.value.x)); f.append('focalY', String(up.value.y)); f.append('segmentId', guessSeg.value.id)
  if (await admin.post('/api/admin/upload/guess', f)) up.value = { file: null, url: '', answer: '', accepted: '', x: 0.5, y: 0.5 }
}
const saveGuess = (g: any, patch: any) => admin.content('guess', 'save', { id: g.id, answerDisplay: g.answerDisplay, acceptedAnswers: g.acceptedAnswers, stepS: g.stepS, ...patch })
const delGuess = async (g: any) => { if (await admin.confirm(`Delete ${g.answerDisplay}?`, 'Delete')) admin.content('guess', 'delete', { id: g.id }) }
</script>

<template>
  <div class="flex items-center gap-4">
    <h1 class="m-0 text-[28px] font-extrabold">Content</h1>
    <div role="tablist" class="flex gap-1.5 bg-a-panel rounded-xl" style="padding:4px">
      <button v-for="t in [['trivia', 'Trivia'], ['guess', 'Guess the Thing'], ['ttl', 'Two Truths'], ['codes', 'Codes']]" :key="t[0]" role="tab" :aria-selected="tab === t[0]" class="border-0 text-base" style="min-height:44px;padding:0 20px;border-radius:9px" :style="tab === t[0] ? 'background:#2A2F3B;color:#fff;font-weight:800' : 'background:transparent;color:#C4CAD6;font-weight:700'" @click="tab = t[0] as any">{{ t[1] }}</button>
    </div>
    <div class="flex-1" />
    <template v-if="tab === 'ttl'">
      <span class="text-base font-bold text-a-soft">Window closes in <b style="color:#FFB36B">{{ closesIn }}</b></span>
      <span class="text-base font-extrabold rounded-full" style="background:#10281C;color:#6EE7A8;padding:8px 16px">{{ counts.approved }} approved · {{ counts.pending }} pending · {{ counts.hidden }} hidden</span>
    </template>
  </div>

  <template v-if="tab === 'ttl'">
    <div class="flex items-center gap-3 bg-a-panel rounded-xl text-[15px] font-semibold text-a-soft" style="padding:10px 16px">
      <span class="font-extrabold text-a-accent whitespace-nowrap">Review tone:</span> keep it fun and work-appropriate, and skip anything about layoffs, pay or personal health. Approving pays +750 to the submitter; hiding pays nothing.
    </div>
    <div v-if="!s.ttl.length" class="text-a-muted font-bold">No submissions yet. They show up here as players send them.</div>
    <div class="grid grid-cols-2 gap-3.5 content-start">
      <article v-for="(t, i) in s.ttl" :key="t.id" class="bg-a-panel rounded-[14px] flex flex-col gap-2.5 box-border" style="padding:14px 16px" :style="{ border: `2px solid ${t.status === 'pending' ? '#FF7A1A' : 'transparent'}` }">
        <div class="flex items-center gap-2.5">
          <Avatar :avatar-key="t.avatarKey" :size="32" />
          <span class="text-[17px] font-extrabold">{{ t.player }}</span><span class="text-sm font-semibold text-a-muted">{{ t.teamName }}</span>
          <div class="flex-1" />
          <span class="a-chip capitalize" :style="{ background: chips[t.status]![0], color: chips[t.status]![1] }">{{ t.status }}</span>
        </div>
        <template v-if="editing === t.id">
          <div v-for="(_, n) in draft.statements" :key="n" class="flex gap-2 items-center">
            <input v-model="draft.statements[n]" class="a-input" maxlength="120" :aria-label="`Statement ${n + 1}`">
            <label class="flex items-center gap-1.5 text-[13px] font-bold whitespace-nowrap"><input v-model="draft.lieIndex" type="radio" :name="`lie-${t.id}`" :value="n">The lie</label>
          </div>
        </template>
        <div v-else class="flex flex-col gap-1.5">
          <div v-for="(l, n) in t.statements" :key="n" class="flex items-center gap-2.5 rounded-lg text-base font-semibold leading-snug box-border" style="min-height:40px;padding:6px 12px" :style="n === t.lieIndex ? 'background:#2A1519;border:2px solid #E0393E' : 'background:#1F232C;border:2px solid transparent'">
            <span class="text-[13px] font-extrabold" style="min-width:60px" :style="{ color: n === t.lieIndex ? '#FF8F94' : '#9AA3B2' }">{{ n === t.lieIndex ? 'THE LIE' : 'Truth' }}</span>{{ l }}
          </div>
        </div>
        <div class="flex gap-2">
          <template v-if="editing === t.id"><button class="a-btn primary" @click="saveEdit(t)">Save</button><button class="a-btn" @click="editing = null">Cancel</button></template>
          <template v-else>
            <button v-if="t.status !== 'approved'" class="a-btn ok" @click="admin.content('ttl', 'approve', { id: t.id })">Approve +750</button>
            <button class="a-btn" @click="startEdit(t)">Edit</button>
            <button v-if="t.status !== 'hidden'" class="a-btn" @click="admin.content('ttl', 'hide', { id: t.id })">Hide</button>
            <button v-else class="a-btn" @click="admin.content('ttl', 'pending', { id: t.id })">Unhide</button>
          </template>
          <div class="flex-1" />
          <button class="a-btn" style="padding:0 12px" :aria-label="`Move ${t.player} earlier`" @click="moveTtl(i, -1)">↑</button>
          <button class="a-btn" style="padding:0 12px" :aria-label="`Move ${t.player} later`" @click="moveTtl(i, 1)">↓</button>
        </div>
      </article>
    </div>
  </template>

  <AdminCodes v-else-if="tab === 'codes'" />

  <template v-else-if="tab === 'trivia'">
    <div class="flex items-center gap-3">
      <select v-model="seg" class="a-input" style="width:300px" aria-label="Trivia segment"><option value="">{{ triviaSegs[0]?.title }}</option><option v-for="g in triviaSegs.slice(1)" :key="g.id" :value="g.id">{{ g.title }}</option></select>
      <div class="flex-1" />
      <button class="a-btn" @click="showCsv = !showCsv">CSV import</button>
      <button class="a-btn primary" @click="q = blank()">Add question</button>
    </div>
    <div v-if="showCsv" class="bg-a-panel rounded-xl flex flex-col gap-2" style="padding:14px">
      <div class="text-sm font-semibold text-a-muted">Columns: prompt, a, b, c, d, correct (a to d), category, seconds</div>
      <textarea v-model="csv" class="a-input" rows="5" style="padding:10px" aria-label="CSV text" />
      <div><button class="a-btn primary" :disabled="!csv.trim()" @click="importCsv">Import</button></div>
    </div>
    <form v-if="q" class="bg-a-panel rounded-xl flex flex-col gap-2.5" style="padding:14px;border:2px solid #FF7A1A" @submit.prevent="saveQ">
      <input v-model="q.prompt" class="a-input" placeholder="Question" required maxlength="200" aria-label="Question">
      <div class="grid grid-cols-2 gap-2">
        <label v-for="(_, i) in q.options" :key="i" class="flex items-center gap-2">
          <input v-model="q.correctIndex" type="radio" name="correct" :value="i" :aria-label="`Option ${'ABCD'[i]} is correct`" style="width:20px;height:20px;accent-color:#6EE7A8">
          <input v-model="q.options[i]" class="a-input" :placeholder="`Option ${'ABCD'[i]}`" required :aria-label="`Option ${'ABCD'[i]}`">
        </label>
      </div>
      <div class="flex gap-2">
        <input v-model="q.category" class="a-input" placeholder="Category" aria-label="Category">
        <input v-model.number="q.timeLimitS" class="a-input" style="width:120px" type="number" min="5" max="60" aria-label="Seconds">
        <button class="a-btn primary">Save</button><button type="button" class="a-btn" @click="q = null">Cancel</button>
      </div>
    </form>
    <section class="bg-a-panel rounded-[14px] flex flex-col gap-1" style="padding:12px 14px">
      <div class="grid gap-2.5 text-[13px] font-extrabold text-a-muted uppercase" style="grid-template-columns:52px 30px 2fr 1.6fr 130px 60px 130px;padding:0 10px 4px;letter-spacing:.06em"><span /><span>#</span><span>Question</span><span>Correct</span><span>Category</span><span>Sec</span><span /></div>
      <div v-for="(x, i) in qs" :key="x.id" class="grid gap-2.5 items-center" style="grid-template-columns:52px 30px 2fr 1.6fr 130px 60px 130px;min-height:48px;padding:0 10px">
        <span class="flex"><button class="bg-transparent border-0 text-a-muted" style="width:26px;height:40px" aria-label="Move up" @click="moveQ(i, -1)">↑</button><button class="bg-transparent border-0 text-a-muted" style="width:26px;height:40px" aria-label="Move down" @click="moveQ(i, 1)">↓</button></span>
        <span class="font-extrabold text-a-muted">{{ i + 1 }}</span>
        <span class="text-[15px] font-semibold truncate" :title="x.prompt">{{ x.prompt }}</span>
        <span class="text-sm font-bold truncate text-a-ok">{{ 'ABCD'[x.correctIndex] }} · {{ x.options[x.correctIndex] }}</span>
        <span class="text-sm font-semibold text-a-muted truncate">{{ x.category }}</span>
        <span class="text-sm font-bold">{{ x.timeLimitS }}</span>
        <span class="flex gap-1.5 justify-end"><button class="a-btn" style="min-height:36px" @click="q = { ...x, options: [...x.options] }">Edit</button><button class="a-btn" style="min-height:36px;padding:0 10px" aria-label="Delete question" @click="delQ(x)">✕</button></span>
      </div>
    </section>
  </template>

  <template v-else>
    <form class="bg-a-panel rounded-xl grid gap-3" style="padding:14px;grid-template-columns:340px minmax(0,1fr)" @submit.prevent="upload">
      <div>
        <div v-if="up.url" class="relative rounded-lg overflow-hidden cursor-crosshair" title="Click the focal point" @click="pickFocal">
          <img :src="up.url" alt="Upload preview" class="block w-full">
          <span class="absolute rounded-full" :style="{ left: `${up.x * 100}%`, top: `${up.y * 100}%` }" style="width:22px;height:22px;margin:-11px;border:3px solid #FF7A1A;background:#FF7A1A55" />
        </div>
        <label v-else class="flex items-center justify-center rounded-lg text-a-muted font-bold cursor-pointer" style="height:180px;border:2px dashed #2B303B">Choose an image<input type="file" accept="image/*" class="sr" @change="pickFile"></label>
      </div>
      <div class="flex flex-col gap-2">
        <div class="text-sm font-semibold text-a-muted">Click the image to set the focal point. Six crops widen from 12% to the full picture.</div>
        <input v-model="up.answer" class="a-input" placeholder="Answer shown at reveal" required aria-label="Answer">
        <input v-model="up.accepted" class="a-input" placeholder="Accepted answers, comma separated" aria-label="Accepted answers">
        <div><button class="a-btn primary" :disabled="!up.file">Upload and cut crops</button></div>
      </div>
    </form>
    <article v-for="g in items" :key="g.id" class="bg-a-panel rounded-[14px] flex flex-col gap-2.5" style="padding:14px 16px">
      <div class="flex gap-2 items-center">
        <input class="a-input" style="width:260px;font-weight:800" :value="g.answerDisplay" aria-label="Answer" @change="saveGuess(g, { answerDisplay: ($event.target as HTMLInputElement).value })">
        <input class="a-input" :value="g.acceptedAnswers.join(', ')" aria-label="Accepted answers" @change="saveGuess(g, { acceptedAnswers: ($event.target as HTMLInputElement).value.split(',').map(x => x.trim()).filter(Boolean) })">
        <button class="a-btn" aria-label="Delete image" @click="delGuess(g)">✕</button>
      </div>
      <div class="grid gap-1.5" style="grid-template-columns:repeat(6,1fr)">
        <img v-for="n in 6" :key="n" :src="`/api/admin/guess-image/${g.id}/${n}`" :alt="`Zoom ${n}`" loading="lazy" class="block w-full rounded-md">
      </div>
    </article>
  </template>
</template>
