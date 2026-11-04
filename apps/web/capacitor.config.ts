import type { CapacitorConfig } from "@capacitor/cli";
import { BRAND } from "./src/brand";

/**
 * Configuration Capacitor (emballage iOS / Android du même code web).
 * ⚠️ `appId` est un PLACEHOLDER : choisissez votre identifiant définitif (domaine inversé) AVANT
 * `npm run cap:add:ios` / `cap:add:android`, car il est ensuite gravé dans les projets natifs et les stores.
 */
const config: CapacitorConfig = {
  appId: BRAND.appId,
  appName: BRAND.name,
  webDir: "dist",
  backgroundColor: "#0b1220",
  server: { androidScheme: "https" },
  ios: { contentInset: "always" },
};

export default config;
