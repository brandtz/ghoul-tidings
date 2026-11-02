// Local data store. Same shape as the planned Postgres tables, kept in memory
// and flushed to .data/party.json. Replace this file with Drizzle queries in WP1.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { PrizeTier, RoundPhase, ItemType, SegmentType } from '~~/shared/types'
import { DEFAULT_CAPS } from '~~/shared/scoring'
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
  points: { triviaBase: number; ttlParticipation: number; ttlSpot: number; ttlFool: number; ttlFoolMax: number }
  ttlOpensAt: number
  ttlClosesAt: number
  noRepeatWinners: boolean
  presenceMin: number
  claimS: number
  spiritGoal: number
  hostSound: { chime: boolean; sting: boolean }
  flags: Record<string, boolean>
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
}
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
export interface Prize { id: string; sortOrder: number; name: string; tier: PrizeTier; notes: string; isMidnight: boolean; status: 'pending' | 'drawn' | 'claimed' | 'skipped' }
export interface RaffleDraw { id: string; prizeId: string; playerId: string; eligibleCount: number; drawnAt: number; claimDeadline: number; status: 'offered' | 'claimed' | 'expired' | 'redrawn' }
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
  codes: CodeRow[]; redemptions: CodeRedemption[]; statusEffects: StatusEffect[]
  teamPowerups: Record<string, string>; unlocks: Record<string, string[]>; bingoClaimed: string[]
  attemptTimes: Record<string, number[]>; lastScoringCode: Record<string, number>; missedAttempts: number
}

export const uid = () => randomUUID()
const g = globalThis as any

export function db(): DB {
  if (!g.__gtDb) {
    mkdirSync(UPLOAD_DIR, { recursive: true })
    g.__gtDb = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : buildSeed()
    // Older data files predate Phase 2.
    g.__gtDb = { codes: [], redemptions: [], statusEffects: [], teamPowerups: {}, unlocks: {}, bingoClaimed: [], attemptTimes: {}, lastScoringCode: {}, missedAttempts: 0, ...g.__gtDb }
    g.__gtDb.party.settings.caps = { ...DEFAULT_CAPS, ...g.__gtDb.party.settings.caps }
    if (!existsSync(FILE)) flush()
  }
  return g.__gtDb
}

function flush() { writeFileSync(FILE, JSON.stringify(g.__gtDb)) }

let timer: ReturnType<typeof setTimeout> | null = null
export function save() {
  if (timer) return
  timer = setTimeout(() => { timer = null; flush() }, 200)
}

export function resetDb() {
  g.__gtDb = buildSeed()
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
  points: { triviaBase: 1000, ttlParticipation: 750, ttlSpot: 500, ttlFool: 100, ttlFoolMax: 2000 },
  ttlOpensAt: Date.now() - 3600_000,
  ttlClosesAt: start + 15 * 60000,
  noRepeatWinners: true,
  presenceMin: 3,
  claimS: 45,
  spiritGoal: 600,
  hostSound: { chime: false, sting: false },
  flags: { eggs: false, powerups: false, cheatSheet: false, bingo: false, eggHunt: false, legendary: false },
})
