import type { Balance } from "@geoclash/engine";
import type { World } from "@geoclash/engine";
import type { MatchResult } from "./simulate";

export interface Check {
  name: string;
  value: string;
  target: string;
  pass: boolean;
}

export interface Report {
  balanceVersion: string;
  games: number;
  seed: number;
  duration: { medianMin: number; meanMin: number; p5Min: number; p95Min: number; shareOver12Min: number };
  aliveAtRound: Record<string, number>;
  finale: { reachedShare: number; entrantsMedian: number | null; entrantsMean: number | null; roundsMedian: number; roundsP95: number };
  endReasons: Record<string, number>;
  eliminationsPerGame: { zone: number; finale: number; cap: number };
  continents: { continent: string; spawns: number; wins: number; winRate: number; ratio: number }[];
  observedSuccess: Record<string, { attempts: number; rate: number }>;
  bands: Record<string, number>;
  topFinaleCities: { name: string; share: number }[];
  checks: Check[];
  pass: boolean;
}

const quantile = (xs: number[], q: number) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

export function buildReport(results: MatchResult[], b: Balance, world: World, seed: number): Report {
  const games = results.length;
  const mins = results.map((r) => r.durationSec / 60);
  const t = b.targets;

  const aliveAt = (k: number) =>
    mean(results.map((r) => r.aliveAfterRound[Math.min(k, r.aliveAfterRound.length) - 1] ?? 1));
  const aliveAtRound: Record<string, number> = {};
  for (const k of Object.keys(t.aliveAtRound)) aliveAtRound[k] = aliveAt(Number(k));

  const withFinale = results.filter((r) => r.finaleEntrants !== null);
  const entrants = withFinale.map((r) => r.finaleEntrants as number);
  const finRounds = withFinale.map((r) => r.finaleRounds);

  const endReasons: Record<string, number> = {};
  for (const r of results) endReasons[r.endReason] = (endReasons[r.endReason] ?? 0) + 1;

  // Équité de spawn : taux de victoire par continent d'apparition / taux global
  const spawns: Record<string, number> = {};
  const wins: Record<string, number> = {};
  for (const r of results) {
    for (const [c, n] of Object.entries(r.spawnByContinent)) spawns[c] = (spawns[c] ?? 0) + n;
    wins[r.winnerSpawnContinent] = (wins[r.winnerSpawnContinent] ?? 0) + 1;
  }
  const totalSpawns = Object.values(spawns).reduce((a, c) => a + c, 0);
  const globalRate = games / totalSpawns;
  const continents = Object.keys(spawns)
    .sort()
    .map((c) => {
      const winRate = (wins[c] ?? 0) / spawns[c];
      return { continent: c, spawns: spawns[c], wins: wins[c] ?? 0, winRate, ratio: winRate / globalRate };
    });

  const observedSuccess: Report["observedSuccess"] = {};
  const agg: Record<string, [number, number]> = {};
  for (const r of results)
    for (const [d, [n, c]] of Object.entries(r.answers)) {
      const e = (agg[d] ??= [0, 0]);
      e[0] += n;
      e[1] += c;
    }
  for (const [d, [n, c]] of Object.entries(agg)) observedSuccess[d] = { attempts: n, rate: c / n };

  const bands: Record<string, number> = {};
  let bandTotal = 0;
  for (const r of results) for (const [k, v] of Object.entries(r.bands)) (bands[k] = (bands[k] ?? 0) + v), (bandTotal += v);
  for (const k of Object.keys(bands)) bands[k] /= bandTotal;

  const fc: Record<number, number> = {};
  for (const r of results) fc[r.finaleCityId] = (fc[r.finaleCityId] ?? 0) + 1;
  const topFinaleCities = Object.entries(fc)
    .sort((a, c) => c[1] - a[1])
    .slice(0, 5)
    .map(([id, n]) => ({ name: world.cities[Number(id)].name, share: n / games }));

  const report: Report = {
    balanceVersion: b.version,
    games,
    seed,
    duration: {
      medianMin: quantile(mins, 0.5),
      meanMin: mean(mins),
      p5Min: quantile(mins, 0.05),
      p95Min: quantile(mins, 0.95),
      shareOver12Min: mins.filter((m) => m > 12).length / games,
    },
    aliveAtRound,
    finale: {
      reachedShare: withFinale.length / games,
      entrantsMedian: entrants.length ? quantile(entrants, 0.5) : null,
      entrantsMean: entrants.length ? mean(entrants) : null,
      roundsMedian: finRounds.length ? quantile(finRounds, 0.5) : NaN,
      roundsP95: finRounds.length ? quantile(finRounds, 0.95) : NaN,
    },
    endReasons,
    eliminationsPerGame: {
      zone: mean(results.map((r) => r.elimByZone)),
      finale: mean(results.map((r) => r.elimByFinale)),
      cap: mean(results.map((r) => r.elimByCap)),
    },
    continents,
    observedSuccess,
    bands,
    topFinaleCities,
    checks: [],
    pass: false,
  };

  const f1 = (x: number) => x.toFixed(1);
  const inRange = (x: number, [lo, hi]: [number, number]) => x >= lo && x <= hi;
  const checks: Check[] = [];
  checks.push({
    name: "Durée médiane (min)",
    value: f1(report.duration.medianMin),
    target: `${t.durationMinutes[0]}-${t.durationMinutes[1]}`,
    pass: inRange(report.duration.medianMin, t.durationMinutes),
  });
  for (const [k, target] of Object.entries(t.aliveAtRound))
    checks.push({
      name: `Joueurs en vie fin du round ${k}`,
      value: f1(aliveAtRound[k]),
      target: `${target} ± ${t.aliveTolerance}`,
      pass: Math.abs(aliveAtRound[k] - target) <= t.aliveTolerance,
    });
  checks.push({
    name: "Survivants à l'entrée de la finale (médiane)",
    value: report.finale.entrantsMedian === null ? "aucune finale" : f1(report.finale.entrantsMedian),
    target: `${t.finaleEntrants[0]}-${t.finaleEntrants[1]}`,
    pass: report.finale.entrantsMedian !== null && inRange(report.finale.entrantsMedian, t.finaleEntrants),
  });
  checks.push({
    name: "Rounds de finale (médiane)",
    value: Number.isNaN(report.finale.roundsMedian) ? "n/a" : f1(report.finale.roundsMedian),
    target: `${t.finaleRounds[0]}-${t.finaleRounds[1]}`,
    pass: !Number.isNaN(report.finale.roundsMedian) && inRange(report.finale.roundsMedian, t.finaleRounds),
  });
  const worst = continents.reduce((w, c) => (Math.abs(c.ratio - 1) > Math.abs(w.ratio - 1) ? c : w), continents[0]);
  checks.push({
    name: "Équité de spawn : pire écart continent",
    value: `${worst.continent} ${(worst.ratio * 100 - 100 >= 0 ? "+" : "")}${(worst.ratio * 100 - 100).toFixed(0)} %`,
    target: `± ${(t.continentTolerance * 100).toFixed(0)} %`,
    pass: continents.every((c) => Math.abs(c.ratio - 1) <= t.continentTolerance),
  });
  checks.push({
    name: "Parties de plus de 12 min",
    value: `${(report.duration.shareOver12Min * 100).toFixed(1)} %`,
    target: `< ${(t.maxShareOver12Min * 100).toFixed(0)} %`,
    pass: report.duration.shareOver12Min < t.maxShareOver12Min,
  });
  report.checks = checks;
  report.pass = checks.every((c) => c.pass);
  return report;
}

