import type { SessionState } from "@geoclash/runtime";
import { useNow } from "../game/hooks";
import { useI18n } from "../i18n";

interface Props {
  state: SessionState;
  onCancel: () => void;
}

export function Lobby({ state, onCancel }: Props) {
  const { t } = useI18n();
  const now = useNow(state.clockOffsetMs, 250);
  const lobby = state.lobby;
  const secs = lobby?.startsAt ? Math.max(0, Math.ceil((lobby.startsAt - now) / 1000)) : null;
  return (
    <main className="screen screen--center">
      <div className="spinner" aria-hidden="true" />
      <h1 role="status">{state.status === "connecting" || !lobby ? t("lobby.connecting") : t("lobby.searching")}</h1>
      {lobby && (
        <>
          <div className="lobby__bar" aria-hidden="true">
            <div
              className="lobby__fill"
              style={{ width: `${Math.min(100, ((lobby.humans + (state.mode === "solo" ? lobby.bots : 0)) / lobby.capacity) * 100)}%` }}
            />
          </div>
          <p>{t("lobby.humans", { n: lobby.humans })}</p>
          <p>🤖 {t("lobby.bots", { n: lobby.capacity - lobby.humans })}</p>
          {secs !== null && <p className="lobby__timer">{t("lobby.startsIn", { n: secs })}</p>}
        </>
      )}
      <button type="button" className="btn" onClick={onCancel}>
        {t("lobby.cancel")}
      </button>
    </main>
  );
}
