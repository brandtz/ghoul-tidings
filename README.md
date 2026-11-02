# Ghoul Tidings

Real-time party game for about 60 players and one host. Players answer on their own screens, the host runs the show from a private panel, and a shared stage view goes out over screen share. The world turns from Halloween to Christmas with every raffle draw.

## Run it

```bash
npm install
npm run dev
```

Then open these in separate windows. Use a private window for each extra player.

| Page | URL | Who |
| --- | --- | --- |
| Player | http://localhost:3000 | Anyone |
| Host panel | http://localhost:3000/admin | Host |
| Stage view | http://localhost:3000/stage | Host, for screen share |
| Design preview | http://localhost:3000/preview | Scrub theme progress and fire a raffle beat |

The development host passcode is `ghoul-tidings-dev-passcode-1234`. Set real secrets from `.env.example` before anyone else can reach the app.

## Try a full show in five minutes

1. Sign in at `/admin`, open **Settings**, and press **Add demo crowd**. Eighteen demo players join and answer on their own.
2. Join as yourself in a second window.
3. Open **Run of show** and keep pressing **Space**. The big button always shows the next step.
4. Set **Party length** to 1 minute under **Prizes and raffle** to watch draws fire quickly.
5. **Settings** has **Reset party** to start over.

The host panel must stay open during a show. It is the conductor that locks rounds on time and fires due draws.

## Phase 2

Everything is off by default. Switch features on under Content, Codes in the host panel.

Real codes live in `catalog/codes.local.json`, which git ignores. A fresh clone has no codes until you add that file or import a catalog in the host panel. See `catalog/README.md`.

## How it is organized

| Path | Holds |
| --- | --- |
| `shared/` | Pure logic used by client and server: theme, scoring, matching, raffle schedule, wire types |
| `server/engine/` | Game services: store, bus, rounds, raffle, scores, snapshot, content |
| `server/api/` | Thin routes that validate input and call a service |
| `components/shell/` | The participant shell, named as in the design handoff |
| `components/game/` | What fills the frame: join, lobby, the three games, slides, finale |
| `components/admin/` | The nine host panel sections |
| `stores/` | Client live state for players and the host |

`server/engine/snapshot.ts` is the secrecy boundary. Anything a browser sees passes through it, and correct answers are only read after a reveal.

## Tests

```bash
npm test                              # unit tests
npx vue-tsc --noEmit                  # types
node tests/e2e/mini-show.cjs          # multi-browser show; needs the app running and `npx playwright install chromium`
node tests/e2e/phase2.cjs             # codes, bag, console, power-ups; also needs catalog/codes.local.json
```

See `BUILD_STATUS.md` for what is done, what is stubbed, and the decisions taken along the way.
