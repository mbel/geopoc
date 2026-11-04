import { describe, expect, it } from "vitest";
import { botThresholds, makeBots, pCorrect } from "@geoclash/runtime";
import { playMatch, runSimulation } from "../src/simulate";
import { buildReport } from "../src/report";
import { balance, world } from "../../engine/test/helpers";

describe("modèle de bots (P0-4)", () => {
  it("taux de réussite de la population dans ±3 pts des cibles, par difficulté", () => {
    const bots = makeBots(20000, 2024, balance);
    for (const [d, target] of Object.entries(balance.bots.successTargets)) {
      const mean = bots.reduce((a, b) => a + pCorrect(balance, b.skill, Number(d)), 0) / bots.length;
      expect(Math.abs(mean - target), `D${d}`).toBeLessThanOrEqual(balance.targets.successTolerance);
    }
  });
  it("les seuils croissent avec la difficulté", () => {
    const t = botThresholds(balance);
    const ds = Object.keys(t).map(Number).sort((a, b) => a - b);
    for (let i = 1; i < ds.length; i++) expect(t[String(ds[i])]).toBeGreaterThan(t[String(ds[i - 1])]);
  });
  it("un meilleur bot réussit plus souvent", () => {
    expect(pCorrect(balance, 0.9, 3)).toBeGreaterThan(pCorrect(balance, 0.2, 3));
  });
});

describe("simulateur (P0-5)", () => {
  it("rejoue une partie à l'identique avec la même seed", () => {
    const a = playMatch(world, balance, 99);
    const b = playMatch(world, balance, 99);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it("des seeds différentes donnent des parties différentes", () => {
    expect(JSON.stringify(playMatch(world, balance, 1))).not.toBe(JSON.stringify(playMatch(world, balance, 2)));
  });
  it("30 parties se terminent, avec un vainqueur et tous les joueurs comptabilisés", () => {
    const res = runSimulation(world, balance, 30, 5);
    for (const r of res) {
      expect(r.winnerId).toBeGreaterThanOrEqual(0);
      expect(r.elimByZone + r.elimByFinale + r.elimByCap + 1).toBe(balance.players);
      expect(r.durationSec).toBeGreaterThan(200);
      expect(r.durationSec).toBeLessThan(900);
    }
  });
  it("les parties ne dépassent jamais le garde-fou de rounds", () => {
    const res = runSimulation(world, balance, 30, 6);
    for (const r of res) expect(r.rounds).toBeLessThanOrEqual(balance.zone.maxRounds);
  });
  it("le rapport agrège les résultats et évalue les cibles", () => {
    const res = runSimulation(world, balance, 40, 8);
    const rep = buildReport(res, balance, world, 8);
    expect(rep.games).toBe(40);
    expect(rep.checks.length).toBeGreaterThan(5);
    expect(rep.aliveAtRound["5"]).toBeCloseTo(100, 0);
  });
});
