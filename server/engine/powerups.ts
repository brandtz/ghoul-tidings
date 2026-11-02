// Team power-ups. One slot per team, offered by rank band at each raffle beat.
// Each use is a status_effects row that the score pipeline reads.
import { randomInt } from 'node:crypto'
import { POWERUPS, TRAILING_POOL, rankBand, type PowerupKind } from '~~/shared/phase2'
import { db, log, uid, type Player } from './db'
import { broadcast } from './bus'
import { Conflict, Validation } from './errors'
import { activeEffect, teamBoard } from './scores'

export function grantPowerups() {
  const d = db()
  if (!d.party.settings.flags.powerups) return
  const teams = teamBoard()
  teams.forEach((t, i) => {
    if (d.teamPowerups[t.id]) return
    d.teamPowerups[t.id] = rankBand(i, teams.length) === 'leader' ? 'sparkle' : TRAILING_POOL[randomInt(TRAILING_POOL.length)]!
  })
}

export function usePowerup(player: Player) {
  const d = db(); const now = Date.now()
  if (!d.party.settings.flags.powerups) throw Conflict('Nothing happens')
  if (!player.teamId) throw Validation('Power-ups belong to teams')
  const kind = d.teamPowerups[player.teamId] as PowerupKind | undefined
  if (!kind) throw Validation('Your team has no power-up right now')
  const def = POWERUPS[kind]
  let targetId = player.teamId
  if (kind === 'snowball') {
    const leader = teamBoard()[0]
    if (!leader || leader.id === player.teamId) throw Validation('You are the leader. Save it for later.')
    targetId = leader.id
  }
  const effectKind = kind === 'snowball' ? 'frozen' : kind
  if (activeEffect(targetId, effectKind)) throw Conflict('That effect is already running')
  d.statusEffects.push({ id: uid(), targetType: 'team', targetId, kind: effectKind, startsAt: now, endsAt: now + def.durationMs, sourceEventId: null, data: { by: player.teamId } })
  delete d.teamPowerups[player.teamId]
  const teamName = d.teams.find(t => t.id === player.teamId)?.name
  log('code', `${teamName} used ${def.name}`, {}, player.displayName)
  broadcast('ticker', { kind: 'powerup', text: `${teamName} used ${def.name}` }, { bump: false })
  broadcast('scores.updated', {})
}
