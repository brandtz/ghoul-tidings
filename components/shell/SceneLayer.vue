<script setup lang="ts">
// Illustrated background. Everything is driven by CSS variables set from themeAt(p),
// so scrubbing progress never re-renders this SVG. Port of the SCENE block in Shell.dc.html.
import { sceneGeometry } from '~/composables/sceneGeometry'
const geo = sceneGeometry()
</script>

<template>
<svg class="abs0" aria-hidden="true" width="1920" height="1080" viewBox="0 0 1920 1080" style="position:absolute;left:0;top:0">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--skyTop)"/><stop offset=".55" style="stop-color:var(--skyMid)"/><stop offset="1" style="stop-color:var(--skyLow)"/></linearGradient>
  <radialGradient id="moonGlow"><stop offset="0" style="stop-color:var(--moon);stop-opacity:.5"/><stop offset="1" style="stop-color:var(--moon);stop-opacity:0"/></radialGradient>
  <radialGradient id="lampGlow"><stop offset="0" style="stop-color:#FFC857;stop-opacity:.75"/><stop offset="1" style="stop-color:#FFC857;stop-opacity:0"/></radialGradient>
  <radialGradient id="pumpGlow"><stop offset="0" style="stop-color:#FF9A2E;stop-opacity:.6"/><stop offset="1" style="stop-color:#FF9A2E;stop-opacity:0"/></radialGradient>
  <radialGradient id="vig" cx=".5" cy=".5" r=".78"><stop offset=".5" style="stop-color:#000;stop-opacity:0"/><stop offset="1" style="stop-color:#000;stop-opacity:.6"/></radialGradient>

  <g id="bat"><path d="M0 0 C-8 -16 -30 -20 -50 -8 C-42 -2 -38 6 -32 6 C-28 0 -22 2 -17 9 C-12 3 -6 3 0 11 C6 3 12 3 17 9 C22 2 28 0 32 6 C38 6 42 -2 50 -8 C30 -20 8 -16 0 0Z" fill="#05040A"/><path d="M-6 -4 L-5 -15 L0 -8 L5 -15 L6 -4Z" fill="#05040A"/></g>

  <g id="spider"><path d="M-14 -4 L-26 -18 M-12 0 L-28 -4 M-12 4 L-26 14 M-8 8 L-18 24 M14 -4 L26 -18 M12 0 L28 -4 M12 4 L26 14 M8 8 L18 24" stroke="#05040A" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="2" rx="14" ry="16" fill="#05040A"/><circle cx="0" cy="-14" r="8" fill="#05040A"/><circle cx="-3" cy="-15" r="1.8" fill="#E66B1F"/><circle cx="3" cy="-15" r="1.8" fill="#E66B1F"/></g>

  <g id="hs"><path d="M-34 0 V-70 Q-34 -104 0 -104 Q34 -104 34 -70 V0Z" fill="#2B2842"/><path d="M-26 -6 V-68 Q-26 -94 0 -94" stroke="#46426A" stroke-width="4" fill="none"/><path d="M-12 -60 H12 M0 -72 V-44" stroke="#14112A" stroke-width="6"/><ellipse cx="0" cy="-101" rx="30" ry="9" fill="#F4F0FA" style="opacity:var(--o-caps)"/><path d="M-34 -72 Q-20 -64 -10 -74 Q0 -62 12 -72 Q24 -62 34 -72 V-80 Q34 -104 0 -104 Q-34 -104 -34 -80Z" fill="#F4F0FA" style="opacity:var(--o-caps)"/></g>

  <g id="pump"><circle cx="0" cy="-48" r="90" style="fill:url(#pumpGlow)"/><path d="M-6 -92 Q-4 -112 10 -118 L14 -112 Q6 -106 6 -92Z" fill="#2F7A3A"/><ellipse cx="0" cy="-50" rx="70" ry="52" fill="#E66B1F"/><path d="M-30 -98 Q-44 -50 -30 -2 M30 -98 Q44 -50 30 -2 M0 -102 V0" stroke="#B84A10" stroke-width="5" fill="none"/><path d="M-44 -66 L-24 -56 L-44 -46Z M44 -66 L24 -56 L44 -46Z M-26 -26 L-14 -34 L-6 -26 L6 -34 L14 -26 L26 -34 L22 -14 L8 -20 L0 -12 L-8 -20 L-22 -14Z" fill="#FFD36B" class="flick"/></g>

  <g id="lamp"><circle cx="0" cy="-138" r="84" style="fill:url(#lampGlow)" class="flick"/><rect x="-3" y="-120" width="6" height="120" fill="#17131F"/><path d="M-12 0 H12 L6 -14 H-6Z" fill="#17131F"/><rect x="-16" y="-156" width="32" height="40" rx="4" fill="#241D30" stroke="#E0A33A" stroke-width="3"/><rect x="-9" y="-148" width="18" height="26" fill="#FFC857"/><path d="M-21 -156 L0 -176 L21 -156Z" fill="#241D30"/><circle cx="0" cy="-180" r="4" fill="#E0A33A"/></g>

  <g id="fir"><rect x="-10" y="-14" width="20" height="26" fill="#2A1A14"/><path d="M-88 -10 L0 -140 L88 -10Z" fill="#0E3F2F"/><path d="M-70 -92 L0 -216 L70 -92Z" fill="#0F4733"/><path d="M-50 -170 L0 -296 L50 -170Z" fill="#115238"/><path d="M-62 -40 Q-30 -56 0 -42 Q30 -58 62 -40 L0 -140Z" fill="#F4F0FA" opacity=".9"/><path d="M-46 -118 Q-22 -132 0 -120 Q22 -134 46 -118 L0 -216Z" fill="#F4F0FA" opacity=".9"/><path d="M-30 -196 Q-12 -208 0 -198 Q12 -208 30 -196 L0 -296Z" fill="#F4F0FA" opacity=".9"/><path d="M-60 -34 L-24 -64 L18 -40 L50 -70 M-44 -112 L-8 -142 L26 -120 M-26 -188 L0 -212 L22 -194" stroke="#F7D774" stroke-width="3" fill="none" stroke-dasharray="1 9" stroke-linecap="round" style="opacity:var(--o-lights)"/><circle cx="-34" cy="-52" r="6" fill="#E0393E" style="opacity:var(--o-ornaments)"/><circle cx="30" cy="-86" r="6" fill="#F2C14E" style="opacity:var(--o-ornaments)"/><circle cx="-20" cy="-140" r="6" fill="#7FB7E8" style="opacity:var(--o-ornaments)"/><circle cx="16" cy="-180" r="5" fill="#E0393E" style="opacity:var(--o-ornaments)"/><path d="M0 -296 l7 16 h-14Z" fill="#F2C14E" style="opacity:var(--o-ornaments)"/></g>

  <g id="giftR"><rect x="-40" y="-52" width="80" height="52" rx="4" fill="#B5202F"/><rect x="-7" y="-52" width="14" height="52" fill="#F2C14E"/><rect x="-40" y="-30" width="80" height="12" fill="#F2C14E" opacity=".9"/><path d="M0 -52 C-26 -84 -44 -56 0 -52 C44 -56 26 -84 0 -52Z" fill="#F2C14E"/></g>
  <g id="giftG"><rect x="-36" y="-44" width="72" height="44" rx="4" fill="#155B43"/><rect x="-6" y="-44" width="12" height="44" fill="#E0393E"/><path d="M0 -44 C-22 -72 -38 -48 0 -44 C38 -48 22 -72 0 -44Z" fill="#E0393E"/></g>

  <g id="snowman"><circle cx="0" cy="-34" r="44" fill="#F4F0FA"/><circle cx="0" cy="-100" r="32" fill="#F4F0FA"/><circle cx="0" cy="-146" r="24" fill="#F4F0FA"/><rect x="-22" y="-182" width="44" height="26" rx="3" fill="#14101C"/><rect x="-32" y="-160" width="64" height="8" rx="3" fill="#14101C"/><path d="M-26 -124 H26 V-114 H-26Z" fill="#B5202F"/><path d="M14 -122 L24 -92 L12 -94Z" fill="#B5202F"/><path d="M0 -146 L20 -142 L0 -138Z" fill="#E66B1F"/><circle cx="-8" cy="-152" r="3" fill="#14101C"/><circle cx="8" cy="-152" r="3" fill="#14101C"/><circle cx="0" cy="-102" r="4" fill="#14101C"/><circle cx="0" cy="-84" r="4" fill="#14101C"/><circle cx="0" cy="-34" r="4" fill="#14101C"/><circle cx="0" cy="-52" r="4" fill="#14101C"/></g>

  <g id="tree" fill="none" stroke="#06050C" stroke-linecap="round" stroke-linejoin="round">
    <path d="M0 900 C70 780 10 650 90 530 C150 430 56 310 112 210 C146 148 118 70 156 0" stroke-width="54"/>
    <path d="M96 520 C190 490 268 420 340 398" stroke-width="24"/>
    <path d="M78 340 C170 312 230 236 310 204 C372 180 440 160 492 104" stroke-width="22"/>
    <path d="M122 190 C196 150 262 126 330 66 C372 30 420 24 470 40" stroke-width="18"/>
    <path d="M150 70 C200 60 250 30 300 8" stroke-width="14"/>
    <path d="M340 398 C380 380 410 340 450 332 M310 204 C330 170 330 140 360 120 M492 104 C520 90 540 70 560 74 M330 66 C340 40 366 30 390 10" stroke-width="9"/>
    <path d="M60 640 C20 610 0 580 -10 540 M100 760 C60 740 30 700 20 670" stroke-width="16"/>
  </g>
