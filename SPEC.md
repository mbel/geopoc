# GeoClash Royale — SPEC v0.1 (game loop chiffrée, recalée par simulation)

> Statut : v0, valeurs de départ **à calibrer par simulation** (voir ROADMAP Phase 0).
> Toute valeur marquée `⚙️` est un paramètre de config (`balance.v0.json`), jamais codée en dur.


## 0. Révisions v0.1 (après la simulation de la Phase 0)

Les valeurs du tableau §2 et du §4 ci-dessous sont celles de la v0. **Les valeurs en vigueur sont dans `data/balance.v1.json`** ; les changements sont :

| Sujet | v0 | v0.1 (en vigueur) |
|---|---|---|
| Portées Grand / Moyen / Micro | 6 / 3 / 1 | **4 / 2 / 1** |
| Grâce après rétrécissement | 1 round | **0** (le round de prévisualisation est la seule chance de fuir) |
| Événements de zone | 8, tous les 3 rounds (6 → 27) | **10 + finale** : rounds 6, 9, 11, 13, 15, 17, 19, 21, 23, 25 ; finale au 27 |
| Fractions de villes sûres | 70 / 50 / 35 / 22 / 12 / 5 % / 3 villes | **85 / 65 / 45 / 30 / 19 / 11 / 7 / 4 / 2 / 1,3 %** |
| Centre de la zone | rayon forcé par « F dedans » (F sur le bord) | décalage plafonné à **0,7 × rayon** : F strictement à l'intérieur |
| Difficulté | D1-2 puis D3, D3-4, D4-5 | D1-2 / D2-3 / D3-4 / D4-5 / **D5-6** |
| Graphe | 3 voisins + hubs | + hubs à 4 voisins + **chaque ville reliée à son hub le plus proche** ; isolée = 2ᵉ voisine à > 1 200 km |

Détails et justifications : `docs/CALIBRATION_LOG.md` et `docs/DECISIONS.md`.

## 1. Décisions verrouillées

| # | Décision |
|---|----------|
| D1 | Questions **globales** : même question, même instant, pour tous les joueurs d'une partie. |
| D2 | Pas de mort subite « le plus lent est éliminé ». Les éliminations viennent de la **zone** puis d'une **finale à difficulté croissante**. |
| D3 | Distance de saut = **sauts de graphe**, les océans comptent peu. Les îles isolées sont reliées à des hubs. |
| D4 | Zone lente au départ : **phase 0 de 5 questions faciles**, zone immobile. |
| D5 | Questions pas uniquement géo (géo ≤ 25 %). Finale : questions très générales, possiblement d'actualité. |
| D6 | Anti-triche : base MVP + score de suspicion en Phase 3. |
| D7 | Vainqueur = **dernier survivant**. Le badge est celui de la **Ville Finale** de la partie. |
| D8 | Compteur d'inscrits de la landing = **valeur réelle**. |
| D9 | Les bots sont **identifiés comme bots** dans l'UI (recommandation : honnêteté + évite toute pratique trompeuse). |

## 2. Paramètres de partie (⚙️ valeurs de départ)

| Paramètre | Valeur |
|-----------|--------|
| Joueurs par partie | 100 (humains + bots de remplissage) |
| Villes (MVP) | 150 |
| Durée cible | 9 min (hors lobby) |
| Fenêtre de réponse | 12 s |
| Révélation de la réponse | 2 s |
| Choix du saut | 5 s (défaut : rester sur place si pas de choix) |
| Mise à jour de la zone | 1 s |
| **Cycle d'un round** | **20 s** → ~27 rounds = 9 min |

### Bandes de vitesse → portée de saut

| Temps de réponse (serveur) | Saut débloqué | Portée (⚙️, en sauts de graphe) |
|---|---|---|
| 0 – 3 s | Grand | jusqu'à 6 |
| 3 – 8 s | Moyen | jusqu'à 3 |
| 8 – 12 s | Micro | 1 (voisin direct) |
| > 12 s ou erreur | Échec | 0 |

