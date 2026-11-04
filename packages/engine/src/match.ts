import type { Balance } from "./config";
import { sampleDifficulty } from "./difficulty";
import { Rng } from "./rng";
import type { AnswerInput, Band, MatchState, Player, World } from "./types";
import { computeZone } from "./zone";

/**
 * Moteur de partie : fonctions PURES et DÉTERMINISTES (SPEC §9).
 * Aucun I/O, aucun Date.now()/Math.random() : l'aléa vient de `rngState`, stocké dans l'état.
 *
 * Cycle d'un round :
 *   drawQuestion → applyAnswers → applyMoves  (puis round suivant, ou FINALE, ou ENDED)
 * Cycle de finale :
 *   drawFinaleQuestion → applyFinaleAnswers
 */

export function createMatch(world: World, b: Balance, seed: number, playerCount = b.players): MatchState {
  const rng = new Rng(seed);
  const weights = world.cities.map((c) => (b.zone.finalCityWeighting === "uniform" ? 1 : b.zone.rarityWeights[c.rarity]));
  const finaleCityId = rng.weighted(weights);
  const plan = {
    bearingRad: rng.next() * 2 * Math.PI,
    offsetKm: b.zone.maxCenterOffsetKm * (0.5 + 0.5 * rng.next()),
  };
  const players: Player[] = [];
  for (let id = 0; id < playerCount; id++) {
    const spawn = rng.int(world.n);
    players.push({
      id,
      spawnCityId: spawn,
      cityId: spawn,
      alive: true,
      redRounds: 0,
      band: "FAIL",
      totalMs: 0,
      finaleMs: 0,
      eliminatedRound: null,
      eliminatedBy: null,
    });
  }
  return {
    seed,
    rngState: rng.state,
    round: 1,
    phase: "ROUND",
    finaleCityId,
    plan,
    players,
    zone: null,
    preview: null,
    difficulty: 1,
    finaleRound: 0,
    finaleDifficulty: b.difficulty.finale.start,
    finaleAllFailStreak: 0,
    winnerId: null,
    endReason: null,
    finaleEntrants: null,
  };
}

export const aliveOf = (s: MatchState): Player[] => s.players.filter((p) => p.alive);

/** Tire la difficulté du round courant. */
export function drawQuestion(s: MatchState, b: Balance): { state: MatchState; difficulty: number } {
  const rng = new Rng(s.rngState);
  const difficulty = sampleDifficulty(b, s.round, rng);
  return { state: { ...s, rngState: rng.state, difficulty }, difficulty };
}

/** Bande de vitesse obtenue (SPEC §2). Erreur ou timeout = FAIL. */
export function bandFor(b: Balance, a: AnswerInput): Band {
  if (!a.correct || a.elapsedMs === null || a.elapsedMs > b.timing.questionWindowMs) return "FAIL";
  for (const band of b.bands) if (a.elapsedMs <= band.maxMs) return band.band;
  return "FAIL";
}

/** Portée de saut (en sauts de graphe) débloquée par une bande. */
export function rangeFor(b: Balance, band: Band): number {
  if (band === "FAIL") return 0;
  return b.bands.find((x) => x.band === band)?.range ?? 0;
}

/** Enregistre les réponses du round : fixe la bande (donc la portée) de chaque joueur en vie. */
export function applyAnswers(s: MatchState, b: Balance, answers: Record<number, AnswerInput>): MatchState {
  if (s.phase !== "ROUND") throw new Error("applyAnswers hors phase ROUND");
  const players = s.players.map((p) => {
    if (!p.alive) return p;
    const a = answers[p.id] ?? { correct: false, elapsedMs: null };
    const ms = a.elapsedMs === null ? b.timing.questionWindowMs : Math.min(a.elapsedMs, b.timing.questionWindowMs);
    return { ...p, band: bandFor(b, a), totalMs: p.totalMs + ms };
  });
  return { ...s, players };
}

/**
 * Applique les sauts, met à jour la zone, applique la règle d'Escale (SPEC §4),
 * puis passe au round suivant, à la finale, ou termine la partie.
 * `moves[id]` = ville cible (ou null/absent = rester). Un saut hors portée est ignoré.
 */
