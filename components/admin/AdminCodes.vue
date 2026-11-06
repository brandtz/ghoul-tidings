<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAdminStore } from '~/stores/admin'
import { BINGO_MIN, DEFAULT_BINGO_SQUARES } from '~~/shared/phase2'

const admin = useAdminStore()
const s = computed(() => admin.a)
const json = ref(''); const show = ref(false)
const flags = computed(() => s.value.party.settings.flags)
const FLAGS: [string, string][] = [['eggs', 'Trick-or-treat codes'], ['cheatSheet', 'Trick-or-Treat Bag'], ['powerups', 'Power-ups'], ['eggHunt', 'Egg hunt board'], ['bingo', 'Meeting bingo'], ['legendary', 'Legendary (Doom)']]
const set = (k: string, v: boolean) => admin.content('settings', 'save', { flags: { [k]: v } })
const importIt = async () => { const r = await admin.content('codes', 'import', { json: json.value }); if (r) { admin.flash(`Imported ${r.data.imported} codes`); json.value = ''; show.value = false } }
const toggle = (c: any) => admin.content('codes', 'toggle', { id: c.id, enabled: !c.enabled })
const reveal = async (c: any) => { if (await admin.confirm('Show this code on every screen, including the stage?', 'Reveal code')) admin.content('codes', 'reveal', { id: c.id }) }
// Bingo pool: one square per line. Each player's card is their own shuffle of 24 from it.
const showBingo = ref(false)
const squares = ref('')
const NL = '\n'
const lines = computed(() => [...new Set(squares.value.split(NL).map(x => x.trim()).filter(x => x && x.toUpperCase() !== 'FREE'))])
const tooLong = computed(() => lines.value.filter(x => x.length > 60))
const openBingo = () => { squares.value = (s.value.party.settings.bingoSquares ?? DEFAULT_BINGO_SQUARES).join(NL); showBingo.value = !showBingo.value }
const saveBingo = async () => {
  if (!await admin.confirm('Everyone with a bingo card gets a fresh card from these squares, and their marks reset.', 'Save bingo squares')) return
  if (await admin.content('settings', 'save', { bingoSquares: lines.value })) { admin.flash(`Bingo now draws from ${lines.value.length} squares`); showBingo.value = false }
}
const cols = 'grid-template-columns:minmax(0,1.6fr) 100px 150px 150px 70px 90px 210px'
</script>

<template>
  <div class="flex items-center gap-3 flex-wrap">
    <label v-for="f in FLAGS" :key="f[0]" class="flex items-center gap-2 bg-a-panel rounded-xl text-[15px] font-bold" style="padding:10px 14px"><input type="checkbox" :checked="flags[f[0]]" style="width:20px;height:20px;accent-color:#FF7A1A" @change="set(f[0], ($event.target as HTMLInputElement).checked)">{{ f[1] }}</label>
    <div class="flex-1" />
    <span class="text-sm font-bold text-a-muted">{{ s.missedAttempts }} missed tries</span>
    <button class="a-btn" :aria-expanded="showBingo" @click="openBingo">Bingo squares</button>
    <button class="a-btn" @click="show = !show">Import catalog</button>
  </div>
  <div v-if="show" class="bg-a-panel rounded-xl flex flex-col gap-2" style="padding:14px">
    <div class="text-sm font-semibold text-a-muted">Paste JSON. Codes are hashed on arrival. Only listed codes keep readable text, for the bag.</div>
    <textarea v-model="json" class="a-input" rows="5" style="padding:10px" aria-label="Catalog JSON" />
    <div><button class="a-btn primary" :disabled="!json.trim()" @click="importIt">Import</button></div>
  </div>
  <div v-if="showBingo" class="bg-a-panel rounded-xl flex flex-col gap-2" style="padding:14px">
    <div class="text-sm font-semibold text-a-muted">One square per line, at least {{ BINGO_MIN }}. Each player gets their own shuffle of {{ BINGO_MIN }} with FREE in the middle, so a bigger list means more varied cards. Keep each under 60 characters.</div>
    <textarea v-model="squares" class="a-input" rows="12" style="padding:10px;line-height:1.45" aria-label="Bingo squares, one per line" />
    <div class="flex items-center gap-3 flex-wrap">
      <button class="a-btn primary" :disabled="lines.length < BINGO_MIN || lines.length > 100 || tooLong.length > 0" @click="saveBingo">Save squares</button>
      <button class="a-btn" @click="squares = DEFAULT_BINGO_SQUARES.join(NL)">Restore the starter list</button>
      <span class="text-sm font-bold" :class="lines.length < BINGO_MIN || tooLong.length ? 'text-[#FF8A7A]' : 'text-a-muted'">
        {{ lines.length }} squares<template v-if="lines.length < BINGO_MIN">, need {{ BINGO_MIN - lines.length }} more</template><template v-if="tooLong.length">, {{ tooLong.length }} over 60 characters</template>
      </span>
    </div>
  </div>
  <div v-if="s.powerups.length" class="text-sm font-bold text-a-soft">Team power-ups held: {{ s.powerups.map((p: any) => `${p.team} · ${p.kind}`).join(', ') }}</div>
  <section class="bg-a-panel rounded-[14px] flex flex-col gap-1" style="padding:12px 14px">
    <div class="grid gap-2.5 text-[13px] font-extrabold text-a-muted uppercase" :style="cols" style="padding:0 10px 4px;letter-spacing:.06em"><span>Label</span><span>Scope</span><span>Reward</span><span>Owner</span><span>Uses</span><span>Listed</span><span /></div>
    <div v-if="!s.codes.length" class="text-a-muted font-bold" style="padding:14px">No codes loaded. Add catalog/codes.local.json or import one here.</div>
    <div v-for="c in s.codes" :key="c.id" class="grid gap-2.5 items-center" :style="[cols, c.enabled ? '' : 'opacity:.5']" style="min-height:44px;padding:0 10px">
      <span class="text-[15px] font-semibold truncate">{{ c.label }}</span>
      <span class="text-sm font-bold capitalize">{{ c.scope }}</span>
      <span class="text-sm font-semibold text-a-muted truncate">{{ c.rewardKey }}</span>
      <span class="text-sm font-semibold text-a-muted truncate">{{ c.team ?? (c.scope === 'team' ? 'Unassigned' : '—') }}</span>
      <span class="text-sm font-extrabold">{{ c.uses }}</span>
      <span class="text-sm font-semibold text-a-muted">{{ c.listed ? 'Yes' : 'No' }}</span>
      <span class="flex gap-1.5 justify-end">
        <button v-if="c.canReveal" class="a-btn" style="min-height:36px;font-size:14px" @click="reveal(c)">Reveal</button>
        <button class="a-btn" style="min-height:36px;font-size:14px" @click="toggle(c)">{{ c.enabled ? 'Disable' : 'Enable' }}</button>
      </span>
    </div>
  </section>
</template>
