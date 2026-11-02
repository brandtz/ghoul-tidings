import { onMounted } from 'vue'
import { usePartyStore } from '~/stores/party'

/** Calm mode: on with prefers-reduced-motion, or by the player's own toggle. */
export function useCalm() {
  const store = usePartyStore()
  onMounted(() => {
    let saved: string | null = null
    try { saved = localStorage.getItem('gt_calm') } catch { /* private mode */ }
    store.calm = saved !== null ? saved === '1' : window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  const toggle = () => {
    store.calm = !store.calm
    try { localStorage.setItem('gt_calm', store.calm ? '1' : '0') } catch { /* private mode */ }
  }
  return { toggle }
}
