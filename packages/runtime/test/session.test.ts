import { describe, expect, it } from "vitest";
import { LocalSession, type SessionState } from "../src";
import { balance, questions, world } from "./helpers";

function setup() {
  let t = 1_000_000;
  const session = new LocalSession({ world, balance, questions, seed: 77, now: () => t, autoTick: false, lobbyMs: 3000 });
  const advance = (ms: number, step = 50) => {
    for (let i = 0; i < ms; i += step) {
      t += step;
      session.tick();
    }
  };
  return { session, advance, now: () => t };
}

describe("LocalSession (solo)", () => {
  it("lobby : les bots prennent progressivement les places libres, puis la partie démarre", () => {
    const { session, advance } = setup();
    const seen: SessionState[] = [];
    session.subscribe((s) => seen.push(s));
    session.start();
    expect(session.getState().status).toBe("lobby");
    expect(session.getState().lobby?.humans).toBe(1);
    advance(1500);
    const mid = session.getState().lobby!;
    expect(mid.bots).toBeGreaterThan(20);
    expect(mid.bots).toBeLessThan(balance.players - 1);
    advance(2000);
    expect(session.getState().status).toBe("playing");
    expect(session.getState().view?.total).toBe(balance.players);
    expect(seen.length).toBeGreaterThan(3);
  });

  it("répondre et sauter passe par l'interface commune", () => {
    const { session, advance } = setup();
    session.start();
    advance(3100 + 3100); // lobby + intro
    expect(session.getState().view?.phase).toBe("QUESTION");
    session.answer(2);
    expect(session.getState().view?.you.answered).toBe(true);
    advance(200);
    expect(session.getState().view?.phase).toBe("REVEAL");
  });

  it("une partie entière (joueur passif) se termine : statut ended, résultat présent", () => {
    const { session, advance } = setup();
    session.start();
    advance(15 * 60_000, 100);
    const s = session.getState();
    expect(s.status).toBe("ended");
    expect(s.view?.result).not.toBeNull();
    expect(s.view?.you.alive).toBe(false);
  });

  it("leave() remet la session au repos ; on peut relancer", () => {
    const { session, advance } = setup();
    session.start();
    advance(4000);
    session.leave();
    expect(session.getState().status).toBe("idle");
    session.start();
    expect(session.getState().status).toBe("lobby");
  });
});
