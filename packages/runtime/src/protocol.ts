import { z } from "zod";
import type { Band } from "@geoclash/engine";

export const PROTOCOL_VERSION = 1;

export type RunnerPhase = "INTRO" | "QUESTION" | "REVEAL" | "MOVE" | "ZONE" | "ENDED";

export interface ZoneView {
  /** Identifiants des villes sûres. */
  safe: number[];
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  safeCount: number;
  final: boolean;
  applyRound: number;
}

export interface QuestionView {
  id: string;
  text: string;
  options: string[];
  category: string;
  difficulty: number;
}

export interface RevealView {
  correctIndex: number;
  yourIndex: number | null;
  correct: boolean;
  elapsedMs: number | null;
  band: Band;
  /** En finale : false si ce joueur vient d'être éliminé. */
  survived: boolean;
}

export interface YouView {
  id: number;
  name: string;
  cityId: number;
  alive: boolean;
  band: Band;
  range: number;
  /** Villes atteignables (phases REVEAL et MOVE). */
  reachable: number[];
  answered: boolean;
  moved: boolean;
  eliminatedBy: "zone" | "finale" | "cap" | null;
  eliminatedRound: number | null;
  place: number | null;
  correctCount: number;
}

export interface ResultView {
  winnerId: number;
  winnerName: string;
  winnerIsBot: boolean;
  youWon: boolean;
  place: number;
  finaleCityId: number;
  endReason: "last_survivor" | "tiebreak" | "cap";
}

/** Tout ce qu'un joueur a le droit de savoir à un instant donné (rien de secret : ni la bonne réponse, ni la Ville Finale avant la zone finale). */
export interface PlayerView {
  v: number;
  serverNow: number;
  matchId: string;
  phase: RunnerPhase;
  mode: "round" | "finale";
  round: number;
  finaleRound: number;
  phaseStartedAt: number;
  phaseEndsAt: number;
  question: QuestionView | null;
  reveal: RevealView | null;
  you: YouView;
  alive: number;
  total: number;
  zone: ZoneView | null;
  preview: ZoneView | null;
  /** Nombre de joueurs en vie par ville. */
  cityCounts: Record<string, number>;
  finaleCityId: number | null;
  spectating: boolean;
  /** Joueurs éliminés lors de la dernière étape. */
  lastElimination: number;
  result: ResultView | null;
}

export interface LobbyInfo {
  mode: "solo" | "online";
  capacity: number;
  humans: number;
  /** Bots qui prendront les places restantes au démarrage. */
  bots: number;
  startsAt: number | null;
  serverNow: number;
}

// ---- Messages réseau ----
export const ClientMessageSchema = z.discriminatedUnion("t", [
  z.object({
    t: z.literal("join"),
    name: z.string().min(1).max(24),
    mode: z.enum(["solo", "online"]),
    lang: z.enum(["fr", "en"]).optional(),
  }),
  z.object({ t: z.literal("answer"), index: z.number().int().min(0).max(3) }),
  z.object({ t: z.literal("move"), cityId: z.number().int().min(0).nullable() }),
  z.object({ t: z.literal("ping"), ts: z.number(), rtt: z.number().min(0).max(10000).optional() }),
  z.object({ t: z.literal("leave") }),
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

export type ServerMessage =
  | { t: "hello"; protocol: number; serverNow: number }
  | { t: "lobby"; info: LobbyInfo }
  | { t: "start"; playerId: number; matchId: string; serverNow: number }
  | { t: "view"; view: PlayerView }
  | { t: "pong"; ts: number; serverNow: number }
  | { t: "error"; code: string; message: string };

// ---- Session côté client (même interface en solo et en ligne) ----
export type SessionStatus = "idle" | "connecting" | "lobby" | "playing" | "ended" | "error";

export interface SessionState {
  mode: "solo" | "online";
  status: SessionStatus;
  lobby: LobbyInfo | null;
  view: PlayerView | null;
  error: string | null;
  /** serverNow − Date.now() : à ajouter à Date.now() pour obtenir l'heure du serveur. */
  clockOffsetMs: number;
}

export interface GameSession {
  getState(): SessionState;
  subscribe(fn: (s: SessionState) => void): () => void;
  start(): void;
  answer(index: number): void;
  move(cityId: number | null): void;
  leave(): void;
}
