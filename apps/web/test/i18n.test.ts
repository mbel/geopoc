import { describe, expect, it } from "vitest";
import { detectLocale, translate } from "../src/i18n";
import { en } from "../src/i18n/en";
import { fr } from "../src/i18n/fr";

describe("i18n", () => {
  it("l'anglais couvre exactement les mêmes clés que le français", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fr).sort());
  });
  it("aucune traduction vide", () => {
    for (const [k, v] of [...Object.entries(fr), ...Object.entries(en)]) expect(v.trim().length, k).toBeGreaterThan(0);
  });
  it("les paramètres {x} sont identiques entre fr et en pour chaque clé", () => {
    const params = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    for (const k of Object.keys(fr) as (keyof typeof fr)[]) expect(params(en[k]), k).toBe(params(fr[k]));
  });
  it("interpole les paramètres", () => {
    expect(translate("fr", "game.alive", { n: 42 })).toBe("42 en vie");
    expect(translate("en", "game.alive", { n: 42 })).toBe("42 alive");
  });
  it("détecte la langue du navigateur", () => {
    expect(detectLocale("fr-FR")).toBe("fr");
    expect(detectLocale("en-GB")).toBe("en");
    expect(detectLocale("de-DE")).toBe("en");
  });
});
