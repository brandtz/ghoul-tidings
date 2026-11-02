<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAdminStore } from '~/stores/admin'

const admin = useAdminStore()
const s = computed(() => admin.a)
const cfg = computed(() => s.value.party.settings)
const toLocal = (t: number) => { const d = new Date(t - new Date(t).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16) }
const f = ref({
  name: s.value.party.name, start: toLocal(s.value.party.scheduledStart), joinUrl: cfg.value.joinUrl, teamCap: cfg.value.teamCap, maxTeams: cfg.value.maxTeams,
  soloMultiplier: cfg.value.soloMultiplier, ttlOpens: toLocal(cfg.value.ttlOpensAt), ttlCloses: toLocal(cfg.value.ttlClosesAt),
  triviaBase: cfg.value.points.triviaBase, ttlParticipation: cfg.value.points.ttlParticipation, ttlSpot: cfg.value.points.ttlSpot, ttlFool: cfg.value.points.ttlFool, ttlFoolMax: cfg.value.points.ttlFoolMax,
  capGame: cfg.value.caps.trivia,
})
async function save() {
  const v = f.value
  const r = await admin.content('settings', 'save', {
    name: v.name, scheduledStart: new Date(v.start).getTime(), joinUrl: v.joinUrl, teamCap: v.teamCap, maxTeams: v.maxTeams, soloMultiplier: v.soloMultiplier,
    ttlOpensAt: new Date(v.ttlOpens).getTime(), ttlClosesAt: new Date(v.ttlCloses).getTime(),
    points: { triviaBase: v.triviaBase, ttlParticipation: v.ttlParticipation, ttlSpot: v.ttlSpot, ttlFool: v.ttlFool, ttlFoolMax: v.ttlFoolMax },
    caps: { trivia: v.capGame, guess: v.capGame, ttl_spot: v.capGame, ttl_fool: v.capGame, ttl_participation: v.capGame },
  })
  if (r) admin.flash('Settings saved')
}
const reset = async () => {
  if (await admin.confirm('Reset the whole party to starter content? Every player, score and draw is deleted.', 'Reset everything')) {
    await admin.post('/api/admin/party/reset')
    window.location.reload()
  }
}
const crowd = () => admin.post('/api/admin/party/demo-crowd').then(r => r && admin.flash('Demo crowd joined'))
const logout = async () => { await $fetch('/api/admin/logout', { method: 'POST' }); navigateTo('/admin/login') }
</script>

<template>
  <div class="flex items-center gap-4">
    <h1 class="m-0 text-[28px] font-extrabold">Settings</h1>
    <div class="flex-1" />
    <button class="a-btn" @click="logout">Sign out</button>
    <button class="a-btn primary" @click="save">Save settings</button>
  </div>
  <form class="grid grid-cols-2 gap-4" @submit.prevent="save">
    <section class="bg-a-panel rounded-2xl flex flex-col gap-3" style="padding:16px 18px">
      <div class="a-eyebrow">Party</div>
      <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Party name<input v-model="f.name" class="a-input"></label>
      <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Start time<input v-model="f.start" type="datetime-local" class="a-input"></label>
      <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Join URL<input v-model="f.joinUrl" class="a-input"></label>
      <div class="grid grid-cols-2 gap-3">
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Players per team<input v-model.number="f.teamCap" type="number" min="2" max="20" class="a-input"></label>
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Maximum teams<input v-model.number="f.maxTeams" type="number" min="2" max="10" class="a-input"></label>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Two Truths opens<input v-model="f.ttlOpens" type="datetime-local" class="a-input"></label>
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Two Truths closes<input v-model="f.ttlCloses" type="datetime-local" class="a-input"></label>
      </div>
    </section>
    <section class="bg-a-panel rounded-2xl flex flex-col gap-3" style="padding:16px 18px">
      <div class="a-eyebrow">Scoring</div>
      <div class="grid grid-cols-2 gap-3">
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Trivia base points<input v-model.number="f.triviaBase" type="number" class="a-input"></label>
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Solo multiplier<input v-model.number="f.soloMultiplier" type="number" step="0.05" min="1" max="3" class="a-input"></label>
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Two Truths approval bonus<input v-model.number="f.ttlParticipation" type="number" class="a-input"></label>
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Spotting the lie<input v-model.number="f.ttlSpot" type="number" class="a-input"></label>
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Per player fooled<input v-model.number="f.ttlFool" type="number" class="a-input"></label>
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Fooling maximum<input v-model.number="f.ttlFoolMax" type="number" class="a-input"></label>
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Cap per game event<input v-model.number="f.capGame" type="number" class="a-input"></label>
      </div>
    </section>
  </form>
  <section class="bg-a-panel rounded-2xl flex flex-col gap-2" style="padding:16px 18px">
    <div class="a-eyebrow">Phase 2 features</div>
    <div class="text-[15px] font-bold text-a-soft">Switch these on under Content, Codes. The legendary reward is not built.</div>
  </section>
  <section class="bg-a-panel rounded-2xl flex items-center gap-4" style="padding:16px 18px">
    <div><div class="text-[17px] font-extrabold">Testing tools</div><div class="text-sm font-semibold text-a-muted">The demo crowd answers on its own while this panel is open.</div></div>
    <div class="flex-1" />
    <button class="a-btn" @click="crowd">Add demo crowd</button>
    <button class="a-btn danger" @click="reset">Reset party…</button>
  </section>
</template>
