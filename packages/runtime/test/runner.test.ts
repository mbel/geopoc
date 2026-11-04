import { describe, expect, it } from "vitest";
import { MatchRunner } from "../src";
import { balance, cheatPolicy, makeRunner, play, questions, wanderPolicy, world } from "./helpers";

describe("MatchRunner : démarrage et places libres", () => {
  it("les bots prennent toutes les places restantes : 100 joueurs en vie au départ", () => {
    const r = makeRunner();
    const v = r.viewFor(0, 0);
    expect(v.total).toBe(balance.players);
    expect(v.alive).toBe(balance.players);
    expect(v.phase).toBe("INTRO");
    expect(Object.values(v.cityCounts).reduce((a, b) => a + b, 0)).toBe(balance.players);
  });

  it("plusieurs humains (ids 0..h-1) + bots pour le reste", () => {
    const r = makeRunner({ humans: [{ id: 0, name: "A" }, { id: 1, name: "B" }, { id: 2, name: "C" }] });
    expect(r.viewFor(1, 0).you.name).toBe("B");
    expect(r.viewFor(2, 0).total).toBe(balance.players);
    expect(() => r.viewFor(3, 0)).toThrow();
  });

  it("refuse des identifiants d'humains incohérents", () => {
    expect(() => makeRunner({ humans: [{ id: 5, name: "X" }] })).toThrow();
  });
});

describe("MatchRunner : aucun secret dans les vues", () => {
  it("pendant la question : pas de bonne réponse, pas de Ville Finale", () => {
    const r = makeRunner();
    r.tick(3000); // fin de l'intro
    const v = r.viewFor(0, 3000);
    expect(v.phase).toBe("QUESTION");
    expect(v.question?.options).toHaveLength(4);
    expect(v.reveal).toBeNull();
    expect(v.finaleCityId).toBeNull();
    const json = JSON.stringify(v);
    expect(json).not.toContain("answerIndex");
    expect(json).not.toContain("correctIndex");
  });

  it("la bonne réponse n'est révélée qu'à la phase REVEAL", () => {
    const r = makeRunner();
    r.tick(3000);
    r.answer(0, 1, 3100);
    r.tick(3100); // réponse unique : fin anticipée
    const v = r.viewFor(0, 3100);
    expect(v.phase).toBe("REVEAL");
    expect(v.reveal?.correctIndex).toBeGreaterThanOrEqual(0);
    expect(v.reveal?.yourIndex).toBe(1);
  });

  it("la Ville Finale n'est jamais connue avant l'application de la zone finale", () => {
    const r = makeRunner();
    const { views } = play(r, wanderPolicy);
    const finalApply = balance.zone.events[balance.zone.events.length - 1].apply;
    for (const v of views) {
      if (v.phase !== "ENDED" && !v.zone?.final) expect(v.finaleCityId, `round ${v.round}`).toBeNull();
    }
    expect(finalApply).toBeGreaterThan(0);
  });
});

