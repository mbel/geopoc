import type { Rng } from "@geoclash/engine";

/** Question « brute » avant mise en forme : la bonne réponse + 3 distracteurs. */
export interface Gen {
  category: string;
  difficulty: number;
  question: string;
  correct: string;
  wrong: string[];
  tags?: string[];
}

/** Ligne écrite à la main : [catégorie, difficulté, question, bonne réponse, faux 1, faux 2, faux 3] */
export type Row = [category: string, difficulty: number, question: string, correct: string, w1: string, w2: string, w3: string];

export const fromRows = (rows: Row[]): Gen[] =>
  rows.map(([category, difficulty, question, correct, ...wrong]) => ({ category, difficulty, question, correct, wrong }));

export const capFirst = (s: string) => (s.length ? s[0].toUpperCase() + s.slice(1) : s);

/** « du Japon » → « Japon », « de la France » → « France », « des États-Unis » → « États-Unis ». */
export function stripArticle(prep: string): string {
  const m = /^(?:du |de la |de l'|des |d')(.+)$/.exec(prep);
  return capFirst(m ? m[1] : prep);
}

/** Tire n éléments distincts (sans remise) parmi `arr`, en excluant ceux qui satisfont `skip`. */
export function sample<T>(rng: Rng, arr: T[], n: number, skip: (x: T) => boolean = () => false): T[] {
  const pool = arr.filter((x) => !skip(x));
  const out: T[] = [];
  const idx = pool.map((_, i) => i);
  while (out.length < n && idx.length) {
    const k = rng.int(idx.length);
    out.push(pool[idx[k]]);
    idx.splice(k, 1);
  }
  return out;
}

/** Distracteurs : n valeurs distinctes de la bonne réponse, tirées dans `pool`. */
export function distract(rng: Rng, pool: string[], correct: string, n = 3): string[] {
  const norm = (s: string) => s.trim().toLowerCase();
  const uniq = [...new Set(pool.map((p) => p.trim()))].filter((p) => norm(p) !== norm(correct));
  return sample(rng, uniq, n);
}
