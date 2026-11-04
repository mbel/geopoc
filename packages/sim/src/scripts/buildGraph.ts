import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getBalance, getWorld } from "@geoclash/data";

const balance = getBalance("v1");
const world = getWorld(balance);
const out = {
  version: balance.version,
  generatedFrom: "cities.json + balance.graph",
  cities: world.cities.map((c) => ({
    id: c.id, name: c.name, country: c.country, continent: c.continent,
    lat: c.lat, lng: c.lng, hub: c.hub, rarity: c.rarity, neighbors: world.adj[c.id],
  })),
};
const target = fileURLToPath(new URL("../../../data/graph.json", import.meta.url));
writeFileSync(target, JSON.stringify(out));
console.log(`packages/data/graph.json écrit (${out.cities.length} villes).`);
