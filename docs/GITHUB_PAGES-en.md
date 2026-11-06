# Deploying to GitHub Pages (Web PWA, Solo or Multiplayer)

This repository is configured to automatically deploy the GeoClash web app to **GitHub Pages** via GitHub Actions.

The game is a static Progressive Web App (PWA):
- **Solo mode**: runs 100% client-side in any player's browser (zero backend server, zero hosting costs).
- **Online mode**: can be enabled by configuring the WebSocket URL of your game server in repository variables.
- **Installable**: works on mobile (Chrome/Safari) and desktop ("Add to Home Screen").

---

## 1. Enable GitHub Pages on Your Repository (One-Time Setup)

On GitHub:
1. Navigate to your repository (`https://github.com/mbel/geopoc`).
2. Click the **Settings** tab.
3. In the left-hand navigation, click **Pages** (under the *Code and automation* section).
4. Under **Build and deployment**:
   - In the **Source** dropdown, select **GitHub Actions** (do **not** choose *Deploy from a branch*).
5. That's it! GitHub activates the `github-pages` environment.

---

## 2. Triggering the Deployment

Deployment can be initiated in two ways:
- **Automatic**: every time you push (`git push`) to the `main` branch.
- **Manual**:
  1. Open the **Actions** tab in your GitHub repository.
  2. In the left sidebar, select **Deploy GitHub Pages**.
  3. Click the **Run workflow** button (targeting the `main` branch).

---

## 3. Accessing Your Live Game

Once the workflow finishes successfully (green checkmark):
- The live game URL is displayed directly on the workflow run page (in the `github-pages` deployment card) or in **Settings → Pages**.
- Standard URL shape: `https://<username>.github.io/<repo-name>/` (for example, `https://mbel.github.io/geopoc/`).

---

## 4. (Optional) Enabling Online Multiplayer

By default, only solo mode is enabled on GitHub Pages.

If you have deployed a WebSocket game server (on Fly.io, Hetzner, VPS, etc.):
1. Navigate to **Settings** → **Secrets and variables** → **Actions** → **Variables** tab.
2. Create a repository variable named `GEOCLASH_SERVER_URL` with your secure WebSocket URL (e.g. `wss://ws.yourdomain.com`).
3. Re-run the GitHub Pages workflow (or push a new commit).
4. The "Play Online" button will become active for all visitors.

