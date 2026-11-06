# GeoClash Royale — SPEC v0.1 (quantified game loop, calibrated by simulation)

> Status: v0, initial baseline values **to be calibrated via simulation** (see ROADMAP Phase 0).
> Any value flagged with `⚙️` is a configuration parameter (`balance.v0.json`), never hardcoded.


## 0. Revisions v0.1 (after Phase 0 simulation)

The values in §2 table and §4 below reflect v0. **The values currently in effect live in `data/balance.v1.json`**; key changes are:

| Topic | v0 | v0.1 (in effect) |
|---|---|---|
| Large / Medium / Micro jump ranges | 6 / 3 / 1 | **4 / 2 / 1** |
| Grace round after shrinkage | 1 round | **0** (the preview round is the sole escape opportunity) |
| Zone events | 8, every 3 rounds (6 → 27) | **10 + finale**: rounds 6, 9, 11, 13, 15, 17, 19, 21, 23, 25; finale at 27 |
| Safe city fractions | 70 / 50 / 35 / 22 / 12 / 5 % / 3 cities | **85 / 65 / 45 / 30 / 19 / 11 / 7 / 4 / 2 / 1.3 %** |
| Zone center | radius forced by "F inside" (F on edge) | offset capped at **0.7 × radius**: F strictly interior |
| Difficulty | D1-2 then D3, D3-4, D4-5 | D1-2 / D2-3 / D3-4 / D4-5 / **D5-6** |
| Graph | 3 neighbors + hubs | + hubs at 4 neighbors + **every city connected to nearest hub**; isolated = 2nd neighbor > 1,200 km |

Details and rationale: `docs/CALIBRATION_LOG-en.md` (`docs/CALIBRATION_LOG.fr.md`) and `docs/DECISIONS-en.md` (`docs/DECISIONS.fr.md`).

## 1. Locked Decisions

| # | Decision |
|---|----------|
| D1 | **Global** questions: same question, same moment, across all players in a match. |
| D2 | No sudden death "slowest player is eliminated". Eliminations stem from the **zone** followed by an **escalating difficulty finale**. |
| D3 | Jump distance = **graph hops**, oceans have negligible penalty. Isolated islands connect to hubs. |
| D4 | Slow initial zone: **phase 0 of 5 easy questions**, stationary zone. |
| D5 | Questions not solely geography (geo ≤ 25%). Finale: broad general knowledge, potentially topical news. |
| D6 | Anti-cheat: MVP foundation + suspicion scoring in Phase 3. |
| D7 | Winner = **last survivor**. The awarded badge corresponds to the match's **Final City**. |
| D8 | Landing page waitlist counter = **real verified count**. |
| D9 | Bots are **clearly labeled as bots** in the UI (recommendation: transparency + prevents deceptive patterns). |

## 2. Match Parameters (⚙️ initial baseline values)

| Parameter | Value |
|-----------|-------|
| Players per match | 100 (humans + bot backfill) |
| Cities (MVP) | 150 |
| Target duration | 9 min (excluding lobby) |
| Answer window | 12 s |
| Answer reveal | 2 s |
| Jump selection | 5 s (default: stay put if no selection) |
| Zone update | 1 s |
| **Round cycle** | **20 s** → ~27 rounds = 9 min |

### Speed Tiers → Jump Range

| Response time (server) | Unlocked Jump | Range (⚙️, in graph hops) |
|---|---|---|
| 0 – 3 s | Large | up to 6 |
| 3 – 8 s | Medium | up to 3 |
| 8 – 12 s | Micro | 1 (direct neighbor) |
| > 12 s or incorrect | Failure | 0 |

A player can always select a destination with **lower** hop distance than their maximum unlocked range.

## 3. Map and Graph

- **Source**: dataset of 150 cities (capitals + major metropolises + island cities), with `id, name, country, continent, lat, lng, hub: bool, rarity`.
- **Short edges**: each city links to its 3-4 closest neighboring cities (geographical distance, ignoring oceans).
- **Hubs**: ~20 cities (major hubs/airports). Hubs interconnect with one another (3-4 links each, connected mesh).
- **Islands and isolated cities**: connected to their **2 nearest hubs**. No city has fewer than 3 links.
- **Validity constraints (validation script, blocking in CI)**:
  - connected graph;
  - diameter ≤ 8 hops;
  - "3-hop reach" from any city ≥ 60% of the median (spawn fairness).

## 4. Red Zone

The zone is **geographical** (spherical cap), not graph-topology based, ensuring intuitive visual readability.

- `Zone_t = (center c_t, radius r_t)`. Cities within the spherical cap are **safe**, others turn **red**.
- **Final City F**: selected randomly at match start, weighted by `rarity` (higher rarity = less frequent). Hidden from players.
- **Center**: begins at `c_0` = random point within ≤ 4,000 km of F (⚙️), converges toward F across stages. Initial noise prevents trivial center-guessing.
- **Radius**: for each stage, `r_t = max(distance to k_t-th closest city to c_t, distance(c_t, F) + margin)`. Invariant: **F is always within the zone**.
- **Shrinkage schedule** (⚙️):

| Announce Round | Apply Round | Safe Cities |
|---|---|---|
| 5 | 6 | 70 % |
| 8 | 9 | 50 % |
| 11 | 12 | 35 % |
| 14 | 15 | 22 % |
| 17 | 18 | 12 % |
| 20 | 21 | 5 % |
| 23 | 24 | 3 cities max |
| 26 | 27 | Final City alone |

