<script setup lang="ts">
// Ghoul Bingo, the 75-ball game. Players see the latest balls and their own card;
// the stage shows the big ball and the board of every number drawn.
import { computed } from 'vue'
import { LETTERS, PATTERN_HELP, PATTERN_LABEL, type BallPattern } from '~~/shared/balls'
import { usePartyStore } from '~/stores/party'

const props = defineProps<{ stage?: boolean }>()
const store = usePartyStore()
const b = computed(() => store.snap?.balls)
const last = computed(() => b.value?.drawn.at(-1) ?? null)
const recent = computed(() => [...(b.value?.drawn ?? [])].reverse().slice(1, props.stage ? 6 : 5))
const drawn = computed(() => new Set(b.value?.drawn ?? []))
const hasCard = computed(() => !props.stage && !!store.me?.balls.card)
const lastGame = computed(() => b.value?.history.at(-1) ?? null)
const SHAPES: Record<BallPattern, number[]> = { line: [10, 11, 12, 13, 14], corners: [0, 4, 20, 24], blackout: Array.from({ length: 25 }, (_, i) => i) }
</script>

<template>
  <div class="screen" :class="{ scroll: !stage }" style="padding:22px 32px 16px;gap:12px">
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <h1 class="h-display" style="font-size:36px;margin:0">Ghoul Bingo</h1>
      <span v-if="b?.game" class="chip" style="font-size:18px">Game {{ b.game }} · {{ PATTERN_LABEL[b.pattern] }}</span>
      <div style="flex:1" />
      <div v-if="b?.game && b.status !== 'idle'" aria-hidden="true" style="display:grid;grid-template-columns:repeat(5,9px);gap:2px" :title="PATTERN_HELP[b.pattern]">
        <span v-for="i in 25" :key="i" style="width:9px;height:9px;border-radius:2px" :style="{ background: SHAPES[b.pattern].includes(i - 1) ? 'var(--border2)' : '#34375E' }" />
      </div>
      <span v-if="b?.drawn.length" style="font-size:17px;font-weight:800;color:var(--muted)">{{ b.drawn.length }} of 75 drawn</span>
    </div>

    <!-- Between games -->
    <div v-if="!b || b.status === 'idle'" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:16px">
      <template v-if="lastGame">
        <div style="font-size:24px;font-weight:800;color:#B9B6D6">Game {{ lastGame.game }} winner{{ lastGame.winners.length === 1 ? '' : 's' }}</div>
        <div class="cinzel" style="font-size:52px;font-weight:900;color:var(--border2);line-height:1.15">{{ lastGame.winners.join(', ') || 'Nobody this time' }}</div>
        <div style="font-size:22px;font-weight:700;color:#B9B6D6">The next game brings a fresh card.</div>
      </template>
      <h2 v-else class="h-display" style="font-size:46px">Cards are coming. Get your dabber ready.</h2>
    </div>

    <!-- Player: balls on the left, card on the right -->
    <div v-else-if="hasCard" class="balls-player" style="flex:1;display:flex;gap:28px;align-items:flex-start;justify-content:center">
      <div class="balls-side" style="width:250px;display:flex;flex-direction:column;align-items:center;gap:14px;padding-top:30px">
        <BingoBall v-if="last" :key="last" :n="last" :size="170" pop />
        <div v-else style="width:170px;height:170px;border-radius:50%;border:3px dashed #34375E;display:flex;align-items:center;justify-content:center;text-align:center;font-size:18px;font-weight:800;color:var(--muted)">First ball<br>coming up</div>
        <div v-if="recent.length" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
          <BingoBall v-for="n in recent" :key="n" :n="n" :size="52" />
        </div>
        <div v-if="b.status === 'won'" style="font-size:20px;font-weight:900;color:var(--border2);text-align:center">BINGO! {{ b.winners.map(w => w.name).join(', ') }}</div>
      </div>
      <div style="flex:1;max-width:600px"><BallsBoard :tile="78" /></div>
    </div>

    <!-- Stage, or a player who joined after the cards went out -->
    <div v-else style="flex:1;display:flex;flex-direction:column;gap:16px;min-height:0">
      <div style="display:flex;gap:30px;align-items:center">
        <div style="width:300px;display:flex;flex-direction:column;align-items:center;gap:12px">
          <BingoBall v-if="last" :key="last" :n="last" :size="230" pop />
          <div v-else style="width:230px;height:230px;border-radius:50%;border:3px dashed #34375E;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:var(--muted)">First ball soon</div>
          <div v-if="recent.length" style="display:flex;gap:6px">
            <BingoBall v-for="n in recent" :key="n" :n="n" :size="46" />
          </div>
        </div>
        <div style="flex:1;display:grid;grid-template-columns:40px repeat(15,minmax(0,1fr));gap:4px">
          <template v-for="(l, r) in LETTERS" :key="l">
            <div class="cinzel" style="font-size:28px;font-weight:900;color:var(--border2);display:flex;align-items:center;justify-content:center">{{ l }}</div>
            <div
              v-for="c in 15" :key="c"
              style="height:58px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:21px;font-weight:900"
              :style="drawn.has(r * 15 + c) ? (r * 15 + c === last ? 'background:var(--border2);color:#140A05' : 'background:var(--border);color:#140A05') : 'background:#15172F;color:#4A4E7A'"
            >{{ r * 15 + c }}</div>
          </template>
        </div>
      </div>
      <div style="flex:1" />
      <div v-if="b.winners.length" style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:center">
        <span class="chip">BINGO!</span>
        <span v-for="w in b.winners" :key="w.name" style="display:flex;align-items:center;gap:8px;font-size:24px;font-weight:900"><Avatar :avatar-key="w.avatarKey" :size="40" />{{ w.name }}</span>
      </div>
      <div v-else style="text-align:center;font-size:20px;font-weight:700;color:#B9B6D6">{{ PATTERN_LABEL[b.pattern] }}: {{ PATTERN_HELP[b.pattern] }} Dab your own card, then press Bingo!</div>
      <div v-if="!stage" style="text-align:center;font-size:17px;font-weight:700;color:var(--muted)">You joined after the cards went out. You get a card with the next game.</div>
    </div>
  </div>
</template>
