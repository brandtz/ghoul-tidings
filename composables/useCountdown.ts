import { onBeforeUnmount, onMounted, ref } from 'vue'
import { usePartyStore } from '~/stores/party'

/** Reactive server-synced time. Countdowns derive from timestamps, never a client timer. */
export function useNow(ms = 200) {
  const store = usePartyStore()
  const now = ref(store.now())
  let t: ReturnType<typeof setInterval>
  onMounted(() => { t = setInterval(() => { now.value = store.now() }, ms) })
  onBeforeUnmount(() => clearInterval(t))
  return now
}
