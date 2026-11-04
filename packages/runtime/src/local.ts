import type { Balance, World } from "@geoclash/engine";
import type { GameSession, LobbyInfo, SessionState } from "./protocol";
import type { Question } from "./questions";
import { MatchRunner } from "./runner";

export interface LocalSessionOptions {
  world: World;
  balance: Balance;
  questions: Question[];
  name?: string;
  seed?: number;
  /** Horloge injectable (tests). */
  now?: () => number;
  /** Durée de l'écran « recherche d'adversaires » (les bots prennent les places libres). */
  lobbyMs?: number;
  introMs?: number;
  /** false : l'hôte appelle `tick()` lui-même (tests). */
  autoTick?: boolean;
}

/**
 * Partie solo : le moteur tourne dans le navigateur, 1 humain + des bots sur toutes les autres places.
 * Même interface (`GameSession`) que la session en ligne : l'interface ne voit aucune différence.
 */
export class LocalSession implements GameSession {
  private state: SessionState = { mode: "solo", status: "idle", lobby: null, view: null, error: null, clockOffsetMs: 0 };
  private listeners = new Set<(s: SessionState) => void>();
  private runner: MatchRunner | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lobbyStart = 0;
  private readonly now: () => number;
  private readonly lobbyMs: number;

  constructor(private readonly opts: LocalSessionOptions) {
    this.now = opts.now ?? (() => Date.now());
    this.lobbyMs = opts.lobbyMs ?? 3500;
  }

  getState(): SessionState {
    return this.state;
  }

  subscribe(fn: (s: SessionState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  start(): void {
    if (this.state.status !== "idle" && this.state.status !== "ended" && this.state.status !== "error") return;
    this.runner = null;
    this.lobbyStart = this.now();
    this.set({ status: "lobby", lobby: this.lobbyInfo(), view: null, error: null });
    if (this.opts.autoTick !== false) this.timer = setInterval(() => this.tick(), 100);
  }

  /** Avance la session (appelé par le minuteur, ou à la main dans les tests). */
  tick(): void {
    const now = this.now();
    if (this.state.status === "lobby") {
      if (now >= this.lobbyStart + this.lobbyMs) return this.beginMatch(now);
      const info = this.lobbyInfo();
      if (info.bots !== this.state.lobby?.bots) this.set({ lobby: info });
      return;
    }
    if (this.runner && this.state.status === "playing") this.runner.tick(now);
  }

  answer(index: number): void {
    this.runner?.answer(0, index, this.now());
  }

  move(cityId: number | null): void {
    this.runner?.move(0, cityId);
  }

  leave(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.runner = null;
    this.set({ status: "idle", lobby: null, view: null });
  }

  private lobbyInfo(): LobbyInfo {
    const now = this.now();
    const capacity = this.opts.balance.players;
    const p = Math.min(1, Math.max(0, (now - this.lobbyStart) / this.lobbyMs));
    return {
      mode: "solo",
      capacity,
      humans: 1,
      bots: Math.floor(p * (capacity - 1)),
      startsAt: this.lobbyStart + this.lobbyMs,
      serverNow: now,
    };
  }

  private beginMatch(now: number): void {
    const seed = this.opts.seed ?? (Math.floor(Math.random() * 0x7fffffff) >>> 0);
    this.runner = new MatchRunner({
      world: this.opts.world,
      balance: this.opts.balance,
      questions: this.opts.questions,
      seed,
      startAt: now,
      introMs: this.opts.introMs,
      humans: [{ id: 0, name: this.opts.name ?? "Toi" }],
    });
    this.runner.onChange(() => this.publishView());
    this.set({ status: "playing", lobby: null, view: this.runner.viewFor(0, now) });
  }

  private publishView(): void {
    if (!this.runner) return;
    const view = this.runner.viewFor(0, this.now());
    this.set({ view, status: this.runner.isEnded() ? "ended" : "playing" });
    if (this.runner.isEnded() && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private set(patch: Partial<SessionState>): void {
    this.state = { ...this.state, ...patch };
    for (const fn of this.listeners) fn(this.state);
  }
}