Un joueur peut toujours choisir une portée **inférieure** à celle débloquée.

## 3. Carte et graphe

- **Source** : liste de 150 villes (capitales + grandes villes + villes insulaires), avec `id, name, country, continent, lat, lng, hub: bool, rarity`.
- **Arêtes courtes** : chaque ville est reliée à ses 3-4 villes les plus proches (distance géographique, océans ignorés).
- **Hubs** : ~20 villes (hubs majeurs/aéroports). Les hubs sont reliés entre eux (3-4 liens chacun, réseau connexe).
- **Îles et villes isolées** : reliées à leurs **2 hubs les plus proches**. Aucune ville n'a moins de 3 liens.
- **Contraintes de validité (script de validation, bloquant en CI)** :
  - graphe connexe ;
  - diamètre ≤ 8 sauts ;
  - « portée à 3 sauts » de chaque ville ≥ 60 % de la médiane (équité de spawn).

## 4. Zone rouge

La zone est **géographique** (calotte sphérique), pas basée sur le graphe, pour que la déduction soit lisible visuellement.

- `Zone_t = (centre c_t, rayon r_t)`. Les villes dans la calotte sont **sûres**, les autres **rouges**.
- **Ville Finale F** : tirée au hasard au début, pondérée par `rarity` (plus rare = plus rare à tirer). Cachée aux joueurs.
- **Centre** : part de `c_0` = point aléatoire à ≤ 4 000 km de F (⚙️), converge vers F au fil des paliers. Le bruit initial rend la déduction non triviale.
- **Rayon** : pour chaque palier, `r_t = max(distance au k_t-ième ville la plus proche de c_t, distance(c_t, F) + marge)`. Invariant : **F est toujours dans la zone**.
- **Calendrier de rétrécissement** (⚙️) :

| Round de l'annonce | Round d'application | Villes sûres |
|---|---|---|
| 5 | 6 | 70 % |
| 8 | 9 | 50 % |
| 11 | 12 | 35 % |
| 14 | 15 | 22 % |
| 17 | 18 | 12 % |
| 20 | 21 | 5 % |
| 23 | 24 | 3 villes max |
| 26 | 27 | Ville Finale seule |

- **Prévisualisation** : la prochaine zone est affichée 1 round avant son application.
- **Phase 0 (rounds 1-5)** : zone immobile, aucune élimination, questions faciles (apprentissage, tension).

