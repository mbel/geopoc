import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { getBalance, getWorld, questionsFr } from "@geoclash/data";
import { haversine } from "@geoclash/engine";
import {
  RemoteSession,
  parseQuestions,
  scaleBalanceTiming,
  type PlayerView,
  type RemoteSessionOptions,
  type SessionState,
} from "@geoclash/runtime";
import { GameServer } from "../src/server";

const balance = scaleBalanceTiming(getBalance(), 1 / 40);
const world = getWorld(balance);
const questions = parseQuestions(questionsFr);

let server: GameServer | null = null;
const sessions: RemoteSession[] = [];

async function boot(lobbyWaitMs = 300) {
  server = new GameServer({ port: 0, host: "127.0.0.1", world, balance, questions, lobbyWaitMs, introMs: 80, tickMs: 20 });
  const port = await server.start();
  return { port, url: `ws://127.0.0.1:${port}` };
}

afterEach(async () => {
  for (const s of sessions.splice(0)) s.leave();
  await server?.stop();
  server = null;
});

/** Un client automatique : répond vite au hasard et fuit vers la zone. */
function botClient(url: string, name: string, mode: "solo" | "online") {
  const s = new RemoteSession({ url, name, mode, WebSocketImpl: WebSocket as unknown as RemoteSessionOptions["WebSocketImpl"] });
  sessions.push(s);
  const log: SessionState[] = [];
  s.subscribe((st) => {
    log.push(st);
    const v = st.view;
    if (!v) return;
    if (v.phase === "QUESTION" && !v.you.answered) s.answer(Math.floor(Math.random() * 4));
    if (v.phase === "MOVE" && !v.you.moved && v.you.alive) s.move(bestMove(v));
  });
  s.start();
  return { s, log };
}

function bestMove(v: PlayerView): number | null {
  const z = v.preview ?? v.zone;
  if (!z || !v.you.reachable.length) return null;
  const d = (c: number) => haversine(z.centerLat, z.centerLng, world.cities[c].lat, world.cities[c].lng);
  let best: number | null = null;
  let bd = d(v.you.cityId);
  for (const c of v.you.reachable) if (d(c) < bd) ((bd = d(c)), (best = c));
  return best;
}

async function until(cond: () => boolean, ms = 25_000, label = "condition") {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > ms) throw new Error(`délai dépassé : ${label}`);
    await new Promise((r) => setTimeout(r, 20));
  }
}

