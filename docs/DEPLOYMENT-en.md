# Production Deployment: Guidance

> Provider pricing and offerings change frequently (Hetzner raised rates twice in 2026, Fly.io discontinued free tiers for new accounts). Price ranges below are **estimates to verify at procurement time**.

## 1. What Needs Deploying

| Component | Nature | Typical Hosting |
|---|---|---|
| **Web application** (PWA) | Static assets | CDN / static web host (GitHub Pages, Cloudflare Pages, Netlify, Vercel…) — free or negligible cost |
| **Game server** (online mode) | **Persistent Node process**, WebSocket connections, in-memory matches | Always-on container or VM |
| iOS / Android apps | Compiled store binaries | No hosting required; packages embed web UI and connect to server via `wss://` |
| *(future)* Database, user accounts | Managed PostgreSQL | Supabase, Neon, etc. |

**Solo mode requires zero server infrastructure** (including debug APK). The backend is only required for multiplayer.

## 2. Yes, Multiplayer Requires an Always-On Process

Our server maintains active matches **in memory** and holds **long-lived WebSockets**: it cannot run on "serverless" platforms (functions that spin down between requests) nor on free tiers with sleep cycles. It requires a **persistent live process** within a Docker container or virtual machine.

## 3. Hosting Options: Three Categories

| Category | Examples | Pros | Cons | Price Range |
|---|---|---|---|---|
| **Container PaaS** | Fly.io, Railway, Render | Simple deployment (Dockerfile), automated TLS/`wss`, minimal ops | Slightly higher unit cost, platform lock-in | Fly.io: smallest always-on VM costs ~\$2-3/mo, 1GB RAM ~\$6-7/mo; no free tier for new signups |
| **VPS** | Hetzner, OVH, Scaleway, DigitalOcean | Cheaper, complete control, predictable | Requires administration (updates, firewall, reverse proxy, process restarts) | Hetzner: entry tier ~€4-5/mo (CX23, post-April 2026 pricing); check availability of smaller tiers |
| **Hyperscalers** | AWS, GCP, Azure | Fully featured, infinite scale, managed services | Excessive complexity and cost for day 1 | Avoid during early phases |

### Recommended Starter Setup
1. **Static Web**: GitHub Pages (already configured, see `docs/GITHUB_PAGES-en.md` / `docs/GITHUB_PAGES.fr.md`) or Cloudflare Pages / Netlify — free.
2. **Game Server**: **Single small instance in Europe** (Paris, Frankfurt, or London, matching target FR/UK audience).
   - *Choose PaaS (Fly.io or Render)* to minimize sysadmin overhead: provide a Dockerfile, platform handles TLS termination and health restarts.
   - *Choose VPS (Hetzner/OVH)* for lowest running cost with ~1h initial setup (Docker + Caddy for `wss`).
3. **Domain Name** (~€10-15/year): `play.yourdomain.com` (web app) and `ws.yourdomain.com` (game server).

## 4. Minimum Target Architecture

```
 players ──► https://play.example.com  ─► CDN (static web)
    │
    └──────► wss://ws.example.com      ─► [TLS / reverse proxy] ─► Node server (1 instance)
                                                                   in-memory matches
```
iOS and Android apps connect to the exact same `wss://` URL. **`wss` (TLS) is mandatory**: browsers block insecure WebSockets from HTTPS origins, and iOS enforces HTTPS/TLS by default.

## 5. Architectural Traits of OUR Server to Keep in Mind

- **In-memory match state**: Redeploying or restarting the process **drops all active matches**. Deploy during off-peak hours; eventually implement graceful shutdown (reject incoming lobbies, wait for active matches to finish).
- **Single instance** for now: Matchmaking lobby and active games reside in a single Node process. You cannot scale out simply by placing instances behind a load balancer; multi-instance horizontal scaling requires shared matchmaking state (Redis or equivalent) — a future task.
- **Compute capacity**: Game simulation logic is extremely lightweight (simulating 1,000 full 100-player matches uses ~9s total CPU time). Bottlenecks will be open socket count and network I/O. **Load testing estimate** (task P2-7): a single 1 vCPU / 1-2 GB RAM instance is plenty to begin with.
- **Protocol versioning**: Mobile app store binaries remain in user hands indefinitely. The server must negotiate legacy protocol versions (or return a clear "update required" notice) as `PROTOCOL_VERSION` increments.

## 6. Code Tasks Before Production Launch

- [ ] Server **Dockerfile** + documented environment variables (`PORT`, `LOBBY_WAIT_MS`, …).
- [ ] **`Origin` header validation** on incoming WebSockets (allowlist: web domain, `https://localhost` / `capacitor://localhost` for native apps).
- [ ] **Graceful shutdown** on `SIGTERM` with structured logging.
- [ ] **Guest identity + reconnection** (otherwise network drops terminate player participation).
- [ ] **Per-IP connection rate limiting**, hardening existing thresholds.
- [ ] **"Client update required" message** for deprecated app builds.
- [ ] **Deployment pipeline**: GitHub Actions → container build → deployment trigger (staging then prod).

## 7. Security and Operations

- TLS end-to-end; firewall restricted to ports 80/443; SSH via public keys only; unattended OS security upgrades (VPS).
- Place domain behind **Cloudflare** (DNS, TLS, DDoS mitigation): ensure WebSockets are enabled in proxy settings.
- **Monitoring**: Uptime probe hitting `/health` (already implemented), notification alerts (email/Telegram), error tracking (Sentry), log aggregation.
- **Backups**: Not needed while running without a database (passports live on client devices). Once user accounts exist: managed Postgres with automated snapshot backups.
- **Personal data**: Minimal current collection (display name only). Privacy policy required by app store guidelines (see `docs/STORE_READINESS-en.md` / `docs/STORE_READINESS.fr.md`).

## 8. Environments

| Environment | Purpose |
|---|---|
| **local** | `npm run dev` + `npm run dev:server` |
| **staging** | Small instance + preview web deployment; test APKs point here (`GEOCLASH_SERVER_URL`) |
| **production** | Dedicated instance, manually approved releases |

## 9. Launch Roadmap

0. **Current state (serverless)**: Solo test APK (`docs/ANDROID-en.md`) + static website on GitHub Pages for browser play (`docs/GITHUB_PAGES-en.md`).
1. **Testing server**: 1 small instance + domain + `wss`; test lobbies among real users (lobby, bot backfill).
2. **Guest auth + reconnection**, Dockerfile, `Origin` checks, automated deployment.
3. **Load testing**, APM, alerting; closed beta (TestFlight / Android closed testing).
4. **Horizontal scaling** only when concurrent user demand warrants it (multi-instance, distributed matchmaking, multi-region).

## 10. Estimated Initial Costs (To Verify)

Domain ~€10-15/year · static web ~€0 · server ~€3-10/month · Apple Developer Account (annual) and Google Play Console (one-time fee) for app stores. Roughly **€5 to €15/month** to operate initially, excluding developer accounts.

