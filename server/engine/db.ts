// The engine's data, kept in memory. With a database URL, server/engine/store.ts loads it
// from Postgres before each request and saves the changed rows after. Without one, it is
// flushed to .data/party.json for local runs and tests.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { BallPattern } from '~~/shared/balls'
import type { BingoClaimStatus, PrizeKind, PrizeTier, RoundPhase, ItemType, SegmentType } from '~~/shared/types'
import { DEFAULT_CAPS } from '~~/shared/scoring'
import { DEFAULT_BINGO_SQUARES } from '~~/shared/phase2'
import { buildSeed } from './seed'

export const DATA_DIR = resolve(process.cwd(), '.data')
export const UPLOAD_DIR = resolve(DATA_DIR, 'uploads')
const FILE = resolve(DATA_DIR, 'party.json')

export interface Settings {
  joinUrl: string
  teamCap: number
  maxTeams: number
  soloMultiplier: number
  caps: Record<string, number>
  points: { triviaBase: number; ttlParticipation: number; ttlSpot: number; ttlFool: number; ttlFoolMax: number; bingo: number; bingoFirst: number; ballsWin: number }
  ttlOpensAt: number
  ttlClosesAt: number
  noRepeatWinners: boolean
  presenceMin: number
  spiritGoal: number
  hostSound: { chime: boolean; sting: boolean }
  flags: Record<string, boolean>
  bingoSquares: string[]
}
export interface LiveState {
  segmentId: string | null
  itemIndex: number
  roundId: string | null
  doneSegments: string[]
  scoringPaused: boolean
  partyPaused: boolean
  pausedAt: number | null
  presentation: { id: string; page: number } | null
  spirit: number
  spiritGoal: number
  hintRevealed: boolean
  themeStep: number
  raffleDeferred: boolean
  conductor: { id: string; at: number } | null
  /** Opens when the bingo segment starts and stays open until the host closes it. */
  bingo: { open: boolean; called: string[] }
  /** Ghoul Bingo, the 75-ball game run in the balls segment. */
  balls: BallsState
}
export interface BallsState {
  game: number; status: 'idle' | 'playing' | 'won'; pattern: BallPattern; drawn: number[]
  auto: boolean; everyS: number; lastDrawAt: number; wonAt: number | null
  winners: { playerId: string; ball: number; at: number }[]
  falseCalls: number
  history: { game: number; pattern: BallPattern; winners: string[]; balls: number }[]
}
export const defaultBalls = (): BallsState => ({ game: 0, status: 'idle', pattern: 'line', drawn: [], auto: false, everyS: 8, lastDrawAt: 0, wonAt: null, winners: [], falseCalls: 0, history: [] })
export interface Party {
  id: string; slug: string; name: string; status: 'draft' | 'lobby' | 'live' | 'ended'
  scheduledStart: number; startedAt: number | null; durationMin: number; pausedMs: number
  themeOverride: number | null; settings: Settings; state: LiveState; stateVersion: number
}
export interface Player { id: string; displayName: string; emailHash: string; avatarKey: string; teamId: string | null; isHost: boolean; removedAt: number | null; joinedAt: number; lastSeenAt: number }
export interface Team { id: string; name: string; mascotKey: string; colorKey: string; createdBy: string | null; deletedAt: number | null }
export interface Segment { id: string; sortOrder: number; type: SegmentType; title: string; config: Record<string, any> }
export interface TriviaQ { id: string; segmentId: string; sortOrder: number; prompt: string; options: string[]; correctIndex: number; category: string; timeLimitS: number }
export interface GuessItem { id: string; segmentId: string; sortOrder: number; answerDisplay: string; acceptedAnswers: string[]; focalX: number; focalY: number; cropPaths: string[]; fullPath: string; stepS: number }
export interface TtlSubmission { id: string; playerId: string; statements: string[]; lieIndex: number; status: 'pending' | 'approved' | 'hidden'; playOrder: number; createdAt: number }
export interface Round { id: string; segmentId: string; itemType: ItemType; itemId: string; phase: RoundPhase; opensAt: number; locksAt: number; revealedAt: number | null; displayOrder: number[]; revealData?: any }
export interface Answer { id: string; roundId: string; playerId: string; payload: { choice?: number; text?: string }; submittedAt: number; zoomStep?: number; isCorrect?: boolean; selfMark?: boolean; points?: number; bonus?: number }
export interface ScoreEvent { id: string; playerId: string | null; teamId: string | null; deltaIndividual: number; deltaTeam: number; source: string; refType: string; refId: string; idempotencyKey: string; reason?: string; createdBy?: string; reversesId?: string; actionId?: string; actionLabel?: string; createdAt: number }
export interface Prize { id: string; sortOrder: number; name: string; tier: PrizeTier; kind: PrizeKind; notes: string; isMidnight: boolean; status: 'pending' | 'drawn' | 'claimed' | 'skipped' }
/** A drawn winner gets the prize straight away (status 'claimed'). 'offered' and 'expired' only exist in data saved before claim windows were removed. */
export interface RaffleDraw { id: string; prizeId: string; playerId: string; eligibleCount: number; drawnAt: number; claimDeadline?: number; status: 'offered' | 'claimed' | 'expired' | 'redrawn' }
export interface BingoClaim { id: string; playerId: string; card: string[]; marked: number[]; status: BingoClaimStatus; createdAt: number; reviewedAt: number | null }
export interface Presentation { id: string; title: string; pdfPath: string; pageCount: number }
export interface CodeRow { id: string; codeHash: string; codeLength: number; scope: 'universal' | 'team' | 'secret' | 'solo'; ownerTeamId: string | null; rewardKey: string; listed: boolean; enabled: boolean; label: string; display: string | null }
export interface CodeRedemption { id: string; codeId: string; playerId: string; teamId: string | null; outcome: 'treat' | 'trick' | 'duplicate'; scoreEventId: string | null; createdAt: number }
export interface StatusEffect { id: string; targetType: 'team' | 'player'; targetId: string; kind: string; startsAt: number; endsAt: number; sourceEventId: string | null; data: any }
export interface LogEvent { id: string; type: string; actor: string; text: string; data?: any; createdAt: number; dismissed?: boolean }

