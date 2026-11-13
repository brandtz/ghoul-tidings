// Ghoul Bingo: 75-ball bingo run in the balls segment. The host draws balls, by hand or
// on a timer. Players dab their own cards (kept on their device) and press Bingo!.
// The server checks the claim against the drawn balls, so there is nothing to review.
// Everyone who completes the pattern on the same ball wins.
import { ballCard, ballLabel, BALL_FREE, defaultPattern, meetsPattern, PATTERN_LABEL, type BallPattern } from '~~/shared/balls'
import { db, log, type Player } from './db'
import { broadcast } from './bus'
import { Conflict, Validation } from './errors'
import { applyScore } from './scores'

/** Late claims for the winning ball still count for this long after the first winner. */
export const TIE_WINDOW_MS = 15000
const RAFFLE_BEAT_MS = 8500

const state = () => db().party.state.balls
const name = (id: string) => db().players.find(p => p.id === id)?.displayName ?? '?'
export const cardFor = (playerId: string, game: number) => ballCard(`${db().party.id}:${game}:${playerId}`)

export function ballsPublic() {
  const b = state(); const d = db()
  return {
    game: b.game, status: b.status, pattern: b.pattern, drawn: b.drawn, auto: b.auto, everyS: b.everyS,
    winners: b.winners.map((w) => {
      const p = d.players.find(x => x.id === w.playerId)
      return { name: p?.displayName ?? '?', avatarKey: p?.avatarKey ?? 'skelly' }
    }),
    history: b.history,
  }
}

export function myBalls(playerId: string) {
  const b = state()
  if (b.status === 'idle' || !b.game) return { card: null, won: false }
  return { card: cardFor(playerId, b.game), won: b.winners.some(w => w.playerId === playerId) }
}

export function newGame(pattern?: BallPattern) {
  const b = state()
  if (b.status === 'playing') throw Conflict('Finish the current game first')
  if (b.status === 'won') finishGame(false)
  b.game += 1
  b.status = 'playing'; b.pattern = pattern ?? defaultPattern(b.game); b.drawn = []; b.winners = []; b.wonAt = null; b.falseCalls = 0
  b.lastDrawAt = Date.now()
  log('bingo', `Ghoul Bingo game ${b.game} started: ${PATTERN_LABEL[b.pattern]}`, {}, 'host')
  broadcast('ticker', { kind: 'treat', text: `Ghoul Bingo game ${b.game}: ${PATTERN_LABEL[b.pattern]}. New cards are out!` }, { bump: false })
  broadcast('state.changed', {})
}

export function drawBall(by = 'host') {
  const b = state()
  if (b.status !== 'playing') throw Conflict(b.status === 'won' ? 'This game has a winner' : 'Start a game first')
  const left = Array.from({ length: 75 }, (_, i) => i + 1).filter(n => !b.drawn.includes(n))
  if (!left.length) throw Validation('All 75 balls are out')
  const n = left[Math.floor(Math.random() * left.length)]!
  b.drawn.push(n); b.lastDrawAt = Date.now()
  log('bingo', `Ball ${b.drawn.length}: ${ballLabel(n)}`, {}, by)
  broadcast('state.changed', {})
  return n
}

export function undoBall() {
  const b = state()
  if (b.status !== 'playing' || !b.drawn.length) throw Conflict('No ball to take back')
  const n = b.drawn.pop()!
  log('bingo', `Ball taken back: ${ballLabel(n)}`, {}, 'host')
  broadcast('state.changed', {})
}

export function setAuto(on: boolean, everyS?: number) {
  const b = state()
  if (everyS) b.everyS = Math.min(30, Math.max(3, Math.round(everyS)))
  b.auto = on
  b.lastDrawAt = Date.now()
  log('bingo', on ? `Auto-draw on, every ${b.everyS} s` : 'Auto-draw off', {}, 'host')
  broadcast('state.changed', {})
}

/** Called once a second from the host's tick. */
export function autoDraw() {
  const d = db(); const b = state(); const now = Date.now()
  if (b.status !== 'playing' || !b.auto || d.party.state.partyPaused || b.drawn.length >= 75) return
  if (now - b.lastDrawAt < b.everyS * 1000) return
  // Hold the next ball while a raffle winner is on screen.
  const lastRaffle = Math.max(0, ...d.draws.map(x => x.drawnAt))
  if (now - lastRaffle < RAFFLE_BEAT_MS) return
  drawBall('auto-draw')
}

/** Ends the game. Cards disappear; the result goes into history. */
export function finishGame(announce = true) {
  const b = state()
  if (b.game && b.status !== 'idle') b.history.push({ game: b.game, pattern: b.pattern, winners: b.winners.map(w => name(w.playerId)), balls: b.drawn.length })
  b.status = 'idle'; b.auto = false
  log('bingo', `Ghoul Bingo game ${b.game} finished`, {}, 'host')
  if (announce) broadcast('state.changed', {})
}

export function claimBalls(player: Player, marked: number[]) {
  const d = db(); const b = state(); const now = Date.now()
  if (b.status === 'idle') throw Conflict('No bingo game is running')
  if (b.winners.some(w => w.playerId === player.id)) throw Conflict('You already won this game. Nicely done.')
  if (b.status === 'won' && now > (b.wonAt ?? 0) + TIE_WINDOW_MS) throw Conflict('Too late. This game already has its winner.')
  const card = cardFor(player.id, b.game)
  const drawn = new Set(b.drawn)
  const good = new Set(marked.filter(i => Number.isInteger(i) && i >= 0 && i < 25 && (i === BALL_FREE || drawn.has(card[i]!))))
  if (!meetsPattern(good, b.pattern)) {
    b.falseCalls += 1
    const wrong = marked.filter(i => i !== BALL_FREE && i >= 0 && i < 25 && !drawn.has(card[i]!)).map(i => card[i]!)
    log('bingo', `False bingo from ${player.displayName}${wrong.length ? ` (not drawn: ${wrong.join(', ')})` : ''}`, {}, player.displayName)
    throw Validation(wrong.length ? `Not quite. ${wrong.length === 1 ? `${wrong[0]} hasn't` : `${wrong.join(', ')} haven't`} been drawn yet.` : `Not yet. You need ${PATTERN_LABEL[b.pattern].toLowerCase()}.`)
  }
  const ball = b.drawn.at(-1) ?? 0
  const first = b.status === 'playing'
  b.winners.push({ playerId: player.id, ball, at: now })
  if (first) { b.status = 'won'; b.wonAt = now; b.auto = false }
  const pts = d.party.settings.points.ballsWin
  const actionId = `balls:${b.game}:${player.id}`
  applyScore({ playerId: player.id, teamId: player.teamId, source: 'balls', basePoints: pts, refType: 'balls', refId: `${b.game}`, idempotencyKey: actionId, actionId, actionLabel: `Ghoul Bingo game ${b.game}, ${player.displayName}` })
  log('score', `Ghoul Bingo game ${b.game}: ${player.displayName} wins +${pts}${first ? '' : ' (same ball)'}`, { actionId, reversible: true }, player.displayName)
  broadcast('effect.global', { key: 'banner', text: `BINGO! ${player.displayName}` }, { bump: false })
  broadcast('ticker', { kind: 'treat', text: `${player.displayName} has BINGO on ${ballLabel(ball)}! +${pts.toLocaleString()}` }, { bump: false })
  broadcast('scores.updated', {})
  broadcast('state.changed', {})
  return { won: true, points: pts }
}