export function reportToMarkdown(r: Report): string {
  const pct = (x: number) => (x * 100).toFixed(1) + " %";
  const L: string[] = [];
  L.push(`# Rapport de simulation — balance ${r.balanceVersion}`);
  L.push("");
  L.push(`${r.games} parties, seed ${r.seed}. **Résultat global : ${r.pass ? "TOUTES LES CIBLES ATTEINTES ✅" : "cibles non atteintes ❌"}**`);
  L.push("");
  L.push("## Contrôles vs cibles");
  L.push("");
  L.push("| Indicateur | Mesuré | Cible | OK |");
  L.push("|---|---|---|---|");
  for (const c of r.checks) L.push(`| ${c.name} | ${c.value} | ${c.target} | ${c.pass ? "✅" : "❌"} |`);
  L.push("");
  L.push("## Durée");
  L.push("");
  L.push(
    `Médiane ${r.duration.medianMin.toFixed(1)} min, moyenne ${r.duration.meanMin.toFixed(1)}, p5 ${r.duration.p5Min.toFixed(1)}, p95 ${r.duration.p95Min.toFixed(1)}.`,
  );
  L.push("");
  L.push("## Courbe d'élimination (joueurs en vie en moyenne)");
  L.push("");
  L.push("| Fin du round | En vie |");
  L.push("|---|---|");
  for (const [k, v] of Object.entries(r.aliveAtRound)) L.push(`| ${k} | ${v.toFixed(1)} |`);
  L.push("");
  L.push("## Finale");
  L.push("");
  L.push(
    `Atteinte dans ${pct(r.finale.reachedShare)} des parties. Entrants : médiane ${r.finale.entrantsMedian ?? "n/a"}, moyenne ${r.finale.entrantsMean?.toFixed(1) ?? "n/a"}. Rounds de finale : médiane ${r.finale.roundsMedian}, p95 ${r.finale.roundsP95}.`,
  );
  L.push("");
  L.push(`Fins de partie : ${Object.entries(r.endReasons).map(([k, v]) => `${k} ${v}`).join(", ")}.`);
  L.push("");
  L.push(
    `Éliminations par partie : zone ${r.eliminationsPerGame.zone.toFixed(1)}, finale ${r.eliminationsPerGame.finale.toFixed(1)}, départage ${r.eliminationsPerGame.cap.toFixed(1)}.`,
  );
  L.push("");
  L.push("## Équité de spawn par continent");
  L.push("");
  L.push("| Continent | Apparitions | Victoires | Taux de victoire | Ratio vs moyenne |");
  L.push("|---|---|---|---|---|");
  for (const c of r.continents)
    L.push(`| ${c.continent} | ${c.spawns} | ${c.wins} | ${pct(c.winRate)} | ${c.ratio.toFixed(2)} |`);
  L.push("");
  L.push("## Taux de réussite observés en partie (biais de survie : les meilleurs restent)");
  L.push("");
  L.push("| Difficulté | Tentatives | Réussite |");
  L.push("|---|---|---|");
  for (const [d, v] of Object.entries(r.observedSuccess).sort()) L.push(`| D${d} | ${v.attempts} | ${pct(v.rate)} |`);
  L.push("");
  L.push("## Bandes de vitesse (réponses de joueurs en vie)");
  L.push("");
  L.push(Object.entries(r.bands).map(([k, v]) => `${k} ${pct(v)}`).join(" · "));
  L.push("");
  L.push("## Villes finales les plus tirées");
  L.push("");
  L.push(r.topFinaleCities.map((c) => `${c.name} ${pct(c.share)}`).join(" · "));
  L.push("");
  return L.join("\n");
}
