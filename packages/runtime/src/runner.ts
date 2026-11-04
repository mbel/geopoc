import {
  Rng,
  aliveOf,
  applyAnswers,
  applyFinaleAnswers,
  applyMoves,
  createMatch,
  drawQuestion,
  mixSeed,
  rangeFor,
  type AnswerInput,
  type Balance,
  type MatchState,
  type World,
  type ZoneState,
} from "@geoclash/engine";
import { botAnswer, botMove, makeBots, type Bot } from "./bots";
import type { PlayerView, QuestionView, RevealView, RunnerPhase, ZoneView } from "./protocol";
import { PROTOCOL_VERSION } from "./protocol";
import { pickQuestion, shuffle, type Question } from "./questions";

export interface RunnerHuman {
  id: number;
  name: string;
}

export interface RunnerOptions {
  world: World;
  balance: Balance;
  seed: number;
  questions: Question[];
  /** Les humains occupent les identifiants 0..h-1 ; les bots prennent TOUTES les places restantes. */
  humans: RunnerHuman[];
  /** Heure de démarrage (ms, horloge de l'hôte). */
  startAt: number;
  matchId?: string;
  introMs?: number;
  /** Termine la question / le saut dès que tous les humains en vie ont joué. */
  earlyAdvance?: boolean;
  /** Multiplicateur de durée quand plus aucun humain n'est en vie (accéléré). */
  spectatorSpeed?: number;
}

interface HumanAnswer {
  index: number;
  elapsedMs: number;
  correct: boolean;
}

/**
 * Orchestration d'une partie : enchaîne les phases (INTRO → QUESTION → REVEAL → MOVE → ZONE → …),
 * fait jouer les bots, collecte les actions des humains et produit une vue SANS SECRET par joueur.
 *
 * Aucune horloge interne : l'hôte (navigateur ou serveur) appelle `tick(now)`.
 * Le même code tourne donc en solo (dans le navigateur) et en ligne (sur le serveur).
 */
export class MatchRunner {
  readonly matchId: string;
  private readonly world: World;
  private readonly balance: Balance;
  private readonly pool: Question[];
  private readonly humanNames = new Map<number, string>();
  private readonly bots: Bot[];
  private readonly qRng: Rng;
  private readonly introMs: number;
  private readonly earlyAdvance: boolean;
  private readonly spectatorSpeed: number;

  private state: MatchState;
  private phase: RunnerPhase = "INTRO";
  private mode: "round" | "finale" = "round";
  private phaseStartedAt = 0;
  private phaseEndsAt = 0;

  private used = new Set<string>();
  private lastCategory: string | null = null;
  private geoCount = 0;
  private asked = 0;

  private question: QuestionView | null = null;
  private correctDisplayIndex = 0;
  private window = 0;
  private botAnswers: Record<number, AnswerInput> = {};
  private humanAnswers = new Map<number, HumanAnswer>();
  private humanMoves = new Map<number, number | null>();
  private reveals = new Map<number, RevealView>();
  private correctCounts = new Map<number, number>();
  private lastElimination = 0;
  private listeners = new Set<() => void>();
  private countsCache: { state: MatchState; counts: Record<string, number> } | null = null;
  private zoneViews = new WeakMap<ZoneState, ZoneView>();

  constructor(opts: RunnerOptions) {
    this.world = opts.world;
    this.balance = opts.balance;
    this.pool = opts.questions;
    this.matchId = opts.matchId ?? `m_${opts.seed.toString(36)}`;
    this.introMs = opts.introMs ?? 3000;
    this.earlyAdvance = opts.earlyAdvance ?? true;
    this.spectatorSpeed = opts.spectatorSpeed ?? 0.15;
    opts.humans.forEach((h, i) => {
      if (h.id !== i) throw new Error("les humains doivent avoir les identifiants 0..h-1");
      this.humanNames.set(h.id, h.name);
    });
    if (opts.humans.length > this.balance.players) throw new Error("trop d'humains pour la partie");
    this.state = createMatch(this.world, this.balance, opts.seed, this.balance.players);
    this.bots = makeBots(this.balance.players, mixSeed(opts.seed, 77), this.balance);
    this.qRng = new Rng(mixSeed(opts.seed, 5150));
    this.enter("INTRO", opts.startAt, this.introMs);
  }

