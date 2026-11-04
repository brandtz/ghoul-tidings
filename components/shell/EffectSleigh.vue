<script setup lang="ts">
// Skeleton Santa's sleigh run, right to left across the sky. Lifted above the frame
// while a question is open so it never covers answers.
defineProps<{ high?: boolean }>()
const deer = [0, 1, 2, 3]
</script>

<template>
  <div class="fx-sleigh-track no-pe" :class="{ high }" aria-hidden="true">
    <div class="fx-sleigh">
      <svg viewBox="0 0 900 260" width="100%" height="100%">
        <!-- sparkle trail behind the sleigh -->
        <g class="fx-trail" fill="#FFE9A8">
          <circle cx="860" cy="176" r="4" /><circle cx="884" cy="160" r="3" /><circle cx="872" cy="196" r="2.5" /><circle cx="896" cy="182" r="2" />
          <path d="M840 150 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3Z" />
        </g>
        <!-- reindeer, four in pairs, with harness lines back to the sleigh -->
        <path d="M60 152 C240 160 420 170 560 168" stroke="#F2C14E" stroke-width="3" fill="none" />
        <path d="M60 168 C240 176 420 184 560 180" stroke="#F2C14E" stroke-width="3" fill="none" />
        <g v-for="i in deer" :key="i" :transform="`translate(${10 + i * 128} ${118 - (i % 2) * 12})`">
          <g class="fx-gallop" :style="{ animationDelay: `${i * -0.12}s` }">
            <!-- legs -->
            <g stroke="#5A3A22" stroke-width="7" stroke-linecap="round">
              <path class="leg-a" d="M40 52 L28 88" /><path class="leg-b" d="M52 52 L50 90" />
              <path class="leg-a" d="M104 50 L118 86" /><path class="leg-b" d="M92 52 L96 90" />
            </g>
            <!-- body, neck, head -->
            <ellipse cx="72" cy="40" rx="46" ry="20" fill="#8A5A34" />
            <ellipse cx="72" cy="46" rx="30" ry="10" fill="#C79A6B" />
            <path d="M34 34 C24 22 20 10 22 0 L36 4 C38 14 42 22 48 28Z" fill="#8A5A34" />
            <ellipse cx="18" cy="0" rx="16" ry="10" fill="#8A5A34" />
            <circle cx="4" cy="2" r="4.5" :fill="i === 0 ? '#FF3B3B' : '#2A1A10'" />
            <circle cx="16" cy="-4" r="2.6" fill="#FFFFFF" /><circle cx="16" cy="-4" r="1.3" fill="#14101C" />
            <!-- antlers -->
            <path d="M24 -8 C26 -26 34 -34 46 -40 M30 -22 L22 -34 M38 -32 L40 -46 M24 -8 C18 -22 8 -26 0 -28 M14 -22 L12 -34" stroke="#E8D6B8" stroke-width="4" stroke-linecap="round" fill="none" />
            <path d="M118 34 C128 30 132 24 130 18" stroke="#8A5A34" stroke-width="6" stroke-linecap="round" fill="none" />
            <!-- collar with a bell -->
            <path d="M32 26 C40 34 50 36 54 30" stroke="#C8102E" stroke-width="6" fill="none" />
            <circle cx="48" cy="38" r="5" fill="#F2C14E" />
          </g>
        </g>
        <!-- sleigh -->
        <g transform="translate(540 70)">
          <path d="M20 150 C10 150 4 160 12 168 L300 168 C326 168 340 150 336 132" stroke="#F2C14E" stroke-width="7" fill="none" stroke-linecap="round" />
          <path d="M60 140 L60 166 M250 140 L250 166" stroke="#F2C14E" stroke-width="6" />
          <!-- skeleton santa -->
          <g transform="translate(120 -34)">
            <path d="M14 104 C14 70 30 52 60 52 C90 52 106 70 106 104Z" fill="#C8102E" />
            <path d="M54 52 L60 104 L66 52Z" fill="#F4F0FA" opacity=".9" />
            <!-- waving bony arm -->
            <g class="fx-wave">
              <path d="M24 70 L4 46 L-6 18" stroke="#F4F0FA" stroke-width="7" stroke-linecap="round" fill="none" />
              <path d="M-6 18 l-8 -10 m8 10 l-2 -14 m2 14 l6 -12 m-6 12 l10 -6" stroke="#F4F0FA" stroke-width="4" stroke-linecap="round" />
              <path d="M18 64 L30 78" stroke="#F4F0FA" stroke-width="14" stroke-linecap="round" />
            </g>
            <!-- skull -->
            <path d="M34 30 C34 8 86 8 86 30 C86 42 80 46 76 48 L76 56 L44 56 L44 48 C40 46 34 42 34 30Z" fill="#F4F0FA" />
            <ellipse cx="50" cy="30" rx="7.5" ry="8.5" fill="#14101C" /><ellipse cx="70" cy="30" rx="7.5" ry="8.5" fill="#14101C" />
            <circle cx="50" cy="31" r="2" fill="#7FE7FF" /><circle cx="70" cy="31" r="2" fill="#7FE7FF" />
            <path d="M60 37 l-4 7 h8Z" fill="#14101C" />
            <path d="M46 50 h28 M52 47 v9 M60 47 v9 M68 47 v9" stroke="#14101C" stroke-width="2" />
            <!-- hat -->
            <path d="M30 18 C34 -8 70 -18 96 -2 C104 4 110 14 112 22 L96 18 C86 4 64 -2 40 14Z" fill="#C8102E" />
            <path d="M28 20 C44 10 76 10 92 18 L92 26 C76 18 44 18 28 28Z" fill="#F4F0FA" />
            <circle cx="114" cy="24" r="9" fill="#F4F0FA" />
          </g>
          <!-- sack of gifts -->
          <path d="M234 64 C220 40 236 18 258 20 C282 22 292 46 280 68Z" fill="#5A3A22" />
          <rect x="240" y="8" width="22" height="20" rx="2" fill="#2FA060" /><path d="M251 8 v20 M240 18 h22" stroke="#F2C14E" stroke-width="3" />
          <rect x="264" y="14" width="18" height="16" rx="2" fill="#7FB7E8" />
          <!-- sleigh body -->
          <path d="M30 60 L250 60 C300 60 330 82 330 112 C330 134 300 146 270 146 L60 146 C30 146 20 120 26 96 Z" fill="#A50D26" />
          <path d="M30 60 L250 60 C300 60 330 82 330 112" stroke="#F2C14E" stroke-width="6" fill="none" />
          <path d="M26 96 C14 90 6 72 14 60 C20 50 34 52 34 62" stroke="#F2C14E" stroke-width="6" fill="none" />
          <path d="M90 104 C110 88 130 120 150 104 C170 88 190 120 210 104" stroke="#F2C14E" stroke-width="4" fill="none" />
        </g>
      </svg>
    </div>
  </div>
</template>
