import { getBalance, getWorld, questionsFr } from "@geoclash/data";
import { parseQuestions, scaleBalanceTiming } from "@geoclash/runtime";
import { GameServer } from "./server";

const turbo = Number(process.env.TURBO ?? "0"); // ex. TURBO=0.05 : parties 20× plus rapides (démo/dev)
const base = getBalance("v1");
const balance = turbo > 0 ? scaleBalanceTiming(base, turbo) : base;

const server = new GameServer({
  port: Number(process.env.PORT ?? 8787),
  world: getWorld(balance),
  balance,
  questions: parseQuestions(questionsFr),
  lobbyWaitMs: Number(process.env.LOBBY_WAIT_MS ?? 20_000),
  log: (m) => console.log(`[serveur] ${m}`),
});

server.start().then((port) => console.log(`GeoClash server : ws://localhost:${port}  (santé : http://localhost:${port}/health)`));

for (const sig of ["SIGINT", "SIGTERM"] as const)
  process.on(sig, () => server.stop().then(() => process.exit(0)));
