# Calibration Log (P0-6)

Each line represents an actual test run performed with the simulator. Targets: see ROADMAP (table P0-6).
`alive` = average surviving players at the end of rounds 5 / 10 / 15 / 20 / 25. `entrants` = survivors entering the finale (median).

## Final Result: `data/balance.v1.json`
1,000 matches, seeds 42 / 1 / 7: **10 out of 10 targets reached** across every seed (see `reports/report-en.md` / `reports/report.fr.md`).
Median duration 9.5 min · alive 100 / 81 / 53 / 37 / 14 · entrants 7 · finale 3 rounds · 0 matches > 12 min.

## History

| # | Change | Outcome | Decision |
|---|---|---|---|
| 0 | **Baseline**: SPEC v0 parameters (ranges 6/3/1, grace 1 round, 8 events every 3 rounds) | duration 10.2 · alive 100/90/87/80/61 · **entrants 48** · 3 targets out of 10 | Far too lenient: the zone barely eliminates anyone |
| G1 | Initial graph (knn 3, hubs 3) | diameter 9, Lagos reaches 37% of median at 3 hops → **constraint violated** | Explore 24 parameter permutations |
| G2 | Inter-continental links between hubs | diameter 4: Large jump (6 hops) spans the globe, Medium covers 64% of map | **Rejected**: invalidates the "speed = range" premise |
| G3 | `hubKnn 4` + each city linked to its closest hub | diameter 6, median reach 56, worst city 66% of median | **Accepted** |
| 1 | Ranges 6/3/1 → 4/2/1 or 3/2/1 | alive@25: 61 → 58, minimal impact | Retained 4/2/1 (Large remains "huge") |
| 2 | Ranges 2/1/1 | alive@25: 41, entrants 33 | **Rejected**: Medium = Micro, speed tiers lose differentiation |
| 3 | Grace 1 round → 0 (player only has preview round to flee) | alive@25: 46 · entrants 32 | **Accepted** (most impactful mechanical lever) |
| 4 | Initial zone center offset 4,000 → 12,000 km | results **identical regardless of fractions** tested | **Design flaw discovered**: radius was forced by "F always inside", so fractions had zero effect, and F sat on zone border (free giveaway) |
| 5 | **New zone model**: center offset capped at `offsetRatio × radius` (0.7) | fractions finally control size; F strictly interior | **Accepted** (updated SPEC §4) |
| 6 | Zone pacing: 8 events / 3 rounds → 10 tighter events (rounds 6, 9, 11, 13 … 25, finale 27), fractions 0.85 → 0.013 | alive@20: 56 · entrants 15 | Better, but mid-game contractions eliminate too few players |
| 7 | Steeper difficulty ramp (D5 by round 16, D6 late game) | minimal isolated impact | Retained (S7 profile) |
| 8 | Bot blunder rate `blunderRate` 0.15 → 0.5 | 0.4: alive 100/81/53/36/14 · entrants 7 | **Accepted: 0.4**. Realistic assumption (humans make suboptimal choices), to be **replaced by playtest data** |
| 9 | Automated test: Stanley (Falklands) only had one hub link | — | **Bug**: "isolated" = 2nd nearest city > 1,200 km (instead of 1st) |
| 10 | Seeds 1 / 7 produced nearly identical games | — | **Bug**: `mixSeed` had poor diffusion; rewritten with proper avalanche + non-collision test |
| 11 | Re-verification after bug fixes, 3 seeds × 1,000 matches | 10/10 targets | **balance.v1.json frozen** |

## Honest Caveats
- Calibrated using **bots**, not human players. The two most sensitive assumptions: `blunderRate` (0.4) and response timing (`bots.timing`). Must be recalibrated as soon as initial playtest data arrives (Phase 1) and in beta (Phase 3).
- Spawn fairness varies by ±10-17% between seeds (statistical noise across 1,000 matches): below the 25% tolerance threshold, but lacking wide safety margin. Run 5,000 matches for tighter variance estimates.
- City coordinates are **approximate**: must be audited prior to public launch.

