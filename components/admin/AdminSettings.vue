<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAdminStore } from '~/stores/admin'

const admin = useAdminStore()
const s = computed(() => admin.a)
const cfg = computed(() => s.value.party.settings)
const teams = computed(() => !!cfg.value.flags.teams)
const toLocal = (t: number) => { const d = new Date(t - new Date(t).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16) }
const f = ref({
  name: s.value.party.name, start: toLocal(s.value.party.scheduledStart), joinUrl: cfg.value.joinUrl, teamCap: cfg.value.teamCap, maxTeams: cfg.value.maxTeams,
  soloMultiplier: cfg.value.soloMultiplier, triviaBase: cfg.value.points.triviaBase, bingo: cfg.value.points.bingo, bingoFirst: cfg.value.points.bingoFirst,
  capGame: cfg.value.caps.trivia,
})
async function save() {
  const v = f.value
  const r = await admin.content('settings', 'save', {
    name: v.name, scheduledStart: new Date(v.start).getTime(), joinUrl: v.joinUrl, teamCap: v.teamCap, maxTeams: v.maxTeams, soloMultiplier: v.soloMultiplier,
    points: { triviaBase: v.triviaBase, bingo: v.bingo, bingoFirst: v.bingoFirst },
    caps: { trivia: v.capGame, guess: v.capGame, bingo: v.capGame },
  })
  if (r) admin.flash('Settings saved')
}
async function setTeams(on: boolean) {
  const text = on
    ? 'Turn teams on? Players can create and join teams, and the team race, team codes and power-ups come back.'
    : 'Turn teams off? Everyone plays solo. Team sign-up, the team race, team codes and power-ups are hidden. Existing teams are kept in case you turn this back on.'
  if (await admin.confirm(text, on ? 'Turn teams on' : 'Turn teams off')) {
    if (await admin.content('settings', 'save', { flags: { teams: on } })) admin.flash(on ? 'Teams are on' : 'Teams are off. Everyone plays solo.')
  }
}
const reset = async () => {
  if (await admin.confirm('Reset the whole party to starter content? Every player, score and draw is deleted. Prizes go back to the default gift cards.', 'Reset everything')) {
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
  <section class="bg-a-panel rounded-2xl flex items-center gap-4" style="padding:16px 18px" :style="teams ? '' : 'border:2px solid #2E6B4C'">
    <div class="flex-1">
      <div class="text-[17px] font-extrabold">Teams <span class="a-chip" style="margin-left:8px" :style="teams ? 'background:#3A2A12;color:#FFB36B' : 'background:#10281C;color:#6EE7A8'">{{ teams ? 'On' : 'Off · everyone plays solo' }}</span></div>
      <div class="text-sm font-semibold text-a-muted">Off hides every team feature: sign-up, the team race, team codes, power-ups and the solo multiplier.</div>
    </div>
    <button class="a-btn" :class="teams ? '' : 'primary'" @click="setTeams(!teams)">{{ teams ? 'Turn teams off' : 'Turn teams on' }}</button>
  </section>
  <form class="grid grid-cols-2 gap-4" @submit.prevent="save">
    <section class="bg-a-panel rounded-2xl flex flex-col gap-3" style="padding:16px 18px">
      <div class="a-eyebrow">Party</div>
      <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Party name<input v-model="f.name" class="a-input"></label>
      <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Start time<input v-model="f.start" type="datetime-local" class="a-input"></label>
      <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Join URL<input v-model="f.joinUrl" class="a-input"></label>
      <div v-if="teams" class="grid grid-cols-2 gap-3">
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Players per team<input v-model.number="f.teamCap" type="number" min="2" max="20" class="a-input"></label>
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Maximum teams<input v-model.number="f.maxTeams" type="number" min="2" max="10" class="a-input"></label>
      </div>
    </section>
    <section class="bg-a-panel rounded-2xl flex flex-col gap-3" style="padding:16px 18px">
      <div class="a-eyebrow">Scoring</div>
      <div class="grid grid-cols-2 gap-3">
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Trivia base points<input v-model.number="f.triviaBase" type="number" class="a-input"></label>
        <label v-if="teams" class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Solo multiplier<input v-model.number="f.soloMultiplier" type="number" step="0.05" min="1" max="3" class="a-input"></label>
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Bingo points<input v-model.number="f.bingo" type="number" min="0" class="a-input"></label>
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">First bingo bonus<input v-model.number="f.bingoFirst" type="number" min="0" class="a-input"></label>
        <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Cap per game event<input v-model.number="f.capGame" type="number" class="a-input"></label>
      </div>
    </section>
  </form>
  <section class="bg-a-panel rounded-2xl flex flex-col gap-2" style="padding:16px 18px">
    <div class="a-eyebrow">Phase 2 features</div>
    <div class="text-[15px] font-bold text-a-soft">Switch these on under Content, Codes. The Most eggs award needs trick-or-treat codes on.</div>
  </section>
  <section class="bg-a-panel rounded-2xl flex items-center gap-4" style="padding:16px 18px">
    <div><div class="text-[17px] font-extrabold">Testing tools</div><div class="text-sm font-semibold text-a-muted">The demo crowd answers on its own while this panel is open.</div></div>
    <div class="flex-1" />
    <button class="a-btn" @click="crowd">Add demo crowd</button>
    <button class="a-btn danger" @click="reset">Reset party…</button>
  </section>
</template>
