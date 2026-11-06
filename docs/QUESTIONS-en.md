# Questions: Generation, Quality, and Verification

## Current State

- **1,291 questions** in French (`packages/data/questions.fr.json`), 10 categories, difficulty 1 through 6.
- **All in `draft` status**: generated from curated factual tables (`packages/data/questions-src/*.ts`) or individually drafted lines. **None have been audited by an external secondary source or human proofreader.** Minor errors or ambiguities undoubtedly exist: do not ship publicly in this state.

## Rebuilding / Expanding

```bash
npm run questions:build -w @geoclash/data
```

The generator is deterministic (fixed seed). Each subject has its own file (`geo.ts`, `science.ts`, `histoire.ts`, `culture.ts`, `arts.ts`, `sport.ts`, `nature.ts`, `food.ts`, `techno.ts`, `pop.ts`). Two ways to introduce content:

1. **Handcrafted row**: `["category", difficulty, "Question?", "Correct answer", "Distractor 1", "Distractor 2", "Distractor 3"]`.
2. **Template + Fact table**: a structured table of facts (e.g. country → capital) where distractors are dynamically sampled from other rows in the set.

The build script automatically rejects: duplicate options, fewer than 3 distractors, missing question marks, texts exceeding character limits, duplicate question texts, and **correct answer leaked inside the question prompt**. Original 66 seed question IDs (`q_0001`–`q_0066`, `questions-src/seed.json`) are preserved; generated IDs start from `q_0100`.

## Automated Quality Controls (Tests)

≥ 1,000 questions · each difficulty tier has ≥ 50 items · ≥ 9 categories, none exceeding 30% · zero duplicate questions · correct answer never leaked in prompt · uniform distribution of correct answer position (A/B/C/D) · prompts ≤ 200 characters, options ≤ 70.

## Verification Roadmap (Pre-Launch)

1. **Independent 2nd Pass** (distinct model or alternative prompt): "Does this question have exactly one verifiable, evergreen correct answer?" → flag as `flagged` upon ambiguity.
2. **Human review of a representative sample** (≥ 10%, focusing on D5-D6 difficulty and date-based facts) → promote to `verified`.
3. **In-game "Report Question" button** + automated quarantine after N flags (already supported in schema: `report_count`, status `flagged`).
4. **Data-driven difficulty recalibration**: observed success rate vs labeled difficulty.
5. For public production release: only serve `verified`/`live` questions.

## Known Watchouts

- "Dated" facts (records, titles, volatile demographic figures) were intentionally avoided; early 2026 events are not covered.
- Automated distractor generation can occasionally produce debatable distinctions (e.g. two cities crossed by the same river): the verification pass is designed to catch these.
- No current affairs (`news`) items yet: requires a dedicated ephemeral pipeline.
- The compiled question JSON bundle is embedded directly in the app (~300 KB); load dynamically on demand if client bundle size becomes a concern.

