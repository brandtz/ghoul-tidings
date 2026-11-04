import { onBeforeUnmount, onMounted } from 'vue'
import { FROG } from '~~/shared/catalog'
import { usePartyStore } from '~/stores/party'

/** Typing the Wednesday phrase anywhere, even inside a text field, unlocks the frog.
 *  Before joining it appears in the picker; after joining it swaps the player's avatar. */
export function useFrogCode() {
  const store = usePartyStore()
  let buf = ''

  function onKey(e: KeyboardEvent) {
    if (e.key.length !== 1 || !/[a-z]/i.test(e.key)) return
    buf = (buf + e.key.toLowerCase()).slice(-FROG.phrase.length)
    if (buf !== FROG.phrase) return
    buf = ''
    store.frogUnlocked = true
    if (store.me && store.me.avatarKey !== FROG.key) store.act('/api/avatar', { avatarKey: FROG.key })
  }
  onMounted(() => window.addEventListener('keydown', onKey))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
}
