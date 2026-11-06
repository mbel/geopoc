import { describe, expect, it } from "vitest";
import { Rng } from "@geoclash/engine";
import { QuestionSchema, parseQuestions, pickQuestion, shuffle } from "../src";
import { questions, questionsEnglish } from "./helpers";

describe("questions", () => {
  it("le jeu d'amorçage est valide : 4 options distinctes, ids uniques", () => {
    expect(questions.length).toBeGreaterThanOrEqual(60);
    for (const q of questions) expect(QuestionSchema.safeParse(q).success, q.id).toBe(true);
  });
  it("rejette une question invalide (options en double, doublon d'id)", () => {
    const base = { ...questions[0] };
    expect(() => parseQuestions([{ ...base, options: ["a", "a", "b", "c"] }])).toThrow();
    expect(() => parseQuestions([base, { ...base }])).toThrow();
    expect(() => parseQuestions([{ ...base, answerIndex: 4 }])).toThrow();
  });
  it("la part de géographie reste raisonnable dans le pool (≤ 30 %)", () => {
    expect(questions.filter((q) => q.category === "geo").length / questions.length).toBeLessThanOrEqual(0.3);
  });
  it("shuffle conserve les éléments et dépend de la seed", () => {
    const a = shuffle([0, 1, 2, 3], new Rng(1));
    expect([...a].sort()).toEqual([0, 1, 2, 3]);
    expect(shuffle([0, 1, 2, 3], new Rng(1))).toEqual(a);
  });
  it("pickQuestion respecte la difficulté, évite les répétitions et la même catégorie deux fois de suite", () => {
    const rng = new Rng(5);
    const used = new Set<string>();
    let last: string | null = null;
    let consecutive = 0;
    for (let i = 0; i < 10; i++) {
      const q = pickQuestion(questions, 3, { used, lastCategory: last, geoCount: 0, total: i }, rng);
      expect(q.difficulty).toBe(3);
      expect(used.has(q.id)).toBe(false);
      if (q.category === last) consecutive++;
      used.add(q.id);
      last = q.category;
    }
    expect(consecutive).toBeLessThanOrEqual(3);
  });
  it("pickQuestion se rabat sur la difficulté la plus proche puis réutilise quand le pool est épuisé", () => {
    const rng = new Rng(2);
    const q7 = pickQuestion(questions, 7, { used: new Set(), lastCategory: null, geoCount: 0, total: 0 }, rng);
    expect(q7.difficulty).toBe(6);
    const all = new Set(questions.map((q) => q.id));
    expect(() => pickQuestion(questions, 2, { used: all, lastCategory: null, geoCount: 0, total: 0 }, rng)).not.toThrow();
  });
  it("ignore les questions retirées ou signalées", () => {
    const pool = questions.map((q) => ({ ...q, status: q.difficulty === 1 ? ("retired" as const) : q.status }));
    const q = pickQuestion(pool, 1, { used: new Set(), lastCategory: null, geoCount: 0, total: 0 }, new Rng(1));
    expect(q.difficulty).not.toBe(1);
  });
});

