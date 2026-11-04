import { describe, expect, it } from "vitest";
import { Rng, mixSeed } from "@geoclash/engine";
import { destination, haversine } from "@geoclash/engine";

describe("Rng", () => {
  it("est déterministe pour une seed donnée", () => {
    const a = new Rng(123);
    const b = new Rng(123);
    for (let i = 0; i < 50; i++) expect(a.next()).toBe(b.next());
  });
  it("donne des suites différentes pour des seeds différentes", () => {
    expect(new Rng(1).next()).not.toBe(new Rng(2).next());
  });
  it("int() reste dans [0, n)", () => {
    const r = new Rng(9);
    for (let i = 0; i < 1000; i++) {
      const v = r.int(7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(7);
    }
  });
  it("mixSeed dérive des seeds distinctes", () => {
    expect(mixSeed(1, 1)).not.toBe(mixSeed(1, 2));
  });
  it("mixSeed : aucune collision sur 10 seeds × 1000 indices (régression : seeds proches = mêmes parties)", () => {
    const seen = new Set<number>();
    for (let a = 1; a <= 10; a++) for (let b = 1; b <= 1000; b++) seen.add(mixSeed(a, b));
    expect(seen.size).toBe(10000);
  });
  it("l'état est reprenable (pureté)", () => {
    const a = new Rng(5);
    a.next();
    const b = new Rng(a.state);
    expect(b.next()).toBe(a.next());
  });
});

describe("geo", () => {
  it("Paris–Londres ≈ 344 km", () => {
    expect(haversine(48.86, 2.35, 51.51, -0.13)).toBeGreaterThan(335);
    expect(haversine(48.86, 2.35, 51.51, -0.13)).toBeLessThan(352);
  });
  it("destination() est cohérente avec haversine()", () => {
    const p = destination(10, 20, 1.2, 3000);
    expect(haversine(10, 20, p.lat, p.lng)).toBeCloseTo(3000, -1);
  });
});
