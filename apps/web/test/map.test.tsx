import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cities, getBalance, getWorld, questionsFr } from "@geoclash/data";
import { MatchRunner, parseQuestions, type PlayerView } from "@geoclash/runtime";
import { MAP_H, MAP_W, capPath, landPath, nearestCity, project, screenToMap } from "../src/map/geo";
import { clampTransform, fitPoints } from "../src/map/useMapGestures";
import { WorldMap } from "../src/map/WorldMap";

afterEach(cleanup);

const balance = getBalance();
const world = getWorld(balance);
const questions = parseQuestions(questionsFr);

function viewAt(round: number, mutate?: (r: MatchRunner) => void): PlayerView {
  const r = new MatchRunner({ world, balance, questions, seed: 5, startAt: 0, humans: [{ id: 0, name: "T" }] });
  r.tick(3000);
  mutate?.(r);
  return r.viewFor(0, 3000 + round);
}

describe("géométrie de la carte", () => {
  it("projette toutes les villes dans le cadre de la carte", () => {
    for (const c of cities) {
      const [x, y] = project(c.lat, c.lng);
      expect(x, c.name).toBeGreaterThanOrEqual(0);
      expect(x, c.name).toBeLessThanOrEqual(MAP_W);
      expect(y, c.name).toBeGreaterThanOrEqual(0);
      expect(y, c.name).toBeLessThanOrEqual(MAP_H);
    }
  });
  it("les côtes réelles sont chargées (chemin SVG non trivial)", () => {
    expect(landPath.length).toBeGreaterThan(5000);
  });
  it("Paris est à l'est de New York et à peu près à la même hauteur", () => {
    const paris = project(48.86, 2.35);
    const ny = project(40.71, -74.01);
    expect(paris[0]).toBeGreaterThan(ny[0]);
    expect(Math.abs(paris[1] - ny[1])).toBeLessThan(80);
  });
  it("une calotte de zone produit un chemin, un rayon nul non", () => {
    expect(capPath(48, 2, 2000).length).toBeGreaterThan(20);
    expect(capPath(48, 2, 0)).toBe("");
  });
  it("une calotte qui traverse l'antiméridien ne plante pas", () => {
    expect(capPath(-17, 179, 2500).length).toBeGreaterThan(20);
  });
});

describe("cadrage et limites du zoom", () => {
  it("clampTransform garde la carte dans le cadre", () => {
    const t = clampTransform({ scale: 3, tx: 500, ty: 500 }, 1300);
    expect(t.tx).toBeLessThanOrEqual(0);
    expect(t.ty).toBeLessThanOrEqual(0);
    const far = clampTransform({ scale: 3, tx: -99999, ty: -99999 }, 1300);
    expect(far.tx).toBeGreaterThanOrEqual(MAP_W - MAP_W * 3);
  });
  it("le zoom est borné", () => {
    expect(clampTransform({ scale: 100, tx: 0, ty: 0 }, 1300).scale).toBe(12);
    expect(clampTransform({ scale: 0.1, tx: 0, ty: 0 }, 1300).scale).toBe(1);
  });
  it("fitPoints cadre un point et deux points éloignés (zoom plus faible)", () => {
    const one = fitPoints([[500, 260]], 1300);
    const two = fitPoints([[100, 100], [900, 400]], 1300);
    expect(one.scale).toBeGreaterThan(two.scale);
  });
});

describe("sélection de ville : fonctions pures", () => {
  const pts: [number, number][] = [[100, 100], [110, 100], [500, 300]];
  it("screenToMap inverse bien la transformation", () => {
    const rect = { left: 10, top: 20, width: 500 };
    const t = { scale: 2, tx: -100, ty: -50 };
    const k = MAP_W / 500;
    const clientX = 10 + ((300 * 2 + -100) / k);
    const clientY = 20 + ((200 * 2 + -50) / k);
    const [mx, my] = screenToMap(clientX, clientY, rect, t);
    expect(mx).toBeCloseTo(300, 5);
    expect(my).toBeCloseTo(200, 5);
  });
  it("nearestCity prend la plus proche parmi les villes autorisées, dans le rayon", () => {
    expect(nearestCity(108, 100, [0, 1, 2], pts, 30, 390, 1)).toBe(1);
    expect(nearestCity(108, 100, [0, 2], pts, 30, 390, 1)).toBe(0);
  });
  it("nearestCity renvoie null si rien n'est assez proche ou si la liste est vide", () => {
    expect(nearestCity(800, 400, [0, 1, 2], pts, 30, 390, 1)).toBeNull();
    expect(nearestCity(100, 100, [], pts, 30, 390, 1)).toBeNull();
  });
  it("le rayon de tolérance (en px écran) reste constant quel que soit le zoom", () => {
    // à fort zoom, la même distance en unités de carte dépasse le rayon
    expect(nearestCity(130, 100, [0], pts, 30, 390, 1)).toBe(0);
    expect(nearestCity(130, 100, [0], pts, 30, 390, 8)).toBeNull();
  });
});

