import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getBalance, getWorld, questionsFr } from "@geoclash/data";
import { MatchRunner, parseQuestions } from "@geoclash/runtime";
import { MovePanel } from "../src/components/MovePanel";

afterEach(cleanup);

const balance = getBalance();
const world = getWorld(balance);
const questions = parseQuestions(questionsFr);

function moveView(fast = true) {
  const r = new MatchRunner({ world, balance, questions, seed: 9, startAt: 0, humans: [{ id: 0, name: "T" }] });
  r.tick(3000);
  r.answer(0, fast ? r.peekCorrectIndex() : (r.peekCorrectIndex() + 1) % 4, 3300);
  r.tick(3300);
  r.tick(3300 + balance.timing.revealMs);
  return r.viewFor(0, 9000);
}

describe("MovePanel : liste des villes atteignables", () => {
  it("affiche les villes atteignables et permet d'en choisir une sans toucher la carte", () => {
    const v = moveView();
    expect(v.phase).toBe("MOVE");
    const onPick = vi.fn();
    render(<MovePanel view={v} pending={null} onPick={onPick} onJump={() => {}} onStay={() => {}} />);
    const chips = document.querySelectorAll<HTMLButtonElement>(".reach__chip");
    expect(chips.length).toBeGreaterThan(0);
    expect(chips.length).toBeLessThanOrEqual(36);
    fireEvent.click(chips[0]);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(v.you.reachable).toContain(onPick.mock.calls[0][0]);
  });

  it("le bouton Sauter n'est actif qu'une fois une destination choisie", () => {
    const v = moveView();
    const { rerender } = render(<MovePanel view={v} pending={null} onPick={() => {}} onJump={() => {}} onStay={() => {}} />);
    expect((screen.getByText("Sauter") as HTMLButtonElement).disabled).toBe(true);
    rerender(<MovePanel view={v} pending={v.you.reachable[0]} onPick={() => {}} onJump={() => {}} onStay={() => {}} />);
    expect((screen.getByText("Sauter") as HTMLButtonElement).disabled).toBe(false);
  });

  it("sans bonne réponse rapide : pas de saut, donc pas de liste", () => {
    const v = moveView(false);
    render(<MovePanel view={v} pending={null} onPick={() => {}} onJump={() => {}} onStay={() => {}} />);
    expect(document.querySelectorAll(".reach__chip").length).toBe(0);
    expect(screen.getByText(/Pas de saut ce round/)).toBeTruthy();
  });
});
