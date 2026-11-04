import type { PlayerView } from "@geoclash/runtime";
import { useEffect, useRef } from "react";
import { useI18n, type MessageKey } from "../i18n";

interface Props {
  view: PlayerView;
  onNewGame: () => void;
  onHome: () => void;
  /** Fourni seulement en ligne (d'autres humains peuvent encore jouer). */
  onSpectate?: () => void;
}

/** Popup bloquante affichée dès que le joueur est éliminé : rejouer, revenir à l'accueil, (regarder la fin). */
export function EliminatedModal({ view, onNewGame, onHome, onSpectate }: Props) {
  const { t } = useI18n();
  const primary = useRef<HTMLButtonElement>(null);
  useEffect(() => primary.current?.focus(), []);
  const reason = view.you.eliminatedBy ?? "zone";
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="elim-title">
      <div className="modal__card">
        <div className="modal__icon" aria-hidden="true">
          💥
        </div>
        <h2 id="elim-title">{t("modal.title")}</h2>
        <p className="modal__reason">{t(`modal.reason.${reason}` as MessageKey)}</p>
        <p className="modal__place">{t("modal.place", { n: view.you.place ?? view.total, total: view.total })}</p>
        <p className="modal__small">{t("modal.correct", { n: view.you.correctCount })}</p>
        <button ref={primary} type="button" className="btn btn--primary btn--big" onClick={onNewGame}>
          <strong>{t("modal.newGame")}</strong>
        </button>
        <button type="button" className="btn" onClick={onHome}>
          {t("modal.home")}
        </button>
        {onSpectate && (
          <button type="button" className="btn btn--ghost" onClick={onSpectate}>
            {t("modal.spectate")}
          </button>
        )}
      </div>
    </div>
  );
}
