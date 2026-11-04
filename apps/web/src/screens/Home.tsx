import { useI18n } from "../i18n";

interface Props {
  name: string;
  onName: (n: string) => void;
  onSolo: () => void;
  onOnline: () => void;
  onPassport: () => void;
  onlineAvailable: boolean;
  error: string | null;
}

export function Home({ name, onName, onSolo, onOnline, onPassport, onlineAvailable, error }: Props) {
  const { t, locale, setLocale } = useI18n();
  return (
    <main className="screen screen--home">
      <div className="logo" aria-hidden="true">
        🌍
      </div>
      <h1>{t("app.name")}</h1>
      <p className="tagline">{t("home.tagline")}</p>

      {error && (
        <div className="toast" role="alert">
          {error}
        </div>
      )}

      <label className="field">
        <span>{t("home.name")}</span>
        <input
          value={name}
          maxLength={24}
          placeholder={t("home.namePlaceholder")}
          onChange={(e) => onName(e.target.value)}
          autoComplete="nickname"
        />
      </label>

      <button type="button" className="btn btn--primary btn--big" onClick={onSolo}>
        <strong>{t("home.solo")}</strong>
        <small>{t("home.soloDesc")}</small>
      </button>
      <button type="button" className="btn btn--big" onClick={onOnline} disabled={!onlineAvailable}>
        <strong>{t("home.online")}</strong>
        <small>{onlineAvailable ? t("home.onlineDesc") : t("home.onlineUnavailable")}</small>
      </button>
      <button type="button" className="btn btn--ghost" onClick={onPassport}>
        🛂 {t("home.passport")}
      </button>

      <p className="howto">{t("home.how")}</p>
      <p className="howto howto--small">{t("home.botsNote")}</p>

      <div className="lang" role="group" aria-label={t("home.language")}>
        {(["fr", "en"] as const).map((l) => (
          <button key={l} type="button" className={`lang__btn${locale === l ? " lang__btn--on" : ""}`} onClick={() => setLocale(l)}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </main>
  );
}
