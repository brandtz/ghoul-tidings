<script setup lang="ts">
// Corners, crest, garland and bow above the frame. Never takes pointer events.
import { sceneGeometry } from '~/composables/sceneGeometry'
const geo = sceneGeometry()
</script>

<template>
<svg aria-hidden="true" width="1920" height="1080" viewBox="0 0 1920 1080" class="abs0 no-pe">
  <!-- gothic corners -->
  <g fill="none" stroke-width="6" stroke-linecap="round" style="stroke:var(--border2)">
    <path d="M440 168 Q440 96 512 96"/><path d="M1480 168 Q1480 96 1408 96"/><path d="M440 744 Q440 816 512 816"/><path d="M1480 744 Q1480 816 1408 816"/>
  </g>
  <g style="fill:var(--border2)"><circle cx="440" cy="96" r="9"/><circle cx="1480" cy="96" r="9"/><circle cx="440" cy="816" r="9"/><circle cx="1480" cy="816" r="9"/></g>
  <!-- gothic crest -->
  <g style="opacity:var(--o-crest)">
    <path d="M884 96 Q918 90 934 66 Q948 44 960 20 Q972 44 986 66 Q1002 90 1036 96Z" style="fill:#120B1E;stroke:var(--border)" stroke-width="5"/>
    <path d="M920 90 Q960 76 1000 90" fill="none" style="stroke:var(--border2)" stroke-width="3"/>
    <path d="M960 40 l10 18 l-10 18 l-10 -18Z" style="fill:var(--border2)"/>
  </g>
  <!-- garland -->
  <g style="opacity:var(--o-garland)">
    <rect x="426" y="82" width="1068" height="748" rx="26" fill="none" stroke="#0F4733" stroke-width="22" stroke-dasharray="30 6" stroke-linecap="round"/>
    <rect x="426" y="82" width="1068" height="748" rx="26" fill="none" stroke="#1F7A58" stroke-width="9" stroke-dasharray="12 24" stroke-linecap="round"/>
    <path class="twk" style="fill:#E0393E" :d="geo.fbA"/><path class="twk" style="fill:#F2C14E;animation-delay:.4s" :d="geo.fbB"/><path class="twk" style="fill:#7FB7E8;animation-delay:.8s" :d="geo.fbC"/><path class="twk" style="fill:#FF8FC7;animation-delay:1.2s" :d="geo.fbD"/>
  </g>
  <!-- bow -->
  <g style="opacity:var(--o-bow)" transform="translate(960 84)">
    <path d="M0 0 C-60 -52 -108 -26 -88 18 C-64 40 -22 20 0 0Z" fill="#B5202F"/><path d="M0 0 C60 -52 108 -26 88 18 C64 40 22 20 0 0Z" fill="#B5202F"/>
    <path d="M-6 6 L-44 58 L-24 52 L-8 70Z" fill="#8F1624"/><path d="M6 6 L44 58 L24 52 L8 70Z" fill="#8F1624"/>
    <path d="M-70 -8 C-50 -24 -28 -16 -12 0" fill="none" stroke="#E0525E" stroke-width="3"/><path d="M70 -8 C50 -24 28 -16 12 0" fill="none" stroke="#E0525E" stroke-width="3"/>
    <ellipse cx="0" cy="4" rx="20" ry="17" fill="#D13445"/>
  </g>
</svg>
</template>
