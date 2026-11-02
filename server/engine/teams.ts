import { db, log, uid, type Player } from './db'
import { broadcast } from './bus'
import { Conflict, NotFound, Validation } from './errors'
import { currentRound } from './rounds'
import { assignTeamCodes } from './codes'

function assertBetweenRounds() {
  const r = currentRound()
  if (r && r.phase !== 'revealed') throw Conflict('You can switch teams between rounds')
}

export function createTeam(player: Player | null, input: { name: string; mascotKey: string; colorKey: string }) {
  const d = db()
  const live = d.teams.filter(t => !t.deletedAt)
  if (player) assertBetweenRounds()
  if (live.length >= d.party.settings.maxTeams) throw Conflict('All team slots are taken')
  if (live.some(t => t.name.toLowerCase() === input.name.trim().toLowerCase())) throw Conflict('That team name is taken')
  if (live.some(t => t.colorKey === input.colorKey)) throw Conflict('That color is taken')
  const team = { id: uid(), name: input.name.trim(), mascotKey: input.mascotKey, colorKey: input.colorKey, createdBy: player?.id ?? null, deletedAt: null }
  d.teams.push(team)
  if (player) player.teamId = team.id
  assignTeamCodes(team.id)
  log('join', `Team created: ${team.name}`, { teamId: team.id }, player?.displayName ?? 'host')
  broadcast('state.changed', {})
  return team
}

export function joinTeam(player: Player, teamId: string) {
  const d = db(); const t = d.teams.find(x => x.id === teamId && !x.deletedAt)
  if (!t) throw NotFound('Team not found')
  assertBetweenRounds()
  const size = d.players.filter(p => p.teamId === t.id && !p.removedAt).length
  if (size >= d.party.settings.teamCap) throw Conflict('That team is full')
  player.teamId = t.id
  log('join', `${player.displayName} joined ${t.name} (${size + 1}/${d.party.settings.teamCap})`, {}, player.displayName)
  broadcast('state.changed', {})
}

export function leaveTeam(player: Player) {
  assertBetweenRounds()
  player.teamId = null
  broadcast('state.changed', {})
}

export function moveTeam(playerId: string, teamId: string | null) {
  const d = db(); const p = d.players.find(x => x.id === playerId)
  if (!p) throw NotFound('Player not found')
  if (teamId && !d.teams.some(t => t.id === teamId && !t.deletedAt)) throw Validation('Team not found')
  p.teamId = teamId
  broadcast('state.changed', {})
}
