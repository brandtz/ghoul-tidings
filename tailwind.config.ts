import type { Config } from 'tailwindcss'

// Admin tokens from the design handoff. The party shell uses CSS variables from themeAt().
export default {
  content: ['./components/**/*.vue', './layouts/**/*.vue', './pages/**/*.vue', './app.vue'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
        nunito: ['Nunito', 'system-ui', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
      },
      colors: {
        a: {
          bg: '#0F1115', nav: '#13161C', panel: '#171A21', raised: '#1F232C', raised2: '#2A2F3B',
          text: '#E8EAF0', soft: '#C4CAD6', muted: '#9AA3B2', accent: '#FF7A1A', accentSoft: '#FFB36B',
          ok: '#6EE7A8', okBg: '#10281C', warn: '#FFD27A', warnBg: '#2B2412', dangerText: '#FF8F94',
          danger: '#E0393E', line: '#2B303B', liveBg: '#3A2A12',
        },
      },
    },
  },
} satisfies Config
