# Testing on Android (Debug APK, Solo, Serverless)

The **solo** mode runs entirely within the application: no backend server is required. The "Play Online" button is disabled as long as no server URL is configured.

## Option A — GitHub Actions (No Local Setup Required)

1. Push the repository to GitHub.
2. Go to **Actions** tab → **Android APK (debug)** workflow → **Run workflow**.
3. Wait for completion (≈ 5-10 min on the first run), open the run, under **Artifacts** → download `geoclash-debug-apk` (a zip containing `geoclash-debug-xxxxxxx.apk`). You must be logged into GitHub.
4. Transfer the APK to your phone (USB cable, Google Drive, email...), open it, and allow installation from this source ("unknown sources" / "install unknown apps").

Workflow file: `.github/workflows/android-apk.yml` (triggered manually or via `android-*` tag).

> ⚠️ **This workflow could not be executed in my local development environment** (no Android SDK or GitHub connectivity). The Capacitor-generated configuration (Gradle 8.2.1, JDK 17, compileSdk 34) is standard, but initial runs may require small adjustments: if an error occurs, share the log.

## Option B — Locally

Prerequisites: Node ≥ 20, **JDK 17**, **Android SDK** (easiest approach: install Android Studio).

```bash
npm install
cd apps/web
npm run android:apk            # web build + cap sync + gradle assembleDebug
# APK location: apps/web/android/app/build/outputs/apk/debug/app-debug.apk
adb install -r android/app/build/outputs/apk/debug/app-debug.apk   # phone with USB debugging enabled
```

To open the project in Android Studio (emulator, log inspection): `npx cap open android`.
Live logs: `adb logcat | grep -i chromium` (the WebView console output appears under this tag).

## Limitations of this APK

- **Signed with an ephemeral debug key** generated on each workflow run: two APKs from different runs will not share the same signature, causing Android to reject in-place upgrades. **Uninstall the older version before installing the new one.** (Using a persistent key stored in GitHub Secrets resolves this; recommended once testing with multiple users.)
- **Not publishable on the Google Play Store** (debug APK). For store release: signed **AAB** *release* build using your own keystore (see `docs/STORE_READINESS-en.md` / `docs/STORE_READINESS.fr.md`).
- **Icon and Splash Screen**: default Capacitor placeholders (provisional). Generate custom assets using `@capacitor/assets`.
- **App ID** `com.example.geoclash`: placeholder that must be changed **before** wider distribution (`apps/web/src/brand.ts`, then recreate/sync the Android project).
- Not tested on physical hardware: touch map interactions and performance on low-end hardware are the key areas to monitor.

## Enabling Online Mode Later

In GitHub: *Settings → Secrets and variables → Actions → Variables* → create `GEOCLASH_SERVER_URL` = `wss://your-server`. The workflow injects this during the build, which enables the "Play Online" button.

