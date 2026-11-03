// Second pass: deferral, claim, Two Truths, slides, finale, hint, calm, scaling, phone.
const { chromium } = require('playwright')
const OUT = process.argv[2] || require('node:os').tmpdir(); const B = process.argv[3] || 'http://localhost:3000'
const wait = ms => new Promise(r => setTimeout(r, ms))
let fails = 0
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) fails++ }
const stateOf = p => p.evaluate(() => fetch('/api/state').then(r => r.json()))
const api = (p, url, body = {}) => p.evaluate(async ([u, b]) => { const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }); return { status: r.status, body: await r.json().catch(() => null) } }, [url, body])
;(async () => {
  const b = await chromium.launch()
  const errs = []
  const mk = async (name, opts = {}) => {
    const c = await b.newContext({ viewport: { width: 1920, height: 1080 }, ...opts })
    const p = await c.newPage()
    p.on('pageerror', e => errs.push(`${name} PAGEERR ${e.message.slice(0, 220)}`))
    p.on('console', m => { if (m.type() === 'error' && !/401|409|422/.test(m.text())) errs.push(`${name} ${m.text().slice(0, 220)}`) })
    return p
  }
  const host = await mk('host')
  await host.goto(B + '/admin/login'); await wait(1500)
  await host.fill('input[type=password]', process.env.GT_PASSCODE || 'ghoul-tidings-dev-passcode-1234')
  await host.click('button:has-text("Sign in")'); await wait(1500)
  await api(host, '/api/admin/party/reset'); await wait(2500)
  await host.goto(B + '/admin/run-of-show'); await wait(1800)

  const p1 = await mk('p1'); const p2 = await mk('p2')
  const phone = await mk('phone', { viewport: { width: 390, height: 844 }, hasTouch: true })
  const small = await mk('small', { viewport: { width: 1366, height: 768 } })
  let i = 0
  for (const [p, n] of [[p1, 'Ada'], [p2, 'Lin'], [phone, 'Pip'], [small, 'Sol']]) {
    await p.goto(B + '/'); await wait(1400)
    if (n === 'Pip') await p.screenshot({ path: `${OUT}/m-join.png` })
    await p.fill('input[autocomplete=name]', n); await p.fill('input[type=email]', `${n}@x.co`)
    await p.click('button:has-text("Enter the party")'); await wait(900); i++
  }
  // Rejoin on another device resumes the same player.
  const again = await mk('again')
  await again.goto(B + '/'); await wait(1200)
  await again.fill('input[autocomplete=name]', 'ada'); await again.fill('input[type=email]', 'ADA@x.co')
  await again.click('button:has-text("Enter the party")'); await wait(900)
  check((await stateOf(again)).me?.id === (await stateOf(p1)).me.id, 'rejoin by email resumes the same seat')
  await again.context().close()

  for (const p of [p1, p2]) {
    await p.click('button:has-text("Submit yours")'); await wait(300)
    for (let n = 0; n < 3; n++) await p.fill(`[aria-label="Statement ${n + 1}"]`, `Fact ${n + 1} from a player`)
    await p.click('button:has-text("Submit for +750")'); await wait(700)
  }
  await host.goto(B + '/admin/content'); await wait(1500)
  await host.screenshot({ path: `${OUT}/a-content.png` })
  await host.click('button:has-text("Approve +750") >> nth=0'); await wait(500)
  await host.click('button:has-text("Approve +750") >> nth=0'); await wait(700)
  check((await stateOf(p1)).me.score === 750, 'approval paid +750')

  // Hint must not exist before the host reveals it.
  check(await p1.locator('text=Trick or Treat Codes').count() === 0, 'hint box absent from the DOM before reveal')
  await api(host, '/api/admin/hint'); await wait(900)
  check(await p1.locator('text=Trick or Treat Codes').count() > 0, 'hint box appears after reveal')
  await p1.click('[aria-label="Open the Trick or Treat hint"]'); await wait(400)
  await p1.screenshot({ path: `${OUT}/p-hint.png` })
  await p1.keyboard.press('Escape'); await wait(200)
  for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) await p1.keyboard.press(k)
  await wait(1400)
  check(await p1.locator('text=You found a code').count() > 0, 'Konami starter code acknowledged')

  // Compressed clock so a draw falls due during an open round.
  await host.goto(B + '/admin/run-of-show'); await wait(1500)
  await api(host, '/api/admin/content/settings/save', { durationMin: 1 }); await wait(400)
  await host.keyboard.press('Space'); await wait(500)  // go live
  await host.keyboard.press('Space'); await wait(500)  // welcome
  await host.keyboard.press('Space'); await wait(500)  // end welcome
  await api(host, '/api/admin/party/start'); await wait(100)
  await host.keyboard.press('Space'); await wait(500)  // trivia
  await host.keyboard.press('Space'); await wait(1800) // open question
  await wait(6000)
  const def = await stateOf(p1)
  check(def.raffle.deferred === true, 'draw due during an open round is deferred')
  check(await p1.locator('text=Drawing after this round').count() > 0, 'countdown card says Drawing after this round')
  await p1.screenshot({ path: `${OUT}/p-deferred.png` })
  await small.screenshot({ path: `${OUT}/p-1366.png` })
  await phone.screenshot({ path: `${OUT}/m-trivia.png` })
  await p1.keyboard.press('1'); await wait(300)
  await wait(5000)
  const locked = await stateOf(p1)
  check(locked.round.phase === 'locked', 'conductor auto-locked at the deadline')
  await host.keyboard.press('Space'); await wait(1600)
  const after = await stateOf(p1)
  check(after.raffle.drawn >= 1 && !after.raffle.deferred, 'draw fired right after the reveal')
  check(after.theme.p > 0, `theme stepped to ${after.theme.p.toFixed(3)}`)

  // Claim flow: find the winner's page.
  await wait(2200)
  const pages = [p1, p2, phone, small]; let winner = null
  for (const p of pages) if ((await stateOf(p)).me.offer) winner = p
  check(!!winner, 'one real player holds the prize offer')
  if (winner) {
    await winner.screenshot({ path: `${OUT}/p-claim.png` })
    await winner.click('button:has-text("Claim it")'); await wait(800)
    check((await stateOf(winner)).me.offer === null, 'claim accepted')
  }
  await api(host, '/api/admin/content/settings/save', { durationMin: 60 }); await wait(300)
  for (const pr of (await host.evaluate(() => fetch('/api/admin/state').then(r => r.json()))).prizes) if (pr.status === 'pending') await api(host, `/api/admin/raffle/${pr.id}/skip`)

  // Walk to Two Truths.
  const adm = () => host.evaluate(() => fetch('/api/admin/state').then(r => r.json()))
  const go = async (u, body = {}) => { const a = await adm(); return api(host, u, { ...body, v: a.v }) }
  await go('/api/admin/round/next'); await wait(200)
  const segs = (await adm()).segments
  await go('/api/admin/segment/start', { segmentId: segs.find(s => s.type === 'ttl').id }); await wait(600)
  await go('/api/admin/round/open'); await wait(2200)
  const t = await stateOf(p1)
  check(!JSON.stringify(t).includes('lieIndex') || t.me.ttl !== null, 'lie index only appears in the owner own record')
  const subj = t.round.ttl.subject.name
  const subjPage = subj === 'Ada' ? p1 : p2; const voter = subj === 'Ada' ? p2 : p1
  await subjPage.screenshot({ path: `${OUT}/p-ttl-subject.png` })
  const self = await api(subjPage, `/api/rounds/${t.round.id}/answer`, { choice: 0 })
  check(self.status === 409, 'subject cannot vote on their own round')
  await voter.click('.tile >> nth=0'); await wait(500)
  await voter.screenshot({ path: `${OUT}/p-ttl.png` })
  await go('/api/admin/round/lock'); await wait(200); await go('/api/admin/round/reveal'); await wait(900)
  await voter.screenshot({ path: `${OUT}/p-ttl-reveal.png` })
  await host.screenshot({ path: `${OUT}/a-ros-ttl.png` })

  // Slides.
  await go('/api/admin/round/skip'); await wait(200)
  await go('/api/admin/segment/start', { segmentId: segs.find(s => s.type === 'presentation').id }); await wait(400)
  await api(host, '/api/admin/presentation/start'); await wait(2500)
  await api(host, '/api/admin/presentation/goto', { page: 2 }); await wait(1800)
  await p1.screenshot({ path: `${OUT}/p-slides.png` })
  check(await p1.locator('text=This slide could not load').count() === 0, 'slide renders on a player screen')
  check(await p1.locator('text=2 / 4').count() > 0, 'players follow the host slide')
  await host.goto(B + '/admin/presentation'); await wait(2500)
  await host.screenshot({ path: `${OUT}/a-presentation.png` })
  await api(host, '/api/admin/presentation/end'); await wait(300)

  // Pause overlay and Calm mode.
  await api(host, '/api/admin/pause', { kind: 'party', on: true }); await wait(900)
  check(await p1.locator('text=Quick intermission').count() > 0, 'pause shows the intermission card')
  await api(host, '/api/admin/pause', { kind: 'party', on: false }); await wait(700)
  await p1.click('[aria-label="Calm mode"]'); await wait(300)
  check(await p1.locator('.gt-root.calm').count() > 0, 'Calm mode toggles')
  await api(host, '/api/admin/effect', { key: 'banner', text: 'Raffle drawing soon!' }); await wait(600)
  check(await p2.locator('text=Raffle drawing soon!').count() > 0, 'banner reaches players')
  await p2.click('button:has-text("Leaderboard")'); await wait(400)
  await p2.screenshot({ path: `${OUT}/p-board.png` })
  await p2.keyboard.press('Escape')

  // Finale.
  await go('/api/admin/segment/start', { segmentId: segs.find(s => s.type === 'finale').id }); await wait(2200)
  await p1.screenshot({ path: `${OUT}/p-finale.png` })
  await phone.screenshot({ path: `${OUT}/m-finale.png`, fullPage: true })

  for (const s of ['theme', 'players', 'monitor', 'effects', 'settings']) {
    await host.goto(`${B}/admin/${s}`); await wait(1400)
    await host.screenshot({ path: `${OUT}/a-${s}.png` })
  }
  await host.setViewportSize({ width: 1440, height: 900 }); await wait(600)
  await host.goto(`${B}/admin/run-of-show`); await wait(1400)
  await host.screenshot({ path: `${OUT}/a-1440.png` })

  // Shell geometry holds across progress at two viewport sizes.
  const pv = await mk('pv', { viewport: { width: 2560, height: 1440 } })
  await pv.goto(`${B}/preview?p=0.5&bar=0`); await wait(1500)
  const box = await pv.locator('.game-frame').boundingBox()
  check(Math.abs(box.x - 440 * 4 / 3) < 1 && Math.abs(box.width - 1040 * 4 / 3) < 1, `frame scales uniformly at 2560 wide ${JSON.stringify(box)}`)

  console.log('errors:', errs.slice(0, 14).join('\n') || 'none')
  console.log('fails:', fails)
  await b.close()
})().catch((e) => { console.error(e); process.exit(1) })
