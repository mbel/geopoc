# Decisions and Deviations from ROADMAP / SPEC

| # | Decision | Rationale |
|---|---|---|
| 1 | **Single package** (`src/engine`, `src/sim`, `src/scripts`) instead of a monorepo `packages/*`, and **npm** instead of pnpm | Lower onboarding friction. Workspaces separation takes place in Phase 1 when `apps/web` lands. The engine has zero Node dependencies: it is already isolated in `src/engine`. |
| 2 | **No ESLint** initially; strict typechecking (`tsc --noEmit`) serves as safeguard | Prevents superfluous configuration during Phase 0. To be introduced in Phase 1. |
| 3 | **Pure and replayable** engine: RNG internal state is tracked in `MatchState.rngState` | The Phase 2 server can replay any match deterministically, and tests are perfectly reproducible. |
| 4 | A round executes in 3 sequential calls: `drawQuestion` → `applyAnswers` → `applyMoves` | The speed tier (and therefore jump range) must be resolved before the player chooses their destination. |
| 5 | **Ranges 4 / 2 / 1** (SPEC v0: 6 / 3 / 1) | With a graph diameter of 6, a 6-hop jump spanned the entire globe. |
| 6 | **Grace = 0**: player only has the preview round to leave the red zone (SPEC v0: 1 grace round) | Most effective lever for driving steady eliminations. The "Stopover" rule remains configurable (`zone.graceRounds`). |
| 7 | **New zone model**: center offset capped at `offsetRatio × radius` | Fixes a design flaw in SPEC v0 (see CALIBRATION_LOG #4-5). The Final City is never stuck unnaturally on the zone edge. |
| 8 | **10 zone events** (rounds 6, 9, 11, 13, 15, 17, 19, 21, 23, 25, finale at 27) | Yields an elimination curve matching roadmap targets. |
| 9 | **Reprieve**: the zone never eliminates all remaining survivors simultaneously | A match must always have a winner; symmetric rule to the finale. |
| 10 | Finale: "3 retries" = tiebreak by cumulative finale time after **4** collectively missed questions; or after 10 finale rounds | Eliminates ambiguity from SPEC §6 (items 3 and 5). |
| 11 | Global safety net: at round 60, lowest cumulative response time wins | No match can run indefinitely. Never triggered during simulation. |
| 12 | Definition of an **isolated** city: its **2nd** nearest city is > 1,200 km away | An isolated pair (e.g. Ushuaia + Stanley) must also qualify as isolated. |
| 13 | Clearly identifying bots (SPEC D9) is a **product/UI** rule, external to the engine | The engine does not distinguish humans from bots. |
| 14 | **Out of scope for this session**: P0-7 (question generation) and P0-8 (landing page) | Planned: question generation/verification prompt in next phase. |

## For Your Validation
- Coordinates and rarities of the 150 cities (`data/cities.json`).
- Selection of the 21 transport hubs.
- Hypothesis `bots.blunderRate = 0.4` (see CALIBRATION_LOG).

