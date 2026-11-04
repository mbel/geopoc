import { getBalance, getWorld, questionsFr } from "@geoclash/data";
import {
  LocalSession,
  RemoteSession,
  parseQuestions,
  scaleBalanceTiming,
  type GameSession,
} from "@geoclash/runtime";
import { config } from "../services/config";

let cache: { turbo: number; balance: ReturnType<typeof getBalance>; world: ReturnType<typeof getWorld> } | null = null;

function content() {
  if (!cache || cache.turbo !== config.turbo) {
    const base = getBalance();
    const balance = config.turbo > 0 ? scaleBalanceTiming(base, config.turbo) : base;
    cache = { turbo: config.turbo, balance, world: getWorld(balance) };
  }
  return cache;
}

export const questions = parseQuestions(questionsFr);
export const onlineAvailable = () => config.serverUrl.length > 0;

/** Solo = moteur dans le navigateur ; en ligne = serveur autoritaire. Même interface dans les deux cas. */
export function createSession(mode: "solo" | "online", name: string): GameSession {
  const { balance, world } = content();
  if (mode === "solo") return new LocalSession({ world, balance, questions, name });
  return new RemoteSession({ url: config.serverUrl, name, mode: "online" });
}