describe("WorldMap", () => {
  it("affiche les 150 villes", () => {
    render(<WorldMap view={viewAt(100)} pendingCityId={null} onCityTap={() => {}} />);
    expect(document.querySelectorAll("[data-city]").length).toBe(cities.length);
  });
  it("marque la ville du joueur", () => {
    const v = viewAt(100);
    render(<WorldMap view={v} pendingCityId={null} onCityTap={() => {}} />);
    expect(screen.getByTestId(`city-${v.you.cityId}`).getAttribute("class")).toContain("city--you");
  });
  it("sans zone appliquée, aucune ville n'est rouge", () => {
    render(<WorldMap view={viewAt(100)} pendingCityId={null} onCityTap={() => {}} />);
    expect(document.querySelectorAll(".city--red").length).toBe(0);
  });
  it("avec une zone, les villes hors zone sont rouges et les autres sûres (formes différentes : accessibilité)", () => {
    const r = new MatchRunner({ world, balance, questions, seed: 5, startAt: 0, humans: [{ id: 0, name: "T" }] });
    // avance la partie jusqu'à ce qu'une zone soit appliquée
    let t = 0;
    for (; t < 600_000 && !r.viewFor(0, t).zone; t += 50) {
      r.tick(t);
      const v = r.viewFor(0, t);
      if (v.phase === "QUESTION" && !v.you.answered) r.answer(0, r.peekCorrectIndex(), t);
    }
    const v = r.viewFor(0, t);
    expect(v.zone).not.toBeNull();
    render(<WorldMap view={v} pendingCityId={null} onCityTap={() => {}} />);
    expect(document.querySelectorAll(".city--safe").length).toBe(v.zone!.safeCount);
    expect(document.querySelectorAll(".city--red").length).toBe(cities.length - v.zone!.safeCount);
    expect(document.querySelectorAll(".city--red rect").length).toBeGreaterThan(0); // losanges
    expect(document.querySelectorAll(".city--safe circle").length).toBeGreaterThan(0); // ronds
  });
  it("un tap (pointeur posé puis relevé, sans glissement) sur une ville atteignable la sélectionne", () => {
    const rect = { left: 0, top: 0, width: 390, height: 520, right: 390, bottom: 520, x: 0, y: 0, toJSON: () => ({}) };
    const spy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(rect as DOMRect);
    const r = new MatchRunner({ world, balance, questions, seed: 5, startAt: 0, humans: [{ id: 0, name: "T" }] });
    r.tick(3000);
    r.answer(0, r.peekCorrectIndex(), 3300);
    r.tick(3300);
    r.tick(3300 + balance.timing.revealMs);
    const v = r.viewFor(0, 9000);
    expect(v.phase).toBe("MOVE");
    let tapped = -1;
    const { container } = render(<WorldMap view={v} pendingCityId={null} onCityTap={(id) => (tapped = id)} />);
    expect(document.querySelectorAll(".city--reach").length).toBe(v.you.reachable.length);

    // position écran de la ville cible, d'après la transformation réellement appliquée
    const layer = container.querySelector(".map__layer")!;
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(layer.getAttribute("transform")!)!;
    const [tx, ty, sc] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const target = v.you.reachable[0];
    const [px, py] = project(cities[target].lat, cities[target].lng);
    const k = MAP_W / rect.width;
    const clientX = (px * sc + tx) / k;
    const clientY = (py * sc + ty) / k;

    const svg = container.querySelector("svg")!;
    const ev = (type: string) => new MouseEvent(type, { bubbles: true, clientX, clientY });
    svg.dispatchEvent(ev("pointerdown"));
    svg.dispatchEvent(ev("pointerup"));
    expect(tapped).not.toBe(-1);
    expect(v.you.reachable).toContain(tapped);
    spy.mockRestore();
  });

  it("un glissement (déplacement de la carte) ne sélectionne aucune ville", () => {
    const rect = { left: 0, top: 0, width: 390, height: 520, right: 390, bottom: 520, x: 0, y: 0, toJSON: () => ({}) };
    const spy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(rect as DOMRect);
    const r = new MatchRunner({ world, balance, questions, seed: 5, startAt: 0, humans: [{ id: 0, name: "T" }] });
    r.tick(3000);
    r.answer(0, r.peekCorrectIndex(), 3300);
    r.tick(3300);
    r.tick(3300 + balance.timing.revealMs);
    const v = r.viewFor(0, 9000);
    let tapped = -1;
    const { container } = render(<WorldMap view={v} pendingCityId={null} onCityTap={(id) => (tapped = id)} />);
    const svg = container.querySelector("svg")!;
    const at = (type: string, x: number, y: number) => new MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
    svg.dispatchEvent(at("pointerdown", 100, 200));
    svg.dispatchEvent(at("pointermove", 140, 230));
    svg.dispatchEvent(at("pointerup", 140, 230));
    expect(tapped).toBe(-1);
    spy.mockRestore();
  });
});
