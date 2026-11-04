import type { Balance } from "@geoclash/engine";

/** Copie de l'équilibrage avec toutes les durées multipliées par `factor` (tests, démos accélérées). */
export function scaleBalanceTiming(b: Balance, factor: number): Balance {
  const sc = (x: number) => Math.max(1, Math.round(x * factor));
  const t = b.timing;
  return {
    ...b,
    timing: {
      questionWindowMs: sc(t.questionWindowMs),
      revealMs: sc(t.revealMs),
      moveMs: sc(t.moveMs),
      zoneUpdateMs: sc(t.zoneUpdateMs),
      finaleWindowMs: sc(t.finaleWindowMs),
      finaleCycleSec: t.finaleCycleSec,
    },
    bands: b.bands.map((x) => ({ ...x, maxMs: sc(x.maxMs) })),
  };
}
