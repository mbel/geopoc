# Rapport de simulation — balance v1

1000 parties, seed 42. **Résultat global : TOUTES LES CIBLES ATTEINTES ✅**

## Contrôles vs cibles

| Indicateur | Mesuré | Cible | OK |
|---|---|---|---|
| Durée médiane (min) | 9.5 | 8-10 | ✅ |
| Joueurs en vie fin du round 5 | 100.0 | 100 ± 8 | ✅ |
| Joueurs en vie fin du round 10 | 80.8 | 80 ± 8 | ✅ |
| Joueurs en vie fin du round 15 | 53.2 | 55 ± 8 | ✅ |
| Joueurs en vie fin du round 20 | 36.7 | 30 ± 8 | ✅ |
| Joueurs en vie fin du round 25 | 13.9 | 12 ± 8 | ✅ |
| Survivants à l'entrée de la finale (médiane) | 7.0 | 2-8 | ✅ |
| Rounds de finale (médiane) | 3.0 | 1-6 | ✅ |
| Équité de spawn : pire écart continent | EU +17 % | ± 25 % | ✅ |
| Parties de plus de 12 min | 0.0 % | < 2 % | ✅ |

## Durée

Médiane 9.5 min, moyenne 9.5, p5 9.2, p95 10.2.

## Courbe d'élimination (joueurs en vie en moyenne)

| Fin du round | En vie |
|---|---|
| 5 | 100.0 |
| 10 | 80.8 |
| 15 | 53.2 |
| 20 | 36.7 |
| 25 | 13.9 |

## Finale

Atteinte dans 95.4 % des parties. Entrants : médiane 7, moyenne 8.5. Rounds de finale : médiane 3, p95 7.

Fins de partie : last_survivor 980, tiebreak 20.

Éliminations par partie : zone 91.9, finale 7.1, départage 0.0.

## Équité de spawn par continent

| Continent | Apparitions | Victoires | Taux de victoire | Ratio vs moyenne |
|---|---|---|---|---|
| AF | 15940 | 164 | 1.0 % | 1.03 |
| AS | 23869 | 240 | 1.0 % | 1.01 |
| EU | 22275 | 260 | 1.2 % | 1.17 |
| NA | 15492 | 136 | 0.9 % | 0.88 |
| OC | 12490 | 108 | 0.9 % | 0.86 |
| SA | 9934 | 92 | 0.9 % | 0.93 |

## Taux de réussite observés en partie (biais de survie : les meilleurs restent)

| Difficulté | Tentatives | Réussite |
|---|---|---|
| D1 | 352500 | 91.6 % |
| D2 | 331257 | 79.0 % |
| D3 | 442590 | 63.9 % |
| D4 | 282868 | 52.3 % |
| D5 | 222171 | 42.9 % |
| D6 | 66680 | 34.7 % |
| D7 | 309 | 35.9 % |

## Bandes de vitesse (réponses de joueurs en vie)

GRAND 19.0 % · MOYEN 40.4 % · MICRO 7.6 % · FAIL 33.1 %

## Villes finales les plus tirées

Antananarivo 1.7 % · Abidjan 1.6 % · Hong Kong 1.4 % · Sydney 1.4 % · Hanoi 1.3 %
