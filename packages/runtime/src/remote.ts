import type { ClientMessage, GameSession, ServerMessage, SessionState } from "./protocol";

export interface RemoteSessionOptions {
  url: string;
  name: string;
  mode?: "solo" | "online";
  /** Constructeur WebSocket (navigateur ou Node ≥ 22 par défaut ; injectable pour les tests). */
  WebSocketImpl?: new (url: string) => WebSocketLike;
}

/** Sous-ensemble de l'API WebSocket utilisé ici. */
export interface WebSocketLike {
  readyState: number;
  send(data: string): void;
  close(): void;
  onopen: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
}

const OPEN = 1;

/** Session en ligne : le serveur est autoritaire ; ce client envoie réponses et sauts, et reçoit des vues. */
export class RemoteSession implements GameSession {
  private state: SessionState;
  private listeners = new Set<(s: SessionState) => void>();
  private ws: WebSocketLike | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private lastRtt: number | undefined;
  private closedByUs = false;

  constructor(private readonly opts: RemoteSessionOptions) {
    this.state = { mode: opts.mode ?? "online", status: "idle", lobby: null, view: null, error: null, clockOffsetMs: 0 };
  }

  getState(): SessionState {
    return this.state;
  }

  subscribe(fn: (s: SessionState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  start(): void {
    if (this.ws) return;
    this.closedByUs = false;
    this.set({ status: "connecting", error: null, lobby: null, view: null });
    const Impl = this.opts.WebSocketImpl ?? (globalThis as unknown as { WebSocket: RemoteSessionOptions["WebSocketImpl"] }).WebSocket;
    if (!Impl) return this.set({ status: "error", error: "WebSocket indisponible" });
    let ws: WebSocketLike;
    try {
      ws = new Impl(this.opts.url);
    } catch {
      return this.set({ status: "error", error: "Serveur injoignable" });
    }
    this.ws = ws;
    ws.onopen = () => {
      this.send({ t: "join", name: this.opts.name, mode: this.opts.mode ?? "online" });
      this.pingTimer = setInterval(() => this.send({ t: "ping", ts: Date.now(), rtt: this.lastRtt }), 2000);
    };
    ws.onmessage = (ev) => this.onMessage(String(ev.data));
    ws.onerror = () => {
      if (this.state.status === "connecting") this.set({ status: "error", error: "Serveur injoignable" });
    };
    ws.onclose = () => {
      this.cleanup();
      if (!this.closedByUs && this.state.status !== "ended" && this.state.status !== "error")
        this.set({ status: "error", error: "Connexion perdue" });
    };
  }

  answer(index: number): void {
    this.send({ t: "answer", index });
  }

  move(cityId: number | null): void {
    this.send({ t: "move", cityId });
  }

  leave(): void {
    this.closedByUs = true;
    this.send({ t: "leave" });
    this.ws?.close();
    this.cleanup();
    this.set({ status: "idle", lobby: null, view: null });
  }

  private onMessage(raw: string): void {
    let msg: ServerMessage;
    try {
      msg = JSON.parse(raw) as ServerMessage;
    } catch {
      return;
    }
    switch (msg.t) {
      case "hello":
        this.set({ clockOffsetMs: msg.serverNow - Date.now() });
        break;
      case "lobby":
        this.set({ status: "lobby", lobby: msg.info, clockOffsetMs: msg.info.serverNow - Date.now() });
        break;
      case "start":
        this.set({ status: "playing", lobby: null });
        break;
      case "view":
        this.set({
          view: msg.view,
          status: msg.view.phase === "ENDED" ? "ended" : "playing",
          lobby: null,
          clockOffsetMs: msg.view.serverNow - Date.now(),
        });
        break;
      case "pong":
        this.lastRtt = Math.max(0, Date.now() - msg.ts);
        break;
      case "error":
        this.set({ status: "error", error: msg.message });
        break;
    }
  }

  private send(m: ClientMessage): void {
    if (this.ws && this.ws.readyState === OPEN) this.ws.send(JSON.stringify(m));
  }

  private cleanup(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
    this.ws = null;
  }

  private set(patch: Partial<SessionState>): void {
    this.state = { ...this.state, ...patch };
    for (const fn of this.listeners) fn(this.state);
  }
}
