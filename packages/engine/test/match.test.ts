import { describe, expect, it } from "vitest";
import {
  applyAnswers,
  applyFinaleAnswers,
  applyMoves,
  bandFor,
  createMatch,
  rangeFor,
} from "@geoclash/engine";
import type { AnswerInput, MatchState } from "@geoclash/engine";
import { balance, clone, firstZone, redCity, safeCity, withPlayers, world } from "./helpers";

const ok = (ms: number): AnswerInput => ({ correct: true, elapsedMs: ms });

/** État au round de la première zone, avec 3 joueurs en vie dont on contrôle la position. */
function atFirstShrink(b = balance) {
  let s = createMatch(world, b, 77);
  const z = firstZone(s, b);
  s = { ...s, round: b.zone.events[0].apply };
  return { s, z };
}

describe("bandes de vitesse (SPEC §2)", () => {
  it("associe temps de réponse et bande", () => {
    expect(bandFor(balance, ok(2900))).toBe("GRAND");
    expect(bandFor(balance, ok(3000))).toBe("GRAND");
    expect(bandFor(balance, ok(5000))).toBe("MOYEN");
    expect(bandFor(balance, ok(9000))).toBe("MICRO");
  });
  it("erreur ou timeout = FAIL", () => {
    expect(bandFor(balance, { correct: false, elapsedMs: 1000 })).toBe("FAIL");
    expect(bandFor(balance, { correct: true, elapsedMs: null })).toBe("FAIL");
    expect(bandFor(balance, ok(12500))).toBe("FAIL");
  });
  it("portées par bande", () => {
    expect(rangeFor(balance, "GRAND")).toBe(4);
    expect(rangeFor(balance, "MOYEN")).toBe(2);
    expect(rangeFor(balance, "MICRO")).toBe(1);
    expect(rangeFor(balance, "FAIL")).toBe(0);
  });
});

describe("sauts", () => {
  it("un saut dans la portée est accepté, hors portée il est ignoré", () => {
    let s = createMatch(world, balance, 1);
    const from = s.players[0].cityId;
    const near = world.adj[from][0];
    let far = -1;
    for (let j = 0; j < world.n; j++) if (world.hops[from * world.n + j] >= 3) far = j;
    s = applyAnswers(s, balance, { 0: ok(9000) }); // MICRO : portée 1
    const outOfRange = applyMoves(s, world, balance, { 0: far });
    expect(outOfRange.players[0].cityId).toBe(from);
    const inRange = applyMoves(s, world, balance, { 0: near });
    expect(inRange.players[0].cityId).toBe(near);
  });
  it("une bande FAIL interdit tout saut", () => {
    let s = createMatch(world, balance, 1);
    const from = s.players[0].cityId;
    s = applyAnswers(s, balance, {}); // aucun joueur n'a répondu : FAIL
    const r = applyMoves(s, world, balance, { 0: world.adj[from][0] });
    expect(r.players[0].cityId).toBe(from);
  });
  it("une cible invalide est ignorée", () => {
    let s = createMatch(world, balance, 1);
    s = applyAnswers(s, balance, { 0: ok(1000) });
    const from = s.players[0].cityId;
    expect(applyMoves(s, world, balance, { 0: 9999 }).players[0].cityId).toBe(from);
    expect(applyMoves(s, world, balance, { 0: -3 }).players[0].cityId).toBe(from);
  });
});

describe("Escale : élimination par la zone (SPEC §4)", () => {
  it("sans grâce, un joueur sur ville rouge qui ne bouge pas est éliminé au rétrécissement", () => {
    const { s, z } = atFirstShrink();
    const red = redCity(z);
    const state = withPlayers(s, (_, i) => ({ cityId: i === 0 ? red : safeCity(z), band: "FAIL" as const }));
    const r = applyMoves(state, world, balance, {});
    expect(r.players[0].alive).toBe(false);
    expect(r.players[0].eliminatedBy).toBe("zone");
    expect(r.players[1].alive).toBe(true);
  });

  it("un joueur sur ville rouge qui saute vers une ville sûre à portée est sauvé", () => {
    const { s, z } = atFirstShrink();
    // trouve une ville rouge qui a une ville sûre à ≤ 2 sauts
    let red = -1,
      target = -1;
    for (let i = 0; i < world.n && red < 0; i++) {
      if (z.safe[i] === 1) continue;
      for (let j = 0; j < world.n; j++)
        if (z.safe[j] === 1 && world.hops[i * world.n + j] <= 2) {
          red = i;
          target = j;
          break;
        }
    }
    expect(red).toBeGreaterThanOrEqual(0);
    const state = withPlayers(s, (_, i) => ({ cityId: i === 0 ? red : safeCity(z), band: "MOYEN" as const }));
    const r = applyMoves(state, world, balance, { 0: target });
    expect(r.players[0].alive).toBe(true);
    expect(r.players[0].cityId).toBe(target);
    expect(r.players[0].redRounds).toBe(0);
  });

  it("avec 1 round de grâce : survie au rétrécissement, élimination à la fin du round suivant", () => {
    const b = clone(balance);
    b.zone.graceRounds = 1;
    const { s, z } = atFirstShrink(b);
    const red = redCity(z);
    const state = withPlayers(s, (_, i) => ({ cityId: i === 0 ? red : safeCity(z), band: "FAIL" as const }));
    const r1 = applyMoves(state, world, b, {});
    expect(r1.players[0].alive).toBe(true);
    expect(r1.players[0].redRounds).toBe(1);
    const r2 = applyMoves(r1, world, b, {});
    expect(r2.players[0].alive).toBe(false);
    expect(r2.players[0].eliminatedBy).toBe("zone");
  });

  it("la zone n'élimine jamais tous les survivants en même temps (réprieve)", () => {
    const { s, z } = atFirstShrink();
    const red = redCity(z);
    const state = withPlayers(s, () => ({ cityId: red, band: "FAIL" as const }));
    const r = applyMoves(state, world, balance, {});
    expect(r.players.filter((p) => p.alive).length).toBe(balance.players);
  });

  it("le dernier survivant gagne", () => {
    const { s, z } = atFirstShrink();
    const red = redCity(z);
    const safe = safeCity(z);
    const state = withPlayers(s, (_, i) => ({ cityId: i === 0 ? safe : red, band: "FAIL" as const }));
    const r = applyMoves(state, world, balance, {});
    expect(r.phase).toBe("ENDED");
    expect(r.winnerId).toBe(0);
    expect(r.endReason).toBe("last_survivor");
  });

  it("la prochaine zone est prévisualisée un round avant son application", () => {
    let s = createMatch(world, balance, 4);
    s = { ...s, round: balance.zone.events[0].announce };
    const r = applyMoves(s, world, balance, {});
    expect(r.preview).not.toBeNull();
    expect(r.preview!.applyRound).toBe(balance.zone.events[0].apply);
    expect(r.zone).toBeNull();
  });
});

