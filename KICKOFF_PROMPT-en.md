# KICKOFF PROMPT — Phase 0 (to paste into Claude Code)

Place `SPEC.md` and `ROADMAP.md` at the root of the repository before running this prompt.

---

You are the lead engineer on a web game called GeoClash Royale (working title): a trivia Battle Royale played on a world map. First, read both `SPEC.md` and `ROADMAP.md` in full. These are the sources of truth: if the code and the spec diverge, point it out rather than deciding on your own.

## Mission
Complete **Phase 0** of the roadmap, in this order: **P0-1 → P0-2 → P0-3 → P0-4 → P0-5 → P0-6**. Tasks P0-7 (questions) and P0-8 (landing page) are outside the scope of this session.

## Before Writing Any Code
1. Summarize your understanding of the rules in at most 10 lines (zone, jumps, elimination, finale).
2. List any ambiguities or contradictions found in the spec, along with your default proposed resolution for each.
3. Await confirmation if an ambiguity blocks the architecture; otherwise proceed with your proposals and document them in `docs/DECISIONS.md`.

## Technical Constraints
- Strict TypeScript, pnpm monorepo: `packages/engine`, `packages/sim`, `data/`. No front-end framework during this phase.
- The engine is a **pure and deterministic library**: `step(state, inputs, rng) → state'`, zero I/O, no `Date.now()` or `Math.random()`. Seeded RNG (e.g. mulberry32) injected from outside.
- **No hardcoded balance values**: everything comes from `data/balance.v0.json` validated by a schema (zod). Configuration is versioned.
- Vitest tests for every rule in `SPEC.md` §4-6 (zone, "F always inside the zone" invariant, Stopover, finale, safety net).
- A match with the identical seed and inputs must be **identically replayable** (dedicated test).
- No network access for data: generate `data/cities.json` from a list you write yourself (150 cities with approximate coordinates), and state clearly that coordinates must be reviewed.
- The graph generator and its validation script (connectivity, diameter ≤ 8, jump range fairness) must **fail loudly** in CI if any constraint is violated.

## Simulator (P0-5)
- CLI: `pnpm sim --games 1000 --seed 42 --balance data/balance.v0.json`.
- Output: JSON report + `report.md` detailing duration (median, p95), surviving players per round, elimination causes, finale rounds, wins per continent, success rate per difficulty.
- 1,000 matches in under 2 minutes on a standard laptop.

## Calibration (P0-6)
- Tune `balance.v0.json` to hit the targets from the ROADMAP table, one variable at a time, and log each iteration (changed parameter, measured effect) in `docs/CALIBRATION_LOG.md`.
- Produce `data/balance.v1.json` once targets are reached. If a target cannot be reached with the current rules, explain why and suggest a rule modification without applying it unilaterally.

## Working Method
- Small commits, one per task or subtask, with clear commit messages.
- After each task: run tests, reiterate the acceptance criteria from the ROADMAP, and confirm whether they have been met with evidence (command output).
- Do not proceed to the next task if criteria are unmet; explain the blocker.
- Avoid over-engineering: the goal is to quickly answer "is the game well-balanced?".

## End-of-Session Deliverables
1. Working build repository, passing test suite, configured CI.
2. `data/cities.json`, `data/graph.json`, `data/balance.v1.json`.
3. Final simulation report (`report.md`) across 1,000 matches.
4. `docs/DECISIONS.md` and `docs/CALIBRATION_LOG.md`.
5. A brief summary note: completed work, remaining tasks, and top 3 risks identified for Phase 1.