describe("qualité du pool de questions", () => {
  const flat = (s: string) =>
    ` ${s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim()} `;

  it("au moins 1 000 questions, toutes valides et en brouillon à vérifier", () => {
    expect(questions.length).toBeGreaterThanOrEqual(1000);
    expect(questions.every((q) => q.status === "draft")).toBe(true);
  });
  it("chaque difficulté de 1 à 6 compte au moins 50 questions", () => {
    for (let d = 1; d <= 6; d++) expect(questions.filter((q) => q.difficulty === d).length, `D${d}`).toBeGreaterThanOrEqual(50);
  });
  it("au moins 9 catégories, aucune ne dépasse 30 % du pool", () => {
    const by = new Map<string, number>();
    for (const q of questions) by.set(q.category, (by.get(q.category) ?? 0) + 1);
    expect(by.size).toBeGreaterThanOrEqual(9);
    for (const [cat, n] of by) expect(n / questions.length, cat).toBeLessThanOrEqual(0.3);
  });
  it("aucun énoncé en double", () => {
    const set = new Set(questions.map((q) => flat(q.question)));
    expect(set.size).toBe(questions.length);
  });
  it("la bonne réponse n'apparaît pas dans l'énoncé", () => {
    for (const q of questions) {
      const c = flat(q.options[q.answerIndex]);
      if (c.trim().length >= 5) expect(flat(q.question).includes(c), `${q.id} ${q.question}`).toBe(false);
    }
  });
  it("la bonne réponse est répartie sur les 4 positions (pas de biais A)", () => {
    const pos = [0, 0, 0, 0];
    for (const q of questions) pos[q.answerIndex]++;
    for (const n of pos) expect(n / questions.length).toBeGreaterThan(0.18);
  });
  it("les questions se terminent par un point d'interrogation et restent lisibles sur mobile", () => {
    for (const q of questions) {
      expect(q.question.trim().endsWith("?"), q.id).toBe(true);
      expect(q.question.length, q.id).toBeLessThanOrEqual(200);
      for (const o of q.options) expect(o.length, q.id).toBeLessThanOrEqual(70);
    }
  });
});

describe("qualité du pool de questions en anglais (questions.en.json)", () => {
  const flat = (s: string) =>
    ` ${s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim()} `;

  it("au moins 1 000 questions en anglais, toutes valides et en brouillon à vérifier", () => {
    expect(questionsEnglish.length).toBeGreaterThanOrEqual(1000);
    expect(questionsEnglish.length).toBe(questions.length);
    expect(questionsEnglish.every((q) => q.status === "draft")).toBe(true);
    expect(questionsEnglish.every((q) => q.lang === "en")).toBe(true);
    for (const q of questionsEnglish) expect(QuestionSchema.safeParse(q).success, q.id).toBe(true);
  });
  it("chaque difficulté de 1 à 6 compte au moins 50 questions", () => {
    for (let d = 1; d <= 6; d++) expect(questionsEnglish.filter((q) => q.difficulty === d).length, `D${d}`).toBeGreaterThanOrEqual(50);
  });
  it("au moins 9 catégories, aucune ne dépasse 30 % du pool", () => {
    const by = new Map<string, number>();
    for (const q of questionsEnglish) by.set(q.category, (by.get(q.category) ?? 0) + 1);
    expect(by.size).toBeGreaterThanOrEqual(9);
    for (const [cat, n] of by) expect(n / questionsEnglish.length, cat).toBeLessThanOrEqual(0.3);
  });
  it("aucun énoncé en double", () => {
    const set = new Set(questionsEnglish.map((q) => flat(q.question)));
    expect(set.size).toBe(questionsEnglish.length);
  });
  it("la bonne réponse n'apparaît pas dans l'énoncé", () => {
    for (const q of questionsEnglish) {
      const c = flat(q.options[q.answerIndex]);
      if (c.trim().length >= 5) expect(flat(q.question).includes(c), `${q.id} ${q.question}`).toBe(false);
    }
  });
  it("la bonne réponse est répartie sur les 4 positions (pas de biais A)", () => {
    const pos = [0, 0, 0, 0];
    for (const q of questionsEnglish) pos[q.answerIndex]++;
    for (const n of pos) expect(n / questionsEnglish.length).toBeGreaterThan(0.18);
  });
  it("les questions anglaises se terminent par un point d'interrogation et restent lisibles sur mobile", () => {
    for (const q of questionsEnglish) {
      expect(q.question.trim().endsWith("?"), q.id).toBe(true);
      expect(q.question.length, q.id).toBeLessThanOrEqual(200);
      for (const o of q.options) expect(o.length, q.id).toBeLessThanOrEqual(70);
    }
  });
});
