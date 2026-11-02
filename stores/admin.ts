// Host panel state: admin snapshot, the conductor loop, the primary next-step action.
import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'
import { usePartyStore } from '~/stores/party'

export const useAdminStore = defineStore('admin', () => {
  const party = usePartyStore()
  const a = shallowRef<any>(null)
  const error = ref('')
  const notice = ref('')
  const dialog = ref<{ text: string; ok: string; resolve: (v: boolean) => void } | null>(null)
  const tabId = Math.random().toString(36).slice(2)
  let tickT: ReturnType<typeof setInterval> | null = null
  let pollT: ReturnType<typeof setInterval> | null = null
  let noticeT: ReturnType<typeof setTimeout>

  async function refresh() {
    try { a.value = await $fetch('/api/admin/state') } catch (e: any) {
      if (e?.statusCode === 401) navigateTo('/admin/login')
    }
  }
  function flash(msg: string) { notice.value = msg; clearTimeout(noticeT); noticeT = setTimeout(() => { notice.value = '' }, 4000) }

  function start() {
    if (tickT) return
    party.connect()
    refresh()
    watch(() => party.snap, refresh)
    watch(() => party.answered, refresh)
    tickT = setInterval(() => { $fetch('/api/admin/tick', { method: 'POST', body: { id: tabId } }).catch(() => {}) }, 1000)
    pollT = setInterval(refresh, 3000)
  }

  /** Every write goes through here. versioned adds the no-double-fire token. */
  async function post(url: string, body: any = {}, versioned = false) {
    error.value = ''
    try {
      const r: any = await $fetch(url, { method: 'POST', body: versioned ? { ...body, v: a.value?.v } : body })
      await refresh()
      return r ?? true
    } catch (e: any) {
      error.value = e?.data?.message ?? e?.message ?? 'That did not go through'
      await refresh()
      return null
    }
  }
  const content = (kind: string, action: string, body: any = {}) => post(`/api/admin/content/${kind}/${action}`, body)

  function confirm(text: string, ok = 'Confirm') {
    return new Promise<boolean>((resolve) => { dialog.value = { text, ok, resolve } })
  }
  function answerDialog(v: boolean) { dialog.value?.resolve(v); dialog.value = null }

  const conductor = computed(() => {
    const c = a.value?.party.state.conductor
    if (!c) return { label: 'Stale', ok: false }
    const fresh = (a.value.serverNow ?? Date.now()) - c.at < 5000
    if (!fresh) return { label: 'Stale', ok: false }
    return { label: c.id === tabId ? 'This tab, ok' : 'Another tab, ok', ok: true }
  })

  const roundWord = (t?: string) => (t === 'trivia' ? 'question' : t === 'guess' ? 'image' : 'round')
  const primary = computed(() => {
    const s = a.value
    if (!s) return null
    const st = s.party.state
    if (s.party.status === 'ended') return null
    if (s.party.status !== 'live') return { label: 'Go live', run: () => post('/api/admin/party/start', {}, true) }
    const c = s.current
    if (!c) {
      if (s.nextSegment) return { label: `Start ${s.nextSegment.title}`, run: () => post('/api/admin/segment/start', { segmentId: s.nextSegment.id }, true) }
      return { label: 'End party', run: () => post('/api/admin/party/end', {}, true) }
    }
    const type = c.segment.type
    if (type === 'intermission') return { label: 'End intermission', run: () => post('/api/admin/segment/end', {}, true) }
    if (type === 'finale') return { label: 'End party', run: () => post('/api/admin/party/end', {}, true) }
    if (type === 'presentation') {
      const p = st.presentation
      if (!p) return { label: 'Start slides', run: () => post('/api/admin/presentation/start', {}) }
      const deck = s.presentations.find((d: any) => d.id === p.id)
      if (p.page < (deck?.pageCount ?? 1)) return { label: `Next slide (${p.page + 1})`, run: () => post('/api/admin/presentation/goto', { page: p.page + 1 }) }
      return { label: 'End slides', run: async () => { await post('/api/admin/presentation/end'); await post('/api/admin/segment/end', {}, true) } }
    }
    const r = c.round
    if (!r) {
      if (c.itemIndex < c.itemCount) return { label: `Open ${roundWord(c.item?.type)} ${c.itemIndex + 1}`, run: () => post('/api/admin/round/open', {}, true) }
      return { label: 'End segment', run: () => post('/api/admin/segment/end', {}, true) }
    }
    if (r.phase === 'open') return { label: 'Lock now', run: () => post('/api/admin/round/lock', {}, true) }
    if (r.phase === 'locked') {
      return {
        label: 'Reveal answers', disabled: st.scoringPaused, reason: st.scoringPaused ? 'Scoring is paused. Resume it to reveal.' : '',
        run: () => post('/api/admin/round/reveal', {}, true),
      }
    }
    const more = c.itemIndex + 1 < c.itemCount
    return { label: more ? `Next ${roundWord(c.item?.type)}` : 'End segment', run: () => post('/api/admin/round/next', {}, true) }
  })

  async function undo() {
    const u = a.value?.undo
    if (!u) return
    if (await confirm(`Undo "${u.label}"? This reverses ${u.count} ${u.count === 1 ? 'event' : 'events'} on every screen.`, 'Undo')) {
      const r = await post('/api/admin/scores/undo')
      if (r) flash(`Reversed ${u.count} ${u.count === 1 ? 'event' : 'events'}`)
    }
  }
  async function pause(kind: 'scoring' | 'party') {
    const st = a.value.party.state
    const on = kind === 'scoring' ? !st.scoringPaused : !st.partyPaused
    await post('/api/admin/pause', { kind, on })
    flash(`${kind === 'scoring' ? 'Scoring' : 'Party'} ${on ? 'paused' : 'resumed'}`)
  }
  const drawNext = async () => {
    const n = a.value?.nextPrize
    if (n && await confirm(`Draw now for ${n.name}?`, 'Draw now')) post(`/api/admin/raffle/${n.id}/draw`)
  }

  return { a, error, notice, dialog, conductor, primary, start, refresh, post, content, confirm, answerDialog, undo, pause, flash, drawNext }
})
