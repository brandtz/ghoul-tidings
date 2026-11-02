<script setup lang="ts">
import { computed, ref } from 'vue'
import { TEAM_COLORS, teamHex } from '~~/shared/catalog'
import { useNow } from '~/composables/useCountdown'
import { useAdminStore } from '~/stores/admin'

const admin = useAdminStore()
const now = useNow(5000)
const s = computed(() => admin.a)
const q = ref('')
const players = computed(() => s.value.players.filter((p: any) => p.name.toLowerCase().includes(q.value.toLowerCase())))
const selId = ref<string | null>(null)
const sel = computed(() => s.value.players.find((p: any) => p.id === selId.value) ?? null)
const amount = ref('+500'); const reason = ref('')
const amt = computed(() => Number(amount.value.replace('+', '')) || 0)
const seen = (t: number) => { const m = Math.round((now.value - t) / 1000); return m < 5 ? 'now' : m < 60 ? `${m} s` : `${Math.round(m / 60)} min` }
const solo = computed(() => s.value.players.filter((p: any) => !p.teamId && !p.removed).length)
async function apply() {
  if (await admin.post('/api/admin/scores/adjust', { playerId: sel.value.id, amount: amt.value, reason: reason.value })) { reason.value = ''; admin.flash('Score adjusted') }
}
const rename = () => { const n = window.prompt('New display name', sel.value.name); if (n) admin.content('players', 'rename', { id: sel.value.id, name: n }) }
const move = (e: Event) => admin.content('players', 'move', { id: sel.value.id, teamId: (e.target as HTMLSelectElement).value || null })
const remove = async () => { if (await admin.confirm(`Remove ${sel.value.name} from the party?`, 'Remove')) admin.content('players', 'remove', { id: sel.value.id }) }
const editTeam = ref<any>(null)
const openTeam = (t: any) => { editTeam.value = { id: t.id, name: t.name, colorKey: t.colorKey } }
const saveTeam = async () => { if (await admin.content('teams', 'save', editTeam.value)) editTeam.value = null }
const disband = async () => { if (await admin.confirm(`Disband ${editTeam.value.name}? Members become lone wolves.`, 'Disband')) { await admin.content('teams', 'disband', { id: editTeam.value.id }); editTeam.value = null } }
const cols = 'grid-template-columns:44px 1.2fr 1fr 90px 90px 100px'
</script>