describe("MatchRunner : réponses et sauts des humains", () => {
  it("une seconde réponse, un index invalide ou une réponse hors phase sont ignorés", () => {
    const r = makeRunner();
    expect(r.answer(0, 0, 100)).toBe(false); // INTRO
    r.tick(3000);
    expect(r.answer(0, 9, 3100)).toBe(false);
    expect(r.answer(0, 2, 3100)).toBe(true);
    expect(r.answer(0, 3, 3200)).toBe(false);
  });

  it("une réponse arrivée après la fenêtre est rejetée", () => {
    const r = makeRunner({ earlyAdvance: false });
    r.tick(3000);
    expect(r.answer(0, 0, 3000 + balance.timing.questionWindowMs + 1)).toBe(false);
  });

  it("la compensation de latence est retranchée du temps de réponse", () => {
    const a = makeRunner({}, 0);
    a.tick(3000);
    a.answer(0, a.peekCorrectIndex(), 3000 + 2500, 0);
    a.tick(3000 + 2500);
    const b = makeRunner({}, 0);
    b.tick(3000);
    b.answer(0, b.peekCorrectIndex(), 3000 + 2500, 400);
    b.tick(3000 + 2500);
    expect(a.viewFor(0, 6000).reveal?.elapsedMs).toBe(2500);
    expect(b.viewFor(0, 6000).reveal?.elapsedMs).toBe(2100);
  });

  it("avec fin anticipée, la question s'arrête dès que l'humain a répondu ; sans, elle attend la fin de la fenêtre", () => {
    const early = makeRunner({ earlyAdvance: true });
    early.tick(3000);
    early.answer(0, 0, 3200);
    early.tick(3200);
    expect(early.viewFor(0, 3200).phase).toBe("REVEAL");

    const late = makeRunner({ earlyAdvance: false });
    late.tick(3000);
    late.answer(0, 0, 3200);
    late.tick(3200);
    expect(late.viewFor(0, 3200).phase).toBe("QUESTION");
    late.tick(3000 + balance.timing.questionWindowMs);
    expect(late.viewFor(0, 20000).phase).toBe("REVEAL");
  });

  it("avec plusieurs humains, la fin anticipée attend TOUS les humains en vie", () => {
    const r = makeRunner({ humans: [{ id: 0, name: "A" }, { id: 1, name: "B" }] });
    r.tick(3000);
    r.answer(0, 0, 3100);
    r.tick(3100);
    expect(r.viewFor(0, 3100).phase).toBe("QUESTION");
    r.answer(1, 0, 3200);
    r.tick(3200);
    expect(r.viewFor(0, 3200).phase).toBe("REVEAL");
  });

  it("une bonne réponse rapide débloque un saut ; un saut hors portée est refusé", () => {
    const r = makeRunner();
    r.tick(3000);
    r.answer(0, r.peekCorrectIndex(), 3500); // < 3 s : bande GRAND
    r.tick(3500);
    r.tick(3500 + balance.timing.revealMs); // → MOVE
    const v = r.viewFor(0, 8000);
    expect(v.phase).toBe("MOVE");
    expect(v.you.band).toBe("GRAND");
    expect(v.you.range).toBe(4);
    expect(v.you.reachable.length).toBeGreaterThan(0);
    const n = world.n;
    const outside = world.cities.find((c) => world.hops[v.you.cityId * n + c.id] > 4 && world.hops[v.you.cityId * n + c.id] !== 255);
    if (outside) expect(r.move(0, outside.id)).toBe(false);
    expect(r.move(0, v.you.reachable[0])).toBe(true);
    expect(r.move(0, null)).toBe(false); // un seul choix par round
  });

  it("une mauvaise réponse (bande FAIL) interdit le saut et n'attend pas le joueur", () => {
    const r = makeRunner();
    r.tick(3000);
    const wrong = (r.peekCorrectIndex() + 1) % 4;
    r.answer(0, wrong, 3500);
    r.tick(3500);
    r.tick(3500 + balance.timing.revealMs); // → MOVE
    const v = r.viewFor(0, 7000);
    expect(v.you.band).toBe("FAIL");
    expect(v.you.reachable).toEqual([]);
    expect(v.you.moved).toBe(true); // déjà « resté sur place » : pas de blocage
  });
});

