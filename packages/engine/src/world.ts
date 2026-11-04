import { haversine } from "./geo";
import type { Balance } from "./config";
import type { City, Continent, Rarity, World } from "./types";

export type RawCity = [string, string, Continent, number, number, number, Rarity];

export function citiesFromRaw(raw: RawCity[]): City[] {
  return raw.map(([name, country, continent, lat, lng, hub, rarity], id) => ({
    id,
    name,
    country,
    continent,
    lat,
    lng,
    hub: hub === 1,
    rarity,
  }));
}

/** Construit le graphe (voir SPEC §3) puis précalcule distances et sauts. Déterministe. */
export function buildWorld(cities: City[], g: Balance["graph"]): World {
  const n = cities.length;
  const dist = new Float32Array(n * n);
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const d = haversine(cities[i].lat, cities[i].lng, cities[j].lat, cities[j].lng);
      dist[i * n + j] = d;
      dist[j * n + i] = d;
    }

  const edges = new Set<number>();
  const key = (a: number, b: number) => (a < b ? a * n + b : b * n + a);
  const link = (a: number, b: number) => {
    if (a !== b) edges.add(key(a, b));
  };
  const nearest = (from: number, candidates: number[], k: number) =>
    candidates
      .filter((c) => c !== from)
      .sort((a, b) => dist[from * n + a] - dist[from * n + b] || a - b)
      .slice(0, k);

  const all = cities.map((c) => c.id);
  const hubs = cities.filter((c) => c.hub).map((c) => c.id);

  // 1. Arêtes courtes : k plus proches voisins (les océans sont ignorés)
  for (const c of cities) for (const o of nearest(c.id, all, g.knn)) link(c.id, o);

  // 2. Réseau de hubs
  for (const h of hubs) for (const o of nearest(h, hubs, g.hubKnn)) link(h, o);
  if (g.hubInterContinentLinks) {
    const continents = [...new Set(cities.filter((c) => c.hub).map((c) => c.continent))];
    for (const h of hubs)
      for (const cont of continents) {
        if (cont === cities[h].continent) continue;
        const cands = hubs.filter((x) => cities[x].continent === cont);
        for (const o of nearest(h, cands, 1)) link(h, o);
      }
  }

  // 3. Villes isolées : reliées à leurs hubs les plus proches
  for (const c of cities) {
    if (c.hub) continue;
    // « isolée » = sa 2ᵉ ville la plus proche est à plus de isolationKm
    // (une paire de villes isolées, comme Ushuaia + Stanley, l'est quand même)
    const second = nearest(c.id, all, 2)[1];
    if (dist[c.id * n + second] > g.isolationKm)
      for (const h of nearest(c.id, hubs, g.isolatedHubLinks)) link(c.id, h);
  }
  if (g.nearestHubLink)
    for (const c of cities) if (!c.hub) for (const h of nearest(c.id, hubs, 1)) link(c.id, h);

  const toAdj = () => {
    const adj: number[][] = Array.from({ length: n }, () => []);
    for (const e of edges) {
      const a = Math.floor(e / n);
      const b = e % n;
      adj[a].push(b);
      adj[b].push(a);
    }
    for (const l of adj) l.sort((x, y) => x - y);
    return adj;
  };

  // 4. Garantir la connexité : relier les composantes par la paire la plus proche
  let adj = toAdj();
  for (;;) {
    const comp = components(adj);
    if (comp.count === 1) break;
    let best: [number, number] | null = null;
    let bestD = Infinity;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        if (comp.id[i] !== comp.id[j] && dist[i * n + j] < bestD) {
          bestD = dist[i * n + j];
          best = [i, j];
        }
    link(best![0], best![1]);
    adj = toAdj();
  }

  // Sauts de graphe : BFS depuis chaque ville
  const hops = new Uint8Array(n * n).fill(255);
  for (let s = 0; s < n; s++) {
    hops[s * n + s] = 0;
    const queue = [s];
    for (let qi = 0; qi < queue.length; qi++) {
      const u = queue[qi];
      const du = hops[s * n + u];
      for (const v of adj[u])
        if (hops[s * n + v] === 255) {
          hops[s * n + v] = du + 1;
          queue.push(v);
        }
    }
  }
  return { n, cities, adj, hops, dist };
}

function components(adj: number[][]): { count: number; id: number[] } {
  const id = new Array(adj.length).fill(-1);
  let count = 0;
  for (let s = 0; s < adj.length; s++) {
    if (id[s] !== -1) continue;
    id[s] = count;
    const stack = [s];
    while (stack.length) {
      const u = stack.pop()!;
      for (const v of adj[u])
        if (id[v] === -1) {
          id[v] = count;
          stack.push(v);
        }
    }
    count++;
  }
  return { count, id };
}

export interface GraphReport {
  connected: boolean;
  diameter: number;
  reachHops: number;
  reach: number[];
  medianReach: number;
  minReach: number;
  minReachRatio: number;
  minReachCity: string;
  degreeMin: number;
  degreeMax: number;
  edgeCount: number;
  ok: boolean;
  errors: string[];
}

/** Contraintes de validité du graphe (SPEC §3). */
export function validateWorld(world: World, c: Balance["graphConstraints"]): GraphReport {
  const { n, hops, adj, cities } = world;
  let diameter = 0;
  let connected = true;
  const reach: number[] = [];
  for (let i = 0; i < n; i++) {
    let r = 0;
    for (let j = 0; j < n; j++) {
      const h = hops[i * n + j];
      if (h === 255) connected = false;
      else {
        if (h > diameter) diameter = h;
        if (j !== i && h <= c.reachHops) r++;
      }
    }
    reach.push(r);
  }
  const sorted = [...reach].sort((a, b) => a - b);
  const medianReach = sorted[Math.floor(n / 2)];
  const minReach = sorted[0];
  const minReachCity = cities[reach.indexOf(minReach)].name;
  const degrees = adj.map((l) => l.length);
  const errors: string[] = [];
  if (!connected) errors.push("graphe non connexe");
  if (diameter > c.maxDiameter) errors.push(`diamètre ${diameter} > ${c.maxDiameter}`);
  const ratio = minReach / medianReach;
  if (ratio < c.minReachRatio)
    errors.push(
      `équité de portée : ${minReachCity} atteint ${minReach} villes en ${c.reachHops} sauts (${(ratio * 100).toFixed(0)} % de la médiane ${medianReach}, minimum ${(c.minReachRatio * 100).toFixed(0)} %)`,
    );
  return {
    connected,
    diameter,
    reachHops: c.reachHops,
    reach,
    medianReach,
    minReach,
    minReachRatio: ratio,
    minReachCity,
    degreeMin: Math.min(...degrees),
    degreeMax: Math.max(...degrees),
    edgeCount: degrees.reduce((a, b) => a + b, 0) / 2,
    ok: errors.length === 0,
    errors,
  };
}
