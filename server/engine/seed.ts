// Starter content so the whole show can be run on day one. All placeholder,
// replaced from the admin panel or git-ignored files before the party.
import { randomUUID } from 'node:crypto'
import type { PrizeKind, PrizeTier } from '~~/shared/types'
import type { DB, GuessItem, Segment, TriviaQ } from './db'
import { defaultBalls, defaultSettings } from './db'

const id = () => randomUUID()

const TRIVIA: [string, string[], number, string][] = [
  ['Which holiday song begins with "Chestnuts roasting on an open fire"?', ['The Christmas Song', 'Jingle Bells', 'Silent Night', 'Deck the Halls'], 0, 'Holiday Music'],
  ['What vegetable did people carve before pumpkins became the Halloween standard?', ['Carrot', 'Potato', 'Turnip', 'Parsnip'], 2, 'Halloween History'],
  ['In the classic poem, how many reindeer pull the sleigh, not counting Rudolph?', ['Six', 'Seven', 'Eight', 'Twelve'], 2, 'Holiday Stories'],
  ['Which city is Santa said to pass through last on a U.S. route, according to NORAD jokes?', ['None, NORAD only tracks by time zone', 'Honolulu', 'Anchorage', 'Miami'], 0, 'Holiday Trivia'],
  ['What color are the berries on traditional mistletoe?', ['Red', 'White', 'Blue', 'Black'], 1, 'Winter Plants'],
  ['Which month does the Mexican holiday Dia de los Muertos end in?', ['October', 'November', 'December', 'September'], 1, 'Holidays Worldwide'],
  ['What do the "twelve days of Christmas" lead up to?', ['New Year\'s Eve', 'Christmas Day', 'Epiphany', 'Boxing Day'], 2, 'Holiday Stories'],
  ['Which spice gives gingerbread most of its heat?', ['Nutmeg', 'Ginger', 'Clove', 'Allspice'], 1, 'Holiday Food'],
  ['What is a group of witches traditionally called?', ['A coven', 'A flock', 'A choir', 'A cackle'], 0, 'Halloween History'],
  ['Which country gave the U.K. its famous annual Trafalgar Square Christmas tree?', ['Sweden', 'Norway', 'Canada', 'Finland'], 1, 'Holidays Worldwide'],
  ['What shape is a candy cane said to resemble?', ['A shepherd\'s crook', 'A hockey stick', 'A question mark', 'A fishing hook'], 0, 'Holiday Food'],
  ['Which bird is traditional in the song for the first day of Christmas?', ['Turtle dove', 'Partridge', 'French hen', 'Calling bird'], 1, 'Holiday Music'],
]
const TRIVIA2: [string, string[], number, string][] = [
  ['In what year did the first Trick-or-Treat references appear in North American newspapers?', ['The 1890s', 'The 1920s', 'The 1950s', 'The 1970s'], 1, 'Halloween History'],
  ['Which of these is NOT one of the original eight reindeer?', ['Comet', 'Cupid', 'Blitzen', 'Olive'], 3, 'Holiday Stories'],
  ['What is the main ingredient in traditional eggnog?', ['Cream and eggs', 'Oat milk', 'Coconut milk', 'Yogurt'], 0, 'Holiday Food'],
  ['What do you traditionally hang by the chimney with care?', ['Wreaths', 'Stockings', 'Lanterns', 'Bells'], 1, 'Holiday Stories'],
]

const GUESSES: [string, string[], number, number, string][] = [
  ['Candy cane', ['candy cane', 'candycane', 'peppermint stick'], 0.5, 0.42, 'candycane'],
  ['Jack-o\'-lantern', ['jack o lantern', 'jackolantern', 'pumpkin', 'carved pumpkin'], 0.42, 0.55, 'pumpkin'],
  ['Snow globe', ['snow globe', 'snowglobe'], 0.52, 0.45, 'globe'],
  ['Christmas ornament', ['ornament', 'christmas ornament', 'bauble', 'christmas ball'], 0.5, 0.56, 'ornament'],
  ['Witch hat', ['witch hat', 'witchs hat', 'witches hat'], 0.5, 0.72, 'hat'],
  ['Gingerbread man', ['gingerbread man', 'gingerbread cookie', 'gingerbread'], 0.5, 0.3, 'gingerbread'],
]

