import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { getBalance, getWorld } from "@geoclash/data";
import { parseBalance, validateWorld } from "@geoclash/engine";
import { buildReport, reportToMarkdown } from "./report";
import { runSimulation } from "./simulate";

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf("--" + name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith("--") ? "true" : v;
}

const games = Number(arg("games", "1000"));
const seed = Number(arg("seed", "42"));
const balanceFile = arg("balance") ? resolve(arg("balance")!) : null;
const outDir = arg("out") ? resolve(arg("out")!) : fileURLToPath(new URL("../../../reports", import.meta.url));
const check = arg("check") === "true";

const balance = balanceFile ? parseBalance(JSON.parse(readFileSync(balanceFile, "utf8"))) : getBalance("v1");
const world = getWorld(balance);
const g = validateWorld(world, balance.graphConstraints);
if (!g.ok) {
  console.error("Graphe invalide : " + g.errors.join(" ; "));
  process.exit(1);
}

const t0 = Date.now();
const results = runSimulation(world, balance, games, seed);
const report = buildReport(results, balance, world, seed);
const secs = ((Date.now() - t0) / 1000).toFixed(1);

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "report.json"), JSON.stringify(report, null, 2));
writeFileSync(resolve(outDir, "report.md"), reportToMarkdown(report));

console.log(`${games} parties simulées en ${secs} s (balance ${balance.version}, seed ${seed})`);
for (const c of report.checks) console.log(`${c.pass ? "✅" : "❌"} ${c.name} : ${c.value}  (cible ${c.target})`);
console.log(`Rapport : ${resolve(outDir, "report.md")}`);
if (check && !report.pass) {
  console.error("Cibles non atteintes.");
  process.exit(1);
}
