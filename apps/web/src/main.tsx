import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { I18nProvider } from "./i18n";
import { isNativePlatform } from "./services/storage";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);

// Service worker (PWA) : web uniquement. Dans l'app native, les fichiers sont déjà embarqués.
if (import.meta.env.PROD) {
  void isNativePlatform().then((native) => {
    if (!native) void import("virtual:pwa-register").then((m) => m.registerSW({ immediate: true }));
  });
}
