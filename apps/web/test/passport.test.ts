import { describe, expect, it } from "vitest";
import { PASSPORT_KEY, emptyPassport, loadPassport, recordMatch, savePassport } from "../src/services/passport";
import { MemoryStorage } from "../src/services/storage";

describe("passeport", () => {
  it("une défaite compte la partie mais n'ajoute pas de badge", () => {
    const p = recordMatch(emptyPassport(), { place: 17, youWon: false, correct: 6, finaleCityId: 5 }, 1000);
    expect(p.games).toBe(1);
    expect(p.wins).toBe(0);
    expect(p.bestPlace).toBe(17);
    expect(p.totalCorrect).toBe(6);
    expect(Object.keys(p.badges)).toHaveLength(0);
  });
  it("une victoire donne le badge de la Ville Finale, cumulable", () => {
    let p = recordMatch(emptyPassport(), { place: 1, youWon: true, correct: 20, finaleCityId: 5 }, 1000);
    p = recordMatch(p, { place: 1, youWon: true, correct: 18, finaleCityId: 5 }, 2000);
    p = recordMatch(p, { place: 1, youWon: true, correct: 18, finaleCityId: 9 }, 3000);
    expect(p.wins).toBe(3);
    expect(p.badges["5"]).toEqual({ cityId: 5, count: 2, firstAt: 1000 });
    expect(Object.keys(p.badges)).toHaveLength(2);
  });
  it("la meilleure place est la plus petite", () => {
    let p = recordMatch(emptyPassport(), { place: 30, youWon: false, correct: 1, finaleCityId: 1 }, 0);
    p = recordMatch(p, { place: 12, youWon: false, correct: 1, finaleCityId: 1 }, 0);
    p = recordMatch(p, { place: 40, youWon: false, correct: 1, finaleCityId: 1 }, 0);
    expect(p.bestPlace).toBe(12);
  });
  it("recordMatch est pur (ne modifie pas l'entrée)", () => {
    const p = emptyPassport();
    recordMatch(p, { place: 1, youWon: true, correct: 1, finaleCityId: 1 }, 0);
    expect(p.games).toBe(0);
    expect(p.badges).toEqual({});
  });
  it("sauvegarde et rechargement", async () => {
    const s = new MemoryStorage();
    const p = recordMatch(emptyPassport(), { place: 1, youWon: true, correct: 3, finaleCityId: 2 }, 5);
    await savePassport(s, p);
    expect(await loadPassport(s)).toEqual(p);
  });
  it("données corrompues ou d'une autre version : repart d'un passeport vide", async () => {
    const s = new MemoryStorage();
    await s.set(PASSPORT_KEY, "{pas du json");
    expect(await loadPassport(s)).toEqual(emptyPassport());
    await s.set(PASSPORT_KEY, JSON.stringify({ version: 99, games: 5 }));
    expect(await loadPassport(s)).toEqual(emptyPassport());
  });
});
