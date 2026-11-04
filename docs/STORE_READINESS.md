# Préparation App Store / Google Play

> Ce document est une **liste de contrôle de travail**, pas un avis juridique. Les règles des stores changent souvent : vérifiez chaque point dans les consignes officielles en vigueur au moment de la soumission.

## 1. Bloquants avant toute soumission

- [ ] **Nom du produit** : « GeoClash » / « GeoClash Royale » est un nom de travail, proche d'une marque connue (jeu mobile existant). Risque de refus ou de litige. Choisir un nom distinct, vérifier marque, domaine, disponibilité sur les stores. Le nom est centralisé dans `apps/web/src/brand.ts`.
- [ ] **Identifiant d'application** (`appId`, « bundle id ») : placeholder `com.example.geoclash` dans `brand.ts`. À fixer **avant** `cap add ios/android` (il est ensuite gravé dans les projets natifs et les stores).
- [ ] **Contenu des questions** : 66 brouillons non vérifiés. Il faut un pipeline de vérification (P0-7) et un volume suffisant (objectif 400, puis 2 000+) avant d'oser publier.
- [ ] **Icônes et splash définitifs** : les icônes actuelles sont des placeholders générés. Prévoir icône 1024×1024, splash, captures d'écran par taille d'appareil, textes de fiche en FR/EN.

## 2. Comptes et signature

- [ ] Compte développeur Apple (payant, annuel) et Google Play Console (frais d'inscription).
- [ ] Certificats / profils de signature iOS ; keystore Android (à sauvegarder précieusement).
- [ ] Pistes de test : TestFlight (iOS), test interne/fermé (Android). Vérifier les exigences actuelles de Google pour les nouveaux comptes (période de test fermé).

## 3. Étapes techniques (Capacitor)

```bash
# depuis la racine
npm run build                         # construit l'app web
cd apps/web
npm run cap:add:ios                   # nécessite macOS + Xcode
npm run cap:add:android               # nécessite Android Studio
npm run cap:sync                      # copie le build web dans les projets natifs
npm run cap:open:ios                  # ouvre Xcode ; idem cap:open:android
```

À ajouter ensuite : `@capacitor/assets` (génération des icônes/splash), `@capacitor/status-bar`, `@capacitor/splash-screen`, notifications push si besoin. Tester sur de **vrais appareils** (la carte tactile, le pincement et les performances n'ont été testés qu'en jsdom).

## 4. Règles de revue à anticiper (à vérifier à jour)

**Apple**
- [ ] « Fonctionnalité minimale » : une simple page web emballée peut être refusée. Atouts déjà en place : haptique, stockage natif, jeu hors-ligne en solo. À renforcer (notifications, sons, passeport, parties planifiées).
- [ ] Si des **comptes** sont créés dans l'app : suppression de compte possible depuis l'app.
- [ ] **Contenu généré par les utilisateurs** (pseudos visibles par d'autres joueurs en ligne) : filtrage, signalement, blocage.
- [ ] Achats : tout contenu numérique payant passe par l'achat intégré ; ne pas prévoir de paiement externe contourné.
- [ ] « Étiquettes de confidentialité » exactes, URL de politique de confidentialité, classification d'âge, déclaration de chiffrement (l'app n'utilise que HTTPS/WSS standard).

**Google Play**
- [ ] Formulaire « Sécurité des données », questionnaire de classification du contenu, niveau d'API cible exigé, format AAB.
- [ ] Politique de confidentialité accessible.

## 5. Données personnelles (UE / Royaume-Uni)

- [ ] Politique de confidentialité (FR + EN) ; base légale ; durées de conservation.
- [ ] **Aucun traceur par défaut** : si analytics/crash reporting, consentement préalable.
- [ ] Public visé : décider l'âge minimum (un jeu de culture générale attire les mineurs). Si des mineurs sont visés, règles renforcées (consentement parental, pseudos, pas de chat) ; sinon, fixer et appliquer un âge minimum.
- [ ] Les **bots sont indiqués comme tels** dans l'interface (déjà fait : mention sur l'accueil et dans le lobby). À conserver et à rendre visible dans le jeu en ligne (🤖).

## 6. Licences et contenus tiers

- Côtes : `world-atlas` / Natural Earth (domaine public / ISC) — conserver les mentions de licence si exigées.
- Questions : si générées par IA, relues et vérifiées ; ne pas copier de bases de quiz protégées.
- Polices : aucune (polices système).

## 7. Qualité « niveau store » (écarts connus)

| Sujet | État |
|---|---|
| Test sur appareils réels (iOS/Android, petits écrans, notch) | ❌ à faire |
| Sons, musique, animations de transition | ❌ |
| Tutoriel de première partie | ❌ |
| Accessibilité (lecteur d'écran, contraste, mouvement réduit) | 🟡 bases en place (labels, formes différentes pour zone sûre/rouge, `prefers-reduced-motion`), pas d'audit |
| Reconnexion en cours de partie (en ligne) | ❌ |
| Comptes, suppression de compte | ❌ |
| Analytics et crash reporting (avec consentement) | ❌ |
| Hébergement du serveur (wss), monitoring | ❌ |
