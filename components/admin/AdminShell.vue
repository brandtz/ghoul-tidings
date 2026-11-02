<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { playChime, playSting } from '~/composables/hostSound'
import { useAdminStore } from '~/stores/admin'
import { usePartyStore } from '~/stores/party'

const props = defineProps<{ section: string }>()
const admin = useAdminStore()
const party = usePartyStore()
const NAV = [
  ['run-of-show', 'Run of show', '▶'], ['content', 'Content', '☰'], ['raffle', 'Prizes and raffle', '🎁'], ['theme', 'Theme', '◐'],
  ['players', 'Players and teams', '☺'], ['monitor', 'Live monitor', '≋'], ['effects', 'Effects soundboard', '⚡'], ['presentation', 'Presentation', '▭'], ['settings', 'Settings', '⚙'],
]

function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement
  if (e.key === 'Escape') { admin.answerDialog(false); return }
  if (t.closest?.('input,textarea,select,[contenteditable]')) return
  if (admin.dialog) return
  const k = e.key.toLowerCase()
  const s = admin.a
  if (e.key === ' ' && !t.closest?.('button,a')) { e.preventDefault(); if (!admin.primary?.disabled) admin.primary?.run() }
  else if (e.key === ' ') { e.preventDefault(); (t as HTMLElement).blur?.(); if (!admin.primary?.disabled) admin.primary?.run() }
  else if (k === 'l') admin.post('/api/admin/round/lock', {}, true)
  else if (k === 'r') { if (!s?.party.state.scoringPaused) admin.post('/api/admin/round/reveal', {}, true) }
  else if (k === 'd') admin.drawNext()
  else if (k === 'p') admin.pause('party')
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const p = s?.party.state.presentation
    if (p) admin.post('/api/admin/presentation/goto', { page: p.page + (e.key === 'ArrowRight' ? 1 : -1) })
  } else if (/^[1-9]$/.test(k) && !e.ctrlKey && !e.metaKey) navigateTo(`/admin/${NAV[Number(k) - 1]![0]}`)
}
// Host sounds stay on this machine and are off until switched on in Effects.
watch(() => party.momentKey, () => {
  const sound = admin.a?.party.settings.hostSound
  if (party.moment?.isMidnight && sound?.chime) playChime()
  else if (sound?.sting) playSting()
})
onMounted(() => { admin.start(); window.addEventListener('keydown', onKey) })
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="admin admin-grid">
    <nav aria-label="Sections" class="bg-a-nav flex flex-col gap-1" style="padding:20px 12px">
      <div class="nav-brand flex flex-col gap-0.5" style="padding:0 12px 18px">
        <span class="text-[20px] font-extrabold text-a-accent">{{ party.snap?.party.name ?? 'Ghoul Tidings' }}</span>
        <span class="text-sm font-semibold text-a-muted">Host panel · private</span>
      </div>
      <NuxtLink
        v-for="(n, i) in NAV" :key="n[0]" :to="`/admin/${n[0]}`" :title="n[1]"
        class="flex items-center gap-2 rounded-[10px] text-[15px] font-bold no-underline whitespace-nowrap"
        style="min-height:44px;padding:0 12px" :style="{ background: section === n[0] ? '#232834' : 'transparent', color: section === n[0] ? '#fff' : '#C4CAD6' }"
      >
        <span aria-hidden="true" class="w-6 text-center" :style="{ color: section === n[0] ? '#FF7A1A' : '#5E6676' }">{{ n[2] }}</span>
        <span class="nav-label">{{ n[1] }}</span>
        <span class="nav-key ml-auto text-[13px] text-a-muted">{{ i + 1 }}</span>
      </NuxtLink>
      <div class="flex-1" />
      <a href="/stage" target="_blank" class="flex items-center justify-center rounded-[10px] text-sm font-bold no-underline text-a-soft bg-a-raised" style="min-height:44px" title="Open stage view">
        <span class="nav-label">Open stage view ↗</span><span class="nav-key" />
      </a>
    </nav>

    <main class="admin-main">
      <div v-if="admin.error" role="alert" class="rounded-xl px-4 py-2 text-[15px] font-bold" style="background:#2A1519;color:#FF8F94">{{ admin.error }}</div>
      <slot v-if="admin.a" />
      <div v-else class="text-a-muted font-bold">Loading the show…</div>
    </main>

    <LiveColumn />

    <footer class="flex items-center gap-7 text-sm font-bold text-a-muted" style="grid-column:1 / 4;background:#0B0D11;padding:0 24px">
      <span><b class="text-a-text">Space</b> next step</span><span><b class="text-a-text">L</b> lock</span><span><b class="text-a-text">R</b> reveal</span>
      <span><b class="text-a-text">D</b> draw now</span><span><b class="text-a-text">P</b> pause party</span><span><b class="text-a-text">← →</b> slides</span>
      <span><b class="text-a-text">Esc</b> cancel</span><span class="ml-auto">Shortcuts are off while a text field is focused</span>
    </footer>

    <div v-if="admin.notice" role="status" class="fixed left-1/2 -translate-x-1/2 rounded-xl px-5 py-3 font-bold bg-a-raised2" style="bottom:60px;z-index:40">{{ admin.notice }}</div>
    <div v-if="admin.dialog" class="fixed inset-0 flex items-center justify-center" style="background:#000a;z-index:50">
      <div role="alertdialog" aria-modal="true" class="rounded-2xl bg-a-panel p-6 flex flex-col gap-4" style="width:460px;border:2px solid #FF7A1A">
        <div class="text-lg font-bold leading-snug">{{ admin.dialog.text }}</div>
        <div class="flex gap-2 justify-end">
          <button class="a-btn" @click="admin.answerDialog(false)">Cancel · Esc</button>
          <button class="a-btn primary" autofocus @click="admin.answerDialog(true)">{{ admin.dialog.ok }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
