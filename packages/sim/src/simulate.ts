import { aliveOf, applyAnswers, applyFinaleAnswers, applyMoves, createMatch, drawQuestion } from "@geoclash/engine";
import { mixSeed } from "@geoclash/engine";
import { roundCycleSec, type Balance } from "@geoclash/engine";
import type { AnswerInput, Continent, World } from "@geoclash/engine";
import { botAnswer, botMove, makeBots } from "@geoclash/runtime";

export interface MatchResult {
  seed: number;
  winnerId: number;
  winnerSpawnContinent: Continent;
  winnerSpawnCityId: number;
  finaleCityId: number;
  endReason: string;
  rounds: number;
  finaleRounds: number;
  durationSec: number;
  finaleEntrants: number | null;
  /** Joueurs en vie à la fin de chaque round normal (index 0 = round 1). */
  aliveAfterRound: number[];
  elimByZone: number;
  elimByFinale: number;
  elimByCap: number;
  spawnByContinent: Record<string, number>;
  /** difficulté -> [tentatives, bonnes réponses] */
  answers: Record<string, [number, number]>;
  bands: Record<string, number>;
}

/** Joue une partie complète avec des bots. Entièrement déterministe pour une seed donnée. */
export function playMatch(world: World, b: Balance, seed: number): MatchResult {
  let s = createMatch(world, b, seed);
  const bots = makeBots(b.players, mixSeed(seed, 77), b);
  const aliveAfterRound: number[] = [];
  const answersStat: Record<string, [number, number]> = {};
  const bands: Record<string, number> = { GRAND: 0, MOYEN: 0, MICRO: 0, FAIL: 0 };
  let rounds = 0;
  let finaleRounds = 0;
  const bump = (d: number, correct: boolean) => {
    const k = String(d);
    const e = (answersStat[k] ??= [0, 0]);
    e[0]++;
    if (correct) e[1]++;
  };

  let guard = 0;
  while (s.phase !== "ENDED") {
    if (++guard > 1000) throw new Error("partie sans fin (garde-fou)");
    if (s.phase === "ROUND") {
      const q = drawQuestion(s, b);
      s = q.state;
      const answers: Record<number, AnswerInput> = {};
      for (const p of aliveOf(s)) {
        const a = botAnswer(bots[p.id], q.difficulty, b, b.timing.questionWindowMs);
        answers[p.id] = a;
        bump(q.difficulty, a.correct && a.elapsedMs !== null);
      }
      s = applyAnswers(s, b, answers);
      for (const p of aliveOf(s)) bands[p.band]++;
      const moves: Record<number, number | null> = {};
      for (const p of aliveOf(s)) {
        const m = botMove(bots[p.id], s, world, b, p);
        if (m !== null) moves[p.id] = m;
      }
      s = applyMoves(s, world, b, moves);
      aliveAfterRound.push(aliveOf(s).length);
      rounds++;
    } else {
      const d = s.finaleDifficulty;
      const answers: Record<number, AnswerInput> = {};
      for (const p of aliveOf(s)) {
        const a = botAnswer(bots[p.id], d, b, b.timing.finaleWindowMs);
        answers[p.id] = a;
        bump(d, a.correct && a.elapsedMs !== null);
      }
      s = applyFinaleAnswers(s, b, answers);
      finaleRounds++;
    }
  }

  const winner = s.players[s.winnerId!];
  const spawnByContinent: Record<string, number> = {};
  for (const p of s.players) {
    const c = world.cities[p.spawnCityId].continent;
    spawnByContinent[c] = (spawnByContinent[c] ?? 0) + 1;
  }
  return {
    seed,
    winnerId: winner.id,
    winnerSpawnContinent: world.cities[winner.spawnCityId].continent,
    winnerSpawnCityId: winner.spawnCityId,
    finaleCityId: s.finaleCityId,
    endReason: s.endReason!,
    rounds,
    finaleRounds,
    durationSec: rounds * roundCycleSec(b) + finaleRounds * b.timing.finaleCycleSec,
    finaleEntrants: s.finaleEntrants,
    aliveAfterRound,
    elimByZone: s.players.filter((p) => p.eliminatedBy === "zone").length,
    elimByFinale: s.players.filter((p) => p.eliminatedBy === "finale").length,
    elimByCap: s.players.filter((p) => p.eliminatedBy === "cap").length,
    spawnByContinent,
    answers: answersStat,
    bands,
  };
}

export function runSimulation(world: World, b: Balance, games: number, seed: number): MatchResult[] {
  const out: MatchResult[] = [];
  for (let g = 0; g < games; g++) out.push(playMatch(world, b, mixSeed(seed, g + 1)));
  return out;
}
