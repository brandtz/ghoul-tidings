<script setup lang="ts">
// Host broadcast banner. Dressed for whichever half of the party the theme is on.
defineProps<{ text: string; jolly: boolean }>()
// One corner web, drawn for the top left and mirrored into the other corners.
const web = 'M0 0L74 0M0 0L64 30M0 0L44 52M0 0L22 66M0 0L0 74'
  + 'M20 0Q18 7 18 8Q14 14 12 16Q8 18 6 19Q2 20 0 20'
  + 'M42 0Q38 14 37 17Q29 28 25 33Q15 38 12 40Q4 42 0 42'
  + 'M64 0Q58 22 56 26Q44 42 38 48Q24 56 18 59Q6 63 0 63'
</script>

<template>
  <div role="status" class="fx-banner no-pe" :class="jolly ? 'jolly' : 'spooky'">
    <template v-if="!jolly">
      <svg v-for="c in ['tl', 'tr', 'bl', 'br']" :key="c" class="fx-web" :class="c" viewBox="0 0 76 76" aria-hidden="true">
        <path :d="web" fill="none" stroke="#E9E4F5" stroke-width="1.6" stroke-linecap="round" opacity=".85" />
      </svg>
      <svg class="fx-spider" viewBox="0 0 40 120" aria-hidden="true">
        <path d="M20 0V78" stroke="#E9E4F5" stroke-width="1.4" />
        <g fill="#0B0814" stroke="#0B0814" stroke-width="2.4" stroke-linecap="round">
          <path d="M14 84 L2 76 M14 88 L0 90 M14 92 L3 102 M26 84 L38 76 M26 88 L40 90 M26 92 L37 102" fill="none" />
          <ellipse cx="20" cy="90" rx="9" ry="11" /><circle cx="20" cy="78" r="6" />
        </g>
        <circle cx="17.5" cy="77" r="1.6" fill="#FF7A1A" /><circle cx="22.5" cy="77" r="1.6" fill="#FF7A1A" />
      </svg>
    </template>
    <template v-else>
      <svg v-for="side in ['l', 'r']" :key="side" class="fx-ribbon" :class="side" viewBox="0 0 220 120" aria-hidden="true">
        <g class="wave">
          <path d="M220 40 C170 20 140 70 90 52 C50 38 30 70 0 58 L6 76 C34 86 58 58 94 72 C146 92 176 46 220 64Z" fill="#C8102E" />
          <path d="M220 40 C170 20 140 70 90 52 C50 38 30 70 0 58" fill="none" stroke="#F2C14E" stroke-width="3" />
          <path d="M220 64 C176 46 146 92 94 72 C58 58 34 86 6 76" fill="none" stroke="#F2C14E" stroke-width="3" />
        </g>
        <g class="wave slow">
          <path d="M220 72 C180 60 150 104 104 92 C70 84 46 108 14 100 L20 114 C50 120 74 98 108 106 C152 118 182 84 220 92Z" fill="#1E7A46" />
        </g>
      </svg>
      <svg class="fx-bow" viewBox="0 0 120 70" aria-hidden="true">
        <path d="M60 34 C40 4 6 8 10 30 C14 50 44 44 60 34Z M60 34 C80 4 114 8 110 30 C106 50 76 44 60 34Z" fill="#C8102E" stroke="#F2C14E" stroke-width="2.5" />
        <path d="M54 38 L38 68 L50 64 L56 70 Z M66 38 L82 68 L70 64 L64 70 Z" fill="#A50D26" stroke="#F2C14E" stroke-width="2" />
        <circle cx="60" cy="35" r="9" fill="#F2C14E" />
      </svg>
    </template>
    <div class="fx-banner-text">{{ text }}</div>
  </div>
</template>
