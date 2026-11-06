# GeoClash Royale — ROADMAP v0

> Team assumption: 1-2 JS/TS developers assisted by AI. Estimates in person-days, to be reviewed after Phase 0.
> Guiding principle: **validate fun and balance before networking**. The #1 risk is player liquidity, not tech.

## Progress (Updated)

| Task | Status |
|---|---|
| **Phase 0** P0-1 to P0-6 (repo, engine, graph, bots, simulator, calibration) | ✅ done, 10/10 targets |
| P0-7 question pipeline | 🟡 generator + automated checks ✅; verification pipeline ⏳ |
| P0-8 landing page | ⏳ to do |
| P1-1 PWA shell | ✅ configured (manifest, service worker, interim icons) — **not tested on device** |
| P1-2 map (coastlines, zone, cities, touch pan/zoom) | ✅ written and tested in jsdom — **not tested on device** |
| P1-3 question screen | ✅ |
| P1-4 jump UX (selection + confirmation, auto-send) | ✅ — to validate in user testing |
| P1-5 local engine + bots (solo) | ✅ |
| P1-6 finale, results, badge | ✅ |
| P1-7 passport (local storage / native Preferences) | ✅ |
| P1-8 question pool | 🟡 1,291 generated drafts; **verification ⏳** (see `docs/QUESTIONS-en.md`) |
| P1-9 tutorial · P1-10 analytics & playtests | ⏳ |
| P2-1 authoritative server | ✅ MVP (9 WebSocket integration tests) |
| P2-2 versioned protocol, reconnection | 🟡 protocol v1 ✅; **reconnection ⏳** |
| P2-3 server timer + latency compensation | 🟡 bounded RTT/2 compensation ✅; to validate under real conditions |
| P2-4 lobby + **bots on free slots** | ✅ (wait-based lobby; scheduled slots ⏳) |
| P2-5 accounts · P2-7 load testing · P2-8 observability | ⏳ |
| P2-6 basic anti-cheat | 🟡 server validation + rate limiting ✅; suspicion score ⏳ |

## High-Level Overview

| Phase | Objective | Duration | Exit Gate |
|---|---|---|---|
| **0. Design & simulation** | Quantified rules, graph, simulator, landing | ~2 weeks | Simulated match 8-10 min, elimination curve within target |
| **1. Solo vs bots** | Complete game playable in the browser | ~4 weeks | 70%+ playtesters complete a match, 40%+ replay |
| **2. Multiplayer** | Authoritative server, lobbies, accounts | ~4 weeks | 100 players/match, 20 concurrent matches under load test |
| **3. Closed Beta** | Telemetry, anti-cheat, recalibration | ~3 weeks + ongoing | Measured D1/D7 retention, filled lobbies |

## Proposed Stack (To Confirm)

- **TypeScript** throughout. Monorepo (pnpm workspaces).
- `packages/engine`: pure and deterministic game logic (seeded RNG), tested with Vitest.
- `packages/sim`: CLI simulator (bots, metrics, reports).
- `apps/web`: mobile-first PWA (Vite + React or Svelte), map in SVG/Canvas or MapLibre/Leaflet.
- `apps/server` (Phase 2): Node + WebSocket (Colyseus or Socket.io), Postgres (Supabase possible).
- `data/`: cities, graph, questions.

---

## Phase 0 — Design & Simulation (~2 weeks)

| ID | Task | Depends On | Est. | Acceptance Criteria |
|---|---|---|---|---|
| P0-1 | Monorepo, lint, CI, conventions, Vitest | — | 1 d | `pnpm test` and `pnpm lint` pass in CI |
| P0-2 | **Engine v0**: state machine, zone (cap), jumps, elimination, finale, seeded RNG | P0-1 | 4 d | Complete match replayable identically with identical seed; unit tests on every rule in SPEC §4-6 |
| P0-3 | **City data + graph generator** (150 cities, hubs, edges) + validation script | P0-1 | 3 d | Connected, diameter ≤ 8, jump range fairness ≥ 60% of median (SPEC §3) |
| P0-4 | **Bot model** (skill, lognormal timing, noisy navigation) | P0-2 | 2 d | Success rate per difficulty within ±3 pts of SPEC §5 targets |
| P0-5 | **CLI simulator** (N matches, metrics, JSON + md report) | P0-2, P0-3, P0-4 | 3 d | 1,000 matches in < 2 min; output: duration, surviving players per round, elimination causes, wins per continent |
| P0-6 | **Calibration**: tuning loop for `balance.v0.json` | P0-5 | 2 d | Targets reached (table below), `balance.v1.json` frozen |
| P0-7 | **Question schema + generation prompts + verification pipeline** (POC on 200 questions) | P0-1 | 3 d | 200 `verified` questions, ≥ 10% manually reviewed, 0 factual errors in sample |
| P0-8 | **Landing page** (real email form, **real counter**, analytics, GDPR notices) | — | 2 d | Recorded signup, double opt-in, conversion goal tracked |

### Calibration Targets (P0-6)

| Metric | Target |
|---|---|
| Median match duration | 8-10 min |
| Surviving players end of round 5 | 100% |
| End of round 10 / 15 / 20 / 25 | ~80 / 55 / 30 / 12 (±8) |
| Survivors entering the finale | 2-8 |
| Finale rounds | 1-6 |
| Win share per continent (equivalent bots) | ±25% of uniform expectation |
| Matches exceeding 12 min | < 2% |

**Phase 0 Gate**: all targets met over 1,000 simulated matches + live landing page.

---

