import { describe, expect, it } from 'vitest'
import { contrast, KEYFRAMES, layersAt, ramp, themeAt } from '../shared/theme'
import { DEFAULT_CAPS, guessValue, runPipeline, speedBonus, trackPosition, zoomStepAt, type ScoreCommand } from '../shared/scoring'
import { isMatch, normalize } from '../shared/match'
import { DEFAULT_BINGO_SQUARES, bingoCard, hasBingo, rankBand, seededShuffle, tailsFor } from '../shared/phase2'
import { dueOffsetMs, midnightIndex, scheduleProgress } from '../shared/schedule'

const ctx = { scoringPaused: false, settings: { soloMultiplier: 1.5, caps: DEFAULT_CAPS } }
const cmd = (o: Partial<ScoreCommand> = {}): ScoreCommand => ({ playerId: 'p', teamId: 't', source: 'trivia', basePoints: 1500, refType: 'r', refId: '1', idempotencyKey: 'k', ...o })

describe('theme', () => {
  it('matches the keyframes at p 0, 0.5 and 1', () => {
    expect(themeAt(0).colors.skyTop).toBe('#080914')
    expect(themeAt(0.5).colors.skyTop.toUpperCase()).toBe('#1B0F2E')
    expect(themeAt(1).colors.skyLow.toUpperCase()).toBe('#9F2739')
  })
  it('clamps ramps and follows the layer table', () => {
    expect(ramp(-1, 0, 1)).toBe(0)
    expect(layersAt(0).bats).toBe(1)
    expect(layersAt(1).bats).toBe(0)
    expect(layersAt(1).pumpkins).toBeCloseTo(0.35)
    expect(layersAt(1).sleigh).toBe(1)
  })
  it('honors a player override without changing the base call', () => {
    expect(themeAt(0, 1).p).toBe(1)
    expect(themeAt(0).p).toBe(0)
  })
  it('keeps text pairs at WCAG AA on rail panels at all keyframes', () => {
    for (const i of [0, 1, 2]) {
      expect(contrast(KEYFRAMES.text[i]!, KEYFRAMES.panel[i]!)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(KEYFRAMES.muted[i]!, KEYFRAMES.panel[i]!)).toBeGreaterThanOrEqual(4.5)
      expect(contrast('#140A05', KEYFRAMES.border[i]!)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('score pipeline', () => {
  it('splits team points and leaves the individual whole', () => {
    expect(runPipeline(cmd(), ctx)).toMatchObject({ deltaIndividual: 1500, deltaTeam: 1500 })
  })
  it('multiplies solo trivia only', () => {
    expect(runPipeline(cmd({ teamId: null }), ctx)).toMatchObject({ deltaIndividual: 2250, deltaTeam: 0 })
    expect(runPipeline(cmd({ teamId: null, source: 'guess' }), ctx)).toMatchObject({ deltaIndividual: 1500 })
  })
  it('rejects game points while paused but allows host adjustments', () => {
    const paused = { ...ctx, scoringPaused: true }
    expect(runPipeline(cmd(), paused)).toHaveProperty('reject')
    expect(runPipeline(cmd({ source: 'admin' }), paused)).not.toHaveProperty('reject')
  })
  it('caps a single event in both directions', () => {
    expect(runPipeline(cmd({ source: 'admin', basePoints: 9000 }), ctx)).toMatchObject({ deltaIndividual: 2500 })
    expect(runPipeline(cmd({ source: 'admin', basePoints: -9000 }), ctx)).toMatchObject({ deltaIndividual: -2500 })
  })
  it('computes speed, zoom and track values', () => {
    expect(speedBonus(10000, 10000)).toBe(500)
    expect(speedBonus(3400, 5000)).toBe(340)
    expect([1, 2, 6].map(guessValue)).toEqual([1500, 1300, 500])
    expect(zoomStepAt(0, 5)).toBe(1)
    expect(zoomStepAt(5000, 5)).toBe(2)
    expect(zoomStepAt(99000, 5)).toBe(6)
    expect(trackPosition(-50, 0)).toBe(0)
    expect(trackPosition(500, 500)).toBe(0.5)
  })
})

describe('guess matching', () => {
  const ok: [string, string[]][] = [
    ['The Candy Cane', ['candy cane']], ['candy-cane', ['candy cane']], ['candy canes', ['candy cane']], ['a snowglobe', ['snowglobe']],
    ['Xmas tree', ['christmas tree']], ['mac & cheese', ['mac and cheese']], ['crème brûlée', ['creme brulee']], ['gingerbraed man', ['gingerbread man']],
  ]
  it.each(ok)('accepts %s', (g, a) => expect(isMatch(g, a)).toBe(true))
  it('rejects wrong and empty guesses', () => {
    expect(isMatch('gingerbread house', ['candy cane'])).toBe(false)
    expect(isMatch('', ['candy cane'])).toBe(false)
    expect(normalize('  The   Grinch! ')).toBe('grinch')
  })
})

describe('raffle schedule', () => {
  it('spaces draws so the first is not at zero and the last leaves room', () => {
    expect(dueOffsetMs(1, 8, 45)).toBe(5 * 60000)
    expect(dueOffsetMs(8, 8, 45)).toBe(40 * 60000)
  })
  it('picks the midnight draw, earlier on a tie, unless flagged', () => {
    expect(midnightIndex(7)).toBe(3)
    expect(midnightIndex(8)).toBe(3)
    expect(midnightIndex(8, 6)).toBe(6)
  })
  it('clamps progress and subtracts pauses', () => {
    expect(scheduleProgress(0, 1000, 0, 60)).toBe(0)
    expect(scheduleProgress(1800_000, 0, 0, 60)).toBe(0.5)
    expect(scheduleProgress(1800_000, 0, 1800_000, 60)).toBe(0)
  })
})

describe('phase 2', () => {
  it('stops a frozen team gaining but keeps individual points and debits', () => {
    const frozen = { ...ctx, teamFrozen: true }
    expect(runPipeline(cmd({ source: 'guess' }), frozen)).toMatchObject({ deltaIndividual: 1500, deltaTeam: 0 })
    expect(runPipeline(cmd({ source: 'code', basePoints: -300, individualPoints: 0 }), frozen)).toMatchObject({ deltaTeam: -300 })
  })
  it('caps code points separately for teams and individuals', () => {
    expect(runPipeline(cmd({ source: 'code', basePoints: 5000, individualPoints: 900 }), ctx)).toMatchObject({ deltaTeam: 2000, deltaIndividual: 500 })
  })
  it('builds one tail per known length from a normalized buffer', () => {
    expect(tailsFor('zz moo!', [3, 5, 40])).toEqual(['MOO', 'ZZMOO'])
  })
  it('gives each team a stable, different shuffle', () => {
    const list = Array.from({ length: 20 }, (_, i) => i)
    expect(seededShuffle(list, 'a')).toEqual(seededShuffle(list, 'a'))
    expect(seededShuffle(list, 'a')).not.toEqual(seededShuffle(list, 'b'))
    expect([...seededShuffle(list, 'a')].sort((x, y) => x - y)).toEqual(list)
  })
  it('bands teams and detects bingo lines with the free center', () => {
    expect([0, 1, 5].map(r => rankBand(r, 6))).toEqual(['leader', 'leader', 'trailing'])
    expect(hasBingo(new Set([10, 11, 13, 14]))).toBe(true)
    expect(hasBingo(new Set([0, 1, 2]))).toBe(false)
  })

  it('deals each player their own 24-square bingo card from the host pool', () => {
    const pool = Array.from({ length: 40 }, (_, i) => `Square ${i}`)
    const a = bingoCard(pool, 'player-a')
    expect(a).toHaveLength(25)
    expect(a[12]).toBe('FREE')
    expect(new Set(a).size).toBe(25)
    expect(a.every(x => x === 'FREE' || pool.includes(x))).toBe(true)
    expect(bingoCard(pool, 'player-a')).toEqual(a)
    expect(bingoCard(pool, 'player-b')).not.toEqual(a)
    expect(bingoCard(DEFAULT_BINGO_SQUARES, 'x').filter(x => x !== 'FREE').sort()).toEqual([...DEFAULT_BINGO_SQUARES].sort())
  })
})

describe('Ghoul Bingo cards', () => {
  it('deals five numbers per column from its range, FREE in the middle, same seed same card', async () => {
    const { ballCard, meetsPattern, BALL_FREE } = await import('../shared/balls')
    const card = ballCard('party:1:player')
    expect(card).toHaveLength(25)
    expect(card[BALL_FREE]).toBe(0)
    for (let i = 0; i < 25; i++) if (i !== BALL_FREE) { const c = i % 5; expect(card[i]).toBeGreaterThanOrEqual(c * 15 + 1); expect(card[i]).toBeLessThanOrEqual(c * 15 + 15) }
    expect(new Set(card).size).toBe(25)
    expect(ballCard('party:1:player')).toEqual(card)
    expect(ballCard('party:2:player')).not.toEqual(card)
    expect(meetsPattern(new Set([10, 11, 13, 14]), 'line')).toBe(true)
    expect(meetsPattern(new Set([0, 4, 20]), 'corners')).toBe(false)
    expect(meetsPattern(new Set([0, 4, 20, 24]), 'corners')).toBe(true)
    expect(meetsPattern(new Set([0, 1, 2, 3, 4]), 'blackout')).toBe(false)
  })
})
