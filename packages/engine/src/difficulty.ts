import type { Balance } from "./config";
import type { Rng } from "./rng";

/** Tire la difficulté d'un round selon le calendrier (SPEC §5). */
export function sampleDifficulty(b: Balance, round: number, rng: Rng): number {
  const sched = b.difficulty.schedule;
  const step = sched.find((s) => round >= s.from && round <= s.to) ?? sched[sched.length - 1];
  const keys = Object.keys(step.mix).sort();
  const idx = rng.weighted(keys.map((k) => step.mix[k]));
  return Number(keys[idx]);
}
