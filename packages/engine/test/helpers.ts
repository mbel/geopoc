import { getBalance, getWorld } from "@geoclash/data";
import type { Balance } from "@geoclash/engine";
import { computeZone } from "@geoclash/engine";
import type { MatchState, World } from "@geoclash/engine";

export const balance: Balance = getBalance();
export const world: World = getWorld(balance);

export const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

/** Zone du premier événement pour un état donné. */
export function firstZone(s: MatchState, b: Balance = balance) {
  return computeZone(world, s.finaleCityId, s.plan, b.zone.events, 0, b.zone.events[0].apply, b.zone.offsetRatio);
}

export function redCity(z: { safe: Uint8Array }): number {
  for (let i = 0; i < z.safe.length; i++) if (z.safe[i] === 0) return i;
  throw new Error("aucune ville rouge");
}
export function safeCity(z: { safe: Uint8Array }): number {
  for (let i = 0; i < z.safe.length; i++) if (z.safe[i] === 1) return i;
  throw new Error("aucune ville sûre");
}

export function withPlayers(s: MatchState, patch: (p: MatchState["players"][number], i: number) => Partial<MatchState["players"][number]>): MatchState {
  return { ...s, players: s.players.map((p, i) => ({ ...p, ...patch(p, i) })) };
}