- **Preview**: the upcoming zone boundary is visible 1 round before enactment.
- **Phase 0 (rounds 1-5)**: static zone, zero eliminations, easy questions (onboarding, building tension).

### Elimination Rule ("Stopover")
1. When a new zone takes effect, players located on red cities enter the **Exposed** state.
2. An Exposed player who answers correctly **and** jumps to a safe city is saved (jump range depends on response speed, as usual).
3. End of the following round: any player still stranded on a red city is **eliminated**.
4. Players on safe cities remain safe until the next shrinkage stage.

## 5. Difficulty and Eliminations

Labeled difficulty from 1 to 5 (⚙️ per round):

| Rounds | Difficulty Mix |
|---|---|
| 1-5 | 70 % D1, 30 % D2 |
| 6-10 | D2-D3 |
| 11-15 | D3 |
| 16-20 | D3-D4 |
| 21-27 | D4 (30 % D5) |
| Finale | D5 |

**Target** success rates per difficulty (human population): D1 92%, D2 80%, D3 65%, D4 50%, D5 35%.
**Effective** difficulty is recalibrated based on observed success rates (Phase 3).

## 6. Finale

Triggers once the zone has contracted down to the Final City. All remaining survivors are gathered there.

1. D5 questions, **8 s** answer window.
2. Any incorrect answer or timeout = instant elimination.
3. If **all** survivors miss the same question: nobody is eliminated, next question served (max 3 retries).
4. If all answer correctly: proceed with an even tougher question ("finale" pool, beyond D5).
5. **Safety net** (invisible under typical play): after 10 finale questions with > 1 survivor remaining, the lowest **cumulative server response time** wins.
6. If only one player survives prior to the finale (all others eliminated by the zone), that player wins immediately.

## 7. Questions

### Schema
```json
{
  "id": "q_000892",
  "lang": "en",
  "category": "history | science | geo | arts | sports | pop_culture | nature | tech | gastronomy | current_affairs",
  "difficulty_label": 3,
  "difficulty_observed": null,
  "question": "Which river flows through Budapest?",
  "options": ["The Danube", "The Rhine", "The Elbe", "The Volga"],
  "answer_index": 0,
  "tags": ["europe", "rivers"],
  "news": false,
  "expires_at": null,
  "status": "draft | verified | live | flagged | retired",
  "verification": { "generated_by": "model", "checked_by": "model2 | human", "source_hint": "..." },
  "stats": { "attempts": 0, "correct": 0, "median_ms": null },
  "report_count": 0
}
```

### Rules
- Options are **randomly shuffled server-side** before transmission; `answer_index` never leaves the server prior to reveal.
- Geography accounts for ≤ 25% of match questions; no two consecutive questions from the same category.
- A player will not encounter a question seen in their last 20 matches.
- Target question pool: 400 (Phase 1), 2,000+ (Phase 3).
- **Pipeline**: AI generation → independent 2nd-pass verification → sample manually reviewed (≥ 10%) → deployment → in-game "report" button → auto-quarantine at N flags.
- Current affairs: `news: true`, mandatory `expires_at`, only allowed in finale or D4-D5.

## 7bis. Real-Time and Network Fairness

- **Authoritative** server: only the server calculates response duration.
- `elapsed = t_server_receipt − t_question_sent − RTT/2` (RTT measured via ping, clamped ⚙️ 0-400 ms).
- Minimum plausible human response time: 400 ms (faster submissions rejected / flagged).

## 8. Bots

A bot has a skill rating `s ∈ [0,1]`.

- `P(correct | difficulty d) = sigmoid(a·(s − b_d))`, parameters calibrated against §5 target rates.
- Response time follows a **lognormal distribution** whose mean decreases with `s` and increases with `d`.
- Navigation: the bot estimates the zone center with noise (estimation quality correlated with `s`), then picks the city within reach that minimizes distance to the estimated center.
- Bot population: skill ratings drawn from a Beta(2,2) distribution during calibration, with "cautious", "aggressive", and "random" behavioral archetypes.

## 9. Match State Model

```
LOBBY → ROUND[1..n] → FINALE → RESULTS
ROUND = QUESTION(12s) → REVEAL(2s) → MOVE(5s) → ZONE_UPDATE(1s)
```

The engine is a **pure library**: `step(state, inputs, rng) → state'`, deterministic (seeded RNG), zero I/O, shared across the simulator, solo client, and multiplayer server.

## 10. Retention (MVP)

- **City badge**: awarded to the winner for the Final City. Rarities: `common / rare / legendary` based on `rarity` (draw frequency).
- **Passport**: badge collection showcase, stats (matches played, top 10 finishes, win rate, total distance traveled).

## 11. Out of Scope for MVP

Monetization, global leaderboards, friend lists / private rooms, voice / chat, alternate game modes, multilingual localization beyond initial target.

## 12. Open Questions

1. Final product name ("GeoClash Royale" is a working title close to existing IP: review prior to launch).
2. **Scheduled** matches (every X minutes, full lobby or filled with bots) vs on-demand: recommendation = scheduled matches to concentrate liquidity.
3. Languages: French first, followed by English?
4. Target monetization model (cosmetics? subscription?).
5. Accounts: passwordless magic link starting in Phase 2?

