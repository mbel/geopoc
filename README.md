# GeoClash Royale (nom de travail)

> 🌐 **Languages / Langues** : [English](README-en.md) · [Français](README.fr.md)

Battle Royale de culture générale sur la carte du monde. **Jouable en solo ou en ligne** : des bots (signalés comme tels) prennent toutes les places libres.

Ce dépôt est un monorepo TypeScript : moteur de règles, runtime de partie, simulateur d'équilibrage, serveur multijoueur et application web/mobile (PWA, prête à être emballée avec Capacitor pour les stores).

## 1. Démarrer

**Prérequis** : Node.js ≥ 20 (`node -v`), VS Code.

```bash
cd geoclash-royale
code .
npm install
npm run ci          # vérifie tout (≈ 1-2 min) : types, graphe, tests, simulation, build
```

### Jouer en solo (dans le navigateur)

```bash
npm run dev
```
Ouvrez l'adresse affichée (ex. `http://localhost:5173`). Sur téléphone (même Wi-Fi) : utilisez l'adresse « Network » affichée par Vite.
Astuce développement : ajoutez `?turbo=0.1` à l'URL pour des parties 10× plus rapides, ex. `http://localhost:5173/?turbo=0.1`.

### Jouer en ligne (plusieurs navigateurs, bots sur les places libres)

Terminal 1 — le serveur (lobby de 20 s ; `TURBO=0.1` pour des parties rapides) :
```bash
LOBBY_WAIT_MS=10000 npm run dev:server
```
(Windows PowerShell : `$env:LOBBY_WAIT_MS=10000; npm run dev:server`)

Terminal 2 — l'application :
```bash
npm run dev
```
Ouvrez l'application dans 2 onglets, cliquez **Jouer en ligne** dans chacun : les humains se retrouvent dans le même lobby, puis les bots prennent les places restantes au démarrage.
Le serveur écoute sur `ws://localhost:8787` (santé : `http://localhost:8787/health`). Autre adresse : variable `VITE_SERVER_URL` (ex. dans `apps/web/.env.local`).

## 2. Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Application web (Vite, rechargement à chaud) |
| `npm run dev:server` | Serveur de jeu WebSocket |
| `npm run build` | Build de production de l'app (dossier `apps/web/dist`) |
| `npm test` | Tous les tests (moteur, runtime, simulateur, serveur, app) |
| `npm run typecheck` | TypeScript strict dans tous les packages |
| `npm run sim` | Simule 1 000 parties de bots → `reports/report.md` |
| `npm run sim:check` | Idem, échoue si une cible d'équilibrage n'est pas atteinte |
| `npm run graph:validate` | Contraintes du graphe de villes |
| `npm run questions:build -w @geoclash/data` | Régénère `questions.fr.json` depuis les tables de faits |
| `npm run ci` | Tout ce qui précède (utilisé par GitHub Actions) |

Options du simulateur : `npm run sim -- --games 5000 --seed 7 --balance chemin/vers/balance.json`.

## 3. Structure

```
packages/
  engine/    règles pures et déterministes (zone, sauts, élimination, finale)
  data/      150 villes, graphe, équilibrage calibré (balance.v1.json), questions
  runtime/   MatchRunner (phases, bots, vues sans secret), protocole, sessions solo/en ligne
  sim/       bots à l'échelle, simulateur, rapports de calibration
apps/
  web/       application React + PWA (+ Capacitor pour iOS/Android)
  server/    serveur autoritaire (Node + ws)
docs/        ARCHITECTURE, DEPLOYMENT, ANDROID, DECISIONS, CALIBRATION_LOG, QUESTIONS, STORE_READINESS
SPEC.md ROADMAP.md KICKOFF_PROMPT.md
```

Détails : `docs/ARCHITECTURE.md`. Principe : **une seule logique de partie**, exécutée dans le navigateur en solo et sur le serveur en ligne ; l'interface ne voit que l'interface `GameSession`.

## 4. Comment on joue

1. Une question à 4 réponses est posée à tout le monde en même temps (12 s).
2. **Plus tu réponds vite (et juste), plus ton saut est long** : Grand (≤ 3 s, portée 4), Moyen (≤ 8 s, portée 2), Micro (≤ 12 s, portée 1), aucun si faux.
3. Tu choisis une ville atteignable (carte), puis tu sautes.
4. La zone rouge rétrécit vers une **Ville Finale** cachée ; la prochaine zone est annoncée un round avant. Hors zone = éliminé.
5. Finale : seuls ceux arrivés sur la Ville Finale restent ; chaque erreur élimine. Le gagnant remporte le **badge de la Ville Finale** (passeport).

## 5. Jouer en ligne sur le Web (GitHub Pages)

L'application web est déployable directement sur **GitHub Pages** via GitHub Actions (workflow `.github/workflows/deploy-pages.yml`). Le jeu en solo fonctionne immédiatement à 100% dans le navigateur de n'importe quel joueur sans serveur. Voir le guide dans [`docs/GITHUB_PAGES.md`](docs/GITHUB_PAGES.md).

## 6. Tester sur Android sans serveur

Un workflow GitHub Actions construit un **APK de test** (mode solo) : voir `docs/ANDROID.md`. Pour la mise en ligne du serveur multijoueur : `docs/DEPLOYMENT.md`.

## 7. Publier sur les stores

Voir `docs/STORE_READINESS.md` (liste de contrôle). En bref : choisir le nom et l'identifiant d'application (`apps/web/src/brand.ts`), puis `npm run build`, `cd apps/web && npm run cap:add:ios` / `cap:add:android` (Xcode / Android Studio requis), `npm run cap:sync`.

## 8. Limites connues (à lire)

- **Non testé sur appareils réels** : l'interface (carte tactile, pincement, tailles d'écran) n'a été vérifiée qu'en tests automatiques (jsdom) et en build ; aucune vérification visuelle n'a été faite.
- **Questions** : 1 291 questions en brouillon, **non vérifiées** (voir `docs/QUESTIONS.md`) : à faire relire avant toute publication.
- **Équilibrage calibré sur des bots**, pas sur des humains (voir `docs/CALIBRATION_LOG.md`).
- **Multijoueur** : pas de reconnexion en cours de partie, pas de comptes, pas de montée en charge testée (voir `docs/ARCHITECTURE.md`).
- **Nom, icônes, identifiant d'app** : provisoires.
