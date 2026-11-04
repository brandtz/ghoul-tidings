// Client live state. Holds the snapshot, syncs the clock, listens for live updates
// (signed Supabase Realtime broadcast, or the local stream), falls back to polling,
// and queues the one-shot moments (raffle beat, effects).
import { defineStore } from 'pinia'
import { compactVerify, importJWK } from 'jose'
import { computed, ref, shallowRef } from 'vue'
import type { BusMessage, PublicSnapshot } from '~~/shared/types'

export interface RaffleMoment { drawId: string; winner: string; avatarKey: string; playerId: string; prize: string; tier: string; isMidnight: boolean; beat: number; reel: string[] }
export interface Toast { id: number; text: string; kind: 'treat' | 'trick' | 'info' }

export const usePartyStore = defineStore('party', () => {
  const snap = shallowRef<PublicSnapshot | null>(null)
  const connected = ref(true)
  const sessionError = ref<string | null>(null)
  const frogUnlocked = ref(false)
  // True while Doom has the keyboard; party key listeners and effect sounds stand down.
  const legendaryOpen = ref(false)
  const offset = ref(0)
  const moment = shallowRef<RaffleMoment | null>(null)
  const momentKey = ref(0)
  const effect = shallowRef<{ key: string; text?: string; n: number } | null>(null)
  const reaction = shallowRef<{ counts: Record<string, number>; n: number } | null>(null)
  const toasts = ref<Toast[]>([])
  const answered = ref(0)
  const calm = ref(false)
  const ticker = shallowRef<{ kind: string; text: string; n: number } | null>(null)
  const personalP = ref<number | null>(null)
  const jokeUntil = ref(0)
  let es: EventSource | null = null
  let rt: { disconnect: () => void } | null = null
  const seen = new Set<string>()
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let beatTimer: ReturnType<typeof setInterval> | null = null
  let syncTimer: ReturnType<typeof setInterval> | null = null
  let downSince = 0
  let fetching = false
  let again = false
  let toastId = 0
  let effectN = 0

  const now = () => Date.now() + offset.value
  const me = computed(() => snap.value?.me ?? null)

  async function syncClock() {
    let best = Infinity; let off = 0
    for (let i = 0; i < 3; i++) {
      const t0 = Date.now()
      const r = await $fetch<{ now: number }>('/api/time').catch(() => null)
      if (!r) continue
      const rtt = Date.now() - t0
      if (rtt < best) { best = rtt; off = r.now + rtt / 2 - Date.now() }
    }
    if (best < Infinity) offset.value = off
  }

  async function refresh() {
    if (fetching) { again = true; return }
    fetching = true
    try {
      const s = await $fetch<PublicSnapshot>('/api/state')
      snap.value = s
      answered.value = s.round?.answeredCount ?? 0
      sessionError.value = null
    } catch (e: any) {
      if (e?.statusCode === 401) sessionError.value = e?.data?.message ?? 'Your seat timed out'
    } finally {
      fetching = false
      if (again) { again = false; refresh() }
    }
  }

  function toast(text: string, kind: Toast['kind'] = 'info') {
    const id = ++toastId
    toasts.value = [...toasts.value.slice(-2), { id, text, kind }]
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 4000)
  }

  function fireEffect(key: string, text?: string) { effect.value = { key, text, n: ++effectN } }

  function onMessage(m: BusMessage) {
    switch (m.type) {
      case 'ping': return
      case 'answers.count': answered.value = m.data.count; return
      case 'react': reaction.value = { counts: m.data.counts, n: ++effectN }; return
      case 'spirit.updated':
        if (snap.value) snap.value = { ...snap.value, spirit: m.data }
        return
      case 'effect.global': fireEffect(m.data.key, m.data.text); return
      case 'ticker': {
        const n = ++effectN
        ticker.value = { ...m.data, n }
        setTimeout(() => { if (ticker.value?.n === n) ticker.value = null }, 6000)
        return
      }
      case 'raffle.drawing': moment.value = m.data; momentKey.value++; break
    }
    if (m.data?.reset) { window.location.reload(); return }
    setTimeout(refresh, Math.random() * 250)
  }

  let pollMs = 0
  function startPolling(ms = 3000) {
    if (pollTimer && pollMs === ms) return
    stopPolling()
    pollMs = ms
    pollTimer = setInterval(refresh, ms)
  }
  function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null } }

  // Light updates are thinned on the server, so a slow poll keeps counts honest
  // even while the live channel is up.
  const SLOW_POLL = 12000
  function liveUp() { connected.value = true; downSince = 0; startPolling(SLOW_POLL); refresh() }
  function liveDown() {
    if (!downSince) downSince = Date.now()
    startPolling()
    setTimeout(() => { if (downSince && Date.now() - downSince >= 3000) connected.value = false }, 3100)
  }

  async function connectRealtime(url: string, apikey: string, jwk: string | object) {
    const key = typeof jwk === 'string' ? JSON.parse(jwk) : jwk
    const [{ RealtimeClient }, pub] = await Promise.all([import('@supabase/realtime-js'), importJWK(key, 'ES256')])
    const client = new RealtimeClient(`${url.replace(/^http/, 'ws')}/realtime/v1`, { params: { apikey } })
    rt = client
    client.channel('gt-party').on('broadcast', { event: 'm' }, async ({ payload }: any) => {
      try {
        const { payload: bytes } = await compactVerify(payload.jws, pub)
        const m = JSON.parse(new TextDecoder().decode(bytes)) as BusMessage & { exp: number }
        if (m.exp < now() || seen.has(m.id)) return
        seen.add(m.id)
        if (seen.size > 500) seen.delete(seen.values().next().value!)
        onMessage(m)
      } catch { /* unsigned or forged */ }
    }).subscribe((status: string) => { if (status === 'SUBSCRIBED') liveUp(); else liveDown() })
  }

  function connect(opts: { heartbeat?: boolean } = {}) {
    if (es || rt) return
    syncClock(); refresh()
    const pub = useRuntimeConfig().public
    if (pub.supabaseUrl && pub.supabasePublishableKey && pub.broadcastPublicKey) {
      liveDown()
      connectRealtime(pub.supabaseUrl, pub.supabasePublishableKey, pub.broadcastPublicKey).catch(() => liveDown())
    } else connectStream()
    syncTimer = setInterval(syncClock, 5 * 60000)
    if (opts.heartbeat) {
      const beat = () => { if (snap.value?.me) $fetch('/api/heartbeat', { method: 'POST' }).catch(() => {}) }
      setTimeout(beat, 1500)
      beatTimer = setInterval(beat, 30000)
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh() })
  }

  function connectStream() {
    es = new EventSource('/api/stream')
    es.onopen = () => { connected.value = true; downSince = 0; stopPolling(); refresh() }
    es.onmessage = (e) => { try { onMessage(JSON.parse(e.data)) } catch { /* dropped */ } }
    es.onerror = () => {
      if (!downSince) downSince = Date.now()
      if (Date.now() - downSince > 3000) connected.value = false
      if (Date.now() - downSince > 10000) startPolling()
      else setTimeout(() => { if (downSince && es?.readyState !== 1) { connected.value = false; startPolling() } }, 10000)
    }
  }

  function disconnect() {
    es?.close(); es = null
    rt?.disconnect(); rt = null
    stopPolling()
    if (beatTimer) clearInterval(beatTimer)
    if (syncTimer) clearInterval(syncTimer)
  }

  /** Ends this device's seat. The seat itself stays on the server, keyed by email, so
   *  joining again with the same email picks up the same score, team and ghoul. */
  async function signOut() {
    await $fetch('/api/leave', { method: 'POST' }).catch(() => {})
    personalP.value = null; jokeUntil.value = 0; frogUnlocked.value = false; legendaryOpen.value = false; toasts.value = []
    sessionError.value = null
    await refresh()
  }

  /** POST helper for player actions. Surfaces server messages as toasts. */
  async function act<T = any>(url: string, body?: any): Promise<T | null> {
    try {
      const r = await $fetch<any>(url, { method: 'POST', body: body ?? {} })
      for (const fx of r?.effects ?? []) {
        if (fx.key === 'theme') { personalP.value = fx.p; setTimeout(() => { personalP.value = null }, fx.durationMs) }
        else if (fx.key === 'joke') { jokeUntil.value = Date.now() + fx.durationMs; setTimeout(() => toast('The auditors took it back. Worth a try.', 'trick'), fx.durationMs) }
        else if (fx.key !== 'none') fireEffect(fx.key)
        if (fx.toast) toast(fx.toast, r?.data?.outcome === 'hit' && fx.key === 'bats' ? 'trick' : 'treat')
      }
      await refresh()
      return r
    } catch (e: any) {
      toast(e?.data?.message ?? 'That did not go through. Try again.', 'trick')
      return null
    }
  }

  return { legendaryOpen, signOut, frogUnlocked, ticker, personalP, jokeUntil, snap, connected, sessionError, offset, moment, momentKey, effect, reaction, toasts, answered, calm, me, now, refresh, connect, disconnect, toast, fireEffect, act }
})
