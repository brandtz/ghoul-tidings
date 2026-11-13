<script setup lang="ts">
// Bingo pool: one square per line. Each player's card is their own shuffle of 24 from it.
import { computed, ref } from 'vue'
import { BINGO_MIN, DEFAULT_BINGO_SQUARES } from '~~/shared/phase2'
import { useAdminStore } from '~/stores/admin'

const admin = useAdminStore()
const NL = '\n'
const saved = computed<string[]>(() => admin.a.party.settings.bingoSquares ?? DEFAULT_BINGO_SQUARES)
const squares = ref(saved.value.join(NL))
const lines = computed(() => [...new Set(squares.value.split(NL).map(x => x.trim()).filter(x => x && x.toUpperCase() !== 'FREE'))])
const tooLong = computed(() => lines.value.filter(x => x.length > 60))
const dirty = computed(() => lines.value.join(NL) !== saved.value.join(NL))
const open = computed(() => !!admin.a.bingo?.open)
const save = async () => {
  const text = open.value
    ? 'Bingo is open right now. Every player gets a fresh card from these squares and their dabs reset. Save anyway?'
    : 'Save these squares? Each player gets their own shuffle when bingo opens.'
  if (!await admin.confirm(text, 'Save bingo squares')) return
  if (await admin.content('settings', 'save', { bingoSquares: lines.value })) admin.flash(`Bingo now draws from ${lines.value.length} squares`)
}
</script>

<template>
  <section class="bg-a-panel rounded-xl flex flex-col gap-2" style="padding:14px 16px">
    <div class="a-eyebrow">Bingo squares</div>
    <div class="text-sm font-semibold text-a-muted">
      One square per line, at least {{ BINGO_MIN }}. Each player gets their own shuffle of {{ BINGO_MIN }} with FREE in the middle, so a longer list means more varied cards and a longer game.
      You call squares during the Meeting Bingo segment, from Run of show. Keep each under 60 characters.
    </div>
    <textarea v-model="squares" class="a-input" rows="16" style="padding:10px;line-height:1.45" aria-label="Bingo squares, one per line" />
    <div class="flex items-center gap-3 flex-wrap">
      <button class="a-btn primary" :disabled="!dirty || lines.length < BINGO_MIN || lines.length > 100 || tooLong.length > 0" @click="save">Save squares</button>
      <button class="a-btn" @click="squares = DEFAULT_BINGO_SQUARES.join(NL)">Restore the starter list</button>
      <span class="text-sm font-bold" :class="lines.length < BINGO_MIN || tooLong.length ? 'text-[#FF8A7A]' : 'text-a-muted'">
        {{ lines.length }} squares<template v-if="lines.length < BINGO_MIN">, need {{ BINGO_MIN - lines.length }} more</template><template v-if="tooLong.length">, {{ tooLong.length }} over 60 characters</template>
      </span>
    </div>
  </section>
</template>
