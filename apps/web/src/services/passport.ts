import type { KeyValueStorage } from "./storage";

export interface Passport {
  version: 1;
  name: string;
  games: number;
  wins: number;
  bestPlace: number | null;
  totalCorrect: number;
  /** Badges de ville : clé = id de la Ville Finale. */
  badges: Record<string, { cityId: number; count: number; firstAt: number }>;
}

export const PASSPORT_KEY = "geoclash.passport.v1";

export const emptyPassport = (): Passport => ({
  version: 1,
  name: "",
  games: 0,
  wins: 0,
  bestPlace: null,
  totalCorrect: 0,
  badges: {},
});

export interface MatchSummary {
  place: number;
  youWon: boolean;
  correct: number;
  finaleCityId: number;
}

/** Enregistre une partie (fonction pure). Le badge de la Ville Finale n'est attribué qu'au vainqueur. */
export function recordMatch(p: Passport, m: MatchSummary, now: number): Passport {
  const badges = { ...p.badges };
  if (m.youWon) {
    const key = String(m.finaleCityId);
    const prev = badges[key];
    badges[key] = prev ? { ...prev, count: prev.count + 1 } : { cityId: m.finaleCityId, count: 1, firstAt: now };
  }
  return {
    ...p,
    games: p.games + 1,
    wins: p.wins + (m.youWon ? 1 : 0),
    bestPlace: p.bestPlace === null ? m.place : Math.min(p.bestPlace, m.place),
    totalCorrect: p.totalCorrect + m.correct,
    badges,
  };
}

export async function loadPassport(storage: KeyValueStorage): Promise<Passport> {
  try {
    const raw = await storage.get(PASSPORT_KEY);
    if (!raw) return emptyPassport();
    const parsed = JSON.parse(raw) as Partial<Passport>;
    if (parsed.version !== 1) return emptyPassport();
    return { ...emptyPassport(), ...parsed, badges: parsed.badges ?? {} };
  } catch {
    return emptyPassport();
  }
}

export async function savePassport(storage: KeyValueStorage, p: Passport): Promise<void> {
  await storage.set(PASSPORT_KEY, JSON.stringify(p));
}