</defs>

<rect width="1920" height="1080" style="fill:url(#sky)"/>
<path style="fill:#FFFFFF;opacity:var(--o-stars)" :d="geo.starsD"/>

<!-- moon -->
<circle cx="330" cy="178" r="220" style="fill:url(#moonGlow)"/>
<circle cx="330" cy="178" r="84" style="fill:var(--moon)"/>
<circle cx="304" cy="160" r="16" fill="#000" opacity=".07"/><circle cx="352" cy="204" r="22" fill="#000" opacity=".06"/><circle cx="360" cy="150" r="9" fill="#000" opacity=".06"/>

<!-- sleigh across the moon -->
<g style="opacity:var(--o-sleigh)" transform="translate(190 150)" fill="#07050C">
  <path d="M120 40 Q150 8 196 18 L206 36 Q160 52 120 40Z"/><path d="M110 52 Q160 66 214 44" stroke="#07050C" stroke-width="5" fill="none"/>
  <ellipse cx="170" cy="8" rx="12" ry="14"/><path d="M158 -4 l12 -10 l12 10Z"/>
  <path d="M120 40 C90 38 70 34 40 30" stroke="#07050C" stroke-width="2.5" fill="none"/>
  <ellipse cx="30" cy="26" rx="16" ry="8"/><path d="M42 22 L54 8 L58 20Z"/><path d="M52 8 l-8 -12 m8 12 l6 -12 m-14 8 l-10 -4" stroke="#07050C" stroke-width="2" fill="none"/><path d="M20 32 l-6 14 m18 -6 l-2 14" stroke="#07050C" stroke-width="3" fill="none"/>
  <ellipse cx="-30" cy="22" rx="16" ry="8"/><path d="M-18 18 L-6 4 L-2 16Z"/><path d="M-8 4 l-8 -12 m8 12 l6 -12" stroke="#07050C" stroke-width="2" fill="none"/><path d="M-40 28 l-6 14 m18 -6 l-2 14" stroke="#07050C" stroke-width="3" fill="none"/>
  <path d="M-14 24 C-4 28 14 30 30 28" stroke="#07050C" stroke-width="2.5" fill="none"/>
