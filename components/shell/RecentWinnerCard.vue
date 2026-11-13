<script setup lang="ts">
// Every prize handed out so far, newest first. The newest row is highlighted.
import { computed } from 'vue'
import { usePartyStore } from '~/stores/party'

const store = usePartyStore()
const list = computed(() => store.snap?.winners ?? [])
</script>

<template>
  <section class="card" style="padding:14px 14px 14px;box-shadow:inset 0 0 24px #00000088">
    <div class="card-label">Winners<template v-if="list.length"> · {{ list.length }}</template></div>
    <ol v-if="list.length" class="scroll" aria-label="Prize winners, newest first" style="list-style:none;margin:10px 0 0;padding:0 2px 0 0;display:flex;flex-direction:column;gap:6px;max-height:400px">
      <li
        v-for="(w, i) in list" :key="`${w.at}-${w.name}`" class="inner-pill"
        style="display:flex;align-items:center;gap:8px;padding:6px 8px;min-height:44px"
        :style="i === 0 ? 'outline:2px solid var(--border2)' : ''"
      >
        <Avatar :avatar-key="w.avatarKey" :size="34" :ring="i === 0 ? 'var(--border2)' : undefined" />
        <span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15">
          <span style="font-size:17px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ w.name }}</span>
          <span style="font-size:14px;font-weight:700;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" :title="w.prize">{{ w.prize }}</span>
        </span>
      </li>
    </ol>
    <div v-else class="inner-pill" style="margin-top:10px;display:flex;align-items:center;padding:8px;min-height:48px">
      <span style="font-size:18px;font-weight:700;color:var(--muted);flex:1;text-align:center">Nobody yet. Could be you.</span>
    </div>
  </section>
</template>
