# Build status

## Solo party, gift card prizes and bingo (Nov 12, 2026)

- **Teams are a setting, off by default** (Settings, Teams). Off: everyone plays solo; team sign-up, the team race, team codes, power-ups and the solo multiplier are hidden. Existing teams are kept and come back if teams are turned on.
- **Recognition slides removed** from the running order. The Presentation section still exists for when a deck arrives.
- **No claim window.** A drawn winner keeps the prize at once. Redraw (no-shows) and Unskip remain.
- **Winners list.** The player rail shows every winner and prize, newest first. The host sees the same list on Prizes and raffle and in the Live column.
- **Default prizes** ($150 for 90 minutes): ten $10 random draws, one about every 8 minutes; a $20 Most eggs found award and a $30 Best score award, given at the finale (Space in Run of show awards them in order, then ends the party). Ties go to whoever got there first. Reset party restores these.
- **Bingo replaces Two Truths.** The Meeting Bingo segment opens bingo for everyone. The host calls squares (Space, random or a picked square), players dab their own cards and press Bingo!, and the host reviews each card in Run of show with each dab marked called or not. Approval pays 1,000, plus 500 for the first bingo. Bingo stays open until the host closes it. Squares are edited under Content, Bingo.

Not yet run: the two Playwright scripts in `tests/e2e`, which were updated for these changes.

## Phase 2

Built behind flags, off by default, switched on under Content, Codes. It follows the Phase 2 outline in the architecture doc. No separate Phase 2 spec exists yet.

- **Codes:** universal, team, secret and solo. Hashed with a server pepper, matched on the tail of typed keys, once per player, once per team for team codes. Misses return nothing.
- **Tricks:** a rival using a team code moves 100 to 400 team points to the owner. Shields block it, and lone wolves lose nothing.
- **Trick-or-Treat Bag:** unlocked by the Konami starter. Shows a team-specific shuffled subset with smudged entries.
- **Secret console:** unlocked by a code, opens with the ~ key.
- **Power-ups:** one team slot, granted at each raffle beat by rank band. Leaders get a cosmetic. Trailing teams get Shield, Snowball or Sugar Rush.
- **Also:** personal theme jump, joke million that never touches the ledger, egg hunt board, meeting bingo, a global ticker, host reveal, and Code attempts in the monitor.

Decisions taken without asking:

- The plan's recommended rule is live: code points mainly move the team race, at most 1,000 reach an individual total, and each event pays an individual at most 500.
- The stored catalog is my placeholder. Replace the words and tune rewards before the party.
- Listed codes keep readable text on the server so the bag can show them. Unlisted codes exist only as hashes. This bends the "hashes only" line in the plan.
- There is a shared 8 second cooldown between score-changing codes per player, and 12 tries a minute.
- Bingo is honor system, like self-mark, and the host can reverse it from the monitor. The host edits the square pool in Content → Codes → Bingo squares (24 or more); each player gets their own shuffle of 24 with FREE in the middle. The card pops open on unlock and stays in the left rail.
- Power-ups have no rim to live in, so the card sits in the left rail. The race badges sit in the Leaderboard.

Left out:

- **Legendary reward:** built. A secret code (in the local catalog) unlocks the Doom v1.9 shareware, running in js-dos, while the host's Legendary switch under Content, Codes is on. The bundle lives in `server/assets/legendary` and is served only to unlocked players. Desktop only; phones get a note. See that folder's README for where the files came from.
- **Secret avatars:** not built. The UX spec marks them optional, and the app has no change-avatar screen yet.

Verification: 26 unit tests, a clean type check, and multi-browser runs on a production build, including all three team power-ups. A frozen team gains nothing, so a Sugar Rush cannot copy from it. Phase 2 has not been tried on a phone.

The plan's Phase 2 points question and the 1.5 times solo multiplier are still open decisions for the owner.

## Phase 1

Rough pass, Oct 30, 2026. The whole front end and a working local game engine are built. The hosted backend is not, by design: the brief for this pass was front end first.

### Must happen before real players use it

| Item | Why it matters |
| --- | --- |
| Replace `server/engine/db.ts` with Drizzle and Supabase Postgres | State lives in one process and a JSON file, so it cannot run on Vercel serverless |
| Replace `server/engine/bus.ts` with signed Supabase Broadcast | The app uses Server-Sent Events from that one process today. ES256 signing is not built |
| Move uploads to private Supabase Storage with signed URLs | Files sit in `.data/uploads` and are served through gated routes |
| Set real secrets from `.env.example` | The defaults are development values |
| Run the corporate VPN and network test | Not done. Polling fallback is built but only lightly exercised |
| Run the 80-player load test | Not done |
| Raise the join limit | It is 10 a minute per IP, as the plan says. Coworkers sharing a corporate VPN address could hit it at the start of the party |

Until the swap, the app can be hosted on any single always-on Node server with `npm run build` and `npm start`.

### Built and working

- **Participant shell:** fixed 1920 by 1080 stage, uniform scaling, `themeAt`, all scene layers, ornaments, rails, score pill, lightning beat, winner overlay, hint modal, Calm mode, stacked layout under 1024 px.
- **Games:** trivia, Guess the Thing with server-gated crops and self-mark, Two Truths with submission and review. All share one round lifecycle.
- **Raffle:** schedule, eligibility, deferral until reveal, claim window, redraw, mark claimed, theme stepping.
- **Scoring:** single pipeline, idempotency keys, solo multiplier, caps, undo of a whole action, reverse from the monitor, ranks.
- **Identity:** email HMAC, signed cookies, rejoin, host passcode, rate limits on join and host sign-in.
- **Host panel:** all nine sections, Live column with live stage thumbnail, shortcuts, stale-action rejection, conductor health.
- **Also:** slides with pdf.js, reactions, spirit meter, team race, finale, generated seed images and deck, and a demo crowd.

### Verified

| Check | Result |
| --- | --- |
| Unit tests | 21 pass |
| Type check | Clean |
| Production build | Clean, no client source maps, no seed answers in the bundle |
| Multi-browser runs against dev and production | All checks pass, no browser errors |

### Decisions taken without asking

The handoff defaults were used for open decisions 1 to 6. Others:

- **Time-sensitive overlays.** A round's answer clock cannot start until the 8 second raffle beat ends. The host cannot draw during an open round. The winner's Claim screen becomes a small rail card after the beat. The docs forbid covering a question but did not specify these cases.
- **Theme stepping.** Each draw advances at least one beat, even when the host draws early. The finale segment sets progress to 1, since the last draw lands before the end.
- **Next and Open are separate presses,** as the plan says, with a "Get ready" screen between.
- **Hint code.** With the codes flag off, the Konami starter shows a treat toast and confetti with no points, so the hint modal never promises something dead.
- **Unclaimed prizes wait for the host** to Redraw or Mark claimed. There is no automatic redraw.
- **Reorder uses up and down buttons** rather than drag handles in this pass.
- **Seed content is placeholder:** the trivia, prizes, images and deck are all mine. A few trivia facts should be checked before use.
- **Host sounds** are synthesized. The midnight chime has no matching clock visual, as decided in the handoff.

### Stubbed or left out

- Team lane patterns are not drawn. Teams are told apart by name, mascot and color.
- Avatar cheer, tumble and run states are not built. Only portraits exist.
- The party date, party length, prize list and solo multiplier are still placeholders from the plan's open decisions.