</g>

<!-- distant skyline -->
<g style="opacity:var(--o-skyline)" fill="#07060D">
  <path d="M0 840 V700 L14 668 L28 700 V750 L50 750 V650 L64 606 L78 650 V750 H110 V710 L124 690 L138 710 V840Z"/>
  <path transform="translate(1920 0) scale(-1 1)" d="M0 840 V710 L12 676 L26 710 V760 L52 760 V670 L66 630 L80 670 V760 H116 V720 L130 700 L144 720 V840Z"/>
</g>

<!-- back firs -->
<g style="opacity:var(--o-firBack)">
  <use href="#fir" transform="translate(52 872) scale(1.25)"/>
  <use href="#fir" transform="translate(318 884) scale(.8)"/>
  <use href="#fir" transform="translate(1868 872) scale(1.25)"/>
  <use href="#fir" transform="translate(1602 884) scale(.8)"/>
  <use href="#fir" transform="translate(690 868) scale(.55)"/>
  <use href="#fir" transform="translate(1230 868) scale(.55)"/>
</g>

<!-- ground -->
<path d="M0 852 C200 820 380 852 600 844 C900 834 1100 848 1350 840 C1600 832 1750 852 1920 838 V1080 H0Z" style="fill:var(--groundBack)"/>
<path d="M0 852 C200 820 380 852 600 844 C900 834 1100 848 1350 840 C1600 832 1750 852 1920 838 V1080 H0Z" style="fill:var(--snow);opacity:var(--o-snowBack)"/>
<path d="M0 934 C260 902 480 942 760 926 C1040 910 1260 946 1540 922 C1700 908 1820 928 1920 918 V1080 H0Z" style="fill:var(--groundFront)"/>
<path d="M0 934 C260 902 480 942 760 926 C1040 910 1260 946 1540 922 C1700 908 1820 928 1920 918 V1080 H0Z" style="fill:var(--snow);opacity:var(--o-snowFront)"/>
<path d="M0 934 C260 902 480 942 760 926 C1040 910 1260 946 1540 922 C1700 908 1820 928 1920 918" fill="none" style="stroke:var(--snow);opacity:var(--o-frost)" stroke-width="7"/>