describe("MatchRunner : partie complète", () => {
  it("une partie complète se termine avec un résultat cohérent", () => {
    const r = makeRunner();
    const { final, endedAt } = play(r, wanderPolicy);
    expect(r.isEnded()).toBe(true);
    expect(final.phase).toBe("ENDED");
    expect(final.result).not.toBeNull();
    expect(final.result!.place).toBeGreaterThanOrEqual(1);
    expect(final.result!.place).toBeLessThanOrEqual(balance.players);
    expect(final.finaleCityId).toBe(final.result!.finaleCityId);
    expect(endedAt).toBeGreaterThan(10_000);
  });

  it("un humain qui triche (toujours juste, instantané) va loin, et la partie finit quand même", () => {
    const r = makeRunner({ seed: 7 });
    const { final } = play(r, cheatPolicy);
    expect(final.phase).toBe("ENDED");
    expect(final.you.correctCount).toBeGreaterThan(10);
  });

  it("déterminisme : même seed + mêmes actions = même vue finale", () => {
    const a = play(makeRunner({ seed: 42 }), wanderPolicy).final;
    const b = play(makeRunner({ seed: 42 }), wanderPolicy).final;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const c = play(makeRunner({ seed: 43 }), wanderPolicy).final;
    expect(JSON.stringify(c)).not.toBe(JSON.stringify(a));
  });

  it("mode spectateur accéléré : une fois le joueur éliminé, la fin de partie est bien plus rapide", () => {
    const idle = () => {}; // humain passif : éliminé par la zone
    for (let seed = 5; seed < 60; seed++) {
      const slow = play(makeRunner({ seed, spectatorSpeed: 1 }), idle);
      if (slow.deathAt === null || slow.endedAt - slow.deathAt < 120_000) continue; // il faut une longue fin de partie pour comparer
      const fast = play(makeRunner({ seed, spectatorSpeed: 0.15 }), idle);
      expect(fast.deathAt).toBe(slow.deathAt); // même partie jusqu'à l'élimination
      expect(fast.endedAt - fast.deathAt!).toBeLessThan((slow.endedAt - slow.deathAt) * 0.5);
      return;
    }
    throw new Error("aucune graine de test avec une longue fin de partie");
  });

  it("aucune question n'est répétée au sein d'une partie tant que le pool le permet", () => {
    const r = makeRunner({ seed: 11 });
    const { views } = play(r, cheatPolicy);
    const ids = views.filter((v) => v.phase === "QUESTION" && v.question).map((v) => v.question!.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("plusieurs humains peuvent jouer la même partie", () => {
    const r = makeRunner({ seed: 21, humans: [{ id: 0, name: "A" }, { id: 1, name: "B" }] });
    const a = play(r, wanderPolicy, 0, 50, 0);
    expect(r.isEnded()).toBe(true);
    const vb = r.viewFor(1, a.endedAt);
    expect(vb.result?.winnerId).toBe(a.final.result?.winnerId);
    expect(vb.you.name).toBe("B");
  });

  it("un seul vainqueur : place 1", () => {
    const r = makeRunner({ seed: 3 });
    play(r, wanderPolicy);
    const s = r.getEngineState();
    const winner = s.players[s.winnerId!];
    expect(winner.alive).toBe(true);
    expect(s.players.filter((p) => p.alive).length).toBe(1);
  });
});

describe("MatchRunner : robustesse", () => {
  it("un gros saut d'horloge enchaîne les phases sans planter", () => {
    const r = makeRunner();
    r.tick(5 * 60_000);
    expect(["QUESTION", "REVEAL", "MOVE", "ZONE", "ENDED"]).toContain(r.viewFor(0, 5 * 60_000).phase);
  });

  it("un humain qui ne joue jamais finit éliminé et la partie va à son terme", () => {
    const r = makeRunner({ seed: 8 });
    const idle = play(r, () => {});
    expect(idle.final.phase).toBe("ENDED");
    expect(idle.final.you.alive).toBe(false);
  });

  it("onChange est notifié à chaque changement de phase", () => {
    const r = makeRunner();
    let n = 0;
    r.onChange(() => n++);
    r.tick(3000);
    r.tick(3000 + balance.timing.questionWindowMs);
    expect(n).toBeGreaterThanOrEqual(2);
  });

  it("le pool de questions est suffisant (≥ 1 question par difficulté 1-6)", () => {
    for (let d = 1; d <= 6; d++) expect(questions.filter((q) => q.difficulty === d).length, `D${d}`).toBeGreaterThan(5);
    expect(new MatchRunner({ world, balance, questions, seed: 1, startAt: 0, humans: [{ id: 0, name: "x" }] })).toBeDefined();
  });
});
