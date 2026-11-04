/**
 * Génère packages/data/questions.fr.json à partir des tables de faits (questions-src/*.ts).
 *   npm run questions:build -w @geoclash/data
 * Déterministe (RNG à graine fixe) : relancer produit exactement le même fichier.
 * Toutes les questions générées sont en statut « draft » : à vérifier avant publication.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Rng } from "@geoclash/engine";
import { generateGeo } from "./geo";
import { generateArts } from "./arts";
import { generateCulture } from "./culture";
import { generateFood } from "./food";
import { generateHistoire } from "./histoire";
import { generateNature } from "./nature";
import { generatePop } from "./pop";
import { generateScience } from "./science";
import { generateSport } from "./sport";
import { generateTechno } from "./techno";
import type { Gen } from "./lib";

const CATEGORIES = new Set(["geo", "sciences", "histoire", "arts", "sport", "culture", "nature", "gastronomie", "techno", "culture_pop"]);
/** Part maximale de la géographie dans le pool (le jeu limite aussi la géo par partie). */
const GEO_MAX_SHARE = 0.28;

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const rng = new Rng(20261102);

interface Out {
  id: string;
  lang: "fr";
  category: string;
  difficulty: number;
  question: string;
  options: string[];
  answerIndex: number;
  tags: string[];
  news: boolean;
  expiresAt: null;
  status: "draft";
}

const seed = JSON.parse(readFileSync(here("./seed.json"), "utf8")) as (Out & { id: string })[];
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const seen = new Set(seed.map((q) => norm(q.question)));

const generators: [string, (r: Rng) => Gen[]][] = [
  ["geo", generateGeo],
  ["sciences", generateScience],
  ["histoire", generateHistoire],
  ["culture", generateCulture],
  ["arts", generateArts],
  ["sport", generateSport],
  ["nature", generateNature],
  ["gastronomie", generateFood],
  ["techno", generateTechno],
  ["culture_pop", generatePop],
];

const problems: string[] = [];
let gens: Gen[] = [];
for (const [name, fn] of generators) {
  const list = fn(rng);
  console.log(`  ${name.padEnd(10)} ${list.length} questions générées`);
  gens.push(...list);
}

// validation + dédoublonnage
const ok: Gen[] = [];
for (const g of gens) {
  const opts = [g.correct, ...g.wrong].map((o) => o.trim());
  if (!CATEGORIES.has(g.category)) problems.push(`catégorie inconnue : ${g.category} (${g.question})`);
  else if (g.difficulty < 1 || g.difficulty > 6) problems.push(`difficulté invalide : ${g.question}`);
  else if (g.wrong.length !== 3) problems.push(`moins de 3 distracteurs : ${g.question}`);
  else if (new Set(opts.map(norm)).size !== 4 || opts.some((o) => !o)) problems.push(`options non distinctes : ${g.question}`);
  else if (!g.question.trim().endsWith("?")) problems.push(`la question ne finit pas par « ? » : ${g.question}`);
  else if (g.question.length > 220 || opts.some((o) => o.length > 80)) problems.push(`trop long : ${g.question}`);
  else if (seen.has(norm(g.question))) problems.push(`doublon ignoré : ${g.question}`);
  else {
    seen.add(norm(g.question));
    ok.push(g);
  }
}

// plafond de la géographie (reproductible : échantillon à graine fixe)
const nonGeo = ok.filter((g) => g.category !== "geo");
const geo = ok.filter((g) => g.category === "geo");
const maxGeo = Math.floor((GEO_MAX_SHARE / (1 - GEO_MAX_SHARE)) * (nonGeo.length + seed.filter((q) => q.category !== "geo").length)) - seed.filter((q) => q.category === "geo").length;
let keptGeo = geo;
if (geo.length > maxGeo) {
  const idx = geo.map((_, i) => i);
  const keep = new Set<number>();
  while (keep.size < Math.max(0, maxGeo)) keep.add(idx.splice(rng.int(idx.length), 1)[0]);
  keptGeo = geo.filter((_, i) => keep.has(i));
  console.log(`  geo : ${geo.length} → ${keptGeo.length} (plafond de ${Math.round(GEO_MAX_SHARE * 100)} % du pool)`);
}
const finalGens = [...nonGeo, ...keptGeo].sort(
  (a, b) => a.category.localeCompare(b.category) || a.difficulty - b.difficulty || a.question.localeCompare(b.question),
);

let n = 100;
const generated: Out[] = finalGens.map((g) => {
  const options = [g.correct, ...g.wrong];
  // mélange à graine fixe : la bonne réponse n'est pas toujours en tête dans le fichier
  for (let i = options.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [options[i], options[j]] = [options[j], options[i]];
  }
  return {
    id: `q_${String(n++).padStart(4, "0")}`,
    lang: "fr",
    category: g.category,
    difficulty: g.difficulty,
    question: g.question,
    options,
    answerIndex: options.indexOf(g.correct),
    tags: g.tags ?? [],
    news: false,
    expiresAt: null,
    status: "draft",
  };
});

const all = [...seed, ...generated];
writeFileSync(here("../questions.fr.json"), JSON.stringify(all, null, 1) + "\n");

const by = <K extends string | number>(f: (q: Out) => K) => {
  const m: Record<string, number> = {};
  for (const q of all) m[String(f(q))] = (m[String(f(q))] ?? 0) + 1;
  return m;
};
console.log(`\n${all.length} questions écrites dans questions.fr.json`);
console.log("par catégorie :", JSON.stringify(by((q) => q.category)));
console.log("par difficulté :", JSON.stringify(by((q) => q.difficulty)));
// contrôle de fuite : la bonne réponse ne doit pas apparaître dans l'énoncé
const flat = (s: string) => ` ${s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim()} `;
for (const q of generated) {
  const c = flat(q.options[q.answerIndex]);
  if (c.trim().length >= 5 && flat(q.question).includes(c)) problems.push(`fuite de la réponse dans l'énoncé : ${q.question} → ${q.options[q.answerIndex]}`);
}
if (problems.length) {
  console.log(`\n${problems.length} problème(s) détecté(s) (questions ignorées) :`);
  for (const p of problems.slice(0, 25)) console.log(" - " + p);
}
