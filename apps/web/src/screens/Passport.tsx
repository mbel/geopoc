import { cities } from "@geoclash/data";
import type { Passport as PassportData } from "../services/passport";
import { useI18n, type MessageKey } from "../i18n";

interface Props {
  passport: PassportData;
  onBack: () => void;
}

export function Passport({ passport, onBack }: Props) {
  const { t } = useI18n();
  const badges = Object.values(passport.badges).sort((a, b) => a.firstAt - b.firstAt);
  return (
    <main className="screen">
      <button type="button" className="btn btn--ghost" onClick={onBack}>
        ← {t("passport.back")}
      </button>
      <h1>🛂 {t("passport.title")}</h1>
      <dl className="stats">
        <div>
          <dt>{t("passport.games")}</dt>
          <dd>{passport.games}</dd>
        </div>
        <div>
          <dt>{t("passport.wins")}</dt>
          <dd>{passport.wins}</dd>
        </div>
        <div>
          <dt>{t("passport.best")}</dt>
          <dd>{passport.bestPlace ?? "–"}</dd>
        </div>
      </dl>
      <h2>{t("passport.badges", { n: badges.length, total: cities.length })}</h2>
      {badges.length === 0 ? (
        <p className="howto">{t("passport.empty")}</p>
      ) : (
        <ul className="badges">
          {badges.map((b) => {
            const c = cities[b.cityId];
            return (
              <li key={b.cityId} className={`badgecard badgecard--${c.rarity}`}>
                <strong>{c.name}</strong>
                <small>
                  {t(`rarity.${c.rarity}` as MessageKey)}
                  {b.count > 1 ? ` · ×${b.count}` : ""}
                </small>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
