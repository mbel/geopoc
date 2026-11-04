# Questions : génération, qualité, vérification

## État

- **1 291 questions** en français (`packages/data/questions.fr.json`), 10 catégories, difficulté 1 à 6.
- **Toutes en statut `draft`** : générées à partir de tables de faits écrites à la main (`packages/data/questions-src/*.ts`) ou rédigées une à une. **Aucune n'a été vérifiée par une source externe ni par un relecteur humain.** Il y a certainement quelques erreurs ou ambiguïtés : ne pas publier en l'état.

## Régénérer / étendre

```bash
npm run questions:build -w @geoclash/data
```

Le générateur est déterministe (graine fixe). Chaque thème est un fichier (`geo.ts`, `science.ts`, `histoire.ts`, `culture.ts`, `arts.ts`, `sport.ts`, `nature.ts`, `food.ts`, `techno.ts`, `pop.ts`). Deux façons d'ajouter du contenu :

1. **Ligne écrite à la main** : `["catégorie", difficulté, "Question ?", "Bonne réponse", "Faux 1", "Faux 2", "Faux 3"]`.
2. **Table + modèle** : une liste de faits (ex. pays → capitale) dont les distracteurs sont tirés automatiquement parmi les autres lignes.

Le script rejette automatiquement : options en double, moins de 3 distracteurs, question sans « ? », textes trop longs, doublons d'énoncé, **réponse présente dans l'énoncé**. Les ids des 66 questions d'origine (`q_0001`–`q_0066`, `questions-src/seed.json`) sont conservés ; les nouvelles commencent à `q_0100`.

## Contrôles automatiques (tests)

≥ 1 000 questions · chaque difficulté ≥ 50 · ≥ 9 catégories, aucune > 30 % · aucun énoncé en double · réponse absente de l'énoncé · bonne réponse répartie sur les 4 positions · énoncés ≤ 200 caractères, options ≤ 70.

## Plan de vérification (à faire avant publication)

1. **Seconde passe indépendante** (modèle différent ou autre prompt) : « cette question a-t-elle une seule bonne réponse, fiable et non datée ? » → marque `flagged` si doute.
2. **Relecture humaine d'un échantillon** (≥ 10 %, plus les difficultés 5-6 et les dates) → passage en `verified`.
3. **Bouton « signaler » en jeu** + retrait automatique après N signalements (déjà prévu dans le schéma : `report_count`, statut `flagged`).
4. **Recalibrage par les données** : difficulté observée (taux de réussite réel) vs difficulté étiquetée.
5. Pour la publication : n'utiliser que `verified`/`live`.

## Points d'attention connus

- Questions « datées » (records, titres, populations) volontairement évitées ; les événements de début 2026 ne sont pas couverts.
- Les distracteurs automatiques peuvent parfois être discutables (ex. deux villes traversées par le même fleuve) : c'est ce que la passe de vérification doit trouver.
- Pas d'actualité (`news`) pour l'instant : il faudra un pipeline de fraîcheur dédié.
- Le fichier JSON est embarqué dans l'application (~300 Ko) ; à charger à la demande si la taille devient un sujet.
