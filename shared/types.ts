// The wire contract. PublicSnapshot is everything a browser may see; nothing
// secret (correct answers, the lie, accepted guesses) may appear before reveal.
export type RoundPhase = 'open' | 'locked' | 'revealed'
export type ItemType = 'trivia' | 'guess' | 'ttl'
export type SegmentType = 'intermission' | 'trivia' | 'guess' | 'ttl' | 'bingo' | 'presentation' | 'finale'
export type PrizeTier = 'swag' | 'special' | 'grand'
/** raffle: a random draw on the schedule. top_score and most_eggs are awarded by the host at the finale. */
export type PrizeKind = 'raffle' | 'top_score' | 'most_eggs'
export type BingoClaimStatus = 'pending' | 'approved' | 'rejected'

export interface BoardRow { id: string; name: string; avatarKey: string; score: number; rank: number; teamName?: string | null }
export interface TeamRow { id: string; name: string; mascotKey: string; colorKey: string; size: number; score: number; members: { name: string; avatarKey: string }[]; position: number; effects: string[] }

export interface PublicRound {
  id: string
  itemType: ItemType
  phase: RoundPhase
  opensAt: number
  locksAt: number
  index: number
  total: number
  answeredCount: number
  trivia?: { prompt: string; options: string[]; category: string; timeLimitS: number }
  guess?: { stepS: number; steps: number }
  ttl?: { subject: { id: string; name: string; avatarKey: string }; statements: string[] }
  reveal?: {
    correctIndex?: number
    distribution?: number[]
    fastest?: string | null
    answerDisplay?: string
    correctCount?: number
    first?: string | null
    fooled?: number
  }
}

export interface MyAnswer { choice?: number; text?: string; zoomStep?: number; worth?: number }
export interface MyResult { points: number; bonus?: number; isCorrect: boolean; canSelfMark?: boolean; selfMarked?: boolean; note?: string }

export interface Me {
  id: string; name: string; avatarKey: string; isHost: boolean
  teamId: string | null; teamName: string | null
  score: number; rank: number; ofPlayers: number
  answer: MyAnswer | null
  result: MyResult | null
  ttl: { statements: string[]; lieIndex: number; status: string } | null
  powerup: string | null
  unlocks: { bag: boolean; console: boolean; bingo: boolean; legendary: boolean }
  /** Present while bingo is open. Dabs live on the device until the player calls bingo. */
  bingoCard: string[] | null
  bingoClaim: BingoClaimStatus | null
}

export interface WinnerEntry { name: string; avatarKey: string; prize: string; tier: PrizeTier; kind: PrizeKind; at: number }

export interface PublicSnapshot {
  v: number
  serverNow: number
  party: { name: string; slug: string; status: 'draft' | 'lobby' | 'live' | 'ended'; scheduledStart: number; startedAt: number | null; durationMin: number; joinUrl: string; teamCap: number; maxTeams: number; soloMultiplier: number }
  paused: { scoring: boolean; party: boolean }
  theme: { p: number; override: boolean }
  segment: { id: string; type: SegmentType; title: string; index: number; total: number; itemCount: number; itemIndex: number } | null
  upNext: { type: SegmentType; title: string } | null
  round: PublicRound | null
  raffle: { nextDueAt: number | null; deferred: boolean; drawn: number; total: number; recent: WinnerEntry[] }
  /** Every prize handed out so far, newest first: raffle draws and finale awards. */
  winners: WinnerEntry[]
  bingo: { open: boolean; called: string[]; winners: { name: string; avatarKey: string }[]; pending: number }
  hintRevealed: boolean
  ttl: { opensAt: number; closesAt: number; open: boolean }
  top10: BoardRow[]
  teams: TeamRow[]
  spirit: { value: number; goal: number }
  present: number
  joined: number
  presentation: { id: string; title: string; page: number; pageCount: number } | null
  finale: { podium: BoardRow[]; teams: TeamRow[]; recap: WinnerEntry[] } | null
  flags: Record<string, boolean>
  eggBoard: { name: string; avatarKey: string; eggs: number }[] | null
  me: Me | null
}

export interface BusMessage { id: string; v: number; type: string; data: any }
