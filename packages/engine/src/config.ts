import { z } from "zod";

const band = z.object({
  maxMs: z.number().positive(),
  band: z.enum(["GRAND", "MOYEN", "MICRO"]),
  range: z.number().int().min(0),
});

const zoneEvent = z
  .object({
    announce: z.number().int().positive(),
    apply: z.number().int().positive(),
    safeFraction: z.number().min(0).max(1).optional(),
    safeCount: z.number().int().positive().optional(),
    final: z.boolean().optional(),
  })
  .refine((e) => e.final || e.safeFraction !== undefined || e.safeCount !== undefined, {
    message: "un événement de zone doit avoir safeFraction, safeCount ou final",
  })
  .refine((e) => e.announce < e.apply, { message: "announce doit précéder apply" });

const difficultyStep = z.object({
  from: z.number().int().positive(),
  to: z.number().int().positive(),
  mix: z.record(z.string(), z.number().min(0)),
});

export const BalanceSchema = z.object({
  version: z.string(),
  players: z.number().int().min(2),
  timing: z.object({
    questionWindowMs: z.number().positive(),
    revealMs: z.number().nonnegative(),
    moveMs: z.number().nonnegative(),
    zoneUpdateMs: z.number().nonnegative(),
    finaleWindowMs: z.number().positive(),
    finaleCycleSec: z.number().positive(),
  }),
  bands: z.array(band).min(1),
  graph: z.object({
    knn: z.number().int().min(1),
    hubKnn: z.number().int().min(1),
    isolationKm: z.number().positive(),
    isolatedHubLinks: z.number().int().min(1),
    nearestHubLink: z.boolean(),
    hubInterContinentLinks: z.boolean(),
  }),
  zone: z.object({
    maxCenterOffsetKm: z.number().nonnegative(),
    /** Décalage max du centre = ratio × rayon (la Ville Finale reste strictement à l'intérieur de la zone). */
    offsetRatio: z.number().min(0).max(0.95).default(0.6),
    graceRounds: z.number().int().min(0),
    finalCityWeighting: z.enum(["rarity", "uniform"]),
    rarityWeights: z.object({ c: z.number(), r: z.number(), l: z.number() }),
    events: z.array(zoneEvent).min(2),
    maxRounds: z.number().int().positive(),
  }),
  difficulty: z.object({
    schedule: z.array(difficultyStep).min(1),
    finale: z.object({
      start: z.number().int(),
      max: z.number().int(),
      maxRounds: z.number().int().positive(),
      maxAllFailStreak: z.number().int().min(1),
    }),
  }),
  bots: z.object({
    skillSlope: z.number().positive(),
    successTargets: z.record(z.string(), z.number().min(0).max(1)),
    timing: z.object({
      baseMs: z.record(z.string(), z.number().positive()),
      sigma: z.number().positive(),
      skillEffect: z.number(),
    }),
    navNoiseKm: z.number().nonnegative(),
    /** Probabilité qu'un bot rate sa réaction (distraction, hésitation) : les humains ne sont pas optimaux. */
    blunderRate: z.number().min(0).max(1).default(0),
    profiles: z.object({
      lazy: z.number().min(0),
      standard: z.number().min(0),
      eager: z.number().min(0),
      random: z.number().min(0),
    }),
  }),
  targets: z.object({
    durationMinutes: z.tuple([z.number(), z.number()]),
    aliveAtRound: z.record(z.string(), z.number()),
    aliveTolerance: z.number(),
    finaleEntrants: z.tuple([z.number(), z.number()]),
    finaleRounds: z.tuple([z.number(), z.number()]),
    continentTolerance: z.number(),
    maxShareOver12Min: z.number(),
    successTolerance: z.number(),
  }),
  graphConstraints: z.object({
    maxDiameter: z.number().int(),
    minReachRatio: z.number(),
    reachHops: z.number().int(),
  }),
});

export type Balance = z.infer<typeof BalanceSchema>;

export function parseBalance(raw: unknown): Balance {
  return BalanceSchema.parse(raw);
}

/** Durée (en s) d'un round « normal » : question + révélation + saut + zone. */
export function roundCycleSec(b: Balance): number {
  const t = b.timing;
  return (t.questionWindowMs + t.revealMs + t.moveMs + t.zoneUpdateMs) / 1000;
}
