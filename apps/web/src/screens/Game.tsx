import type { GameSession } from "@geoclash/runtime";
import { useEffect, useRef, useState } from "react";
import { EliminatedModal } from "../components/EliminatedModal";
import { Hud } from "../components/Hud";
import { MovePanel } from "../components/MovePanel";
import { QuestionPanel } from "../components/QuestionPanel";
import { cityName } from "../game/cities";
import { useNow, useSession } from "../game/hooks";
import { useI18n } from "../i18n";
import { WorldMap } from "../map/WorldMap";
import { haptic } from "../services/haptics";

interface Props {
  session: GameSession;
  onLeave: () => void;
  /** Lance immédiatement une nouvelle partie (même mode). */
  onNewGame: () => void;
}

export function Game({ session, onLeave, onNewGame }: Props) {
  const { t } = useI18n();
  const state = useSession(session);
  const view = state.view;
  const now = useNow(state.clockOffsetMs, 100);
  const [pending, setPending] = useState<number | null>(null);
  const [spectateFor, setSpectateFor] = useState<string | null>(null);

  const phaseKey = view ? `${view.phase}:${view.round}:${view.mode}:${view.finaleRound}` : "";
  useEffect(() => setPending(null), [phaseKey]);

  // Confirmation automatique du saut choisi juste avant la fin du temps imparti
  const committed = useRef("");
  useEffect(() => {
    if (!view || view.phase !== "MOVE" || view.you.moved || pending === null) return;
    if (view.phaseEndsAt - now < 450 && committed.current !== phaseKey) {
      committed.current = phaseKey;
      session.move(pending);
    }
  }, [now, view, pending, phaseKey, session]);

  // Retour haptique à la révélation
  const hapticFor = useRef("");
  useEffect(() => {
    if (view?.phase === "REVEAL" && view.reveal && hapticFor.current !== phaseKey) {
      hapticFor.current = phaseKey;
      void haptic(view.reveal.correct ? "success" : "error");
    }
  }, [view, phaseKey]);

  if (!view) return null;

  const spectating = !view.you.alive;
  const showModal = spectating && spectateFor !== view.matchId;
  let panel: JSX.Element | null = null;
  if (view.phase === "INTRO") {
    panel = (
      <div className="panel">
        <h2 className="question" role="status">
          {t("game.intro", { city: cityName(view.you.cityId) })}
        </h2>
        <p className="panel__text">{t("game.introHint", { n: view.total })}</p>
      </div>
    );
  } else if (spectating) {
    // sous la popup bloquante, on n'affiche rien d'autre (pas de doublon) ; le bandeau n'apparaît qu'en mode spectateur
    panel = showModal ? null : (
      <div className="panel">
        <h2 className="question" role="status">
          {t("game.eliminated")}
        </h2>
        <p className="panel__text">{t("game.place", { n: view.you.place ?? view.total, total: view.total })}</p>
        <p className="panel__text">{t("game.spectating")}</p>
        <div className="actions">
          <button type="button" className="btn btn--primary" onClick={onNewGame}>
            {t("modal.newGame")}
          </button>
          <button type="button" className="btn" onClick={onLeave}>
            {t("game.leave")}
          </button>
        </div>
      </div>
    );
  } else if (view.phase === "QUESTION" || view.phase === "REVEAL") {
    panel = <QuestionPanel view={view} onAnswer={(i) => session.answer(i)} />;
  } else if (view.phase === "MOVE") {
    panel = (
      <MovePanel
        view={view}
        pending={pending}
        onPick={(id) => {
          setPending(id);
          void haptic("light");
        }}
        onJump={() => {
          if (pending !== null) {
            committed.current = phaseKey;
            session.move(pending);
          }
        }}
        onStay={() => {
          committed.current = phaseKey;
          session.move(null);
        }}
      />
    );
  } else if (view.phase === "ZONE") {
    panel = (
      <div className="panel">
        <h2 className="question" role="status">
          {view.lastElimination > 0 ? t("game.eliminatedCount", { n: view.lastElimination }) : t("game.noElimination")}
        </h2>
        {view.finaleCityId !== null && <p className="panel__text">📍 {t("game.finaleCity", { city: cityName(view.finaleCityId) })}</p>}
      </div>
    );
  }

  return (
    <div className="game">
      <Hud view={view} now={now} onLeave={onLeave} />
      <WorldMap
        view={view}
        pendingCityId={pending}
        onCityTap={(id) => {
          if (view.phase === "MOVE" && !view.you.moved) {
            setPending(id);
            void haptic("light");
          }
        }}
      />
      {panel && (
        <section className="sheet" aria-live="polite">
          {panel}
        </section>
      )}
      {showModal && (
        <EliminatedModal
          view={view}
          onNewGame={onNewGame}
          onHome={onLeave}
          onSpectate={state.mode === "online" ? () => setSpectateFor(view.matchId) : undefined}
        />
      )}
    </div>
  );
}
