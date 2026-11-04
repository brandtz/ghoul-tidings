<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAdminStore } from '~/stores/admin'

const admin = useAdminStore()
const s = computed(() => admin.a)
const banner = ref('Raffle drawing in two minutes!')
const fx = [
  ['lightning', 'Lightning', '#F3EEF9', '#14101C', '2 s', 'A soft white bloom from the top edge, two flashes at most.'],
  ['bats', 'Bat swarm', '#8B5CF6', '#FFFFFF', '6 s', 'A flutter of bats crosses the rim and frame.'],
  ['snow', 'Snow burst', '#7FB7E8', '#0B1020', '6 s', 'A quick flurry over the frame, light on the stage.'],
  ['confetti', 'Confetti', '#F2C14E', '#1A1204', '5 s', 'Streamers from both top corners.'],
  ['spirit', 'Spirit burst', '#FF7A1A', '#140A05', '4 s', 'A celebration for the Holiday Spirit meter.'],
  ['sleigh', 'Skelly sleigh', '#C8102E', '#FFFFFF', '7 s', 'Skeleton Santa and his reindeer fly across the sky, bells jingling.'],
]
const openRound = computed(() => { const r = s.value.current?.round; return r && r.phase !== 'revealed' })
const sound = (k: 'chime' | 'sting', v: boolean) => admin.content('settings', 'save', { hostSound: { ...s.value.party.settings.hostSound, [k]: v } })
const fire = (key: string, text?: string) => admin.post('/api/admin/effect', { key, text })
const hint = async () => { if (await admin.confirm('Reveal the Trick or Treat hint box on every player screen? It stays for the rest of the party.', 'Reveal a hint')) admin.post('/api/admin/hint') }
</script>

<template>
  <div class="flex items-center gap-4">
    <h1 class="m-0 text-[28px] font-extrabold">Effects soundboard</h1>
    <span class="text-[15px] font-bold text-a-muted">Weather for the whole party. Use sparingly, never over an open question.</span>
  </div>
  <div v-if="openRound" class="flex items-center gap-3 rounded-xl text-base font-bold" style="background:#2B2412;color:#FFD27A;padding:12px 18px">
    ⚠ A question is open. Particles stay out of the frame until the reveal. Lightning stays within the flash-safety limits and falls back to a warm glow for Calm mode.
  </div>
  <div class="grid grid-cols-3 gap-4">
    <div v-for="f in fx" :key="f[0]" class="bg-a-panel rounded-2xl flex flex-col gap-3 box-border" style="padding:18px 20px;min-height:226px">
      <button class="rounded-[14px] border-0 text-[28px] font-extrabold flex items-center justify-center gap-3.5" style="min-height:96px" :style="{ background: f[2], color: f[3] }" @click="fire(f[0]!)">{{ f[1] }}<span class="text-sm font-extrabold rounded-lg" style="background:#00000033;padding:3px 10px">{{ f[4] }}</span></button>
      <div class="text-base font-bold">{{ f[5] }}</div>
      <div class="text-sm font-semibold text-a-muted mt-auto">Shows and sounds on every screen, including the stage.</div>
    </div>
    <div class="bg-a-panel rounded-2xl flex flex-col gap-3 box-border" style="padding:18px 20px;min-height:226px">
      <label class="flex flex-col gap-1.5 text-[13px] font-bold text-a-muted">Banner text (up to 80 characters)
        <input v-model="banner" maxlength="80" class="a-input" style="min-height:48px;font-size:18px;font-weight:700"></label>
      <button class="rounded-[14px] border-0 text-2xl font-extrabold" style="min-height:60px;background:#6EE7A8;color:#06210F" :disabled="!banner.trim()" @click="fire('banner', banner)">Banner</button>
      <div class="text-sm font-semibold text-a-muted mt-auto">Dressed with webs on the Halloween side, ribbons on the Christmas side. Plays a call sound.</div>
    </div>
  </div>
  <section aria-label="Hint" class="bg-a-panel rounded-[14px] flex items-center gap-5" style="padding:14px 20px">
    <div><div class="text-[17px] font-extrabold">Trick or Treat hint</div><div class="text-sm font-semibold text-a-muted">Adds a small box to the player left rail with the starter code only.</div></div>
    <div class="flex-1" />
    <button class="a-btn primary" :disabled="s.party.state.hintRevealed" @click="hint">{{ s.party.state.hintRevealed ? 'Hint revealed' : 'Reveal a hint' }}</button>
  </section>
  <section aria-label="Sound" class="bg-a-panel rounded-[14px] flex items-center gap-5" style="padding:14px 20px">
    <div><div class="text-[17px] font-extrabold">Host sound</div><div class="text-sm font-semibold text-a-muted">Plays on the host's machine only: the midnight chime and the raffle sting. Off by default. Effect sounds play everywhere; each viewer can mute them from the speaker in their corner.</div></div>
    <div class="flex-1" />
    <label class="flex items-center gap-2.5 text-base font-bold"><input type="checkbox" :checked="s.party.settings.hostSound.chime" style="width:24px;height:24px;accent-color:#FF7A1A" @change="sound('chime', ($event.target as HTMLInputElement).checked)">Midnight chime</label>
    <label class="flex items-center gap-2.5 text-base font-bold"><input type="checkbox" :checked="s.party.settings.hostSound.sting" style="width:24px;height:24px;accent-color:#FF7A1A" @change="sound('sting', ($event.target as HTMLInputElement).checked)">Raffle sting</label>
  </section>
</template>
