export type Continent = "EU" | "AF" | "AS" | "OC" | "NA" | "SA";
export type Rarity = "c" | "r" | "l";

export interface City {
  id: number;
  name: string;
  country: string;
  continent: Continent;
  lat: number;
  lng: number;
  hub: boolean;
  rarity: Rarity;
}

/** Monde précalculé : villes, graphe, distances. Immuable. */
export interface World {
  n: number;
  cities: City[];
  adj: number[][];
  /** Sauts de graphe, matrice n*n aplatie. 255 = injoignable. */
  hops: Uint8Array;
  /** Distances orthodromiques en km, matrice n*n aplatie. */
  dist: Float32Array;
}

export type Band = "GRAND" | "MOYEN" | "MICRO" | "FAIL";

export interface Player {
  id: number;
  spawnCityId: number;
  cityId: number;
  alive: boolean;
  /** Nombre de fins de round consécutives passées sur une ville rouge. */
  redRounds: number;
  /** Dernière bande de vitesse obtenue (définit la portée du saut). */
  band: Band;
  totalMs: number;
  finaleMs: number;
  eliminatedRound: number | null;
  eliminatedBy: "zone" | "finale" | "cap" | null;
}

export interface ZoneState {
  eventIndex: number;
  centerLat: number;
  centerLng: number;
  /** Rayon de la calotte (km) : 0 pour la zone finale. */
  radiusKm: number;
  /** 1 = ville sûre, 0 = ville rouge. */
  safe: Uint8Array;
  safeCount: number;
  final: boolean;
  applyRound: number;
}

export type Phase = "ROUND" | "FINALE" | "ENDED";

export interface MatchState {
  seed: number;
  rngState: number;
  round: number; // round en cours (1-indexé)
  phase: Phase;
  finaleCityId: number;
  /** Plan de convergence du centre de zone. */
  plan: { bearingRad: number; offsetKm: number };
  players: Player[];
  /** Zone actuellement appliquée (null avant le premier rétrécissement). */
  zone: ZoneState | null;
  /** Prochaine zone annoncée (visible des joueurs), null si rien d'annoncé. */
  preview: ZoneState | null;
  /** Dernière difficulté tirée. */
  difficulty: number;
  finaleRound: number;
  finaleDifficulty: number;
  finaleAllFailStreak: number;
  winnerId: number | null;
  endReason: "last_survivor" | "tiebreak" | "cap" | null;
  /** Nombre de joueurs en vie à l'entrée de la finale (null si pas de finale). */
  finaleEntrants: number | null;
}

export interface AnswerInput {
  correct: boolean;
  /** Temps de réponse mesuré côté serveur ; null = pas de réponse (timeout). */
  elapsedMs: number | null;
}
