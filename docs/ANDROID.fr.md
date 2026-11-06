# Tester sur Android (APK de debug, solo, sans serveur)

Le mode **solo** tourne entièrement dans l'application : aucun serveur n'est nécessaire. Le bouton « Jouer en ligne » est désactivé tant qu'aucune URL de serveur n'est configurée.

## Option A — GitHub Actions (rien à installer)

1. Poussez le dépôt sur GitHub.
2. Onglet **Actions** → workflow **Android APK (debug)** → **Run workflow**.
3. Attendez la fin (≈ 5-10 min la première fois), ouvrez l'exécution, section **Artifacts** → téléchargez `geoclash-debug-apk` (un zip contenant `geoclash-debug-xxxxxxx.apk`). Il faut être connecté à GitHub.
4. Envoyez l'APK sur le téléphone (câble, Drive, e-mail…), ouvrez-le et autorisez l'installation depuis cette source (« sources inconnues » / « installer des applications inconnues »).

Fichier du workflow : `.github/workflows/android-apk.yml` (déclenchement manuel ou par tag `android-*`).

> ⚠️ **Ce workflow n'a pas pu être exécuté dans mon environnement** (pas de SDK Android ni d'accès à GitHub). La configuration générée par Capacitor (Gradle 8.2.1, JDK 17, compileSdk 34) est standard, mais la première exécution peut demander un petit ajustement : en cas d'erreur, envoyez-moi le journal.

## Option B — En local

Prérequis : Node ≥ 20, **JDK 17**, **Android SDK** (le plus simple : installer Android Studio).

```bash
npm install
cd apps/web
npm run android:apk            # build web + cap sync + gradle assembleDebug
# APK : apps/web/android/app/build/outputs/apk/debug/app-debug.apk
adb install -r android/app/build/outputs/apk/debug/app-debug.apk   # téléphone en mode débogage USB
```

Pour ouvrir le projet dans Android Studio (émulateur, logs) : `npx cap open android`.
Logs en direct : `adb logcat | grep -i chromium` (la console du WebView apparaît sous ce nom).

## Limites de cet APK

- **Signé avec une clé de debug** générée à chaque exécution du workflow : deux APK issus de deux exécutions différentes n'ont pas la même signature, Android refuse alors la mise à jour « par-dessus ». **Désinstallez l'ancienne version avant d'installer la nouvelle.** (Une clé fixe stockée dans les secrets GitHub règle ça ; utile dès qu'il y a plusieurs testeurs.)
- **Pas publiable sur le Play Store** (APK debug). Pour le store : build *release* signé en **AAB** avec un keystore à vous (voir `docs/STORE_READINESS.md`).
- **Icône et écran de démarrage** : ceux par défaut de Capacitor (provisoires). Générer les vôtres avec `@capacitor/assets`.
- **Identifiant** `com.example.geoclash` : placeholder à changer **avant** de partager largement (`apps/web/src/brand.ts`, puis recréer/mettre à jour le projet Android).
- Non testé sur appareil réel : la carte tactile et les performances sur téléphones modestes sont les points à surveiller.

## Activer le mode en ligne plus tard

Dans GitHub : *Settings → Secrets and variables → Actions → Variables* → créer `GEOCLASH_SERVER_URL` = `wss://votre-serveur`. Le workflow l'injecte au build ; le bouton « Jouer en ligne » s'active.