  // ---------- API hôte ----------
  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  isEnded(): boolean {
    return this.phase === "ENDED";
  }

  humanIds(): number[] {
    return [...this.humanNames.keys()];
  }

  /** Reflète l'état moteur (lecture seule : tests et journaux serveur). */
  getEngineState(): MatchState {
    return this.state;
  }

  /** @internal Réservé aux tests : index affiché de la bonne réponse. */
  peekCorrectIndex(): number {
    return this.correctDisplayIndex;
  }

  /** Avance l'horloge. Renvoie true si au moins une phase a changé. */
  tick(now: number): boolean {
    let changed = false;
    for (let guard = 0; guard < 64 && this.phase !== "ENDED"; guard++) {
      const early = now < this.phaseEndsAt && this.earlyDone();
      if (!early && now < this.phaseEndsAt) break;
      const at = early ? now : this.phaseEndsAt;
      this.advance(at);
      changed = true;
    }
    if (changed) this.emit();
    return changed;
  }

  answer(id: number, index: number, now: number, latencyMs = 0): boolean {
    if (this.phase !== "QUESTION") return false;
    if (!this.isAliveHuman(id) || this.humanAnswers.has(id)) return false;
    if (!Number.isInteger(index) || index < 0 || index > 3) return false;
    const elapsed = Math.max(0, now - this.phaseStartedAt - Math.max(0, latencyMs));
    if (elapsed > this.window) return false;
    this.humanAnswers.set(id, { index, elapsedMs: Math.round(elapsed), correct: index === this.correctDisplayIndex });
    this.emit();
    return true;
  }

  move(id: number, cityId: number | null): boolean {
    if (this.phase !== "MOVE" || this.mode !== "round") return false;
    if (!this.isAliveHuman(id) || this.humanMoves.has(id)) return false;
    if (cityId !== null) {
      const p = this.state.players[id];
      const range = rangeFor(this.balance, p.band);
      if (!Number.isInteger(cityId) || cityId < 0 || cityId >= this.world.n) return false;
      if (this.world.hops[p.cityId * this.world.n + cityId] > range) return false;
    }
    this.humanMoves.set(id, cityId === this.state.players[id].cityId ? null : cityId);
    this.emit();
    return true;
  }

  // ---------- Vue d'un joueur ----------
  viewFor(id: number, now: number): PlayerView {
    const name = this.humanNames.get(id);
    if (name === undefined) throw new Error(`joueur humain inconnu : ${id}`);
    const s = this.state;
    const p = s.players[id];
    const ended = this.phase === "ENDED";
    const range = rangeFor(this.balance, p.band);
    const showReach = p.alive && (this.phase === "REVEAL" || this.phase === "MOVE") && this.mode === "round";
    const reachable: number[] = [];
    if (showReach && range > 0) {
      const n = this.world.n;
      for (let j = 0; j < n; j++) if (j !== p.cityId && this.world.hops[p.cityId * n + j] <= range) reachable.push(j);
    }
    const finaleKnown = s.zone?.final === true || ended;
    const result =
      ended && s.winnerId !== null
        ? {
            winnerId: s.winnerId,
            winnerName: this.nameOf(s.winnerId),
            winnerIsBot: !this.humanNames.has(s.winnerId),
            youWon: s.winnerId === id,
            place: this.placeOf(id) ?? 1,
            finaleCityId: s.finaleCityId,
            endReason: s.endReason ?? "last_survivor",
          }
        : null;
    return {
      v: PROTOCOL_VERSION,
      serverNow: now,
      matchId: this.matchId,
      phase: this.phase,
      mode: this.mode,
      round: s.round,
      finaleRound: s.finaleRound,
      phaseStartedAt: this.phaseStartedAt,
      phaseEndsAt: Number.isFinite(this.phaseEndsAt) ? this.phaseEndsAt : -1,
      question: this.phase === "QUESTION" || this.phase === "REVEAL" ? this.question : null,
      reveal: this.phase === "REVEAL" || this.phase === "MOVE" ? (this.reveals.get(id) ?? null) : null,
      you: {
        id,
        name,
        cityId: p.cityId,
        alive: p.alive,
        band: p.band,
        range,
        reachable,
        answered: this.humanAnswers.has(id),
        moved: this.humanMoves.has(id),
        eliminatedBy: p.eliminatedBy,
        eliminatedRound: p.eliminatedRound,
        place: this.placeOf(id),
        correctCount: this.correctCounts.get(id) ?? 0,
      },
      alive: aliveOf(s).length,
      total: s.players.length,
      zone: s.zone ? this.zoneView(s.zone) : null,
      preview: s.preview ? this.zoneView(s.preview) : null,
      cityCounts: this.cityCounts(),
      finaleCityId: finaleKnown ? s.finaleCityId : null,
      spectating: !p.alive,
      lastElimination: this.lastElimination,
      result,
    };
  }

