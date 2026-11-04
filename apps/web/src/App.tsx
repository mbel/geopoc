import type { GameSession } from "@geoclash/runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { createSession, onlineAvailable } from "./game/createSession";
import { useSession } from "./game/hooks";
import { useI18n } from "./i18n";
import { Game } from "./screens/Game";
import { Home } from "./screens/Home";
import { Lobby } from "./screens/Lobby";
import { Passport } from "./screens/Passport";
import { Results } from "./screens/Results";
import { emptyPassport, loadPassport, recordMatch, savePassport, type Passport as PassportData } from "./services/passport";
import { MemoryStorage, createStorage, type KeyValueStorage } from "./services/storage";

type Mode = "solo" | "online";

export default function App() {
  const { t } = useI18n();
  const [storage, setStorage] = useState<KeyValueStorage>(() => new MemoryStorage());
  const [passport, setPassport] = useState<PassportData>(emptyPassport());
  const [screen, setScreen] = useState<"home" | "passport">("home");
  const [session, setSession] = useState<GameSession | null>(null);
  const [mode, setMode] = useState<Mode>("solo");
  const [name, setName] = useState("");
  const state = useSession(session);
  const recorded = useRef<string>("");

  useEffect(() => {
    let alive = true;
    createStorage().then(async (s) => {
      if (!alive) return;
      setStorage(s);
      const p = await loadPassport(s);
      if (!alive) return;
      setPassport(p);
      setName((cur) => cur || p.name);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Enregistre la partie dès que le résultat est connu : à l'élimination, ou à la fin pour le vainqueur.
  const view = state.view;
  useEffect(() => {
    if (!view || recorded.current === view.matchId) return;
    const out = view.result
      ? { place: view.result.place, youWon: view.result.youWon, finaleCityId: view.result.finaleCityId }
      : !view.you.alive && view.you.place !== null
        ? { place: view.you.place, youWon: false, finaleCityId: 0 }
        : null;
    if (!out) return;
    recorded.current = view.matchId;
    setPassport((p) => {
      const next = recordMatch(p, { ...out, correct: view.you.correctCount }, Date.now());
      void savePassport(storage, next);
      return next;
    });
  }, [view, storage]);

  const errorText = useMemo(() => {
    if (state.status !== "error") return null;
    return state.error ?? t("error.connection");
  }, [state.status, state.error, t]);

  const rename = (n: string) => {
    setName(n);
    setPassport((p) => {
      const next = { ...p, name: n };
      void savePassport(storage, next);
      return next;
    });
  };

  const start = (m: Mode) => {
    session?.leave();
    const s = createSession(m, name.trim() || t("home.namePlaceholder"));
    setMode(m);
    setSession(s);
    s.start();
  };

  const leave = () => {
    session?.leave();
    setSession(null);
    setScreen("home");
  };

  if (session && (state.status === "connecting" || state.status === "lobby")) return <Lobby state={state} onCancel={leave} />;
  if (session && state.status === "playing") return <Game session={session} onLeave={leave} onNewGame={() => start(mode)} />;
  if (session && state.status === "ended" && state.view?.result)
    return <Results view={state.view} onAgain={() => start(mode)} onHome={leave} />;
  if (screen === "passport") return <Passport passport={passport} onBack={() => setScreen("home")} />;
  return (
    <Home
      name={name}
      onName={rename}
      onSolo={() => start("solo")}
      onOnline={() => start("online")}
      onPassport={() => setScreen("passport")}
      onlineAvailable={onlineAvailable()}
      error={errorText}
    />
  );
}
