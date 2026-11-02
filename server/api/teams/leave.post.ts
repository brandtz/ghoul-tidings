import { requirePlayer } from '~~/server/engine/session'
import { envelope } from '~~/server/engine/control'
import { leaveTeam } from '~~/server/engine/teams'
export default defineEventHandler(async (event) => { leaveTeam(await requirePlayer(event)); return envelope() })
