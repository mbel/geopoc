# GeoClash Royale — ROADMAP v0

> Hypothèse d'équipe : 1-2 développeurs JS/TS assistés par IA. Estimations en jours-personne, à réviser après la Phase 0.
> Principe directeur : **valider le fun et l'équilibrage avant le réseau**. Le risque n°1 est la liquidité des joueurs, pas la technique.

## Avancement (mis à jour)

| Tâche | État |
|---|---|
| **Phase 0** P0-1 à P0-6 (repo, moteur, graphe, bots, simulateur, calibration) | ✅ fait, 10/10 cibles |
| P0-7 pipeline de questions | 🟡 générateur + contrôles automatiques ✅ ; pipeline de vérification ⏳ |
| P0-8 landing page | ⏳ à faire |
| P1-1 shell PWA | ✅ configuré (manifest, service worker, icônes provisoires) — **non testé sur appareil** |
| P1-2 carte (côtes, zone, villes, pan/zoom tactile) | ✅ écrite et testée en jsdom — **non testée sur appareil** |
| P1-3 écran question | ✅ |
| P1-4 UX du saut (sélection + confirmation, auto-envoi) | ✅ — à valider en test utilisateur |
| P1-5 moteur + bots en local (solo) | ✅ |
| P1-6 finale, résultats, badge | ✅ |
| P1-7 passeport (stockage local / Preferences natif) | ✅ |
| P1-8 pool de questions | 🟡 1 291 brouillons générés ; **vérification ⏳** (voir `docs/QUESTIONS.md`) |
| P1-9 tutoriel · P1-10 analytics et playtests | ⏳ |
| P2-1 serveur autoritaire | ✅ MVP (9 tests d'intégration WebSocket) |
| P2-2 protocole versionné, reconnexion | 🟡 protocole v1 ✅ ; **reconnexion ⏳** |
| P2-3 chrono serveur + compensation de latence | 🟡 compensation RTT/2 bornée ✅ ; à valider en conditions réelles |
| P2-4 lobby + **bots sur les places libres** | ✅ (lobby à attente ; créneaux planifiés ⏳) |
| P2-5 comptes · P2-7 test de charge · P2-8 observabilité | ⏳ |
| P2-6 anti-cheat de base | 🟡 validation serveur + limitation de débit ✅ ; score de suspicion ⏳ |

## Vue d'ensemble

| Phase | Objectif | Durée | Gate de sortie |
|---|---|---|---|
| **0. Design & simulation** | Règles chiffrées, graphe, simulateur, landing | ~2 sem. | Partie simulée de 8-10 min, courbe d'élimination dans la cible |
| **1. Solo vs bots** | Jeu complet jouable dans le navigateur | ~4 sem. | 70 %+ des playtesteurs finissent une partie, 40 %+ en relancent une |
| **2. Multijoueur** | Serveur autoritaire, lobbies, comptes | ~4 sem. | 100 joueurs/partie, 20 parties simultanées en test de charge |
| **3. Bêta fermée** | Télémétrie, anti-triche, recalibrage | ~3 sem. + continu | Rétention J1/J7 mesurée, lobbies remplis |

## Stack proposée (à confirmer)

- **TypeScript** partout. Monorepo (pnpm workspaces).
- `packages/engine` : logique de jeu pure et déterministe (RNG seedé), testée avec Vitest.
- `packages/sim` : simulateur CLI (bots, métriques, rapports).
- `apps/web` : PWA mobile-first (Vite + React ou Svelte), carte en SVG/Canvas ou MapLibre/Leaflet.
- `apps/server` (Phase 2) : Node + WebSocket (Colyseus ou Socket.io), Postgres (Supabase possible).
- `data/` : villes, graphe, questions.

---

## Phase 0 — Design & simulation (~2 semaines)

| ID | Tâche | Dépend de | Est. | Critère d'acceptation |
|---|---|---|---|---|
| P0-1 | Monorepo, lint, CI, conventions, Vitest | — | 1 j | `pnpm test` et `pnpm lint` passent en CI |
| P0-2 | **Engine v0** : machine à états, zone (calotte), sauts, élimination, finale, RNG seedé | P0-1 | 4 j | Partie complète rejouable à l'identique avec la même seed ; tests unitaires sur chaque règle de SPEC §4-6 |
| P0-3 | **Données villes + générateur de graphe** (150 villes, hubs, arêtes) + script de validation | P0-1 | 3 j | Connexe, diamètre ≤ 8, équité de portée ≥ 60 % de la médiane (SPEC §3) |
| P0-4 | **Modèle de bots** (compétence, temps lognormal, navigation bruitée) | P0-2 | 2 j | Taux de réussite par difficulté dans ±3 pts des cibles SPEC §5 |
| P0-5 | **Simulateur CLI** (N parties, métriques, rapport JSON + md) | P0-2, P0-3, P0-4 | 3 j | 1 000 parties en < 2 min ; sortie : durée, joueurs en vie par round, causes d'élimination, victoires par continent |
| P0-6 | **Calibration** : boucle de réglage de `balance.v0.json` | P0-5 | 2 j | Cibles atteintes (tableau ci-dessous), `balance.v1.json` figé |
| P0-7 | **Schéma de questions + prompts de génération + pipeline de vérification** (POC sur 200 questions) | P0-1 | 3 j | 200 questions `verified`, ≥ 10 % relues à la main, 0 erreur factuelle dans l'échantillon |
| P0-8 | **Landing page** (vrai formulaire e-mail, **vrai compteur**, analytics, mentions RGPD) | — | 2 j | Inscription enregistrée, double opt-in, objectif de conversion mesuré |

### Cibles de calibration (P0-6)

| Indicateur | Cible |
|---|---|
| Durée médiane d'une partie | 8-10 min |
| Joueurs en vie fin du round 5 | 100 % |
| Fin du round 10 / 15 / 20 / 25 | ~80 / 55 / 30 / 12 (±8) |
| Survivants à l'entrée de la finale | 2-8 |
| Rounds de finale | 1-6 |
| Part de victoires par continent (bots équivalents) | ±25 % de l'espérance uniforme |
| Parties dépassant 12 min | < 2 % |

**Gate Phase 0** : toutes les cibles atteintes sur 1 000 parties simulées + landing en ligne.

---

## Phase 1 — Solo vs bots (~4 semaines)

| ID | Tâche | Dépend de | Est. | Critère d'acceptation |
|---|---|---|---|---|
| P1-1 | Shell PWA (manifest, service worker, install, thème, écrans de nav) | P0-1 | 2 j | Installable sur iOS/Android, Lighthouse PWA ≥ 90 |
| P1-2 | **Carte** : rendu monde, villes, pion, zone, prévisualisation de zone | P0-2, P0-3 | 5 j | 60 fps sur mobile milieu de gamme, tap précis sur une ville |
| P1-3 | **Écran question** : chrono, options, feedback, révélation | P0-2 | 3 j | Chrono fluide, aucun double envoi, lisible en plein soleil |
| P1-4 | **UX du saut** : portée débloquée, villes atteignables mises en évidence, confirmation | P1-2 | 3 j | Choix en ≤ 2 taps ; test utilisateur : 90 % comprennent sans explication |
| P1-5 | Intégration engine + bots en local (boucle de partie complète) | P0-4 | 3 j | Partie solo jouable de bout en bout |
| P1-6 | Finale + écran de résultats + badge | P1-5 | 3 j | Gagnant et badge affichés, partage possible |
| P1-7 | Passeport : badges, stats (stockage local) | P1-6 | 2 j | Persistance après rechargement |
| P1-8 | **Pool de 400 questions** vérifiées (D1-D5, 10 catégories) | P0-7 | 4 j | Répartition de difficulté et catégories conforme à SPEC §7 |
| P1-9 | Tutoriel (partie guidée de 5 questions) | P1-5 | 2 j | 80 % des nouveaux comprennent le « vitesse = portée » |
| P1-10 | Analytics et playtests (10-20 testeurs) | P1-6 | 3 j | Rapport : complétion, durée, abandons par round, retours |

**Gate Phase 1** : ≥ 70 % de complétion, ≥ 40 % de relance, durée moyenne 8-11 min. Sinon, itérer le design avant la Phase 2.

---

## Phase 2 — Multijoueur (~4 semaines)

| ID | Tâche | Dépend de | Est. | Critère d'acceptation |
|---|---|---|---|---|
| P2-1 | Serveur autoritaire : salles, boucle de partie avec l'engine | P1-5 | 5 j | Une partie de 100 clients simulés se termine sans désync |
| P2-2 | Protocole WebSocket (versionné), reconnexion, reprise de session | P2-1 | 3 j | Reconnexion < 5 s sans perte d'état |
| P2-3 | **Chrono serveur + compensation de latence** | P2-1 | 3 j | Écart de temps mesuré ≤ 100 ms entre clients à 50 ms et 300 ms de RTT |
| P2-4 | **Parties planifiées** + lobby + remplissage par bots (bots **identifiés**) | P2-1 | 3 j | Lobby démarre à l'heure, bots clairement marqués |
| P2-5 | Comptes (e-mail magique), profil, persistance badges/stats | P2-1 | 4 j | Passeport conservé entre appareils |
| P2-6 | Anti-triche de base (temps minimal, mélange options, rate limiting, validation serveur) | P2-3 | 2 j | Réponses impossibles rejetées, tests d'abus |
| P2-7 | Test de charge | P2-1 | 2 j | 20 parties × 100 joueurs, p95 latence d'événement < 300 ms |
| P2-8 | Observabilité (logs, métriques, alertes) | P2-1 | 2 j | Dashboard avec parties actives, erreurs, latence |

**Gate Phase 2** : test de charge passé, 0 désync sur 200 parties de test.

---

## Phase 3 — Bêta fermée (~3 semaines puis continu)

| ID | Tâche | Dépend de | Est. | Critère d'acceptation |
|---|---|---|---|---|
| P3-1 | Invitations depuis la liste d'attente (vagues) | P2-5 | 2 j | Envoi par vagues, taux d'activation suivi |
| P3-2 | Tableau de bord produit (rétention J1/J7, durée, complétion, remplissage lobbies) | P2-8 | 3 j | KPI à jour quotidiennement |
| P3-3 | **Recalibrage automatique de la difficulté** (observée vs étiquetée) | P2-1 | 3 j | Job planifié, questions hors fourchette flaggées |
| P3-4 | **Score de suspicion anti-triche** + outil de revue | P3-2 | 4 j | Faux positifs < 2 % sur jeu de test |
| P3-5 | Signalement de questions + retrait automatique | P2-1 | 2 j | Seuil configurable, file de revue |
| P3-6 | Pipeline de questions d'actualité (rafraîchissement hebdo, expiration) | P0-7 | 3 j | ≥ 20 questions d'actualité fraîches par semaine |
| P3-7 | Passage du pool à 2 000+ questions | P0-7 | continu | Pas de répétition sur 20 parties |

**Gate Phase 3** : rétention J1 ≥ 35 %, J7 ≥ 15 % (cibles initiales, à ajuster), lobbies remplis à ≥ 40 % d'humains aux créneaux de pointe.

---

## KPI produit

- Landing : conversion e-mail ≥ 15 % (objectif du PRD d'origine).
- Partie : complétion ≥ 70 %, durée 8-11 min.
- Rétention : J1 / J7 (cibles ci-dessus).
- Qualité contenu : taux de signalement < 0,5 % des réponses.

## Registre de risques

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Liquidité (pas assez de joueurs simultanés) | Haute | Haute | Parties planifiées, bots identifiés, phase solo d'abord |
| Triche (recherche des réponses) | Haute | Moyenne | Difficulté montante, pool large, score de suspicion |
| Erreurs factuelles dans les questions | Moyenne | Haute | Vérification en 2 passes, relecture, signalement |
| Équilibrage (parties trop longues ou courtes) | Moyenne | Haute | Simulateur en Phase 0, paramètres en config |
| Latence inégale | Moyenne | Moyenne | Chrono serveur, compensation RTT bornée |
| Nom proche d'une marque existante | Moyenne | Moyenne | Changer le nom avant le lancement public |
| Lisibilité mobile de la carte | Moyenne | Haute | Prototype et tests dès P1-2/P1-4 |

## Prochaines décisions à prendre

1. Stack front (React vs Svelte) et lib de carte (SVG maison vs MapLibre).
2. Colyseus vs Socket.io (Phase 2, peut attendre).
3. Parties planifiées vs à la demande (recommandation : planifiées).
4. Nom du produit.