function finaleState(n = 3): MatchState {
  let s = createMatch(world, balance, 9, n);
  s = withPlayers(s, () => ({ cityId: s.finaleCityId }));
  return { ...s, phase: "FINALE", round: 28, finaleEntrants: n };
}

describe("finale (SPEC §6)", () => {
  it("toute erreur ou timeout élimine immédiatement", () => {
    const r = applyFinaleAnswers(finaleState(), balance, {
      0: ok(3000),
      1: { correct: false, elapsedMs: 2000 },
      2: { correct: true, elapsedMs: null },
    });
    expect(r.players[0].alive).toBe(true);
    expect(r.players[1].alive).toBe(false);
    expect(r.players[2].alive).toBe(false);
    expect(r.phase).toBe("ENDED");
    expect(r.winnerId).toBe(0);
  });

  it("si tous échouent, personne n'est éliminé", () => {
    const r = applyFinaleAnswers(finaleState(), balance, {
      0: { correct: false, elapsedMs: 1000 },
      1: { correct: false, elapsedMs: 1000 },
      2: { correct: false, elapsedMs: 1000 },
    });
    expect(r.players.every((p) => p.alive)).toBe(true);
    expect(r.finaleAllFailStreak).toBe(1);
    expect(r.phase).toBe("FINALE");
  });

  it("si tous répondent juste, la difficulté monte (plafonnée)", () => {
    let s = finaleState();
    const all = { 0: ok(2000), 1: ok(2000), 2: ok(2000) };
    const d0 = s.finaleDifficulty;
    s = applyFinaleAnswers(s, balance, all);
    expect(s.finaleDifficulty).toBe(d0 + 1);
    for (let i = 0; i < 6 && s.phase === "FINALE"; i++) s = applyFinaleAnswers(s, balance, all);
    expect(s.finaleDifficulty).toBeLessThanOrEqual(balance.difficulty.finale.max);
  });

  it("un correct hors fenêtre de finale compte comme une erreur", () => {
    const r = applyFinaleAnswers(finaleState(2), balance, { 0: ok(3000), 1: ok(balance.timing.finaleWindowMs + 500) });
    expect(r.players[1].alive).toBe(false);
    expect(r.winnerId).toBe(0);
  });

  it("filet de sécurité : après trop d'échecs collectifs, le temps cumulé le plus faible gagne", () => {
    let s = finaleState(2);
    for (let i = 0; i < balance.difficulty.finale.maxAllFailStreak + 1; i++)
      s = applyFinaleAnswers(s, balance, {
        0: { correct: false, elapsedMs: 1000 },
        1: { correct: false, elapsedMs: 2000 },
      });
    expect(s.phase).toBe("ENDED");
    expect(s.endReason).toBe("tiebreak");
    expect(s.winnerId).toBe(0);
  });

  it("filet de sécurité : après maxRounds de finale avec plusieurs survivants, départage au temps", () => {
    let s = finaleState(2);
    for (let i = 0; i < balance.difficulty.finale.maxRounds && s.phase === "FINALE"; i++)
      s = applyFinaleAnswers(s, balance, { 0: ok(1500), 1: ok(2500) });
    expect(s.phase).toBe("ENDED");
    expect(s.endReason).toBe("tiebreak");
    expect(s.winnerId).toBe(0);
  });

  it("entre en finale quand tous les survivants sont sur la Ville Finale après la zone finale", () => {
    let s = createMatch(world, balance, 21, 3);
    const lastIdx = balance.zone.events.length - 1;
    s = withPlayers(s, () => ({ cityId: s.finaleCityId, band: "FAIL" as const }));
    s = { ...s, round: balance.zone.events[lastIdx].apply };
    const r = applyMoves(s, world, balance, {});
    expect(r.phase).toBe("FINALE");
    expect(r.finaleEntrants).toBe(3);
  });
});

describe("pureté et déterminisme", () => {
  it("les fonctions ne mutent pas l'état d'entrée", () => {
    const s = createMatch(world, balance, 5);
    const snapshot = JSON.stringify(s.players);
    const s2 = applyAnswers(s, balance, { 0: ok(1000) });
    applyMoves(s2, world, balance, { 0: world.adj[s.players[0].cityId][0] });
    expect(JSON.stringify(s.players)).toBe(snapshot);
  });
  it("même seed = même partie initiale", () => {
    const a = createMatch(world, balance, 123);
    const b = createMatch(world, balance, 123);
    expect(a.finaleCityId).toBe(b.finaleCityId);
    expect(a.players.map((p) => p.cityId)).toEqual(b.players.map((p) => p.cityId));
  });
});