export interface DB {
  party: Party
  players: Player[]; teams: Team[]; segments: Segment[]; trivia: TriviaQ[]; guess: GuessItem[]
  ttl: TtlSubmission[]; rounds: Round[]; answers: Answer[]; scoreEvents: ScoreEvent[]
  prizes: Prize[]; draws: RaffleDraw[]; presentations: Presentation[]; log: LogEvent[]
  codes: CodeRow[]; redemptions: CodeRedemption[]; statusEffects: StatusEffect[]; bingoClaims: BingoClaim[]
  teamPowerups: Record<string, string>; unlocks: Record<string, string[]>; bingoClaimed: string[]
  attemptTimes: Record<string, number[]>; lastScoringCode: Record<string, number>; missedAttempts: number
  rate: Record<string, { minute: number; count: number }>; busLight: Record<string, number>
}

export const uid = () => randomUUID()
const g = globalThis as any

/** Fills fields that older saved data predates. */
export function normalize(d: any): DB {
  Object.assign(d, { codes: [], redemptions: [], statusEffects: [], bingoClaims: [], teamPowerups: {}, unlocks: {}, bingoClaimed: [], attemptTimes: {}, lastScoringCode: {}, missedAttempts: 0, rate: {}, busLight: {}, ...d })
  const s = d.party.settings
  s.caps = { ...DEFAULT_CAPS, ...s.caps }
  s.bingoSquares ??= [...DEFAULT_BINGO_SQUARES]
  s.points.bingo ??= 1000
  s.points.bingoFirst ??= 500
  s.points.ballsWin ??= 1500
  s.flags.teams ??= false
  d.party.state.bingo ??= { open: false, called: [] }
  d.party.state.balls ??= defaultBalls()
  for (const p of d.prizes) p.kind ??= 'raffle'
  // Winners keep their prize now. Older saved offers count as won.
  for (const r of d.draws) if (r.status === 'offered') r.status = 'claimed'
  for (const p of d.prizes) if (p.status === 'drawn') p.status = 'claimed'
  return d
}

/** Teams are an opt-in setting. With them off, everyone plays solo whatever team they once joined. */
export const teamsOn = () => !!db().party.settings.flags.teams
export const teamOf = (p: { teamId: string | null }) => (teamsOn() ? p.teamId : null)

export function db(): DB {
  if (g.__gtPg) {
    if (!g.__gtDb) throw new Error('The party data is not loaded yet')
    return g.__gtDb
  }
  if (!g.__gtDb) {
    mkdirSync(UPLOAD_DIR, { recursive: true })
    g.__gtDb = normalize(existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : buildSeed())
    if (!existsSync(FILE)) flush()
  }
  return g.__gtDb
}

function flush() { if (!g.__gtPg) writeFileSync(FILE, JSON.stringify(g.__gtDb)) }

let timer: ReturnType<typeof setTimeout> | null = null
/** File mode only. In database mode the request wrapper saves changed rows. */
export function save() {
  if (g.__gtPg || timer) return
  timer = setTimeout(() => { timer = null; flush() }, 200)
}

export function resetDb() {
  g.__gtDb = normalize(buildSeed())
  flush()
  return g.__gtDb as DB
}

export function log(type: string, text: string, data?: any, actor = 'system') {
  const d = db()
  d.log.unshift({ id: uid(), type, actor, text, data, createdAt: Date.now() })
  if (d.log.length > 2000) d.log.length = 2000
}

export const defaultSettings = (start: number): Settings => ({
  joinUrl: 'http://localhost:3000',
  teamCap: 8,
  maxTeams: 10,
  soloMultiplier: 1.5,
  caps: { ...DEFAULT_CAPS },
  points: { triviaBase: 1000, ttlParticipation: 750, ttlSpot: 500, ttlFool: 100, ttlFoolMax: 2000, bingo: 1000, bingoFirst: 500, ballsWin: 1500 },
  ttlOpensAt: Date.now() - 3600_000,
  ttlClosesAt: start + 15 * 60000,
  noRepeatWinners: true,
  presenceMin: 3,
  spiritGoal: 600,
  hostSound: { chime: false, sting: false },
  flags: { teams: false, eggs: false, powerups: false, cheatSheet: false, bingo: false, eggHunt: false, legendary: false },
  bingoSquares: [...DEFAULT_BINGO_SQUARES],
})
