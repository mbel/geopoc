import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { en } from "./en";
import { fr, type MessageKey } from "./fr";

export type Locale = "fr" | "en";
export type { MessageKey };

const dictionaries: Record<Locale, Record<MessageKey, string>> = { fr, en };

export function detectLocale(lang: string | undefined = typeof navigator !== "undefined" ? navigator.language : "fr"): Locale {
  return (lang ?? "fr").toLowerCase().startsWith("fr") ? "fr" : "en";
}

/** Traduction avec interpolation `{nom}`. Retombe sur le français, puis sur la clé. */
export function translate(locale: Locale, key: MessageKey, params?: Record<string, string | number>): string {
  const raw = dictionaries[locale][key] ?? fr[key] ?? key;
  return params ? raw.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`)) : raw;
}

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue>({
  locale: "fr",
  setLocale: () => {},
  t: (key, params) => translate("fr", key, params),
});

export function I18nProvider({ initial, children }: { initial?: Locale; children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initial ?? detectLocale());
  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale, t: (key, params) => translate(locale, key, params) }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