<!-- fog (Halloween) -->
<g style="opacity:var(--o-fog)" fill="#C9B8E8">
  <ellipse cx="420" cy="905" rx="360" ry="34" opacity=".12"/><ellipse cx="1500" cy="915" rx="400" ry="36" opacity=".12"/><ellipse cx="960" cy="950" rx="520" ry="26" opacity=".08"/>
</g>

<!-- twisted trees -->
<use href="#tree"/>
<use href="#tree" transform="translate(1920 0) scale(-1 1)"/>
<path style="fill:#FFFFFF;opacity:var(--o-frost)" d="M96 520 l60 -22 l-8 -10 l-52 18Z M78 340 l60 -26 l-6 -9 l-56 22Z M122 190 l70 -34 l-6 -9 l-66 30Z"/>

<!-- webs, spiders, bats (Halloween) -->
<g style="opacity:var(--o-webs)" fill="none" stroke="#D9CDE8" stroke-width="1.6" stroke-linecap="round">
  <path :d="geo.webTR" opacity=".5"/>
  <path :d="geo.webTL" opacity=".4"/>
  <path d="M1700 0 V130" stroke-width="1.4"/><path d="M262 0 V150" stroke-width="1.4"/><path d="M1560 0 V70" stroke-width="1.4"/>
</g>
<g style="opacity:var(--o-webs)"><use href="#spider" transform="translate(1700 150) scale(.8)"/><use href="#spider" transform="translate(262 168) scale(.7)"/><use href="#spider" transform="translate(1560 86) scale(.5)"/></g>
<g style="opacity:var(--o-bats)"><use href="#bat" transform="translate(262 120) scale(.9) rotate(-8)"/><use href="#bat" transform="translate(392 78) scale(.7) rotate(6)"/><use href="#bat" transform="translate(1640 250) scale(.6) rotate(-6)"/><use href="#bat" transform="translate(1790 190) scale(.8) rotate(8)"/></g>

<!-- headstones -->
<use href="#hs" transform="translate(112 992)"/>
<use href="#hs" transform="translate(250 1012) scale(.8)"/>
<use href="#hs" transform="translate(360 988) scale(.62)"/>
<use href="#hs" transform="translate(1560 988) scale(.66)"/>
<use href="#hs" transform="translate(1676 1012) scale(.85)"/>
<use href="#hs" transform="translate(1806 990)"/>

<!-- pumpkins -->
<g style="opacity:var(--o-pumpkins)"><use href="#pump" transform="translate(46 1066) scale(1.05)"/><use href="#pump" transform="translate(520 1036) scale(.5)"/><use href="#pump" transform="translate(1396 1040) scale(.5)"/></g>

<!-- lamps -->
<use href="#lamp" transform="translate(418 928)"/>
<use href="#lamp" transform="translate(1502 928)"/>

<!-- gifts + snowman (Christmas) -->
<g style="opacity:var(--o-gifts)"><use href="#giftR" transform="translate(448 1046) scale(.95)"/><use href="#giftG" transform="translate(528 1054) scale(.7)"/><use href="#giftG" transform="translate(1398 1054) scale(.75)"/><use href="#giftR" transform="translate(1478 1048) scale(.9)"/><use href="#giftR" transform="translate(1880 1058) scale(.8)"/></g>

<!-- front firs -->
<g style="opacity:var(--o-firFront)"><use href="#fir" transform="translate(180 1010) scale(.9)"/><use href="#fir" transform="translate(1720 1016) scale(.85)"/></g>

<g style="opacity:var(--o-snowman)"><use href="#snowman" transform="translate(1770 1040) scale(1.1)"/></g>

<!-- twinkle lights along the branches -->
<g style="opacity:var(--o-lights)">
  <path class="twk" style="fill:#E0393E" :d="geo.tbA"/><path class="twk" style="fill:#F2C14E;animation-delay:.4s" :d="geo.tbB"/><path class="twk" style="fill:#2FA060;animation-delay:.8s" :d="geo.tbC"/><path class="twk" style="fill:#7FB7E8;animation-delay:1.2s" :d="geo.tbD"/><path class="twk" style="fill:#FF8FC7;animation-delay:1.6s" :d="geo.tbE"/>
</g>


<rect width="1920" height="1080" style="fill:url(#vig)"/>
</svg>
<SnowCanvas />
</template>
