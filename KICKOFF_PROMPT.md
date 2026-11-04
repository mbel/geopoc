# KICKOFF PROMPT — Phase 0 (à coller dans Claude Code)

Place `SPEC.md` et `ROADMAP.md` à la racine du repo avant de lancer ce prompt.

---

Tu es l'ingénieur principal d'un jeu web appelé GeoClash Royale (titre temporaire) : un Battle Royale de culture générale sur une carte du monde. Lis d'abord `SPEC.md` puis `ROADMAP.md` en entier. Ce sont les sources de vérité : si le code et la spec divergent, signale-le au lieu de décider seul.

## Mission
Réaliser la **Phase 0** de la roadmap, dans cet ordre : **P0-1 → P0-2 → P0-3 → P0-4 → P0-5 → P0-6**. Les tâches P0-7 (questions) et P0-8 (landing) sont hors de cette session.

## Avant d'écrire du code
1. Résume en 10 lignes maximum ta compréhension des règles (zone, sauts, élimination, finale).
2. Liste les ambiguïtés ou contradictions que tu as trouvées dans la spec, avec ta proposition par défaut pour chacune.
3. Attends ma validation si une ambiguïté bloque l'architecture ; sinon avance avec tes propositions et note-les dans `docs/DECISIONS.md`.

## Contraintes techniques
- TypeScript strict, monorepo pnpm : `packages/engine`, `packages/sim`, `data/`. Pas de framework front dans cette phase.
- Le moteur est une **bibliothèque pure et déterministe** : `step(state, inputs, rng) → state'`, aucun I/O, aucun `Date.now()`/`Math.random()`. RNG seedé (ex. mulberry32), injecté.
- **Aucune valeur d'équilibrage en dur** : tout vient de `data/balance.v0.json` validé par un schéma (zod). La config est versionnée.
- Tests Vitest pour chaque règle de `SPEC.md` §4-6 (zone, invariant « F toujours dans la zone », Escale, finale, filet de sécurité).
- Une partie avec la même seed et les mêmes inputs doit être **rejouable à l'identique** (test dédié).
- Pas d'accès réseau pour les données : génère `data/cities.json` à partir d'une liste que tu écris toi-même (150 villes avec coordonnées approximatives), et dis-moi clairement que les coordonnées doivent être vérifiées.
- Le générateur de graphe et son script de validation (connexité, diamètre ≤ 8, équité de portée) doivent **échouer bruyamment** en CI si une contrainte est violée.

## Simulateur (P0-5)
- CLI : `pnpm sim --games 1000 --seed 42 --balance data/balance.v0.json`.
- Sortie : rapport JSON + `report.md` avec durée (médiane, p95), joueurs en vie par round, causes d'élimination, rounds de finale, victoires par continent, taux de réussite par difficulté.
- 1 000 parties en moins de 2 minutes sur un laptop standard.

## Calibration (P0-6)
- Ajuste `balance.v0.json` pour atteindre les cibles du tableau de la ROADMAP, une variable à la fois, et consigne chaque itération (paramètre changé, effet mesuré) dans `docs/CALIBRATION_LOG.md`.
- Produis `data/balance.v1.json` quand les cibles sont atteintes. Si une cible est inatteignable avec les règles actuelles, explique pourquoi et propose une modification de règle, sans la faire seul.

## Méthode de travail
- Commits petits, un par tâche ou sous-tâche, messages clairs.
- Après chaque tâche : lance les tests, rappelle le critère d'acceptation de la ROADMAP et dis s'il est atteint, avec la preuve (sortie de commande).
- Ne passe pas à la tâche suivante si le critère n'est pas atteint ; explique le blocage.
- Ne sur-ingénierie pas : le but est de répondre vite à « le jeu est-il bien équilibré ? ».

## Livrables de fin de session
1. Repo qui build, tests verts, CI configurée.
2. `data/cities.json`, `data/graph.json`, `data/balance.v1.json`.
3. Rapport de simulation final (`report.md`) sur 1 000 parties.
4. `docs/DECISIONS.md` et `docs/CALIBRATION_LOG.md`.
5. Un court message de synthèse : ce qui est fait, ce qui reste, les 3 risques que tu vois pour la Phase 1.
