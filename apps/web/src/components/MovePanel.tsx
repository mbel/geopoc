import type { PlayerView } from "@geoclash/runtime";
import { cityName } from "../game/cities";
import { ReachList } from "./ReachList";
import { useI18n, type MessageKey } from "../i18n";

interface Props {
  view: PlayerView;
  pending: number | null;
  onPick: (cityId: number) => void;
  onJump: () => void;
  onStay: () => void;
}

export function MovePanel({ view, pending, onPick, onJump, onStay }: Props) {
  const { t } = useI18n();
  const { you } = view;
  const noJump = you.range === 0;
  return (
    <div className="panel">
      <div className="panel__meta">
        <span className="chip chip--accent">
          {t(`game.band.${you.band}` as MessageKey)}
          {!noJump && ` · ${t("game.range", { n: you.range })}`}
        </span>
      </div>
      {noJump ? (
        <p className="panel__text" role="status">
          {t("game.noJump")}
        </p>
      ) : you.moved ? (
        <p className="panel__text" role="status">
          ✓ {t("game.jumpSent")}
        </p>
      ) : (
        <>
          <h2 className="question" role="status">
            {t("game.chooseDestination")}
          </h2>
          <p className="panel__text">
            {pending === null ? t("game.reachable", { n: you.reachable.length }) : t("game.destination", { city: cityName(pending) })}
          </p>
          <ReachList view={view} pending={pending} onPick={onPick} />
          <div className="actions">
            <button type="button" className="btn btn--primary" disabled={pending === null} onClick={onJump}>
              {t("game.jump")}
            </button>
            <button type="button" className="btn" onClick={onStay}>
              {t("game.stay")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