describe("serveur de jeu", () => {
  it("expose /health", async () => {
    const { port } = await boot();
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    const body = (await res.json()) as { ok: boolean; protocol: number };
    expect(body.ok).toBe(true);
    expect(body.protocol).toBe(1);
  });

  it("solo : partie privée immédiate, 1 humain + 99 bots, jusqu'à la fin", async () => {
    const { url } = await boot();
    const { s } = botClient(url, "Solo", "solo");
    await until(() => s.getState().status === "playing", 5000, "démarrage solo");
    expect(s.getState().view?.total).toBe(balance.players);
    await until(() => s.getState().status === "ended", 30_000, "fin de partie solo");
    expect(s.getState().view?.result).not.toBeNull();
  });

  it("en ligne : le lobby regroupe les humains, les bots prennent les places libres, tous voient la même partie", async () => {
    const { url } = await boot(400);
    const a = botClient(url, "Alice", "online");
    const b = botClient(url, "Bob", "online");
    const c = botClient(url, "Chloé", "online");
    await until(() => a.s.getState().status === "lobby", 5000, "lobby");
    await until(() => (a.s.getState().lobby?.humans ?? 0) >= 3, 5000, "3 humains dans le lobby");
    const lobby = a.s.getState().lobby!;
    expect(lobby.capacity).toBe(balance.players);
    expect(lobby.bots).toBe(balance.players - lobby.humans);

    await until(() => [a, b, c].every((x) => x.s.getState().status === "ended"), 40_000, "fin de partie en ligne");
    const views = [a, b, c].map((x) => x.s.getState().view!);
    expect(new Set(views.map((v) => v.matchId)).size).toBe(1);
    expect(new Set(views.map((v) => v.result!.winnerId)).size).toBe(1);
    expect(views.map((v) => v.you.name).sort()).toEqual(["Alice", "Bob", "Chloé"]);
    expect(new Set(views.map((v) => v.you.id)).size).toBe(3);
    expect(views.every((v) => v.total === balance.players)).toBe(true);
  });

  it("aucune vue envoyée pendant la question ne contient la bonne réponse ni la Ville Finale", async () => {
    const { url } = await boot();
    const { s, log } = botClient(url, "Espion", "solo");
    await until(() => s.getState().status === "ended", 30_000, "fin");
    for (const st of log) {
      const v = st.view;
      if (!v) continue;
      if (v.phase === "QUESTION") {
        expect(JSON.stringify(v)).not.toContain("correctIndex");
        expect(v.reveal).toBeNull();
      }
      if (v.phase !== "ENDED" && !v.zone?.final) expect(v.finaleCityId).toBeNull();
    }
  });

  it("rejette les messages invalides sans planter le serveur", async () => {
    const { url, port } = await boot();
    const ws = new WebSocket(url);
    const msgs: string[] = [];
    ws.on("message", (d) => msgs.push(d.toString()));
    await new Promise((r) => ws.on("open", r));
    ws.send("pas du json");
    ws.send(JSON.stringify({ t: "answer", index: 99 }));
    ws.send(JSON.stringify({ t: "inconnu" }));
    await until(() => msgs.filter((m) => m.includes('"error"')).length >= 3, 3000, "3 erreurs");
    ws.close();
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    expect(res.ok).toBe(true);
  });

  it("répond aux ping par un pong (mesure de latence)", async () => {
    const { url } = await boot();
    const ws = new WebSocket(url);
    const msgs: any[] = [];
    ws.on("message", (d) => msgs.push(JSON.parse(d.toString())));
    await new Promise((r) => ws.on("open", r));
    ws.send(JSON.stringify({ t: "ping", ts: 12345, rtt: 80 }));
    await until(() => msgs.some((m) => m.t === "pong"), 2000, "pong");
    expect(msgs.find((m) => m.t === "pong").ts).toBe(12345);
    ws.close();
  });

  it("un client ne peut pas rejoindre deux fois", async () => {
    const { url } = await boot();
    const ws = new WebSocket(url);
    const msgs: any[] = [];
    ws.on("message", (d) => msgs.push(JSON.parse(d.toString())));
    await new Promise((r) => ws.on("open", r));
    ws.send(JSON.stringify({ t: "join", name: "X", mode: "online" }));
    ws.send(JSON.stringify({ t: "join", name: "X", mode: "online" }));
    await until(() => msgs.some((m) => m.t === "error" && m.code === "already_joined"), 2000, "erreur already_joined");
    ws.close();
  });

  it("un joueur qui quitte le lobby libère sa place", async () => {
    const { url } = await boot(60_000);
    const a = botClient(url, "A", "online");
    const b = botClient(url, "B", "online");
    await until(() => (b.s.getState().lobby?.humans ?? 0) === 2, 4000, "2 humains");
    a.s.leave();
    await until(() => b.s.getState().lobby?.humans === 1, 4000, "1 humain");
    expect(b.s.getState().lobby?.bots).toBe(balance.players - 1);
  });

  it("une déconnexion en pleine partie n'empêche pas la partie de se terminer pour les autres", async () => {
    const { url } = await boot(300);
    const a = botClient(url, "Reste", "online");
    const b = botClient(url, "Part", "online");
    await until(() => a.s.getState().status === "playing" && b.s.getState().status === "playing", 6000, "partie lancée");
    b.s.leave();
    await until(() => a.s.getState().status === "ended", 40_000, "fin pour celui qui reste");
    expect(a.s.getState().view?.result).not.toBeNull();
  });
});
