# Déploiement en production : indications

> Les prix et offres des hébergeurs changent souvent (Hetzner a relevé ses tarifs deux fois en 2026, Fly.io n'a plus d'offre gratuite pour les nouveaux comptes). Les ordres de grandeur ci-dessous sont **à vérifier au moment de commander**.

## 1. Ce qu'il faut déployer

| Pièce | Nature | Hébergement typique |
|---|---|---|
| **Application web** (PWA) | fichiers statiques | CDN / hébergeur statique (GitHub Pages, Cloudflare Pages, Netlify, Vercel…) — gratuit ou quasi |
| **Serveur de jeu** (mode en ligne) | **processus Node permanent**, connexions WebSocket, parties en mémoire | une machine/conteneur toujours allumé |
| Apps iOS / Android | binaires envoyés aux stores | pas d'hébergement ; elles embarquent l'app web et appellent le serveur en `wss://` |
| *(plus tard)* base de données, comptes | Postgres managé | Supabase, Neon, etc. |

**Le mode solo n'a besoin d'aucun serveur** (ni l'APK de test). Le serveur ne sert qu'au multijoueur.

## 2. Oui, il faut une machine toujours allumée pour le multijoueur

Notre serveur garde les parties **en mémoire** et tient des **WebSocket longues** : il ne peut pas tourner en « serverless » (fonctions qui s'éteignent entre deux requêtes) ni sur les offres gratuites qui se mettent en veille. Il faut un **processus qui reste vivant**, dans un conteneur Docker ou sur une VM.

## 3. Où l'héberger : trois familles

| Famille | Exemples | Plus | Moins | Ordre de grandeur |
|---|---|---|---|---|
| **PaaS à conteneurs** | Fly.io, Railway, Render | Déploiement simple (Dockerfile), TLS/`wss` géré, peu d'ops | Un peu plus cher à ressources égales, dépendance à la plateforme | Fly.io : la plus petite machine toujours allumée coûte ~2 à 3 $/mois, 1 Go de RAM ~6 à 7 $/mois ; pas d'offre gratuite pour les nouveaux comptes |
| **VPS** | Hetzner, OVH, Scaleway, DigitalOcean | Moins cher, contrôle total, prévisible | Il faut administrer (mises à jour, pare-feu, reverse proxy, redémarrage) | Hetzner : entrée de gamme ~4 à 5 €/mois (CX23, après les hausses d'avril 2026) ; vérifier la disponibilité réelle des petites offres |
| **Gros cloud** | AWS, GCP, Azure | Tout existe (scalabilité, managé) | Complexité et coût disproportionnés au démarrage | À éviter au début |

### Ma recommandation pour démarrer
1. **Web statique** : GitHub Pages (déjà configuré, voir `docs/GITHUB_PAGES.md`) ou Cloudflare Pages / Netlify — gratuit.
2. **Serveur de jeu** : **une seule petite instance en Europe** (Paris, Francfort ou Londres, vos joueurs étant FR/UK).
   - *Préférez un PaaS (Fly.io ou Render)* si vous voulez limiter l'administration : vous donnez un Dockerfile, ils gèrent TLS et redémarrages.
   - *Préférez un VPS (Hetzner/OVH)* si vous voulez le coût le plus bas et acceptez ~1 h de mise en place (Docker + Caddy pour `wss`).
3. **Nom de domaine** (~10-15 €/an) : `jeu.votredomaine.com` (site) et `ws.votredomaine.com` (serveur).

## 4. Architecture cible minimale

```
 joueurs ──► https://jeu.exemple.com  ─► CDN (site statique)
    │
    └─────► wss://ws.exemple.com      ─► [TLS / proxy] ─► serveur Node (1 instance)
                                                           parties en mémoire
```
Les apps iOS/Android appellent la même URL `wss://`. **`wss` (TLS) est obligatoire** : les navigateurs bloquent le contenu non sécurisé depuis une page HTTPS, et iOS impose HTTPS/TLS par défaut.

## 5. Particularités de NOTRE serveur à connaître

- **Parties en mémoire** : redéployer ou redémarrer **coupe les parties en cours**. Déployer aux heures creuses ; prévoir à terme un arrêt « en douceur » (refuser les nouvelles parties, attendre la fin des actuelles).
- **Une seule instance** pour l'instant : le lobby et les parties vivent dans un seul processus. On ne peut pas simplement ajouter des instances derrière un répartiteur ; le passage à plusieurs instances demande un matchmaking partagé (Redis ou équivalent) — étape ultérieure.
- **Capacité** : le calcul d'une partie est très léger (la simulation de 1 000 parties de 100 joueurs complètes prend ~9 s de CPU au total). Le facteur limitant sera plutôt le nombre de connexions et la bande passante. **Estimation à confirmer par un test de charge** (tâche P2-7) : une machine 1 vCPU / 1 à 2 Go devrait suffire pour démarrer.
- **Versions de protocole** : les apps des stores restent en circulation longtemps. Le serveur doit continuer à accepter l'ancien protocole (ou renvoyer « mise à jour requise ») quand il évolue (`PROTOCOL_VERSION`).

## 6. À faire côté code avant la mise en production (je peux m'en charger)

- [ ] **Dockerfile** du serveur + variables d'environnement documentées (`PORT`, `LOBBY_WAIT_MS`, …).
- [ ] **Vérification de l'`Origin`** des connexions WebSocket (liste blanche : votre site, `https://localhost` / `capacitor://localhost` pour les apps natives).
- [ ] **Arrêt propre** sur `SIGTERM` et journaux structurés.
- [ ] **Compte invité + reconnexion** (sinon une coupure réseau = abandon de la partie).
- [ ] **Limitation de connexions par IP**, durcissement des limites existantes.
- [ ] **Message « mise à jour requise »** pour les anciens clients.
- [ ] **Pipeline de déploiement** : GitHub Actions → construire l'image → déployer (staging puis prod).

## 7. Sécurité et exploitation

- TLS partout ; pare-feu : seuls les ports 80/443 ouverts ; SSH par clé uniquement ; mises à jour automatiques de sécurité (VPS).
- Mettre le domaine derrière **Cloudflare** (DNS, TLS, protection contre les attaques par déni de service) : vérifier que les WebSocket sont bien acceptées par votre offre.
- **Supervision** : sonde d'uptime sur `/health` (déjà fourni), alertes (e-mail/Telegram), suivi des erreurs (Sentry), consultation des journaux.
- **Sauvegardes** : sans objet tant qu'il n'y a pas de base de données (le passeport est local). Dès qu'il y a des comptes : Postgres managé avec sauvegardes automatiques.
- **Données personnelles** : peu de données aujourd'hui (pseudo). Politique de confidentialité exigée par les stores (voir `docs/STORE_READINESS.md`).

## 8. Environnements

| Environnement | Rôle |
|---|---|
| **local** | `npm run dev` + `npm run dev:server` |
| **staging** | petite instance + URL de prévisualisation du site ; les APK de test pointent dessus (`GEOCLASH_SERVER_URL`) |
| **production** | instance dédiée, déploiements manuels validés |

## 9. Feuille de route de mise en ligne

0. **Maintenant, sans serveur** : APK de test solo (`docs/ANDROID.md`) + site statique sur GitHub Pages pour tester dans un navigateur (`docs/GITHUB_PAGES.md`).
1. **Serveur de test** : 1 petite instance + domaine + `wss` ; tests entre quelques personnes (lobby, bots sur les places libres).
2. **Identité invité + reconnexion**, Dockerfile, vérification d'`Origin`, déploiement automatisé.
3. **Test de charge**, supervision, alertes ; bêta fermée (TestFlight / test fermé Android).
4. **Passage à l'échelle** seulement si le trafic le justifie (plusieurs instances, matchmaking partagé, multi-région).

## 10. Coûts indicatifs de départ (à vérifier)

Domaine ~10-15 €/an · site statique ~0 € · serveur ~3-10 €/mois · compte développeur Apple (annuel) et Google Play (frais unique) en plus pour les stores. Soit **de l'ordre de 5 à 15 €/mois** pour démarrer, hors comptes développeur.
