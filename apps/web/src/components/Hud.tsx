import type { PlayerView } from "@geoclash/runtime";
import { useI18n } from "../i18n";
import { TimerBar } from "./TimerBar";

interface Props {
  view: PlayerView;
  now: number;
  onLeave: () => void;
}

export function Hud({ view, now, onLeave }: Props) {
  const { t } = useI18n();
  const zoneHint = (() => {
    if (view.mode === "finale") return null;
    if (view.preview) {
      if (view.preview.final) return t("game.zoneFinal");
      return view.preview.applyRound <= view.round
        ? t("game.zoneThisRound")
        : t("game.zoneIn", { n: view.preview.applyRound - view.round + 1 });
    }
    return null;
  })();
  return (
    <header className="hud">
      <div className="hud__row">
        <span className="pill" aria-label={t("game.alive", { n: view.alive })}>
          👥 {view.alive}/{view.total}
        </span>
        <span className="hud__round">{view.mode === "finale" ? t("game.finale") : t("game.round", { n: view.round })}</span>
        <button type="button" className="icon-btn" onClick={onLeave} aria-label={t("game.leave")}>
          ✕
        </button>
      </div>
      {zoneHint && (
        <div className="hud__hint" role="status">
          ⚠️ {zoneHint}
        </div>
      )}
      <TimerBar startedAt={view.phaseStartedAt} endsAt={view.phaseEndsAt} now={now} />
    </header>
  );
}
