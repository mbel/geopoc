import { readFileSync } from "node:fs";
import { getBalance, getWorld } from "@geoclash/data";
import { parseBalance, validateWorld } from "@geoclash/engine";

const file = process.argv[2];
const balance = file ? parseBalance(JSON.parse(readFileSync(file, "utf8"))) : getBalance("v1");
const world = getWorld(balance);
const r = validateWorld(world, balance.graphConstraints);
console.log(
  `Graphe : ${world.n} villes, ${r.edgeCount} arêtes, degré ${r.degreeMin}-${r.degreeMax}, diamètre ${r.diameter}`,
);
console.log(
  `Portée à ${r.reachHops} sauts : médiane ${r.medianReach}, min ${r.minReach} (${r.minReachCity}), ratio ${(r.minReachRatio * 100).toFixed(0)} %`,
);
if (!r.ok) {
  console.error("ÉCHEC de validation du graphe :");
  for (const e of r.errors) console.error(" - " + e);
  process.exit(1);
}
console.log("OK : toutes les contraintes du graphe sont respectées.");
