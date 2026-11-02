import { subscribe } from '~~/server/engine/bus'
export default defineEventHandler(async (event) => {
  const stream = createEventStream(event)
  const off = subscribe((m) => { stream.push(JSON.stringify(m)).catch(() => {}) })
  const ping = setInterval(() => { stream.push(JSON.stringify({ type: 'ping' })).catch(() => {}) }, 15000)
  stream.onClosed(() => { off(); clearInterval(ping) })
  return stream.send()
})
