import { randomInt } from "node:crypto";
import { createServer, type Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import type { Balance, World } from "@geoclash/engine";
import {
  ClientMessageSchema,
  MatchRunner,
  PROTOCOL_VERSION,
  type LobbyInfo,
  type Question,
  type ServerMessage,
} from "@geoclash/runtime";

export interface ServerOptions {
  port: number;
  host?: string;
  world: World;
  balance: Balance;
  questions: Question[];
  /** Délai d'attente du lobby en ligne avant que les bots prennent les places libres. */
  lobbyWaitMs?: number;
  tickMs?: number;
  introMs?: number;
  maxConnections?: number;
  now?: () => number;
  log?: (msg: string) => void;
}

interface Client {
  ws: WebSocket;
  name: string | null;
  mode: "solo" | "online" | null;
  match: ActiveMatch | null;
  playerId: number;
  /** Demi-RTT mesuré (ms), borné : sert à compenser la latence sur les temps de réponse. */
  halfRttMs: number;
  msgWindowStart: number;
  msgCount: number;
}

interface ActiveMatch {
  id: string;
  runner: MatchRunner;
  clients: Client[];
  endedAt: number | null;
}

const MAX_MSG_PER_SEC = 40;

/**
 * Serveur de jeu autoritaire.
 * - `solo` : partie privée immédiate, 1 humain + bots.
 * - `online` : lobby commun ; au bout de `lobbyWaitMs` (ou lobby plein), la partie démarre et
 *   les bots prennent TOUTES les places libres. Le serveur seul calcule temps de réponse, sauts et éliminations.
 */
export class GameServer {
  private readonly http: Server;
  private readonly wss: WebSocketServer;
  private readonly clients = new Set<Client>();
  private waiting: Client[] = [];
  private lobbyStartsAt: number | null = null;
  private readonly matches = new Map<string, ActiveMatch>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastLobbyBroadcast = 0;
  private readonly now: () => number;
  private readonly log: (m: string) => void;
  private matchCounter = 0;

  constructor(private readonly opts: ServerOptions) {
    this.now = opts.now ?? (() => Date.now());
    this.log = opts.log ?? (() => {});
    this.http = createServer((req, res) => {
      if (req.url === "/health") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, protocol: PROTOCOL_VERSION, ...this.stats() }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    this.wss = new WebSocketServer({ server: this.http, maxPayload: 2048 });
    this.wss.on("connection", (ws) => this.onConnection(ws));
  }

  stats() {
    return { connections: this.clients.size, waiting: this.waiting.length, matches: this.matches.size };
  }

  start(): Promise<number> {
    return new Promise((resolve) => {
      this.http.listen(this.opts.port, this.opts.host ?? "0.0.0.0", () => {
        const addr = this.http.address();
        const port = typeof addr === "object" && addr ? addr.port : this.opts.port;
        this.timer = setInterval(() => this.tick(), this.opts.tickMs ?? 100);
        this.log(`serveur en écoute sur le port ${port}`);
        resolve(port);
      });
    });
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    for (const c of this.clients) c.ws.terminate();
    await new Promise<void>((r) => this.wss.close(() => r()));
    await new Promise<void>((r) => this.http.close(() => r()));
  }

  // ---------- connexions ----------
  private onConnection(ws: WebSocket): void {
    if (this.clients.size >= (this.opts.maxConnections ?? 5000)) {
      ws.close(1013, "serveur plein");
      return;
    }
    const c: Client = { ws, name: null, mode: null, match: null, playerId: -1, halfRttMs: 0, msgWindowStart: 0, msgCount: 0 };
    this.clients.add(c);
    this.send(c, { t: "hello", protocol: PROTOCOL_VERSION, serverNow: this.now() });
    ws.on("message", (data) => this.onMessage(c, data.toString()));
    ws.on("close", () => this.onClose(c));
    ws.on("error", () => ws.terminate());
  }

  private onClose(c: Client): void {
    this.clients.delete(c);
    this.removeFromLobby(c);
    // Une partie en cours continue : le joueur déconnecté ne répond plus (éliminé par la zone).
  }

  private onMessage(c: Client, raw: string): void {
    const now = this.now();
    if (now - c.msgWindowStart > 1000) {
      c.msgWindowStart = now;
      c.msgCount = 0;
    }
    if (++c.msgCount > MAX_MSG_PER_SEC) return; // anti-spam : messages ignorés
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return this.send(c, { t: "error", code: "bad_json", message: "message illisible" });
    }
    const parsed = ClientMessageSchema.safeParse(json);
    if (!parsed.success) return this.send(c, { t: "error", code: "bad_message", message: "message invalide" });
    const m = parsed.data;
    switch (m.t) {
      case "ping":
        if (m.rtt !== undefined) c.halfRttMs = Math.min(400, m.rtt / 2);
        return this.send(c, { t: "pong", ts: m.ts, serverNow: now });
      case "join":
        return this.join(c, m.name, m.mode);
      case "answer":
        if (c.match) c.match.runner.answer(c.playerId, m.index, now, c.halfRttMs);
        return;
      case "move":
        if (c.match) c.match.runner.move(c.playerId, m.cityId);
        return;
      case "leave":
        this.removeFromLobby(c);
        c.ws.close();
        return;
    }
  }

  // ---------- lobby ----------
  private join(c: Client, rawName: string, mode: "solo" | "online"): void {
    if (c.mode) return this.send(c, { t: "error", code: "already_joined", message: "déjà dans une partie" });
    // eslint-disable-next-line no-control-regex
    c.name = rawName.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 24) || "Joueur";
    c.mode = mode;
    if (mode === "solo") return this.startMatch([c]);
    this.waiting.push(c);
    if (this.lobbyStartsAt === null) this.lobbyStartsAt = this.now() + (this.opts.lobbyWaitMs ?? 20_000);
    if (this.waiting.length >= this.opts.balance.players) return this.startLobbyMatch();
    this.broadcastLobby();
  }

  private removeFromLobby(c: Client): void {
    const i = this.waiting.indexOf(c);
    if (i === -1) return;
    this.waiting.splice(i, 1);
    if (this.waiting.length === 0) this.lobbyStartsAt = null;
    else this.broadcastLobby();
  }

  private lobbyInfo(): LobbyInfo {
    const capacity = this.opts.balance.players;
    return {
      mode: "online",
      capacity,
      humans: this.waiting.length,
      bots: capacity - this.waiting.length,
      startsAt: this.lobbyStartsAt,
      serverNow: this.now(),
    };
  }

  private broadcastLobby(): void {
    this.lastLobbyBroadcast = this.now();
    const info = this.lobbyInfo();
    for (const c of this.waiting) this.send(c, { t: "lobby", info });
  }

  private startLobbyMatch(): void {
    const group = this.waiting.splice(0, this.opts.balance.players);
    this.lobbyStartsAt = this.waiting.length ? this.now() + (this.opts.lobbyWaitMs ?? 20_000) : null;
    this.startMatch(group);
  }

  // ---------- parties ----------
  private startMatch(group: Client[]): void {
    const now = this.now();
    const id = `m${++this.matchCounter}_${randomInt(0, 0xffffff).toString(36)}`;
    const seed = randomInt(1, 0x7fffffff);
    const runner = new MatchRunner({
      world: this.opts.world,
      balance: this.opts.balance,
      questions: this.opts.questions,
      seed,
      startAt: now,
      matchId: id,
      introMs: this.opts.introMs,
      humans: group.map((c, i) => ({ id: i, name: c.name ?? "Joueur" })),
    });
    const match: ActiveMatch = { id, runner, clients: group, endedAt: null };
    this.matches.set(id, match);
    group.forEach((c, i) => {
      c.match = match;
      c.playerId = i;
      this.send(c, { t: "start", playerId: i, matchId: id, serverNow: now });
    });
    runner.onChange(() => this.pushViews(match));
    this.pushViews(match);
    this.log(`partie ${id} : ${group.length} humain(s) + ${this.opts.balance.players - group.length} bot(s)`);
  }

  private pushViews(m: ActiveMatch): void {
    const now = this.now();
    for (const c of m.clients) {
      if (c.ws.readyState !== c.ws.OPEN) continue;
      this.send(c, { t: "view", view: m.runner.viewFor(c.playerId, now) });
    }
    if (m.runner.isEnded() && m.endedAt === null) m.endedAt = now;
  }

  private tick(): void {
    const now = this.now();
    if (this.lobbyStartsAt !== null && this.waiting.length > 0 && now >= this.lobbyStartsAt) this.startLobbyMatch();
    else if (this.waiting.length > 0 && now - this.lastLobbyBroadcast >= 1000) this.broadcastLobby();
    for (const [id, m] of this.matches) {
      m.runner.tick(now);
      if (m.endedAt !== null && now - m.endedAt > 30_000) {
        for (const c of m.clients) if (c.match === m) c.match = null;
        this.matches.delete(id);
      }
    }
  }

  private send(c: Client, msg: ServerMessage): void {
    if (c.ws.readyState === c.ws.OPEN) c.ws.send(JSON.stringify(msg));
  }
}
