# Décisions et écarts par rapport à la ROADMAP / SPEC

| # | Décision | Pourquoi |
|---|---|---|
| 1 | **Un seul package** (`src/engine`, `src/sim`, `src/scripts`) au lieu d'un monorepo `packages/*`, et **npm** au lieu de pnpm | Moins de friction pour démarrer. Le découpage en workspaces se fera en Phase 1, quand `apps/web` arrivera. Le moteur n'a aucune dépendance Node : il est déjà isolé dans `src/engine`. |
| 2 | **Pas d'ESLint** pour l'instant ; le typecheck strict (`tsc --noEmit`) joue le rôle de garde-fou | Évite de la configuration inutile en Phase 0. À ajouter en Phase 1. |
| 3 | Moteur **pur et rejouable** : l'état du RNG est stocké dans `MatchState.rngState` | Le serveur de la Phase 2 pourra rejouer une partie à l'identique, et les tests sont reproductibles. |
| 4 | Un round se joue en 3 appels : `drawQuestion` → `applyAnswers` → `applyMoves` | La bande de vitesse (donc la portée) doit être connue avant que le joueur choisisse son saut. |
| 5 | **Portées 4 / 2 / 1** (SPEC v0 : 6 / 3 / 1) | Avec un diamètre de 6, un saut de 6 couvrait toute la carte. |
| 6 | **Grâce = 0** : le joueur n'a que le round de prévisualisation pour quitter la zone rouge (SPEC v0 : 1 round de grâce) | Levier le plus efficace pour obtenir des éliminations. La règle « Escale » reste configurable (`zone.graceRounds`). |
| 7 | **Nouveau modèle de zone** : décalage du centre plafonné à `offsetRatio × rayon` | Corrige un défaut de la SPEC v0 (voir CALIBRATION_LOG #4-5). La Ville Finale n'est plus jamais sur le bord de la zone. |
| 8 | **10 événements de zone** (rounds 6, 9, 11, 13, 15, 17, 19, 21, 23, 25, finale au 27) | Courbe d'élimination conforme aux cibles. |
| 9 | **Réprieve** : la zone n'élimine jamais tous les survivants en même temps | Une partie doit toujours avoir un vainqueur ; règle symétrique à celle de la finale. |
| 10 | Finale : « 3 relances » = départage au temps cumulé de finale après **4** questions collectivement ratées ; ou après 10 questions de finale | Rend la SPEC §6 (points 3 et 5) non ambiguë. |
| 11 | Garde-fou : à 60 rounds, le temps de réponse cumulé le plus faible gagne | Aucune partie ne peut durer indéfiniment. Jamais déclenché en simulation. |
| 12 | Définition d'une ville **isolée** : sa **2ᵉ** ville la plus proche est à > 1 200 km | Une paire isolée (Ushuaia + Stanley) doit l'être aussi. |
| 13 | Les bots identifiés comme tels (SPEC D9) sont une règle de **produit/UI**, hors moteur | Le moteur ne connaît pas la différence humain/bot. |
| 14 | **Hors périmètre de cette session** : P0-7 (génération des questions) et P0-8 (landing) | Prévu : prompt de génération/vérification des questions en prochaine étape. |

## À valider par vous
- Coordonnées et raretés des 150 villes (`data/cities.json`).
- Choix des 21 hubs.
- Hypothèse `bots.blunderRate = 0,4` (voir CALIBRATION_LOG).
