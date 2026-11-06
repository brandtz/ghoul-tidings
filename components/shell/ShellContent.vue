<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCalm } from '~/composables/useCalm'
import { usePartyStore } from '~/stores/party'

const props = defineProps<{ stage?: boolean; thumb?: boolean; stacked?: boolean }>()
const store = usePartyStore()
const { toggle } = useCalm()
const showBoard = ref(false)
const showHint = ref(false)
const showTtl = ref(false)
const showReact = ref(false)
const showBag = ref(false)
const showBingo = ref(false)
const showLegendary = ref(false)
// Opens by itself the moment the code lands, not on later reloads. The host switch closes it.
watch(() => store.me?.unlocks.legendary, (on, was) => { if (on && was === false) showLegendary.value = true })
// Same for bingo: the card slides out the moment the code lands.
watch(() => !!store.me?.bingoCard, (on, was) => { if (on && was === false) showBingo.value = true })
const personal = computed(() => !props.stage && !props.thumb)
const hasSeat = computed(() => !!store.me)

const flashing = ref(false)
const glowing = ref(false)
function beat() {
  if (store.calm) { glowing.value = true; setTimeout(() => { glowing.value = false }, 650) }
  else { flashing.value = false; requestAnimationFrame(() => { flashing.value = true; setTimeout(() => { flashing.value = false }, 950) }) }
}
watch(() => store.momentKey, beat)
watch(() => store.effect, (e) => { if (e?.key === 'lightning') beat() })
</script>

<template>
  <GameFrame :glowing="glowing"><slot /></GameFrame>
  <FrameOrnaments v-if="!stacked" />

  <template v-if="stacked && personal && hasSeat">
    <ScorePill @board="showBoard = true" />
  </template>

  <aside v-if="personal && hasSeat" class="rail rail-left" aria-label="Party actions">
    <TruthsCard @open="showTtl = true" />
    <CodesHintCard @open="showHint = true" />
    <PowerUpCard />
    <BingoCard @open="showBingo = true" />
    <LegendaryCard @open="showLegendary = true" />
  </aside>
  <aside class="rail rail-right" aria-label="Raffle">
    <RaffleCountdownCard />
    <RecentWinnerCard />
  </aside>

  <template v-if="personal && hasSeat && !stacked">
    <ScorePill @board="showBoard = true" />
    <button class="side-btn" style="left:596px" :aria-pressed="store.calm" aria-label="Calm mode" title="Calm mode" @click="toggle">☾</button>
    <button class="side-btn" style="left:1272px" :aria-expanded="showReact" aria-label="Reactions" title="Reactions" @click="showReact = !showReact">☺</button>
    <ReactionsTray v-if="showReact" />
  </template>
  <SpiritBar v-if="stage" />
  <ReactionPlume v-if="!thumb" :stage="stage" />

  <EffectCanvas v-if="!thumb" :stage="stage" />
  <Toasts v-if="personal" />
  <MuteButton v-if="!thumb" />
  <SystemBanner v-if="!thumb" />
  <Ticker v-if="!thumb" />
  <ConsoleDrawer v-if="personal && store.me?.unlocks.console" />

  <RaffleMoment v-if="!thumb" :personal="personal">
    <template #lightning>
      <div class="abs0 no-pe" :class="{ flash: flashing }" style="width:1920px;height:1080px;position:absolute">
        <div class="bloom" />
        <svg class="abs0 bolts" aria-hidden="true" width="1920" height="1080" viewBox="0 0 1920 1080">
          <g fill="none" stroke-linejoin="round" stroke-linecap="round">
            <path d="M360 0 L318 150 L372 160 L270 340 L328 352 L214 590" stroke="#8B5CF6" stroke-width="16" opacity=".5" />
            <path d="M360 0 L318 150 L372 160 L270 340 L328 352 L214 590" stroke="#F1E9FF" stroke-width="5" />
            <path d="M1560 0 L1604 170 L1548 180 L1664 380 L1604 392 L1710 640" stroke="#8B5CF6" stroke-width="16" opacity=".5" />
            <path d="M1560 0 L1604 170 L1548 180 L1664 380 L1604 392 L1710 640" stroke="#F1E9FF" stroke-width="5" />
          </g>
        </svg>
      </div>
    </template>
  </RaffleMoment>

  <HintModal v-if="showHint" @close="showHint = false" @bag="showHint = false; showBag = true" @bingo="showHint = false; showBingo = true" />
  <BagModal v-if="showBag" @close="showBag = false" />
  <BingoModal v-if="personal && showBingo && store.me?.bingoCard" @close="showBingo = false" />
  <TtlDialog v-if="showTtl" @close="showTtl = false" />
  <LeaderboardDrawer v-if="showBoard" @close="showBoard = false" />
  <LegendaryModal v-if="personal && showLegendary && store.me?.unlocks.legendary" @close="showLegendary = false" />
</template>
