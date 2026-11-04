import { useEffect, useState, useSyncExternalStore } from "react";
import type { GameSession, SessionState } from "@geoclash/runtime";

const IDLE: SessionState = { mode: "solo", status: "idle", lobby: null, view: null, error: null, clockOffsetMs: 0 };

export function useSession(session: GameSession | null): SessionState {
  return useSyncExternalStore(
    (cb) => (session ? session.subscribe(cb) : () => {}),
    () => (session ? session.getState() : IDLE),
    () => IDLE,
  );
}

/** Heure « serveur » courante, rafraîchie à intervalle régulier. */
export function useNow(offsetMs = 0, intervalMs = 100, active = true): number {
  const [now, setNow] = useState(() => Date.now() + offsetMs);
  useEffect(() => {
    if (!active) return;
    setNow(Date.now() + offsetMs);
    const id = setInterval(() => setNow(Date.now() + offsetMs), intervalMs);
    return () => clearInterval(id);
  }, [offsetMs, intervalMs, active]);
  return now;
}
