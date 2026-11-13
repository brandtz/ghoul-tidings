<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { teamHex } from '~~/shared/catalog'
import { usePartyStore } from '~/stores/party'

const emit = defineEmits<{ close: [] }>()
const store = usePartyStore()
const tab = ref<'people' | 'teams' | 'eggs'>('people')
const eggs = computed(() => store.snap?.eggBoard ?? null)
const badge: Record<string, string> = { shield: '🛡 Shielded', frozen: '❄ Frozen', rush: '🍬 Rush', sparkle: '✨ Sparkling' }
const top = computed(() => store.snap?.top10 ?? [])
const teams = computed(() => store.snap?.teams ?? [])
const outside = computed(() => { const m = store.me; return m && !top.value.some(r => r.id === m.id) ? m : null })
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') emit('close') }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="dim" @click="$emit('close')" />
  <section role="dialog" aria-label="Leaderboard" class="modal-card ov-card" style="position:absolute;left:600px;top:110px;width:720px;height:700px;padding:24px 28px;display:flex;flex-direction:column;gap:14px">
    <button aria-label="Close" style="position:absolute;right:14px;top:14px;width:48px;height:48px;border-radius:50%;border:3px solid var(--border);background:#140E24;color:var(--text);font-size:24px;font-weight:900" @click="$emit('close')">×</button>
    <h2 class="h-display" style="font-size:32px">Leaderboard</h2>
    <div role="tablist" style="display:flex;gap:8px">
      <button role="tab" :aria-selected="tab === 'people'" class="btn-ghost" :style="tab === 'people' ? 'background:var(--border);color:#140A05' : ''" @click="tab = 'people'">Top 10</button>
      <button v-if="store.snap?.flags.teams" role="tab" :aria-selected="tab === 'teams'" class="btn-ghost" :style="tab === 'teams' ? 'background:var(--border);color:#140A05' : ''" @click="tab = 'teams'">Team race</button>
      <button v-if="eggs" role="tab" :aria-selected="tab === 'eggs'" class="btn-ghost" :style="tab === 'eggs' ? 'background:var(--border);color:#140A05' : ''" @click="tab = 'eggs'">Egg hunt</button>
    </div>
    <div class="scroll" style="flex:1;display:flex;flex-direction:column;gap:6px">
      <template v-if="tab === 'people'">
        <div v-if="!top.length" style="font-size:20px;font-weight:700;color:var(--muted);padding:20px;text-align:center">No scores yet.</div>
        <div v-for="r in top" :key="r.id" class="inner-pill" :style="r.id === store.me?.id ? 'outline:2px solid var(--border2)' : ''" style="display:flex;align-items:center;gap:12px;min-height:52px;padding:0 14px">
          <span style="width:36px;font-size:20px;font-weight:900;color:var(--border2)">{{ r.rank }}</span>
          <Avatar :avatar-key="r.avatarKey" :size="36" />
          <span style="flex:1;font-size:20px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ r.name }}</span>
          <span style="font-size:20px;font-weight:900">{{ r.score.toLocaleString() }}</span>
        </div>
        <div v-if="outside" class="inner-pill" style="outline:2px solid var(--border2);display:flex;align-items:center;gap:12px;min-height:52px;padding:0 14px;margin-top:6px">
          <span style="width:36px;font-size:20px;font-weight:900;color:var(--border2)">{{ outside.rank }}</span>
          <Avatar :avatar-key="outside.avatarKey" :size="36" />
          <span style="flex:1;font-size:20px;font-weight:800">You</span>
          <span style="font-size:20px;font-weight:900">{{ outside.score.toLocaleString() }}</span>
        </div>
      </template>
      <template v-else-if="tab === 'eggs'">
        <div v-for="(e, i) in eggs ?? []" :key="e.name" class="inner-pill" style="display:flex;align-items:center;gap:12px;min-height:52px;padding:0 14px">
          <span style="width:36px;font-size:20px;font-weight:900;color:var(--border2)">{{ i + 1 }}</span>
          <Avatar :avatar-key="e.avatarKey" :size="36" />
          <span style="flex:1;font-size:20px;font-weight:800">{{ e.name }}</span>
          <span style="font-size:20px;font-weight:900">{{ e.eggs }} 🥚</span>
        </div>
      </template>
      <template v-else>
        <div v-if="!teams.length" style="font-size:20px;font-weight:700;color:var(--muted);padding:20px;text-align:center">No teams yet.</div>
        <div v-for="t in teams" :key="t.id" class="inner-pill" style="padding:10px 14px;display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;align-items:center;gap:10px;font-size:19px;font-weight:800">
            <Avatar :avatar-key="t.mascotKey" :size="32" :ring="teamHex(t.colorKey)" />
            <span style="flex:1">{{ t.name }}</span><span v-for="x in t.effects" :key="x" style="font-size:15px;color:var(--border2)">{{ badge[x] }}</span><span style="color:var(--muted);font-size:16px">{{ t.size }} players</span><span>{{ t.score.toLocaleString() }}</span>
          </div>
          <div style="height:10px;border-radius:5px;background:#1B1D38;overflow:hidden">
            <div :style="{ width: `${Math.max(2, t.position * 100)}%`, background: teamHex(t.colorKey) }" style="height:100%;transition:width 800ms ease-out" />
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
