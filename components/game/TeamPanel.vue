<script setup lang="ts">
import { computed, ref } from 'vue'
import { CHARACTERS, TEAM_COLORS, teamHex } from '~~/shared/catalog'
import { usePartyStore } from '~/stores/party'

const store = usePartyStore()
const mode = ref<'choose' | 'create' | 'join'>('choose')
const name = ref(''); const mascot = ref('jack'); const color = ref('')
const teams = computed(() => store.snap?.teams ?? [])
const taken = computed(() => new Set(teams.value.map(t => t.colorKey)))
const cap = computed(() => store.snap?.party.teamCap ?? 8)
const myTeam = computed(() => teams.value.find(t => t.id === store.me?.teamId))
const firstFree = () => TEAM_COLORS.find(c => !taken.value.has(c.key))?.key ?? ''
const startCreate = () => { color.value = firstFree(); mode.value = 'create' }
async function create() {
  if (await store.act('/api/teams', { name: name.value, mascotKey: mascot.value, colorKey: color.value })) mode.value = 'choose'
}
async function join(id: string) { if (await store.act(`/api/teams/${id}/join`)) mode.value = 'choose' }
const leave = () => store.act('/api/teams/leave')
const solo = () => store.toast('Lone wolf it is. You can switch between rounds.', 'treat')
</script>

<template>
  <div v-if="myTeam" style="display:flex;flex-direction:column;gap:10px;border:3px solid #34375E;border-radius:16px;background:#15172F;padding:14px 18px">
    <div style="display:flex;align-items:center;gap:14px">
      <Avatar :avatar-key="myTeam.mascotKey" :size="56" :ring="teamHex(myTeam.colorKey)" />
      <div style="flex:1"><div class="cinzel" style="font-size:26px;font-weight:700">{{ myTeam.name }}</div><div style="font-size:17px;font-weight:700;color:#B9B6D6">{{ myTeam.size }}/{{ cap }} players</div></div>
      <button class="btn-ghost" @click="leave">Leave team</button>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      <span v-for="m in myTeam.members" :key="m.name" style="display:flex;align-items:center;gap:6px;font-size:17px;font-weight:700"><Avatar :avatar-key="m.avatarKey" :size="28" />{{ m.name }}</span>
    </div>
  </div>

  <template v-else-if="mode === 'choose'">
    <div class="tile-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div style="border:3px solid #34375E;border-radius:16px;background:#15172F;padding:14px 18px;display:flex;flex-direction:column;gap:8px">
        <div class="cinzel" style="font-size:24px;font-weight:700">Run with a pack</div>
        <div style="font-size:17px;font-weight:700;color:#B9B6D6;flex:1">A shared spot in the team race and future team power-ups.</div>
        <div style="display:flex;gap:8px"><button class="btn-gold" style="flex:1;padding:0 8px" @click="startCreate">Create team</button><button class="btn-ghost" style="flex:1;padding:0 8px" :disabled="!teams.length" @click="mode = 'join'">Join team</button></div>
      </div>
      <div style="border:3px solid #34375E;border-radius:16px;background:#15172F;padding:14px 18px;display:flex;flex-direction:column;gap:8px">
        <div class="cinzel" style="font-size:24px;font-weight:700">Lone wolf</div>
        <div style="font-size:17px;font-weight:700;color:#B9B6D6;flex:1">{{ store.snap?.party.soloMultiplier }}× trivia points and your own spotlight.</div>
        <button class="btn-ghost" @click="solo">Stay solo</button>
      </div>
    </div>
    <div style="font-size:16px;font-weight:700;color:#B9B6D6;text-align:center">You can switch between rounds.</div>
  </template>

  <form v-else-if="mode === 'create'" style="display:flex;flex-direction:column;gap:10px" @submit.prevent="create">
    <input v-model="name" class="field" maxlength="24" required placeholder="Team name" aria-label="Team name">
    <div style="display:flex;gap:6px;flex-wrap:wrap" role="radiogroup" aria-label="Team color">
      <label v-for="c in TEAM_COLORS" :key="c.key" :title="taken.has(c.key) ? `${c.name} is taken` : c.name" :style="{ background: c.hex, opacity: taken.has(c.key) ? .25 : 1, outline: color === c.key ? '3px solid #fff' : 'none' }" style="width:44px;height:44px;border-radius:10px;cursor:pointer;display:block">
        <input v-model="color" class="sr" type="radio" name="color" :value="c.key" :disabled="taken.has(c.key)"><span class="sr">{{ c.name }}</span>
      </label>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap" role="radiogroup" aria-label="Mascot">
      <label v-for="c in CHARACTERS" :key="c.key" :title="c.name" style="cursor:pointer;border-radius:50%" :style="mascot === c.key ? 'outline:3px solid #fff' : ''">
        <input v-model="mascot" class="sr" type="radio" name="mascot" :value="c.key"><Avatar :avatar-key="c.key" :size="44" />
      </label>
    </div>
    <div style="display:flex;gap:8px"><button class="btn-gold" style="flex:1" :disabled="!color">Create team</button><button type="button" class="btn-ghost" @click="mode = 'choose'">Back</button></div>
  </form>

  <div v-else style="display:flex;flex-direction:column;gap:8px">
    <button v-for="t in teams" :key="t.id" class="tile" style="min-height:64px;font-size:20px;padding:0 14px" :disabled="t.size >= cap" @click="join(t.id)">
      <Avatar :avatar-key="t.mascotKey" :size="44" :ring="teamHex(t.colorKey)" />
      <span style="flex:1">{{ t.name }}</span><span style="color:#B9B6D6">{{ t.size >= cap ? 'Full' : `${t.size}/${cap}` }}</span>
    </button>
    <button class="btn-ghost" @click="mode = 'choose'">Back</button>
  </div>
</template>