<template>
  <div class="flex items-center gap-4">
    <h1 class="m-0 text-[28px] font-extrabold">Players and teams</h1>
    <span class="text-base font-bold text-a-muted">{{ s.present }} present · {{ s.players.length }} joined · {{ s.teams.length }} teams · {{ solo }} lone wolves</span>
    <div class="flex-1" />
    <input v-model="q" class="a-input" style="width:260px;background:#171A21" placeholder="Search players" aria-label="Search players">
  </div>
  <div class="grid gap-[18px] flex-1 min-h-0" style="grid-template-columns:minmax(0,1fr) 400px">
    <section aria-label="Players" class="bg-a-panel rounded-[14px] flex flex-col gap-1 overflow-y-auto" style="padding:12px 14px">
      <div class="grid gap-2.5 text-[13px] font-extrabold text-a-muted uppercase" :style="cols" style="padding:0 10px 6px;letter-spacing:.06em"><span /><span>Name</span><span>Team</span><span>Score</span><span>Last seen</span><span>Status</span></div>
      <div v-if="!players.length" class="text-a-muted font-bold" style="padding:14px">No players yet. Settings has a demo crowd for testing.</div>
      <button v-for="p in players" :key="p.id" class="grid gap-2.5 items-center rounded-[10px] text-left text-a-text box-border" :style="[cols, { background: selId === p.id ? '#1F232C' : 'transparent', border: `2px solid ${selId === p.id ? '#FF7A1A' : 'transparent'}` }]" style="min-height:52px;padding:0 10px" @click="selId = p.id">
        <Avatar :avatar-key="p.avatarKey" :size="32" />
        <span class="text-base font-bold truncate">{{ p.name }}<span v-if="p.isHost" class="text-a-muted"> · host</span></span>
        <span class="text-[15px] font-semibold text-a-soft truncate">{{ p.teamName }}</span>
        <span class="text-base font-extrabold">{{ p.score.toLocaleString() }}</span>
        <span class="text-sm font-semibold text-a-muted">{{ seen(p.lastSeenAt) }}</span>
        <span class="a-chip" :style="p.status === 'Present' ? 'background:#10281C;color:#6EE7A8' : 'background:#2B2412;color:#FFD27A'">{{ p.status }}</span>
      </button>
    </section>
    <div class="flex flex-col gap-3.5 min-h-0">
      <section v-if="sel" aria-label="Selected player" class="bg-a-panel rounded-[14px] flex flex-col gap-3" style="padding:16px 18px;border:2px solid #FF7A1A">
        <div class="flex items-center gap-3"><Avatar :avatar-key="sel.avatarKey" :size="44" /><div><div class="text-xl font-extrabold">{{ sel.name }}</div><div class="text-sm font-semibold text-a-muted">{{ sel.teamName }} · {{ sel.score.toLocaleString() }} pts · seen {{ seen(sel.lastSeenAt) }}</div></div></div>
        <div class="grid grid-cols-2 gap-2">
          <button class="a-btn" @click="rename">Rename</button>
          <select class="a-input" aria-label="Move team" :value="sel.teamId ?? ''" style="background:#2A2F3B;border-color:transparent;font-weight:700;font-size:15px" @change="move"><option value="">Lone wolf</option><option v-for="t in s.teams" :key="t.id" :value="t.id">{{ t.name }}</option></select>
        </div>
        <div class="a-eyebrow" style="margin-top:2px">Adjust score</div>
        <div class="grid gap-2.5" style="grid-template-columns:120px 1fr">
          <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Amount<input v-model="amount" class="a-input" style="font-size:18px;font-weight:800"></label>
          <label class="flex flex-col gap-1 text-[13px] font-bold text-a-muted">Reason (required)<input v-model="reason" class="a-input" style="font-size:15px"></label>
        </div>
        <div class="text-[13px] font-semibold text-a-muted">Logged to the ledger as a new row, never an edit. Capped at 2,500 per event.</div>
        <div class="flex gap-2">
          <button class="a-btn primary flex-1" style="min-height:48px;font-size:16px" :disabled="!amt || reason.trim().length < 3" @click="apply">Apply {{ amt > 0 ? '+' : '' }}{{ amt }}</button>
          <button class="a-btn danger" style="min-height:48px" @click="remove">Remove player…</button>
        </div>
      </section>
      <section aria-label="Teams" class="bg-a-panel rounded-[14px] flex flex-col gap-1.5 flex-1 overflow-y-auto" style="padding:14px 16px">
        <div class="a-eyebrow">Teams</div>
        <div v-for="t in s.teams" :key="t.id" class="flex items-center gap-2.5 bg-a-raised rounded-[10px]" style="min-height:48px;padding:0 12px">
          <span class="rounded flex-none" style="width:16px;height:16px" :style="{ background: teamHex(t.colorKey) }" />
          <span class="text-base font-bold flex-1 truncate">{{ t.name }}</span>
          <span class="text-sm font-semibold text-a-muted">{{ t.size }}/{{ s.party.settings.teamCap }}</span>
          <span class="text-base font-extrabold text-right" style="width:72px">{{ t.score.toLocaleString() }}</span>
          <button class="a-btn" style="min-height:36px;padding:0 12px;font-size:14px" :aria-label="`Edit ${t.name}`" @click="openTeam(t)">Edit</button>
        </div>
        <form v-if="editTeam" class="flex flex-col gap-2" style="margin-top:6px" @submit.prevent="saveTeam">
          <input v-model="editTeam.name" class="a-input" aria-label="Team name">
          <select v-model="editTeam.colorKey" class="a-input" aria-label="Team color"><option v-for="c in TEAM_COLORS" :key="c.key" :value="c.key">{{ c.name }}</option></select>
          <div class="flex gap-2"><button class="a-btn primary">Save</button><button type="button" class="a-btn" @click="editTeam = null">Cancel</button><button type="button" class="a-btn danger ml-auto" @click="disband">Disband…</button></div>
        </form>
        <div class="text-[13px] font-semibold text-a-muted" style="margin-top:4px">Edit covers rename, recolor and disband. Disband returns members to lone wolf.</div>
      </section>
    </div>
  </div>
</template>