// $150 budget for a 90 minute party: ten $10 random draws (one about every 8 minutes),
// then two finale awards, $20 for most eggs found and $30 for best score.
const RAFFLE_COUNT = 10
const PRIZES: [string, PrizeTier, PrizeKind, string][] = [
  ...Array.from({ length: RAFFLE_COUNT }, (): [string, PrizeTier, PrizeKind, string] => ['$10 gift card', 'swag', 'raffle', 'Random draw · emailed after the party']),
  ['$20 gift card · Most eggs found', 'special', 'most_eggs', 'Finale award · emailed after the party'],
  ['$30 gift card · Best score', 'grand', 'top_score', 'Finale award · emailed after the party'],
]

export function buildSeed(): DB {
  const start = new Date('2026-11-16T18:00:00Z').getTime()
  const seg = (sortOrder: number, type: Segment['type'], title: string, config = {}): Segment => ({ id: id(), sortOrder, type, title, config })
  const segments = [
    seg(1, 'intermission', 'Welcome intermission'),
    seg(2, 'bingo', 'Meeting Bingo kickoff'),
    seg(3, 'trivia', 'Holiday Trivia'),
    seg(4, 'guess', 'Guess the Thing'),
    seg(5, 'balls', 'Ghoul Bingo'),
    seg(6, 'trivia', 'Holiday Trivia, round 2'),
    seg(7, 'finale', 'Finale'),
  ]
  const toQ = (list: typeof TRIVIA, segmentId: string): TriviaQ[] => list.map((q, i) => ({
    id: id(), segmentId, sortOrder: i + 1, prompt: q[0], options: q[1], correctIndex: q[2], category: q[3], timeLimitS: 10,
  }))
  const guess: GuessItem[] = GUESSES.map((g, i) => ({
    id: id(), segmentId: segments[3]!.id, sortOrder: i + 1, answerDisplay: g[0], acceptedAnswers: g[1], focalX: g[2], focalY: g[3], cropPaths: [], fullPath: '', stepS: 5,
    seedArt: g[4],
  } as GuessItem & { seedArt: string }))

  return {
    party: {
      id: id(), slug: 'ghoul-tidings-2026', name: 'Ghoul Tidings', status: 'lobby', scheduledStart: start, startedAt: null,
      durationMin: 90, pausedMs: 0, themeOverride: null, settings: defaultSettings(start),
      state: {
        segmentId: null, itemIndex: -1, roundId: null, doneSegments: [], scoringPaused: false, partyPaused: false, pausedAt: null,
        presentation: null, spirit: 0, spiritGoal: 600, hintRevealed: false, themeStep: 0, raffleDeferred: false, conductor: null,
        bingo: { open: false, called: [] }, balls: defaultBalls(),
      },
      stateVersion: 1,
    },
    players: [], teams: [], segments,
    trivia: [...toQ(TRIVIA, segments[2]!.id), ...toQ(TRIVIA2, segments[5]!.id)],
    guess, ttl: [], rounds: [], answers: [], scoreEvents: [],
    prizes: PRIZES.map((p, i) => ({ id: id(), sortOrder: i + 1, name: p[0], tier: p[1], kind: p[2], notes: p[3], isMidnight: false, status: 'pending' as const })),
    draws: [], presentations: [], log: [],
    codes: [], redemptions: [], statusEffects: [], bingoClaims: [], teamPowerups: {}, unlocks: {}, bingoClaimed: [], attemptTimes: {}, lastScoringCode: {}, missedAttempts: 0,
    rate: {}, busLight: {},
  }
}
