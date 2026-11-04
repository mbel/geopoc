import { describe, expect, it } from "vitest";
import { createMatch } from "@geoclash/engine";
import { computeZone } from "@geoclash/engine";
import { balance, world } from "./helpers";

describe("zone (SPEC §4)", () => {
  const events = balance.zone.events;

  it("invariant : la Ville Finale est TOUJOURS dans la zone, à chaque événement et pour 200 parties", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const s = createMatch(world, balance, seed);
      events.forEach((_, i) => {
        const z = computeZone(world, s.finaleCityId, s.plan, events, i, events[i].apply, balance.zone.offsetRatio);
        expect(z.safe[s.finaleCityId], `seed ${seed} event ${i}`).toBe(1);
      });
    }
  });

  it("la zone ne grandit jamais : nombre de villes sûres décroissant (± arrondi)", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = createMatch(world, balance, seed);
      let prev = Infinity;
      events.forEach((_, i) => {
        const z = computeZone(world, s.finaleCityId, s.plan, events, i, events[i].apply, balance.zone.offsetRatio);
        expect(z.safeCount).toBeLessThanOrEqual(prev + 3);
        prev = z.safeCount;
      });
    }
  });

  it("l'événement final ne laisse que la Ville Finale", () => {
    const s = createMatch(world, balance, 5);
    const i = events.length - 1;
    const z = computeZone(world, s.finaleCityId, s.plan, events, i, events[i].apply, balance.zone.offsetRatio);
    expect(z.final).toBe(true);
    expect(z.safeCount).toBe(1);
    expect(z.safe[s.finaleCityId]).toBe(1);
  });

  it("le nombre de villes sûres suit la fraction demandée (≈)", () => {
    const s = createMatch(world, balance, 11);
    const z = computeZone(world, s.finaleCityId, s.plan, events, 0, events[0].apply, balance.zone.offsetRatio);
    const expected = Math.round(events[0].safeFraction! * world.n);
    expect(Math.abs(z.safeCount - expected)).toBeLessThanOrEqual(6);
  });

  it("calcul déterministe", () => {
    const s = createMatch(world, balance, 3);
    const a = computeZone(world, s.finaleCityId, s.plan, events, 2, events[2].apply, balance.zone.offsetRatio);
    const b = computeZone(world, s.finaleCityId, s.plan, events, 2, events[2].apply, balance.zone.offsetRatio);
    expect(Array.from(a.safe)).toEqual(Array.from(b.safe));
  });
});
