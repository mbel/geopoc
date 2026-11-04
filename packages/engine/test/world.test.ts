import { describe, expect, it } from "vitest";
import { buildWorld, validateWorld } from "@geoclash/engine";
import { cities } from "@geoclash/data";
import rawCities from "../../data/cities.json" with { type: "json" };
import { balance, world } from "./helpers";

describe("données des villes", () => {
  const raw = rawCities as unknown as unknown[][];
  it("150 villes, noms uniques, coordonnées valides", () => {
    expect(raw.length).toBe(150);
    expect(new Set(raw.map((c) => c[0])).size).toBe(150);
    for (const c of raw) {
      expect(c[3] as number).toBeGreaterThanOrEqual(-90);
      expect(c[3] as number).toBeLessThanOrEqual(90);
      expect(c[4] as number).toBeGreaterThanOrEqual(-180);
      expect(c[4] as number).toBeLessThanOrEqual(180);
    }
  });
  it("une vingtaine de hubs", () => {
    const hubs = raw.filter((c) => c[5] === 1).length;
    expect(hubs).toBeGreaterThanOrEqual(18);
    expect(hubs).toBeLessThanOrEqual(25);
  });
});

describe("graphe (SPEC §3)", () => {
  it("respecte les contraintes de validité (connexe, diamètre, équité de portée)", () => {
    const r = validateWorld(world, balance.graphConstraints);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });
  it("aucune ville n'a moins de 3 liens", () => {
    expect(Math.min(...world.adj.map((l) => l.length))).toBeGreaterThanOrEqual(3);
  });
  it("les îles isolées sont reliées à au moins 2 hubs", () => {
    for (const name of ["Hanga Roa", "Jamestown", "Stanley", "Tarawa", "Longyearbyen", "Honolulu"]) {
      const c = world.cities.find((x) => x.name === name)!;
      const hubLinks = world.adj[c.id].filter((j) => world.cities[j].hub).length;
      expect(hubLinks, name).toBeGreaterThanOrEqual(c.hub ? 0 : 2);
    }
  });
  it("est déterministe", () => {
    const w2 = buildWorld(cities, balance.graph);
    expect(w2.adj).toEqual(world.adj);
  });
  it("la matrice de sauts est symétrique", () => {
    const n = world.n;
    for (let i = 0; i < n; i += 7) for (let j = 0; j < n; j += 5) expect(world.hops[i * n + j]).toBe(world.hops[j * n + i]);
  });
  it("une contrainte violée est détectée (graphe trop clairsemé)", () => {
    const sparse = buildWorld(cities, { ...balance.graph, nearestHubLink: false, hubKnn: 3 });
    const r = validateWorld(sparse, balance.graphConstraints);
    expect(r.ok).toBe(false);
  });
});
