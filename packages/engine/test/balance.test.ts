import { describe, expect, it } from "vitest";
import { parseBalance } from "@geoclash/engine";
import v0 from "../../data/balance.v0.json" with { type: "json" };
import v1 from "../../data/balance.v1.json" with { type: "json" };
import { balance, clone } from "./helpers";

describe("configuration d'équilibrage", () => {
  for (const [f, raw] of [["balance.v0.json", v0], ["balance.v1.json", v1]] as const) {
    it(`${f} respecte le schéma`, () => {
      expect(() => parseBalance(raw)).not.toThrow();
    });
  }
  it("rejette une config invalide", () => {
    const bad = clone(balance) as any;
    bad.timing.questionWindowMs = -1;
    expect(() => parseBalance(bad)).toThrow();
  });
  it("rejette un événement de zone incohérent (announce >= apply)", () => {
    const bad = clone(balance) as any;
    bad.zone.events[0].announce = bad.zone.events[0].apply;
    expect(() => parseBalance(bad)).toThrow();
  });
  it("calendrier de zone cohérent : annonces avant application, applications croissantes, finale en dernier", () => {
    const ev = balance.zone.events;
    for (let i = 0; i < ev.length; i++) {
      expect(ev[i].announce).toBeLessThan(ev[i].apply);
      if (i > 0) expect(ev[i].apply).toBeGreaterThan(ev[i - 1].apply);
      expect(Boolean(ev[i].final)).toBe(i === ev.length - 1);
    }
  });
  it("les fractions de zone sont décroissantes", () => {
    const fr = balance.zone.events.filter((e) => e.safeFraction !== undefined).map((e) => e.safeFraction!);
    for (let i = 1; i < fr.length; i++) expect(fr[i]).toBeLessThan(fr[i - 1]);
  });
  it("le calendrier de difficulté couvre tous les rounds", () => {
    const s = balance.difficulty.schedule;
    expect(s[0].from).toBe(1);
    for (let i = 1; i < s.length; i++) expect(s[i].from).toBe(s[i - 1].to + 1);
  });
  it("les bandes de vitesse sont ordonnées et couvrent la fenêtre de réponse", () => {
    const b = balance.bands;
    for (let i = 1; i < b.length; i++) {
      expect(b[i].maxMs).toBeGreaterThan(b[i - 1].maxMs);
      expect(b[i].range).toBeLessThanOrEqual(b[i - 1].range);
    }
    expect(b[b.length - 1].maxMs).toBe(balance.timing.questionWindowMs);
  });
});
