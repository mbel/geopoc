import { z } from "zod";
import type { Rng } from "@geoclash/engine";

export const QuestionSchema = z
  .object({
    id: z.string().min(1),
    lang: z.string().min(2),
    category: z.string().min(2),
    difficulty: z.number().int().min(1).max(7),
    question: z.string().min(5),
    options: z.array(z.string().min(1)).length(4),
    /** Index de la bonne réponse dans `options` (l'ordre est mélangé à l'envoi). */
    answerIndex: z.number().int().min(0).max(3),
    tags: z.array(z.string()).default([]),
    news: z.boolean().default(false),
    expiresAt: z.string().nullable().default(null),
    status: z.enum(["draft", "verified", "live", "flagged", "retired"]).default("draft"),
  })
  .refine((q) => new Set(q.options.map((o) => o.trim().toLowerCase())).size === 4, {
    message: "les 4 options doivent être distinctes",
  });

export type Question = z.infer<typeof QuestionSchema>;

export function parseQuestions(raw: unknown): Question[] {
  const list = z.array(QuestionSchema).parse(raw);
  const ids = new Set<string>();
  for (const q of list) {
    if (ids.has(q.id)) throw new Error(`identifiant de question en double : ${q.id}`);
    ids.add(q.id);
  }
  return list;
}

export function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface PickContext {
  used: Set<string>;
  lastCategory: string | null;
  geoCount: number;
  total: number;
  now?: number;
}

/**
 * Choisit une question de difficulté `difficulty` : jamais déjà vue dans la partie,
 * catégorie différente de la précédente, part de géographie limitée (~30 %).
 * Si le pool est insuffisant, on prend la difficulté la plus proche, puis on réutilise.
 */
export function pickQuestion(pool: Question[], difficulty: number, ctx: PickContext, rng: Rng): Question {
  const usable = pool.filter(
    (q) =>
      q.status !== "retired" &&
      q.status !== "flagged" &&
      !(q.expiresAt && ctx.now !== undefined && Date.parse(q.expiresAt) < ctx.now),
  );
  if (usable.length === 0) throw new Error("aucune question utilisable");
  const maxDelta = 7;
  for (const allowReuse of [false, true]) {
    for (let delta = 0; delta <= maxDelta; delta++) {
      for (const d of delta === 0 ? [difficulty] : [difficulty + delta, difficulty - delta]) {
        let cands = usable.filter((q) => q.difficulty === d && (allowReuse || !ctx.used.has(q.id)));
        if (cands.length === 0) continue;
        const notSameCat = cands.filter((q) => q.category !== ctx.lastCategory);
        if (notSameCat.length) cands = notSameCat;
        if (ctx.total >= 4 && ctx.geoCount / ctx.total > 0.3) {
          const nonGeo = cands.filter((q) => q.category !== "geo");
          if (nonGeo.length) cands = nonGeo;
        }
        return cands[rng.int(cands.length)];
      }
    }
  }
  return usable[rng.int(usable.length)];
}
