# Architecture

## Overview

```
            ┌────────────────────────── @geoclash/engine ──────────────────────────┐
            │ pure deterministic rules: zone, jumps, elimination, finale           │
            └───────────────▲──────────────────────────────▲───────────────────────┘
                            │                              │
   @geoclash/data ──────────┤                              │
   cities, balance,         │                    @geoclash/sim (simulator, reports)
   questions                │
                            │
            ┌───────────────┴──────────── @geoclash/runtime ───────────────────────┐
            │ MatchRunner (phases, bots, secret-free views) · protocol · sessions  │
            │ LocalSession (solo, in browser) · RemoteSession (WebSocket)          │
            └───────────────▲──────────────────────────────▲───────────────────────┘
                            │                              │
                   apps/web (React, PWA,           apps/server (Node + ws,
                   Capacitor → iOS/Android)        authoritative server)
```

## Core Principle: Single Match Logic, Two Hosts

- The **engine** (`engine`) has no knowledge of time, networking, or user interface.
- The **MatchRunner** (`runtime`) sequences phases (INTRO → QUESTION → REVEAL → MOVE → ZONE → … → FINALE → ENDED), drives bot actions, and outputs only **secret-free views** (`PlayerView`).
- In **solo mode**, the runner runs entirely client-side in the browser (`LocalSession`): 1 human + 99 bots.
- In **online mode**, the *exact same* runner runs on the server: N humans (lobby) + **bots backfilling all empty slots**. The client (`RemoteSession`) transmits only `answer` and `move` actions.
- The UI interacts strictly with the `GameSession` interface: it does not know or care whether the match is running locally or over the network.

## Multiplayer Security Model

- The server is **authoritative**: response elapsed times, jump ranges, and eliminations are computed server-side.
- State views **never contain**: the correct answer before the reveal phase, nor the Final City identity prior to the finale zone (unit tested).
- Latency compensation: `elapsed = receipt_time − question_start_time − RTT/2` (RTT/2 clamped to 400 ms).
- Comprehensive message validation (zod schemas), max payload size 2 KB, rate limiting at 40 messages/s/connection.

## Tech Stack Decisions

| Choice | Rationale | Discarded Alternative |
|---|---|---|
| React + Vite + TypeScript, PWA | Team's core frontend competence; TS engine reused as-is; PWA directly meets initial PRD | — |
| **Capacitor** for app stores | Single web codebase packaged into native mobile apps; access to native plugins (haptics, persistent storage, notifications) | **React Native / Expo**: superior native feel, but requires full rewrite of UI and map; revisit if map performance lags on low-end hardware |
| SVG Map (d3-geo + `world-atlas` coastlines) | 150 points, offline, accessible, lightweight (≈ 120 KB gzip total) | MapLibre/Leaflet: network tile dependencies, heavier overhead for simple needs |
| No state management / router library | 5 screens, state lives in the session object | Redux, React Router: introduce only if application complexity expands |
| `ws` (Node) | Minimal lightweight protocol, complete low-level control | Colyseus / Socket.io: consider for horizontal scaling |

## Missing Items for "Production" Multiplayer

Reconnection and in-flight session recovery · user accounts/authentication · server-side persistence (match history, stats, cloud passport) · scheduled matches with fixed time slots · horizontal scale (multi-instance clustering, distributed matchmaking queue) · TLS (`wss://`) and production deployment · observability and APM · advanced anti-cheat (suspicion scoring) · username moderation.

## Player Identity (Current State & Trajectory)

**Currently: Zero authentication.** The player inputs a display name; passport data (matches, earned badges) is stored locally on the device; online, the server identifies a connection solely by its WebSocket socket (no persistent accounts, no mid-game session resumption, no duplicate name collision handling).

**Recommended Trajectory** (from lightest to heaviest):

1. **Anonymous Guest Account**: a random UUID generated on device + server-side session token. Enables in-flight reconnection during a match and server telemetry without collecting personal data.
2. **Account Linking** (magic link email, or Sign in with Apple/Google) to sync passport across multiple devices, global leaderboards, and store purchases. Note: App Store guidelines may mandate "Sign in with Apple" if other third-party social logins are offered, as well as account deletion within the app.
3. **Phone Number Verification**: not recommended for this product (SMS routing costs, privacy friction, low incremental value).

