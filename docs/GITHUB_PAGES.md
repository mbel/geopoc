# Déploiement sur GitHub Pages (PWA web, mode solo ou multijoueur)

Ce dépôt est configuré pour déployer automatiquement l'application web de GeoClash sur **GitHub Pages** via GitHub Actions.

Le jeu est une PWA (Progressive Web App) statique :
- **Mode solo** : fonctionne immédiatement à 100% dans le navigateur de n'importe quel joueur (sans aucun serveur ni frais d'hébergement).
- **Mode en ligne** : activable en configurant l'URL WebSocket du serveur de jeu dans les variables du dépôt.
- **Installable** : sur smartphone (Chrome/Safari) et sur ordinateur (« Ajouter à l'écran d'accueil »).

---

## 1. Activer GitHub Pages sur votre dépôt (à faire une seule fois)

Sur GitHub :
1. Rendez-vous sur votre dépôt (`https://github.com/mbel/geopoc`).
2. Cliquez sur l'onglet **Settings** (Paramètres).
3. Dans le menu de gauche, cliquez sur **Pages** (sous la section *Code and automation*).
4. Sous **Build and deployment** :
   - Dans le menu déroulant **Source**, sélectionnez **GitHub Actions** (et **non** *Deploy from a branch*).
5. C'est tout ! GitHub activera l'environnement `github-pages`.

---

## 2. Déclencher le déploiement

Le déploiement se fait de deux manières :
- **Automatique** : à chaque fois que vous poussez (`git push`) sur la branche `main`.
- **Manuel** :
  1. Allez dans l'onglet **Actions** de votre dépôt GitHub.
  2. Dans la colonne de gauche, sélectionnez **Déploiement GitHub Pages**.
  3. Cliquez sur le bouton **Run workflow** (sur la branche `main`).

---

## 3. Accéder à votre jeu en ligne

Une fois le workflow terminé avec succès (vert) :
- L'URL de votre jeu sera affichée directement sur la page de l'exécution du workflow (dans l'environnement `github-pages`) ou dans **Settings → Pages**.
- Format standard : `https://<nom-utilisateur>.github.io/<nom-depot>/` (par exemple `https://mbel.github.io/geopoc/`).

---

## 4. (Optionnel) Activer le multijoueur en ligne

Par défaut, seul le mode solo est actif sur GitHub Pages.

Si vous avez déployé un serveur de jeu WebSocket (sur Fly.io, Hetzner, VPS, etc.) :
1. Allez dans **Settings** → **Secrets and variables** → **Actions** → onglet **Variables**.
2. Créez une variable de dépôt nommée `GEOCLASH_SERVER_URL` avec votre URL WebSocket sécurisée (ex: `wss://ws.votredomaine.com`).
3. Relancez le workflow GitHub Pages (ou poussez un commit).
4. Le bouton « Jouer en ligne » deviendra alors actif pour tous les visiteurs du site.