export function applyMoves(
  s: MatchState,
  world: World,
  b: Balance,
  moves: Record<number, number | null>,
): MatchState {
  if (s.phase !== "ROUND") throw new Error("applyMoves hors phase ROUND");
  const n = world.n;
  const r = s.round;
  const events = b.zone.events;

  // 1. Sauts
  let players = s.players.map((p) => {
    if (!p.alive) return p;
    const target = moves[p.id];
    if (target === null || target === undefined || target === p.cityId) return p;
    if (!Number.isInteger(target) || target < 0 || target >= n) return p;
    if (world.hops[p.cityId * n + target] > rangeFor(b, p.band)) return p;
    return { ...p, cityId: target };
  });

  // 2. Zone : application puis annonce
  let zone = s.zone;
  let preview = s.preview;
  const applyIdx = events.findIndex((e) => e.apply === r);
  if (applyIdx >= 0) {
    zone =
      preview && preview.eventIndex === applyIdx
        ? preview
        : computeZone(world, s.finaleCityId, s.plan, events, applyIdx, r, b.zone.offsetRatio);
    preview = null;
  }
  const annIdx = events.findIndex((e) => e.announce === r);
  if (annIdx >= 0) preview = computeZone(world, s.finaleCityId, s.plan, events, annIdx, events[annIdx].apply, b.zone.offsetRatio);

  // 3. Suivi des joueurs sur ville rouge, puis élimination (Escale)
  const z = zone;
  players = players.map((p) => {
    if (!p.alive) return p;
    const red = z !== null && z.safe[p.cityId] === 0;
    return { ...p, redRounds: red ? p.redRounds + 1 : 0 };
  });
  const aliveCount = players.filter((p) => p.alive).length;
  const doomed = players.filter((p) => p.alive && p.redRounds > b.zone.graceRounds);
  // Jamais tout le monde en même temps : réprieve si la zone éliminerait tous les survivants.
  if (doomed.length > 0 && doomed.length < aliveCount) {
    const ids = new Set(doomed.map((p) => p.id));
    players = players.map((p) =>
      ids.has(p.id) ? { ...p, alive: false, eliminatedRound: r, eliminatedBy: "zone" as const } : p,
    );
  }

  let next: MatchState = { ...s, players, zone, preview };
  const alive = players.filter((p) => p.alive);

  // 4. Issue
  if (alive.length === 1) {
    return { ...next, phase: "ENDED", winnerId: alive[0].id, endReason: "last_survivor" };
  }
  if (zone?.final && alive.every((p) => p.cityId === s.finaleCityId)) {
    return { ...next, round: r + 1, phase: "FINALE", finaleEntrants: alive.length };
  }
  if (r >= b.zone.maxRounds) {
    return endByTiebreak(next, "cap", (p) => p.totalMs);
  }
  return { ...next, round: r + 1 };
}

/** Tire la difficulté de la question de finale (SPEC §6). */
export function finaleDifficultyOf(s: MatchState): number {
  return s.finaleDifficulty;
}

/**
 * Round de finale : toute erreur ou timeout élimine. Si TOUS échouent, personne n'est éliminé.
 * Après `maxAllFailStreak` relances ratées ou `maxRounds` questions, le temps cumulé départage.
 */
export function applyFinaleAnswers(s: MatchState, b: Balance, answers: Record<number, AnswerInput>): MatchState {
  if (s.phase !== "FINALE") throw new Error("applyFinaleAnswers hors phase FINALE");
  const window = b.timing.finaleWindowMs;
  const fin = b.difficulty.finale;
  const okById = new Map<number, boolean>();
  let players = s.players.map((p) => {
    if (!p.alive) return p;
    const a = answers[p.id] ?? { correct: false, elapsedMs: null };
    const ok = a.correct && a.elapsedMs !== null && a.elapsedMs <= window;
    okById.set(p.id, ok);
    const ms = a.elapsedMs === null ? window : Math.min(a.elapsedMs, window);
    return { ...p, finaleMs: p.finaleMs + ms };
  });
  const aliveCount = okById.size;
  const okCount = [...okById.values()].filter(Boolean).length;
  const eliminationRound = s.round + s.finaleRound;

  let streak = s.finaleAllFailStreak;
  let difficulty = s.finaleDifficulty;
  if (okCount === 0) {
    streak += 1;
  } else {
    streak = 0;
    players = players.map((p) =>
      p.alive && okById.get(p.id) === false
        ? { ...p, alive: false, eliminatedRound: eliminationRound, eliminatedBy: "finale" as const }
        : p,
    );
    if (okCount === aliveCount) difficulty = Math.min(fin.max, difficulty + 1);
  }

  const next: MatchState = {
    ...s,
    players,
    finaleRound: s.finaleRound + 1,
    finaleDifficulty: difficulty,
    finaleAllFailStreak: streak,
  };
  const alive = players.filter((p) => p.alive);
  if (alive.length === 1) return { ...next, phase: "ENDED", winnerId: alive[0].id, endReason: "last_survivor" };
  if (streak > fin.maxAllFailStreak || next.finaleRound >= fin.maxRounds)
    return endByTiebreak(next, "tiebreak", (p) => p.finaleMs);
  return next;
}

function endByTiebreak(s: MatchState, reason: "cap" | "tiebreak", score: (p: Player) => number): MatchState {
  const alive = s.players.filter((p) => p.alive);
  const winner = alive.reduce((best, p) => (score(p) < score(best) || (score(p) === score(best) && p.id < best.id) ? p : best));
  const round = s.round + s.finaleRound;
  const players = s.players.map((p) =>
    p.alive && p.id !== winner.id ? { ...p, alive: false, eliminatedRound: round, eliminatedBy: "cap" as const } : p,
  );
  return { ...s, players, phase: "ENDED", winnerId: winner.id, endReason: reason };
}