  // ---------- Interne ----------
  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  private isAliveHuman(id: number): boolean {
    return this.humanNames.has(id) && this.state.players[id]?.alive === true;
  }

  private humansAlive(): number[] {
    return this.humanIds().filter((id) => this.state.players[id].alive);
  }

  private speed(): number {
    return this.humansAlive().length === 0 ? this.spectatorSpeed : 1;
  }

  private nameOf(id: number): string {
    return this.humanNames.get(id) ?? `Bot ${id}`;
  }

  private placeOf(id: number): number | null {
    const s = this.state;
    const p = s.players[id];
    if (p.alive) return s.phase === "ENDED" && s.winnerId === id ? 1 : null;
    if (s.winnerId === id) return 1;
    const r = p.eliminatedRound ?? 0;
    return 1 + s.players.filter((q) => q.alive || (q.eliminatedRound ?? 0) > r).length;
  }

  private cityCounts(): Record<string, number> {
    if (this.countsCache?.state === this.state) return this.countsCache.counts;
    const counts: Record<string, number> = {};
    for (const p of this.state.players) if (p.alive) counts[p.cityId] = (counts[p.cityId] ?? 0) + 1;
    this.countsCache = { state: this.state, counts };
    return counts;
  }

  private zoneView(z: ZoneState): ZoneView {
    let v = this.zoneViews.get(z);
    if (!v) {
      const safe: number[] = [];
      for (let i = 0; i < z.safe.length; i++) if (z.safe[i] === 1) safe.push(i);
      v = {
        safe,
        centerLat: z.centerLat,
        centerLng: z.centerLng,
        radiusKm: z.radiusKm,
        safeCount: z.safeCount,
        final: z.final,
        applyRound: z.applyRound,
      };
      this.zoneViews.set(z, v);
    }
    return v;
  }

  private earlyDone(): boolean {
    if (!this.earlyAdvance) return false;
    const hs = this.humansAlive();
    if (hs.length === 0) return false;
    if (this.phase === "QUESTION") return hs.every((id) => this.humanAnswers.has(id));
    if (this.phase === "MOVE") return hs.every((id) => this.humanMoves.has(id));
    return false;
  }

  private enter(phase: RunnerPhase, at: number, durationMs: number): void {
    this.phase = phase;
    this.phaseStartedAt = at;
    this.phaseEndsAt = phase === "ENDED" ? Infinity : at + durationMs;
  }

  private advance(at: number): void {
    switch (this.phase) {
      case "INTRO":
        return this.enterQuestion(at);
      case "QUESTION":
        return this.endQuestion(at);
      case "REVEAL":
        if (this.mode === "round") return this.enterMove(at);
        return this.state.phase === "ENDED" ? this.enter("ENDED", at, 0) : this.enterQuestion(at);
      case "MOVE":
        return this.endMove(at);
      case "ZONE":
        return this.state.phase === "ENDED" ? this.enter("ENDED", at, 0) : this.enterQuestion(at);
      case "ENDED":
        return;
    }
  }

