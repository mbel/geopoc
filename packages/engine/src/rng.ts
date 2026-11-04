/**
 * RNG déterministe (mulberry32). L'état est un simple entier : il peut être stocké
 * dans l'état de partie, ce qui rend le moteur pur et rejouable à l'identique.
 */
export class Rng {
  state: number;
  constructor(seed: number) {
    this.state = seed >>> 0;
  }
  /** Flottant dans [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** Entier dans [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }
  /** Loi normale centrée réduite (Box-Muller). */
  normal(): number {
    const u = Math.max(this.next(), 1e-12);
    const v = this.next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  /** Tirage pondéré : renvoie l'index. */
  weighted(weights: number[]): number {
    let total = 0;
    for (const w of weights) total += w;
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r < 0) return i;
    }
    return weights.length - 1;
  }
}

function fmix(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Combine deux entiers en une seed (avalanche complète : des entrées proches donnent des seeds sans rapport). */
export function mixSeed(a: number, b: number): number {
  return fmix((fmix((a ^ 0x9e3779b9) >>> 0) + Math.imul(fmix((b + 0x7f4a7c15) >>> 0), 0x27d4eb2f)) >>> 0);
}
