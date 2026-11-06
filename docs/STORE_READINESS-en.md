# App Store / Google Play Readiness

> This document is a **working checklist**, not formal legal advice. Platform policies change frequently: verify each requirement against current official developer guidelines before submission.

## 1. Hard Blockers Before Submission

- [ ] **Product Name**: "GeoClash" / "GeoClash Royale" is a working title, uncomfortably close to an established mobile gaming IP. High risk of trademark dispute or rejection. Select an original brand name; verify trademark clearance, domains, and app store availability. Brand name is centralized in `apps/web/src/brand.ts`.
- [ ] **Application Identifier** (`appId`, "bundle id"): placeholder `com.example.geoclash` in `brand.ts`. Must be finalized **before** running `cap add ios/android` (it becomes embedded in native project configs and store manifests).
- [ ] **Question Content**: 66 unverified drafts initially (1,291 currently in draft). Requires a formal verification pipeline (P0-7) and robust volume (400 target for Phase 1, 2,000+ for Phase 3) before release.
- [ ] **Final Icons and Splash Screens**: current assets are provisional generated placeholders. Prepare 1024×1024 store icon, splash graphics, store screenshots for all target device form factors, store metadata in FR/EN.

## 2. Developer Accounts and Signing

- [ ] Apple Developer Program account (annual fee) and Google Play Console account (one-time registration fee).
- [ ] iOS signing certificates and provisioning profiles; Android signing keystore (must be securely vaulted).
- [ ] Testing tracks: TestFlight (iOS), internal/closed testing track (Android). Check current Google Play requirements for new developer accounts (20-tester closed test requirement).

## 3. Technical Steps (Capacitor)

```bash
# from workspace root
npm run build                         # compiles web application
cd apps/web
npm run cap:add:ios                   # requires macOS + Xcode
npm run cap:add:android               # requires Android Studio
npm run cap:sync                      # syncs compiled web assets into native wrappers
npm run cap:open:ios                  # opens Xcode project; similarly cap:open:android
```

Next packages to integrate: `@capacitor/assets` (automated icon/splash generation), `@capacitor/status-bar`, `@capacitor/splash-screen`, and push notifications if required. Test on **physical devices** (touch map dragging, pinch-zoom gestures, and frame rates have only been validated in jsdom).

## 4. App Store Review Guidelines to Anticipate

**Apple**
- [ ] "Minimum Functionality": thin web wrappers face rejection risk. Existing native capabilities: haptics, native offline storage, serverless solo play. Further enhancements recommended: push notifications, sound design, passport collection, scheduled matches.
- [ ] If **accounts** can be created: in-app account deletion mechanism is strictly mandatory.
- [ ] **User-Generated Content** (usernames visible to other online players): profanity filtering, player reporting, user blocking.
- [ ] Monetization: all paid digital content must pass through In-App Purchase (StoreKit); no external payment bypasses.
- [ ] Accurate Privacy Nutrition Labels, hosted Privacy Policy URL, Age Rating questionnaire, Export Compliance / Encryption declaration (standard HTTPS/WSS usage only).

**Google Play**
- [ ] "Data Safety" form, Content Rating questionnaire, Target API level compliance, signed AAB release artifact.
- [ ] Accessible hosted Privacy Policy URL.

## 5. Privacy and Data Protection (EU / UK GDPR)

- [ ] Bilingual Privacy Policy (FR + EN); legal basis; data retention schedule.
- [ ] **Zero tracking by default**: prior consent required before initializing analytics / crash reporting SDKs.
- [ ] Target audience: define minimum age threshold (trivia games attract minors). If minors are targeted, heightened child safety rules apply (parental consent, strict username policies, no open chat); otherwise, declare and enforce minimum age.
- [ ] **Bots must be disclosed**: clearly marked as bots in the UI (already highlighted on home screen and lobby). Must remain prominently indicated in active matches (🤖).

## 6. Licensing and Third-Party Assets

- Coastlines: `world-atlas` / Natural Earth (Public Domain / ISC) — maintain license notices.
- Questions: if generated via LLMs, audited and verified; avoid scraping copyright-protected trivia databases.
- Typography: zero custom fonts (uses native system typography).

## 7. Store-Grade Polish (Known Gaps)

| Item | Status |
|---|---|
| Physical device testing (iOS/Android, small viewports, display notches) | ❌ to do |
| Audio design, music, UI transition motion | ❌ |
| First-time user onboarding tutorial | ❌ |
| Accessibility (screen readers, color contrast, reduced motion) | 🟡 foundational elements (ARIA labels, distinct geometry for safe/red zones, `prefers-reduced-motion`), needs audit |
| Mid-game match reconnection (online) | ❌ |
| User accounts & account deletion workflow | ❌ |
| Privacy-compliant opt-in analytics and crash reporting | ❌ |
| Production server hosting (`wss://`), monitoring & alerting | ❌ |

