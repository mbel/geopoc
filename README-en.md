# GeoClash Royale (working title)

> 🌐 **Languages / Langues** : [English](README-en.md) · [Français](README.fr.md)

General knowledge Battle Royale on a world map. **Playable solo or online**: bots (clearly marked as such) fill all open slots.

This repository is a TypeScript monorepo: rules engine, match runtime, balance simulator, multiplayer server, and web/mobile application (PWA, ready to be wrapped with Capacitor for app stores).

## 1. Getting Started

**Prerequisites**: Node.js ≥ 20 (`node -v`), VS Code.

```bash
cd geoclash-royale
code .
npm install
npm run ci          # verifies everything (≈ 1-2 min): types, graph, tests, simulation, build
```

### Playing Solo (in the browser)

```bash
npm run dev
```
Open the displayed URL (e.g., `http://localhost:5173`). On mobile (on the same Wi-Fi): use the "Network" IP address shown by Vite.
Development tip: append `?turbo=0.1` to the URL for 10× faster matches, e.g. `http://localhost:5173/?turbo=0.1`.

### Playing Online (multiple browsers, bots filling empty slots)

Terminal 1 — Server (20s lobby; `TURBO=0.1` for fast games):
```bash
LOBBY_WAIT_MS=10000 npm run dev:server
```
(Windows PowerShell: `$env:LOBBY_WAIT_MS=10000; npm run dev:server`)

Terminal 2 — Application:
```bash
npm run dev
```
Open the app in 2 tabs, click **Play Online** in each: humans join the same lobby, and bots fill the remaining seats upon match start.
The server listens on `ws://localhost:8787` (health check: `http://localhost:8787/health`). To use a different address, configure `VITE_SERVER_URL` (e.g. in `apps/web/.env.local`).

## 2. Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Web application (Vite, HMR) |
| `npm run dev:server` | WebSocket game server |
| `npm run build` | Production build of the app (`apps/web/dist` directory) |
| `npm test` | All tests (engine, runtime, simulator, server, app) |
| `npm run typecheck` | Strict TypeScript checks across all packages |
| `npm run sim` | Simulates 1,000 bot matches → `reports/report.md` |
| `npm run sim:check` | Same as above, fails if any balance target is missed |
| `npm run graph:validate` | Validates city graph constraints |
| `npm run questions:build -w @geoclash/data` | Rebuilds `questions.fr.json` from factual tables |
| `npm run ci` | Runs all the above (used in GitHub Actions CI) |

Simulator options: `npm run sim -- --games 5000 --seed 7 --balance path/to/balance.json`.

## 3. Structure

```
packages/
  engine/    pure deterministic rules (zone, jumps, elimination, finale)
  data/      150 cities, graph, calibrated balance (balance.v1.json), questions
  runtime/   MatchRunner (phases, bots, secret-free views), protocol, solo/online sessions
  sim/       bots at scale, simulator, calibration reports
apps/
  web/       React app + PWA (+ Capacitor for iOS/Android)
  server/    authoritative server (Node + ws)
docs/        ARCHITECTURE, DEPLOYMENT, ANDROID, DECISIONS, CALIBRATION_LOG, QUESTIONS, STORE_READINESS
SPEC.md ROADMAP.md KICKOFF_PROMPT.md
```

Details: `docs/ARCHITECTURE-en.md` (`docs/ARCHITECTURE.fr.md`). Core principle: **single match logic**, executed in-browser for solo play and on the server for online play; the UI only interacts via the `GameSession` interface.

## 4. How to Play

1. A multiple-choice question with 4 options is presented to all players simultaneously (12s).
2. **The faster (and more accurately) you answer, the longer your jump**: Large (≤ 3s, range 4), Medium (≤ 8s, range 2), Micro (≤ 12s, range 1), none if incorrect.
3. Choose a reachable city on the map, then jump.
4. The red zone shrinks toward a hidden **Final City**; the next zone is previewed one round in advance. Ending outside the zone = eliminated.
5. Finale: only players who reached the Final City remain; each mistake eliminates. The last survivor earns the **Final City badge** in their passport.

## 5. Play Online on the Web (GitHub Pages)

The web app is directly deployable to **GitHub Pages** via GitHub Actions (workflow `.github/workflows/deploy-pages.yml`). Solo mode works 100% client-side in any player's browser without needing a backend server. See the guide in [`docs/GITHUB_PAGES-en.md`](docs/GITHUB_PAGES-en.md).

## 6. Testing on Android Without a Server

A GitHub Actions workflow builds a **debug APK** (solo mode): see `docs/ANDROID-en.md`. For multiplayer server deployment: `docs/DEPLOYMENT-en.md`.

## 7. App Store Publishing

See `docs/STORE_READINESS-en.md` (readiness checklist). In brief: select the brand name and app identifier (`apps/web/src/brand.ts`), run `npm run build`, then `cd apps/web && npm run cap:add:ios` / `cap:add:android` (requires Xcode / Android Studio), and `npm run cap:sync`.

## 8. Known Limitations (Important Read)

- **Not tested on real physical devices**: Touch UI (map panning, pinch zoom, varied screen sizes) has only been validated in automated tests (jsdom) and build pipelines; no visual inspection on hardware has occurred.
- **Questions**: 1,291 draft questions, **unverified** (see `docs/QUESTIONS-en.md`): must be reviewed before any public release.
- **Balance calibrated on bots**, not human players (see `docs/CALIBRATION_LOG-en.md`).
- **Multiplayer**: no in-match reconnection, no user accounts, no load testing under high concurrency (see `docs/ARCHITECTURE-en.md`).
- **Name, icons, app ID**: provisional placeholders.
