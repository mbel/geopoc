import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { I18nProvider } from "../src/i18n";
import { PASSPORT_KEY } from "../src/services/passport";

function mount(locale: "fr" | "en" = "fr") {
  return render(
    <I18nProvider initial={locale}>
      <App />
    </I18nProvider>,
  );
}

const advance = async (ms: number, step = 100) => {
  for (let i = 0; i < ms; i += step) await act(async () => void vi.advanceTimersByTime(step));
};

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "Date"] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("App : navigation", () => {
  it("affiche l'accueil avec solo, en ligne et passeport", () => {
    mount();
    expect(screen.getByText("Jouer en solo")).toBeTruthy();
    expect(screen.getByText("Jouer en ligne")).toBeTruthy();
    expect(screen.getByText(/Mon passeport/)).toBeTruthy();
    expect(screen.getByText(/pour compléter la partie sont des bots/)).toBeTruthy(); // mention explicite des bots
  });

  it("change de langue", () => {
    mount();
    fireEvent.click(screen.getByText("EN"));
    expect(screen.getByText("Play solo")).toBeTruthy();
  });

  it("ouvre le passeport vide puis revient", () => {
    mount();
    fireEvent.click(screen.getByText(/Mon passeport/));
    expect(screen.getByText(/premier badge/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Retour/));
    expect(screen.getByText("Jouer en solo")).toBeTruthy();
  });
});

describe("App : élimination", () => {
  async function untilDialog(maxMs = 12 * 60_000) {
    for (let t = 0; t < maxMs && !document.querySelector('[role="dialog"]'); t += 500) await advance(500, 500);
  }

  it("quand le joueur est éliminé, une popup BLOQUANTE propose une nouvelle partie", async () => {
    mount();
    fireEvent.click(screen.getByText("Jouer en solo"));
    await untilDialog();
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog!.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText("Tu es éliminé")).toBeTruthy();
    expect(screen.getByText(/Place \d+ sur 100/)).toBeTruthy();
    expect(screen.getByText("Nouvelle partie")).toBeTruthy();
    expect(screen.getByText("Accueil")).toBeTruthy();
    // en solo, pas de « regarder la fin » : ça n'a pas d'intérêt
    expect(screen.queryByText(/Regarder la fin/)).toBeNull();
  });

  it("« Nouvelle partie » relance immédiatement une partie et la partie perdue est enregistrée", async () => {
    mount();
    fireEvent.click(screen.getByText("Jouer en solo"));
    await untilDialog();
    expect(JSON.parse(localStorage.getItem(PASSPORT_KEY) ?? "null")?.games).toBe(1); // enregistrée dès l'élimination
    await act(async () => void fireEvent.click(screen.getByText("Nouvelle partie")));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(screen.getByText(/Recherche d'adversaires/)).toBeTruthy();
  });

  it("« Accueil » depuis la popup quitte la partie", async () => {
    mount();
    fireEvent.click(screen.getByText("Jouer en solo"));
    await untilDialog();
    await act(async () => void fireEvent.click(within(document.querySelector('[role="dialog"]') as HTMLElement).getByText("Accueil")));
    expect(screen.getByText("Jouer en solo")).toBeTruthy();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe("App : partie solo", () => {
  it("lobby avec bots → intro → question → révélation", async () => {
    mount();
    fireEvent.click(screen.getByText("Jouer en solo"));
    expect(screen.getByText(/Recherche d'adversaires/)).toBeTruthy();
    expect(screen.getByText(/bot\(s\) prendront les places libres/)).toBeTruthy();

    await advance(3700);
    expect(screen.getByText(/Tu apparais à/)).toBeTruthy();
    expect(document.querySelectorAll("[data-city]").length).toBe(150);

    await advance(3200);
    const options = document.querySelectorAll<HTMLButtonElement>(".opt");
    expect(options.length).toBe(4);
    expect(document.querySelector(".question")?.textContent?.length).toBeGreaterThan(5);

    await act(async () => void fireEvent.click(options[0]));
    await advance(300);
    expect(document.querySelector(".opt--correct")).not.toBeNull(); // la bonne réponse est révélée
  });

  it("annuler depuis le lobby revient à l'accueil", async () => {
    mount();
    fireEvent.click(screen.getByText("Jouer en solo"));
    fireEvent.click(screen.getByText("Annuler"));
    expect(screen.getByText("Jouer en solo")).toBeTruthy();
  });

  it("quitter en pleine partie revient à l'accueil", async () => {
    mount();
    fireEvent.click(screen.getByText("Jouer en solo"));
    await advance(7000);
    fireEvent.click(screen.getByLabelText("Quitter"));
    expect(screen.getByText("Jouer en solo")).toBeTruthy();
  });

  it("une partie entière (joueur passif) aboutit aux résultats et met à jour le passeport", async () => {
    mount();
    fireEvent.click(screen.getByText("Jouer en solo"));
    await advance(14 * 60_000, 500);
    expect(screen.getByText("Partie terminée")).toBeTruthy();
    expect(screen.getByText(/Place \d+ sur 100/)).toBeTruthy();
    expect(screen.getByText(/Ville finale :/)).toBeTruthy();
    const stored = JSON.parse(localStorage.getItem(PASSPORT_KEY) ?? "null");
    expect(stored.games).toBe(1);
    fireEvent.click(screen.getByText("Accueil"));
    expect(screen.getByText("Jouer en solo")).toBeTruthy();
  });

  it("rejouer relance une partie", async () => {
    mount();
    fireEvent.click(screen.getByText("Jouer en solo"));
    await advance(14 * 60_000, 500);
    fireEvent.click(screen.getByText("Rejouer"));
    expect(screen.getByText(/Recherche d'adversaires/)).toBeTruthy();
  });
});
