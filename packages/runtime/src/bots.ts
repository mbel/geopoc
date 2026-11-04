import { destination, haversine, sphericalCentroid } from "@geoclash/engine";
import { Rng, mixSeed } from "@geoclash/engine";
import { rangeFor } from "@geoclash/engine";
import type { Balance } from "@geoclash/engine";
import type { AnswerInput, MatchState, Player, World, ZoneState } from "@geoclash/engine";

export type Profile = "lazy" | "standard" | "eager" | "random";

export interface Bot {
  id: number;
  skill: number; // ∈ [0,1]
  profile: Profile;
  rng: Rng;
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/** Quantile de Beta(2,2) : inverse de F(s) = 3s² − 2s³. */
function betaInv(u: number): number {
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (3 * mid * mid - 2 * mid * mid * mid < u) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const GRID = 400;
const skillGrid = Array.from({ length: GRID }, (_, j) => betaInv((j + 0.5) / GRID));
const thresholdCache = new Map<string, Record<string, number>>();

/**
 * Seuils b_d calés pour que la population de bots (compétence ~ Beta(2,2)) atteigne
 * exactement les taux de réussite cibles par difficulté (SPEC §5).
 */
export function botThresholds(b: Balance): Record<string, number> {
  const key = JSON.stringify([b.bots.skillSlope, b.bots.successTargets]);
  const hit = thresholdCache.get(key);
  if (hit) return hit;
  const a = b.bots.skillSlope;
  const out: Record<string, number> = {};
  for (const [d, target] of Object.entries(b.bots.successTargets)) {
    let lo = -3,
      hi = 4;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      let mean = 0;
      for (const s of skillGrid) mean += sigmoid(a * (s - mid));
      mean /= GRID;
      if (mean > target) lo = mid;
      else hi = mid;
    }
    out[d] = (lo + hi) / 2;
  }
  thresholdCache.set(key, out);
  return out;
}

function clampKey(b: Balance, d: number): string {
  const keys = Object.keys(b.bots.successTargets).map(Number);
  return String(Math.min(Math.max(d, Math.min(...keys)), Math.max(...keys)));
}

export function pCorrect(b: Balance, skill: number, difficulty: number): number {
  const thr = botThresholds(b)[clampKey(b, difficulty)];
  return sigmoid(b.bots.skillSlope * (skill - thr));
}

export function makeBots(count: number, seed: number, b: Balance): Bot[] {
  const rng = new Rng(seed);
  const p = b.bots.profiles;
  const profiles: Profile[] = ["lazy", "standard", "eager", "random"];
  const weights = [p.lazy, p.standard, p.eager, p.random];
  return Array.from({ length: count }, (_, id) => {
    const u = [rng.next(), rng.next(), rng.next()].sort((x, y) => x - y)[1]; // médiane de 3 U(0,1) ~ Beta(2,2)
    return { id, skill: u, profile: profiles[rng.weighted(weights)], rng: new Rng(mixSeed(seed, id + 1)) };
  });
}

/** Réponse d'un bot : justesse (selon compétence × difficulté) et temps lognormal. */
export function botAnswer(bot: Bot, difficulty: number, b: Balance, windowMs: number): AnswerInput {
  const correct = bot.rng.next() < pCorrect(b, bot.skill, difficulty);
  const t = b.bots.timing;
  const base = t.baseMs[clampKey(b, difficulty)];
  const median = base * (1 - t.skillEffect * (bot.skill - 0.5));
  const ms = median * Math.exp(t.sigma * bot.rng.normal());
  if (ms > windowMs) return { correct: false, elapsedMs: null };
  return { correct, elapsedMs: Math.round(ms) };
}

const centroidCache = new WeakMap<ZoneState, { lat: number; lng: number }>();
function zoneCentroid(world: World, z: ZoneState): { lat: number; lng: number } {
  let c = centroidCache.get(z);
  if (!c) {
    const pts = [];
    for (let i = 0; i < world.n; i++) if (z.safe[i] === 1) pts.push(world.cities[i]);
    c = sphericalCentroid(pts);
    centroidCache.set(z, c);
  }
  return c;
}

/**
 * Navigation d'un bot : il vise le centroïde (bruité) de la plus petite zone connue
 * (prévisualisation en priorité) parmi les villes à sa portée.
 */
export function botMove(bot: Bot, s: MatchState, world: World, b: Balance, p: Player): number | null {
  const known = s.preview ?? s.zone;
  if (!known || known.safeCount >= world.n) return null; // aucune information
  const range = rangeFor(b, p.band);
  const n = world.n;

  if (bot.profile === "random") {
    if (bot.rng.next() >= 0.3 || range === 0) return null;
    const reach: number[] = [];
    for (let j = 0; j < n; j++) if (j !== p.cityId && world.hops[p.cityId * n + j] <= range) reach.push(j);
    return reach.length ? reach[bot.rng.int(reach.length)] : null;
  }
  if (range === 0) return null;
  if (bot.rng.next() < b.bots.blunderRate) return null; // hésitation : le bot ne réagit pas ce round

  const c = zoneCentroid(world, known);
  const noiseKm = b.bots.navNoiseKm * Math.max(0, 1.3 - bot.skill);
  const est = noiseKm > 0 ? destination(c.lat, c.lng, bot.rng.next() * 2 * Math.PI, noiseKm * bot.rng.next()) : c;
  const distTo = (j: number) => haversine(est.lat, est.lng, world.cities[j].lat, world.cities[j].lng);

  const currentSafe = known.safe[p.cityId] === 1;
  let best = -1,
    bestD = Infinity,
    bestSafe = -1,
    bestSafeD = Infinity;
  for (let j = 0; j < n; j++) {
    if (world.hops[p.cityId * n + j] > range) continue;
    const d = distTo(j);
    if (d < bestD) (bestD = d), (best = j);
    if (known.safe[j] === 1 && d < bestSafeD) (bestSafeD = d), (bestSafe = j);
  }
  const target = bestSafe >= 0 ? bestSafe : best;
  const targetD = bestSafe >= 0 ? bestSafeD : bestD;
  if (target < 0 || target === p.cityId) return null;
  const curD = distTo(p.cityId);

  switch (bot.profile) {
    case "lazy":
      return currentSafe ? null : targetD < curD ? target : null;
    case "standard":
      if (!currentSafe) return targetD < curD ? target : null;
      return bot.rng.next() < 0.5 && targetD + 300 < curD ? target : null;
    case "eager":
      return targetD < curD || !currentSafe ? target : null;
  }
}