  private enterQuestion(at: number): void {
    const finale = this.state.phase === "FINALE";
    let difficulty: number;
    if (finale) {
      difficulty = this.state.finaleDifficulty;
      this.window = this.balance.timing.finaleWindowMs;
    } else {
      const q = drawQuestion(this.state, this.balance);
      this.state = q.state;
      difficulty = q.difficulty;
      this.window = this.balance.timing.questionWindowMs;
    }
    this.mode = finale ? "finale" : "round";
    const q = pickQuestion(
      this.pool,
      difficulty,
      { used: this.used, lastCategory: this.lastCategory, geoCount: this.geoCount, total: this.asked },
      this.qRng,
    );
    this.used.add(q.id);
    this.lastCategory = q.category;
    this.asked++;
    if (q.category === "geo") this.geoCount++;
    const order = shuffle([0, 1, 2, 3], this.qRng);
    this.correctDisplayIndex = order.indexOf(q.answerIndex);
    this.question = {
      id: q.id,
      text: q.question,
      options: order.map((i) => q.options[i]),
      category: q.category,
      difficulty: q.difficulty,
    };
    this.botAnswers = {};
    for (const p of this.state.players) {
      if (p.alive && !this.humanNames.has(p.id))
        this.botAnswers[p.id] = botAnswer(this.bots[p.id], difficulty, this.balance, this.window);
    }
    this.humanAnswers.clear();
    this.reveals.clear();
    this.enter("QUESTION", at, this.window * this.speed());
  }

  private endQuestion(at: number): void {
    const answers: Record<number, AnswerInput> = {};
    for (const p of this.state.players) {
      if (!p.alive) continue;
      if (this.humanNames.has(p.id)) {
        const h = this.humanAnswers.get(p.id);
        answers[p.id] = h ? { correct: h.correct, elapsedMs: h.elapsedMs } : { correct: false, elapsedMs: null };
      } else {
        answers[p.id] = this.botAnswers[p.id] ?? { correct: false, elapsedMs: null };
      }
    }
    const before = aliveOf(this.state).length;
    this.state =
      this.mode === "round"
        ? applyAnswers(this.state, this.balance, answers)
        : applyFinaleAnswers(this.state, this.balance, answers);
    this.lastElimination = before - aliveOf(this.state).length;
    for (const id of Object.keys(answers).map(Number)) {
      if (!this.humanNames.has(id)) continue;
      const h = this.humanAnswers.get(id);
      const a = answers[id];
      const ok = a.correct && a.elapsedMs !== null;
      if (ok) this.correctCounts.set(id, (this.correctCounts.get(id) ?? 0) + 1);
      this.reveals.set(id, {
        correctIndex: this.correctDisplayIndex,
        yourIndex: h?.index ?? null,
        correct: ok,
        elapsedMs: h?.elapsedMs ?? null,
        band: this.state.players[id].band,
        survived: this.state.players[id].alive,
      });
    }
    this.enter("REVEAL", at, this.balance.timing.revealMs * this.speed());
  }

  private enterMove(at: number): void {
    this.humanMoves.clear();
    for (const id of this.humansAlive())
      if (rangeFor(this.balance, this.state.players[id].band) === 0) this.humanMoves.set(id, null);
    this.enter("MOVE", at, this.balance.timing.moveMs * this.speed());
  }

  private endMove(at: number): void {
    const moves: Record<number, number | null> = {};
    for (const p of this.state.players) {
      if (!p.alive) continue;
      if (this.humanNames.has(p.id)) moves[p.id] = this.humanMoves.get(p.id) ?? null;
      else {
        const m = botMove(this.bots[p.id], this.state, this.world, this.balance, p);
        if (m !== null) moves[p.id] = m;
      }
    }
    const before = aliveOf(this.state).length;
    this.state = applyMoves(this.state, this.world, this.balance, moves);
    this.lastElimination = before - aliveOf(this.state).length;
    this.enter("ZONE", at, this.balance.timing.zoneUpdateMs * this.speed());
  }
}
