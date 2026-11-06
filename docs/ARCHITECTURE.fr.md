# Architecture

## Vue d'ensemble

```
            ┌────────────────────────── @geoclash/engine ──────────────────────────┐
            │ règles pures et déterministes : zone, sauts, élimination, finale     │
            └───────────────▲──────────────────────────────▲───────────────────────┘
                            │                              │
   @geoclash/data ──────────┤                              │
   villes, équilibrage,     │                    @geoclash/sim (simulateur, rapports)
   questions                │
                            │
            ┌───────────────┴──────────── @geoclash/runtime ───────────────────────┐
            │ MatchRunner (phases, bots, vues sans secret) · protocole · sessions  │
            │ LocalSession (solo, dans le navigateur) · RemoteSession (WebSocket)  │
            └───────────────▲──────────────────────────────▲───────────────────────┘
                            │                              │
                   apps/web (React, PWA,           apps/server (Node + ws,
                   Capacitor → iOS/Android)        serveur autoritaire)
```

## Principe central : une seule logique de partie, deux hôtes

- Le **moteur** (`engine`) ne connaît ni le temps, ni le réseau, ni l'interface.
- Le **MatchRunner** (`runtime`) enchaîne les phases (INTRO → QUESTION → REVEAL → MOVE → ZONE → … → FINALE → ENDED), fait jouer les bots et ne produit que des **vues sans secret** (`PlayerView`).
- En **solo**, le runner tourne dans le navigateur (`LocalSession`) : 1 humain + 99 bots.
- En **ligne**, le *même* runner tourne sur le serveur : N humains (lobby) + des **bots qui prennent toutes les places libres**. Le client (`RemoteSession`) n'envoie que `answer` et `move`.
- L'interface consomme l'interface `GameSession` : elle ne sait pas si elle joue en solo ou en ligne.

## Sécurité du multijoueur (modèle)

- Le serveur est **autoritaire** : temps de réponse, portée des sauts, éliminations sont calculés côté serveur.
- Les vues ne contiennent **jamais** : la bonne réponse avant la révélation, ni la Ville Finale avant la zone finale (testé).
- Compensation de latence : `elapsed = réception − début de question − RTT/2` (RTT/2 borné à 400 ms).
- Validation de tous les messages (zod), taille max 2 Ko, limitation à 40 messages/s/connexion.

## Décisions de stack

| Choix | Raison | Alternative écartée |
|---|---|---|
| React + Vite + TypeScript, PWA | L'équipe est frontend ; le moteur TS est réutilisé tel quel ; la PWA répond d'abord au PRD | — |
| **Capacitor** pour les stores | Un seul code web emballé en app native ; plugins natifs (haptique, stockage durable, notifications) accessibles | **React Native / Expo** : meilleure sensation native, mais réécriture de toute l'interface et de la carte ; à reconsidérer si les performances de la carte posent problème sur appareils modestes |
| Carte SVG (d3-geo + côtes `world-atlas`) | 150 points, hors-ligne, accessible, léger (≈ 120 Ko gzip au total) | MapLibre/Leaflet : tuiles réseau, plus lourd pour un besoin simple |
| Pas de bibliothèque d'état/routeur | 5 écrans, état dans la session | Redux, React Router : à ajouter si le produit grossit |
| `ws` (Node) | Protocole simple, contrôle total | Colyseus / Socket.io : à envisager pour le passage à l'échelle |

## Ce qui manque pour un multijoueur « production »

Reconnexion et reprise de session · comptes/authentification · persistance (parties, stats, passeport serveur) · parties planifiées à créneaux fixes · montée en charge (plusieurs instances, file de matchmaking partagée) · TLS (`wss://`) et déploiement · observabilité · anti-triche avancé (score de suspicion) · modération des pseudos.

## Identité des joueurs (état actuel et trajectoire)

**Aujourd'hui : aucune authentification.** Le joueur saisit un pseudo ; le passeport (parties, badges) est stocké sur l'appareil ; en ligne, le serveur identifie une connexion par sa socket seulement (pas de compte, pas de reprise de session, pas d'anti-doublon de pseudo).

**Trajectoire recommandée** (du plus léger au plus lourd) :

1. **Compte invité anonyme** : un identifiant aléatoire généré sur l'appareil + un jeton de session côté serveur. Permet la reconnexion en pleine partie et des statistiques serveur sans aucune donnée personnelle.
2. **Rattachement d'un compte** (e-mail à lien magique, ou connexion Apple/Google) pour retrouver son passeport sur un autre appareil, classements, achats. À vérifier : les règles des stores peuvent exiger « Se connecter avec Apple » si d'autres connexions sociales sont proposées, et la suppression de compte depuis l'app.
3. **Numéro de téléphone** : déconseillé pour ce produit (coût des SMS, donnée personnelle sensible, peu de valeur ajoutée).
