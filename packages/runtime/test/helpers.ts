import { getBalance, getWorld, questionsEn, questionsFr } from "@geoclash/data";
import { Rng, haversine } from "@geoclash/engine";
import { MatchRunner, parseQuestions, type PlayerView, type RunnerOptions } from "../src";

export const balance = getBalance();
export const world = getWorld(balance);
export const questions = parseQuestions(questionsFr);
export const questionsEnglish = parseQuestions(questionsEn);

export function makeRunner(over: Partial<RunnerOptions> = {}, startAt = 0) {
  return new MatchRunner({
    world,
    balance,
    questions,
    seed: 1234,
    startAt,
    humans: [{ id: 0, name: "Toi" }],
    ...over,
  });
}

export type Policy = (view: PlayerView, runner: MatchRunner, now: number, rng: Rng) => void;

/** Joueur « raisonnable » : répond au hasard, fuit vers le centre de la prochaine zone. */
export const wanderPolicy: Policy = (view, runner, now, rng) => {
  const id = view.you.id;
  if (view.phase === "QUESTION" && !view.you.answered) runner.answer(id, rng.int(4), now);
  if (view.phase === "MOVE" && !view.you.moved && view.you.alive) {
    const z = view.preview ?? view.zone;
    let best: number | null = null;
    if (z && view.you.reachable.length) {
      let bd = haversine(z.centerLat, z.centerLng, world.cities[view.you.cityId].lat, world.cities[view.you.cityId].lng);
      for (const c of view.you.reachable) {
        const d = haversine(z.centerLat, z.centerLng, world.cities[c].lat, world.cities[c].lng);
        if (d < bd) {
          bd = d;
          best = c;
        }
      }
    }
    runner.move(id, best);
  }
};

/** Cheat de test : répond toujours juste, immédiatement (pour atteindre la finale). */
export const cheatPolicy: Policy = (view, runner, now, rng) => {
  const id = view.you.id;
  if (view.phase === "QUESTION" && !view.you.answered) runner.answer(id, runner.peekCorrectIndex(), now);
  else wanderPolicy(view, runner, now, rng);
};

export interface PlayResult {
  views: PlayerView[];
  endedAt: number;
  /** Instant où le joueur observé est éliminé (null s'il ne l'est jamais). */
  deathAt: number | null;
  final: PlayerView;
}

/** Fait tourner la partie en temps simulé jusqu'à sa fin (ou 20 min simulées). */
export function play(runner: MatchRunner, policy: Policy, start = 0, step = 50, humanId = 0): PlayResult {
  const rng = new Rng(99);
  const views: PlayerView[] = [];
  let deathAt: number | null = null;
  let now = start;
  for (; now < start + 20 * 60_000 && !runner.isEnded(); now += step) {
    runner.tick(now);
    const v = runner.viewFor(humanId, now);
    if (deathAt === null && !v.you.alive) deathAt = now;
    if (views.length === 0 || views[views.length - 1].phase !== v.phase || views[views.length - 1].round !== v.round) views.push(v);
    policy(v, runner, now, rng);
  }
  runner.tick(now);
  return { views, endedAt: now, deathAt, final: runner.viewFor(humanId, now) };
}