## Phase 1 — Solo vs Bots (~4 weeks)

| ID | Task | Depends On | Est. | Acceptance Criteria |
|---|---|---|---|---|
| P1-1 | PWA shell (manifest, service worker, install, theme, nav screens) | P0-1 | 2 d | Installable on iOS/Android, Lighthouse PWA ≥ 90 |
| P1-2 | **Map**: world rendering, cities, pawn, zone, zone preview | P0-2, P0-3 | 5 d | 60 fps on mid-range mobile, precise city tap |
| P1-3 | **Question screen**: timer, options, feedback, reveal | P0-2 | 3 d | Smooth timer, no duplicate submission, legible in direct sunlight |
| P1-4 | **Jump UX**: unlocked range, highlighted reachable cities, confirmation | P1-2 | 3 d | Selection in ≤ 2 taps; user testing: 90% understand without explanation |
| P1-5 | Engine integration + local bots (full match loop) | P0-4 | 3 d | Solo match playable end-to-end |
| P1-6 | Finale + results screen + badge | P1-5 | 3 d | Winner and badge displayed, shareable |
| P1-7 | Passport: badges, stats (local storage) | P1-6 | 2 d | Persistence after reload |
| P1-8 | **Pool of 400 verified questions** (D1-D5, 10 categories) | P0-7 | 4 d | Difficulty and category distribution per SPEC §7 |
| P1-9 | Tutorial (guided 5-question match) | P1-5 | 2 d | 80% of newcomers understand "speed = range" |
| P1-10 | Analytics and playtests (10-20 testers) | P1-6 | 3 d | Report: completion, duration, drops per round, feedback |

**Phase 1 Gate**: ≥ 70% completion, ≥ 40% replay, average duration 8-11 min. Otherwise, iterate on design before Phase 2.

---

## Phase 2 — Multiplayer (~4 weeks)

| ID | Task | Depends On | Est. | Acceptance Criteria |
|---|---|---|---|---|
| P2-1 | Authoritative server: rooms, match loop with engine | P1-5 | 5 d | 100 simulated clients match completes without desync |
| P2-2 | WebSocket protocol (versioned), reconnection, session recovery | P2-1 | 3 d | Reconnection < 5 s without state loss |
| P2-3 | **Server timer + latency compensation** | P2-1 | 3 d | Measured time delta ≤ 100 ms between clients at 50 ms and 300 ms RTT |
| P2-4 | **Scheduled matches** + lobby + bot backfill (clearly **identified** bots) | P2-1 | 3 d | Lobby starts on time, bots clearly tagged |
| P2-5 | Accounts (magic link), profile, badge/stat persistence | P2-1 | 4 d | Passport preserved across devices |
| P2-6 | Basic anti-cheat (minimum time, option shuffle, rate limiting, server validation) | P2-3 | 2 d | Impossible answers rejected, abuse test suite |
| P2-7 | Load testing | P2-1 | 2 d | 20 matches × 100 players, p95 event latency < 300 ms |
| P2-8 | Observability (logs, metrics, alerts) | P2-1 | 2 d | Dashboard showing active matches, error rates, latency |

**Phase 2 Gate**: load test passed, 0 desync across 200 test matches.

---

## Phase 3 — Closed Beta (~3 weeks then ongoing)

| ID | Task | Depends On | Est. | Acceptance Criteria |
|---|---|---|---|---|
| P3-1 | Waitlist invites (in waves) | P2-5 | 2 d | Sent in waves, activation rate tracked |
| P3-2 | Product dashboard (D1/D7 retention, duration, completion, lobby fill) | P2-8 | 3 d | Daily updated KPIs |
| P3-3 | **Automatic difficulty recalibration** (observed vs labeled) | P2-1 | 3 d | Scheduled job, out-of-bounds questions flagged |
| P3-4 | **Anti-cheat suspicion score** + review tool | P3-2 | 4 d | False positive rate < 2% on test suite |
| P3-5 | Question reporting + automatic quarantine | P2-1 | 2 d | Configurable threshold, review queue |
| P3-6 | Current events question pipeline (weekly refresh, expiration) | P0-7 | 3 d | ≥ 20 fresh topical questions per week |
| P3-7 | Question pool expansion to 2,000+ | P0-7 | ongoing | Zero repeats over 20 matches |

**Phase 3 Gate**: D1 retention ≥ 35%, D7 retention ≥ 15% (initial targets, to adjust), lobbies ≥ 40% human during peak windows.

---

## Product KPIs

- Landing: email conversion ≥ 15% (original PRD goal).
- Match: completion ≥ 70%, duration 8-11 min.
- Retention: D1 / D7 (targets above).
- Content quality: flag rate < 0.5% of answers.

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Liquidity (not enough concurrent players) | High | High | Scheduled matches, identified bots, solo mode first |
| Cheating (looking up answers) | High | Medium | Escalating difficulty, large pool, suspicion scoring |
| Factual errors in questions | Medium | High | Two-pass verification, human review, reporting |
| Balancing (matches too long or short) | Medium | High | Phase 0 simulator, parameters in config |
| Unequal latency | Medium | Medium | Server timer, bounded RTT compensation |
| Name close to existing brand | Medium | Medium | Change name before public release |
| Mobile map readability | Medium | High | Prototype and test starting at P1-2/P1-4 |

## Next Decisions to Make

1. Frontend stack (React vs Svelte) and map library (custom SVG vs MapLibre).
2. Colyseus vs Socket.io (Phase 2, can wait).
3. Scheduled vs on-demand matches (recommendation: scheduled).
4. Product name.

