import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { themeAt } from '~~/shared/theme'

export function applyTheme(el: HTMLElement, p: number) {
  const t = themeAt(p)
  const s = el.style
  for (const [k, v] of Object.entries(t.colors)) s.setProperty(`--${k}`, v)
  for (const [k, v] of Object.entries(t.layers)) s.setProperty(`--o-${k}`, v.toFixed(3))
}

/** Keeps a root element's theme variables on target. Changes tween over 1.5 s. */
export function useThemeVars(el: Ref<HTMLElement | null>, target: Ref<number>) {
  const displayed = ref(target.value)
  let raf = 0
  const set = (p: number) => { displayed.value = p; if (el.value) applyTheme(el.value, p) }

  function tween(to: number) {
    cancelAnimationFrame(raf)
    const from = displayed.value; const t0 = performance.now()
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 1500)
      set(from + (to - from) * (k * k * (3 - 2 * k)))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    if (document.hidden) set(to)
    else raf = requestAnimationFrame(step)
  }
  onMounted(() => set(target.value))
  watch(target, tween)
  onBeforeUnmount(() => cancelAnimationFrame(raf))
  return displayed
}