### Règle d'élimination (« Escale »)
1. Quand une zone s'applique, les joueurs sur une ville rouge passent en état **Exposé**.
2. Un joueur Exposé qui répond juste **et** saute vers une ville sûre est sauvé (la portée dépend de sa vitesse, comme d'habitude).
3. Fin du round suivant : tout joueur encore sur une ville rouge est **éliminé**.
4. Un joueur sur une ville sûre reste sûr jusqu'au prochain palier.

## 5. Difficulté et éliminations

Difficulté étiquetée de 1 à 5 (⚙️ par round) :

| Rounds | Mix de difficulté |
|---|---|
| 1-5 | 70 % D1, 30 % D2 |
| 6-10 | D2-D3 |
| 11-15 | D3 |
| 16-20 | D3-D4 |
| 21-27 | D4 (30 % D5) |
| Finale | D5 |

Taux de réussite **cibles** par difficulté (population humaine) : D1 92 %, D2 80 %, D3 65 %, D4 50 %, D5 35 %.
La difficulté **effective** est recalibrée à partir du taux de réussite observé (Phase 3).

## 6. Finale

Se déclenche quand la zone est réduite à la Ville Finale. Les survivants s'y trouvent tous.

1. Questions D5, fenêtre de réponse de **8 s**.
2. Toute erreur ou timeout = élimination immédiate.
3. Si **tous** les survivants échouent la même question : aucune élimination, nouvelle question (max 3 relances).
4. Si tous répondent juste : on continue avec une question plus difficile (pool « finale », au-dessus de D5).
5. **Filet de sécurité** (invisible dans le cas normal) : après 10 questions de finale avec > 1 survivant, gagne le **temps de réponse serveur cumulé** le plus faible.
6. Si un seul joueur reste avant la finale (tous les autres éliminés par la zone), il gagne.

## 7. Questions

### Schéma
```json
{
  "id": "q_000892",
  "lang": "fr",
  "category": "histoire | sciences | geo | arts | sport | culture_pop | nature | techno | gastronomie | actualite",
  "difficulty_label": 3,
  "difficulty_observed": null,
  "question": "Quel fleuve traverse Budapest ?",
  "options": ["Le Danube", "Le Rhin", "L'Elbe", "La Volga"],
  "answer_index": 0,
  "tags": ["europe", "fleuves"],
  "news": false,
  "expires_at": null,
  "status": "draft | verified | live | flagged | retired",
  "verification": { "generated_by": "model", "checked_by": "model2 | human", "source_hint": "..." },
  "stats": { "attempts": 0, "correct": 0, "median_ms": null },
  "report_count": 0
}
```

### Règles
- Les options sont **mélangées côté serveur** à l'envoi ; `answer_index` ne quitte jamais le serveur avant la révélation.
- Géo ≤ 25 % des questions d'une partie ; pas deux questions consécutives de même catégorie.
- Un joueur ne revoit pas une question vue dans ses 20 dernières parties.
- Pool cible : 400 (Phase 1), 2 000+ (Phase 3).
- **Pipeline** : génération IA → vérification par une 2ᵉ passe indépendante → échantillon relu à la main (≥ 10 %) → publication → bouton « signaler » en jeu → retrait automatique à N signalements.
- Questions d'actualité : `news: true`, `expires_at` obligatoire, uniquement en finale ou D4-D5.

## 7bis. Temps réel et équité réseau

- Serveur **autoritaire** : seul le serveur calcule le temps de réponse.
- `elapsed = t_reception_serveur − t_envoi_question − RTT/2` (RTT mesuré par ping, borné ⚙️ 0-400 ms).
- Temps de réponse minimal plausible : 400 ms (en dessous = rejet / flag).

## 8. Bots

Un bot a une compétence `s ∈ [0,1]`.

- `P(juste | difficulté d) = sigmoid(a·(s − b_d))`, paramètres calés sur les taux cibles du §5.
- Temps de réponse ~ **lognormale** dont la moyenne décroît avec `s` et croît avec `d`.
- Navigation : le bot estime le centre de la zone avec du bruit (qualité liée à `s`), puis choisit la ville qui minimise la distance au centre estimé dans sa portée.
- Population de bots : compétences tirées d'une loi Beta(2,2) pour la calibration, avec des profils « prudent », « agressif », « aléatoire ».

## 9. Modèle d'état d'une partie

```
LOBBY → ROUND[1..n] → FINALE → RESULTS
ROUND = QUESTION(12s) → REVEAL(2s) → MOVE(5s) → ZONE_UPDATE(1s)
```

Le moteur est une **bibliothèque pure** : `step(state, inputs, rng) → state'`, déterministe (RNG avec seed), sans I/O, utilisé par le simulateur, le client solo et le serveur.

## 10. Rétention (MVP)

- **Badge de ville** : attribué au gagnant pour la Ville Finale. Raretés `common / rare / legendary` selon `rarity` (fréquence de tirage).
- **Passeport** : galerie de badges, stats (parties, top 10, taux de victoire, distance parcourue).

## 11. Hors périmètre MVP

Monétisation, classement mondial, amis/parties privées, voix/chat, modes alternatifs, multilingue au-delà du français.

## 12. Questions ouvertes

1. Nom définitif du produit (« GeoClash Royale » est un titre temporaire et proche d'une marque existante : à vérifier avant tout lancement).
2. Parties **planifiées** (toutes les X minutes, lobby plein ou complété de bots) vs à la demande : recommandation = planifiées, ça concentre les joueurs.
3. Langues : français d'abord ?
4. Monétisation envisagée (cosmétiques ? abonnement ?).
5. Comptes : e-mail magique dès la Phase 2 ?
