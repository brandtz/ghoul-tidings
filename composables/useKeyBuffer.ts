import { onBeforeUnmount, onMounted } from 'vue'
import { usePartyStore } from '~/stores/party'

const TOKENS: Record<string, string> = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R' }

/** Last 32 keys pressed outside text inputs. Only runs once the hint is out or eggs are on. */
export function useKeyBuffer() {
  const store = usePartyStore()
  let buf = ''
  let timer: ReturnType<typeof setTimeout> | null = null

  function onKey(e: KeyboardEvent) {
    const s = store.snap
    if (!s?.me || !(s.flags.eggs || s.hintRevealed)) return
    const t = e.target as HTMLElement
    if (t?.closest?.('input,textarea,select,[contenteditable],[role=dialog]')) return
    const tok = TOKENS[e.key] ?? (e.key.length === 1 ? e.key.toUpperCase() : '')
    if (!tok) return
    buf = (buf + tok).slice(-32)
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      const tail = buf; buf = ''
      if (tail.length >= 4) store.act('/api/redeem', { tail })
    }, 800)
  }
  onMounted(() => window.addEventListener('keydown', onKey))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
}
