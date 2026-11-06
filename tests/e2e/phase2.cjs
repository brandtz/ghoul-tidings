// Phase 2 flows against a running app with catalog/codes.local.json loaded.
const { chromium } = require('playwright')
const OUT = process.argv[2] || require('node:os').tmpdir(); const B = process.argv[3] || 'http://localhost:3000'
const cat = require('../../catalog/codes.local.json') // git-ignored; never put code text in this file
const word = (reward, scope) => cat.find(x => x.reward === reward && (!scope || x.scope === scope)).code
const wait = ms => new Promise(r => setTimeout(r, ms))
let fails = 0
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) fails++ }
const stateOf = p => p.evaluate(() => fetch('/api/state').then(r => r.json()))
const api = (p, url, body = {}) => p.evaluate(async ([u, b]) => { const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }); return { status: r.status, body: await r.json().catch(() => null) } }, [url, body])
const type = async (p, s) => { await p.locator('body').click({ position: { x: 5, y: 5 } }); await p.keyboard.type(s, { delay: 15 }); await wait(1200) }
;(async () => {
  const b = await chromium.launch()
  const errs = []
  const mk = async (name) => {
    const c = await b.newContext({ viewport: { width: 1920, height: 1080 } }); const p = await c.newPage()
    p.on('pageerror', e => errs.push(`${name} PAGEERR ${e.message.slice(0, 220)}`))
    p.on('console', m => { if (m.type() === 'error' && !/40[19]|422/.test(m.text())) errs.push(`${name} ${m.text().slice(0, 220)}`) })
    return p
  }
  const host = await mk('host')
  await host.goto(B + '/admin/login'); await wait(1500)
  await host.fill('input[type=password]', process.env.GT_PASSCODE || 'ghoul-tidings-dev-passcode-1234')
  await host.click('button:has-text("Sign in")'); await wait(1500)
  await api(host, '/api/admin/party/reset'); await wait(2500)
  const adm = () => host.evaluate(() => fetch('/api/admin/state').then(r => r.json()))
  check((await adm()).codes.length > 20, 'catalog loaded from the local file')

  const [a, c, solo] = [await mk('a'), await mk('c'), await mk('solo')]
  for (const [p, n] of [[a, 'Ada'], [c, 'Cy'], [solo, 'Sol']]) {
    await p.goto(B + '/'); await wait(1300)
    await p.fill('input[autocomplete=name]', n); await p.fill('input[type=email]', `${n}@x.co`)
    await p.click('button:has-text("Enter the party")'); await wait(800)
  }
  await type(a, word('treat_medium'))
  check((await stateOf(a)).me.score === 0, 'codes do nothing while the flag is off')

  await api(a, '/api/teams', { name: 'Alpha', mascotKey: 'jack', colorKey: 'pumpkin' })
  await api(c, '/api/teams', { name: 'Cobalt', mascotKey: 'cat', colorKey: 'frost' })
  await api(host, '/api/admin/content/settings/save', { flags: { eggs: true, cheatSheet: true, powerups: true, eggHunt: true, bingo: true } }); await wait(500)
  await api(host, '/api/admin/hint'); await wait(600)
  const codesAdmin = (await adm()).codes
  check(codesAdmin.filter(x => x.team).length >= 4, 'teams received private codes')
  check(!JSON.stringify(codesAdmin).includes('codeHash'), 'host list omits hashes')

  await type(a, 'NOTACODEXYZ')
  check(await a.locator('text=Trick!').count() === 0 && (await stateOf(a)).me.score === 0, 'a miss shows nothing')
  await a.locator('[aria-label="Open the Trick or Treat hint"]').count()
  for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) await a.keyboard.press(k)
  await wait(1400)
  check((await stateOf(a)).me.unlocks.bag, 'Konami unlocks the bag')
  await a.click('[aria-label="Open the Trick or Treat hint"]'); await wait(300)
  await a.click('button:has-text("Open the bag")'); await wait(700)
  await a.screenshot({ path: `${OUT}/p2-bag.png` })
  const bagA = (await a.evaluate(() => fetch('/api/bag').then(r => r.json()))).entries
  check(bagA.length > 0 && bagA.length < codesAdmin.length && bagA.some(e => e.smudged), `bag shows a subset with smudges (${bagA.length})`)
  check(await c.evaluate(() => fetch('/api/bag').then(r => r.status)) === 401, 'bag stays locked for others')
  await a.keyboard.press('Escape'); await wait(300)

  const before = (await stateOf(a)).me
  await type(a, word('treat_medium'))
  const after = (await stateOf(a)).me
  check(after.score - before.score === 150, `treat paid the individual ${after.score - before.score}`)
  await wait(100); await type(a, word('treat_medium')); check(await a.locator('text=Already in your bag').count() > 0, 'a code works once per player')

  await type(a, word('unlock_console')); await wait(300)
  check((await stateOf(a)).me.unlocks.console, 'secret code unlocks the console')
  await a.keyboard.press('~'); await wait(400)
  await a.fill('[aria-label="Console input"]', word('joke_million')); await a.keyboard.press('Enter'); await wait(900)
  await a.screenshot({ path: `${OUT}/p2-console.png` })
  check(await a.locator('text=1,00').count() > 0, 'joke million shows in the pill')
  check((await stateOf(a)).me.score < 1000, 'joke million never touches the ledger')
  await a.keyboard.press('Escape')

  await wait(8200)
  await type(a, word('theme_christmas'))
  await a.screenshot({ path: `${OUT}/p2-personal-theme.png` })
  const o = await a.locator('.gt-root').evaluate(el => el.style.getPropertyValue('--o-bow'))
  check(Number(o) > 0.5, 'personal theme jumps only for this player')

  await wait(8200); await type(a, word('egg_big'))
  check((await stateOf(c)).eggBoard?.length === 1, 'egg board appears after the first egg')

  await wait(8200)
  await type(solo, word('treat_big', 'solo')); check((await stateOf(solo)).me.score === 250, 'solo code pays a lone wolf')
  await wait(8200); const beforeHowl = (await stateOf(a)).me.score; await type(a, word('treat_medium', 'solo')); check((await stateOf(a)).me.score === beforeHowl, 'solo code ignored by a team player')

  // Trick: a team code used by a rival moves team points.
  const alpha = () => stateOf(a).then(s => s.teams.find(t => t.name === 'Alpha').score)
  const cobalt = () => stateOf(a).then(s => s.teams.find(t => t.name === 'Cobalt').score)
  const owned = (await adm()).codes.filter(x => x.team === 'Alpha')
  check(owned.length >= 2, 'Alpha owns team codes')
  const teamWords = cat.filter(x => x.scope === 'team').map(x => x.code)
  const mine = teamWords.slice(0, 3)
  const [a0, c0] = [await alpha(), await cobalt()]
  let moved = false
  for (const w of mine) {
    await wait(8200); await type(c, w)
    if (await alpha() > a0) { moved = true; break }
  }
  const [a1, c1] = [await alpha(), await cobalt()]
  check(moved && a1 - a0 === c0 - c1, `trick moved points between teams (${a1 - a0})`)

  // Power-ups through a live raffle.
  await api(host, '/api/admin/party/start'); await wait(400)
  const prize = (await adm()).prizes[0]
  await api(host, `/api/admin/raffle/${prize.id}/draw`); await wait(900)
  const [pa, pc] = [(await stateOf(a)).me.powerup, (await stateOf(c)).me.powerup]
  check(pa === 'sparkle', `leader offered a cosmetic (${pa})`)
  check(['shield', 'snowball', 'rush'].includes(pc), `trailing team offered ${pc}`)
  await wait(8200)
  await c.screenshot({ path: `${OUT}/p2-powerup.png` })
  await c.click('button:text-is("Use")'); await wait(800)
  const fx = (await stateOf(a)).teams.flatMap(t => t.effects)
  check(fx.length > 0, `power-up is live on the race (${fx})`)
  check((await stateOf(c)).me.powerup === null, 'power-up slot is spent')
  // Keep drawing until both timed power-ups have been exercised.
  await api(host, '/api/admin/content/settings/save', { noRepeatWinners: false })
  const aid = (await stateOf(a)).me.id; const gain = amount => api(host, '/api/admin/scores/adjust', { playerId: aid, amount, reason: 'power-up test' })
  const tested = new Set(); const prizes = (await adm()).prizes.slice(1)
  for (const pz of prizes) {
    if (tested.size === 2) break
    await api(host, `/api/admin/raffle/${pz.id}/draw`); await wait(500)
    const kind = (await stateOf(c)).me.powerup
    if (!['snowball', 'rush'].includes(kind) || tested.has(kind)) { if (kind) await api(c, '/api/powerups/use'); continue }
    const used = await api(c, '/api/powerups/use'); await wait(300)
    if (used.status !== 200) { console.log(`${kind} held back: ${used.body?.message}`); await wait(21000); await api(c, '/api/powerups/use'); await wait(300) }
    const [s0, r0] = [await alpha(), await cobalt()]
    await gain(400); await wait(300)
    if (kind === 'snowball') check(await alpha() === s0, 'Snowball: frozen leader gains nothing')
    else { const [da, dc] = [await alpha() - s0, await cobalt() - r0]; check(dc === 200 && da === 400, `Sugar Rush copies half of a rival gain (alpha +${da}, cobalt +${dc})`) }
    tested.add(kind)
    await wait(kind === 'snowball' ? 30500 : 20500)
  }
  console.log(`timed power-ups exercised: ${[...tested]}`)

  // Bingo.
  await type(a, word('unlock_bingo')); await wait(300)
  check((await stateOf(a)).me.unlocks.bingo, 'bingo unlocks')
  check(await a.locator('[aria-label="Meeting bingo"]').isVisible(), 'bingo card pops open on unlock')
  for (const n of [10, 11, 13, 14]) await a.locator('[aria-label="Meeting bingo"] .tile-grid button').nth(n).click()
  await a.screenshot({ path: `${OUT}/p2-bingo.png` })
  await a.click('button:has-text("Call bingo")'); await wait(700)
  check((await stateOf(a)).me.bingoClaimed, 'bingo claim recorded')
  await a.keyboard.press('Escape')

  await host.goto(B + '/admin/content'); await wait(1500)
  await host.click('button:text-is("Codes")'); await wait(500)
  await host.screenshot({ path: `${OUT}/p2-admin-codes.png` })
  const reveal = (await adm()).codes.find(x => x.canReveal)
  await api(host, '/api/admin/content/codes/reveal', { id: reveal.id }); await wait(500)
  check(await c.locator('text=A code from the host').count() > 0, 'host reveal reaches players')

  const raw = JSON.stringify(await stateOf(c))
  check(!cat.filter(x => !x.listed).some(x => raw.includes(x.code)), 'no code text in a player snapshot')
  console.log('team scores', await alpha(), await cobalt())
  console.log('errors:', errs.slice(0, 12).join('\n') || 'none')
  console.log('fails:', fails)
  await b.close()
})().catch((e) => { console.error(e); process.exit(1) })
