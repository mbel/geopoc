# Journal de calibration (P0-6)

Chaque ligne = un essai réellement exécuté avec le simulateur. Cibles : voir ROADMAP (tableau P0-6).
`alive` = joueurs en vie en moyenne à la fin des rounds 5 / 10 / 15 / 20 / 25. `entrants` = survivants à l'entrée de la finale (médiane).

## Résultat final : `data/balance.v1.json`
1 000 parties, seeds 42 / 1 / 7 : **10 cibles sur 10 atteintes** à chaque fois (voir `reports/report.md`).
Durée médiane 9,5 min · alive 100 / 81 / 53 / 37 / 14 · entrants 7 · finale 3 rounds · aucune partie > 12 min.

## Historique

| # | Changement | Résultat | Décision |
|---|---|---|---|
| 0 | **Baseline** : valeurs de la SPEC v0 (portées 6/3/1, grâce 1 round, 8 événements tous les 3 rounds) | durée 10,2 · alive 100/90/87/80/61 · **entrants 48** · 3 cibles sur 10 | Beaucoup trop clément : la zone ne tue presque personne |
| G1 | Premier graphe (knn 3, hubs 3) | diamètre 9, Lagos atteint 37 % de la médiane à 3 sauts → **contrainte violée** | Explorer 24 combinaisons de paramètres |
| G2 | Liens inter-continents entre hubs | diamètre 4 : un Grand saut (6 sauts) couvre tout le monde, un Moyen atteint 64 % de la carte | **Rejeté** : détruit le principe « vitesse = portée » |
| G3 | `hubKnn 4` + chaque ville reliée à son hub le plus proche | diamètre 6, portée médiane 56, pire ville 66 % de la médiane | **Retenu** |
| 1 | Portées 6/3/1 → 4/2/1 ou 3/2/1 | alive@25 : 61 → 58, peu d'effet | Gardé 4/2/1 (Grand reste « énorme ») |
| 2 | Portées 2/1/1 | alive@25 : 41, entrants 33 | **Rejeté** : Moyen = Micro, plus de différence de vitesse |
| 3 | Grâce 1 round → 0 (le joueur n'a que le round de prévisualisation pour fuir) | alive@25 : 46 · entrants 32 | **Retenu** (levier le plus efficace) |
| 4 | Décalage initial du centre de zone 4 000 → 12 000 km | résultats **identiques quelles que soient les fractions** testées | **Défaut de conception trouvé** : le rayon était forcé par « F toujours dedans », donc les fractions n'avaient aucun effet, et F était toujours sur le bord de la zone (indice gratuit) |
| 5 | **Nouveau modèle de zone** : décalage du centre plafonné à `offsetRatio × rayon` (0,7) | les fractions pilotent enfin la taille ; F strictement à l'intérieur | **Retenu** (SPEC §4 mise à jour) |
| 6 | Espacement des zones : 8 événements / 3 rounds → 10 événements plus rapprochés (rounds 6, 9, 11, 13 … 25, finale 27), fractions 0,85 → 0,013 | alive@20 : 56 · entrants 15 | Mieux, mais les rétrécissements du milieu tuent trop peu |
| 7 | Difficulté plus raide (D5 dès le round 16, D6 en fin de partie) | peu d'effet seul | Gardé (profil S7) |
| 8 | Taux d'hésitation des bots `blunderRate` 0,15 → 0,5 | 0,4 : alive 100/81/53/36/14 · entrants 7 | **Retenu : 0,4**. Hypothèse réaliste (les humains ne réagissent pas parfaitement) à **remplacer par des données de playtest** |
| 9 | Test automatique : Stanley (Falkland) n'avait qu'un lien hub | — | **Bug** : « isolée » = 2ᵉ ville la plus proche à > 1 200 km (au lieu de la 1ʳᵉ) |
| 10 | Seeds 1 / 7 donnaient presque les mêmes parties | — | **Bug** : `mixSeed` mélangeait mal ; réécrit avec une vraie avalanche + test de non-collision |
| 11 | Re-vérification après correctifs, 3 seeds × 1 000 parties | 10/10 cibles | **balance.v1.json figé** |

## Réserves honnêtes
- Calibré sur des **bots**, pas sur des humains. Les deux hypothèses les plus fragiles : `blunderRate` (0,4) et les temps de réponse (`bots.timing`). À recaler dès les premières données de playtest (Phase 1) puis en bêta (Phase 3).
- L'équité de spawn varie de ±10-17 % d'une seed à l'autre (bruit statistique à 1 000 parties) : en dessous du seuil de 25 %, mais pas de marge énorme. Passer à 5 000 parties pour une mesure plus fine.
- Les coordonnées des villes sont **approximatives** : à vérifier avant toute publication.
