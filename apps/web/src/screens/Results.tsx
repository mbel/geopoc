import type { PlayerView } from "@geoclash/runtime";
import { cityName } from "../game/cities";
import { useI18n } from "../i18n";

interface Props {
  view: PlayerView;
  onAgain: () => void;
  onHome: () => void;
}

export function Results({ view, onAgain, onHome }: Props) {
  const { t } = useI18n();
  const r = view.result;
  if (!r) return null;
  return (
    <main className="screen screen--center">
      <div className="trophy" aria-hidden="true">
        {r.youWon ? "🏆" : "🌍"}
      </div>
      <h1 className={r.youWon ? "win" : undefined}>{r.youWon ? t("results.win") : t("results.lose")}</h1>
      <p className="big">{t("results.place", { n: r.place, total: view.total })}</p>
      <p>{t("results.winner", { name: r.winnerIsBot ? `🤖 ${r.winnerName}` : r.winnerName })}</p>
      <p>{t("results.finaleCity", { city: cityName(r.finaleCityId) })}</p>
      <p>{t("results.correct", { n: view.you.correctCount })}</p>
      {r.youWon && <p className="badge">🎖️ {t("results.badge", { city: cityName(r.finaleCityId) })}</p>}
      <button type="button" className="btn btn--primary btn--big" onClick={onAgain}>
        {t("results.playAgain")}
      </button>
      <button type="button" className="btn" onClick={onHome}>
        {t("results.home")}
      </button>
    </main>
  );
}
