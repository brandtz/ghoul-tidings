<script setup lang="ts">
// Design check page: scrub p and moments with sample data. Nothing here touches the live party.
import { computed, onMounted, ref, watch } from 'vue'
import type { PublicSnapshot } from '~~/shared/types'
import { usePartyStore } from '~/stores/party'

const route = useRoute()
const store = usePartyStore()
const p = ref(Number(route.query.p ?? 0))
const game = ref(String(route.query.game ?? 'blank'))
const hint = ref(route.query.hint === '1')
const bar = ref(route.query.bar !== '0')

const base = (): PublicSnapshot => ({
  v: 1, serverNow: Date.now(),
  party: { name: 'Ghoul Tidings', slug: 'preview', status: 'live', scheduledStart: Date.now(), startedAt: Date.now(), durationMin: 60, joinUrl: 'https://ghoul-tidings.example', teamCap: 8, maxTeams: 10, soloMultiplier: 1.5 },
  paused: { scoring: false, party: false }, theme: { p: p.value, override: false }, segment: null, upNext: { type: 'trivia', title: 'Holiday Trivia' },
  round: game.value === 'trivia' ? {
    id: 'x', itemType: 'trivia', phase: 'open', opensAt: Date.now() - 4000, locksAt: Date.now() + 6000, index: 3, total: 12, answeredCount: 34,
    trivia: { prompt: 'Which holiday song begins with "Chestnuts roasting on an open fire"?', options: ['The Christmas Song', 'Jingle Bells', 'Silent Night', 'Deck the Halls'], category: 'Holiday Music', timeLimitS: 10 },
  } : null,
  raffle: { nextDueAt: Date.now() + 138000, deferred: false, drawn: 2, total: 8, recent: [] },
  recentWinner: { name: 'Taylor M.', avatarKey: 'twinkle' }, hintRevealed: hint.value,
  ttl: { opensAt: 0, closesAt: Date.now() + 3e6, open: true },
  top10: [], teams: [], spirit: { value: 120, goal: 600 }, present: 57, joined: 61, presentation: null, finale: null, flags: {}, eggBoard: null,
  me: { id: 'me', name: 'You', avatarKey: 'skelly', isHost: false, teamId: null, teamName: null, score: 12840, rank: 23, ofPlayers: 57, answer: null, result: null, ttl: null, offer: null, powerup: null, unlocks: { bag: false, console: false, bingo: false, legendary: false }, bingoClaimed: false },
})
const refresh = () => { store.snap = base() }
onMounted(refresh)
watch([game, hint], refresh)
const winner = () => { store.moment = { drawId: 'x', winner: 'Jamie L.', avatarKey: 'twinkle', playerId: 'y', prize: 'Coffee shop gift card', tier: 'special', isMidnight: false, beat: 1, reel: ['Dana K.', 'Jo A.', 'Wei T.', 'Jamie L.'] }; store.momentKey++ }
const label = computed(() => p.value.toFixed(2))
</script>

<template>
  <PartyShell :progress="p"><div v-if="game === 'blank'" class="screen" style="align-items:center;justify-content:center;text-align:center">
    <div class="cinzel" style="font-size:40px;font-weight:500;letter-spacing:.14em;color:#B9B6D6">GAME AREA</div>
    <div style="font-size:20px;font-weight:600;color:#8A87AB">Trivia, Guess the Thing, Two Truths and a Lie</div>
  </div><GameScreen v-else /></PartyShell>
  <div v-if="bar" style="position:fixed;left:12px;bottom:12px;z-index:50;background:#000c;color:#fff;font:600 14px Inter,sans-serif;padding:8px 12px;border-radius:10px;display:flex;gap:10px;align-items:center">
    p {{ label }} <input v-model.number="p" type="range" min="0" max="1" step="0.01" aria-label="Party progress" style="width:220px">
    <select v-model="game" aria-label="Game"><option>blank</option><option>trivia</option></select>
    <label><input v-model="hint" type="checkbox"> hint</label>
    <button @click="winner">raffle beat</button>
  </div>
</template>
