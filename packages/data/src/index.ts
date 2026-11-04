import { buildWorld, citiesFromRaw, parseBalance, type Balance, type RawCity, type World } from "@geoclash/engine";
import citiesRaw from "../cities.json" with { type: "json" };
import balanceV0 from "../balance.v0.json" with { type: "json" };
import balanceV1 from "../balance.v1.json" with { type: "json" };
import questionsFrRaw from "../questions.fr.json" with { type: "json" };

export const cities = citiesFromRaw(citiesRaw as RawCity[]);

const balances = { v0: balanceV0, v1: balanceV1 } as const;
export type BalanceVersion = keyof typeof balances;

/** Équilibrage validé (schéma zod). Par défaut : la version calibrée. */
export function getBalance(version: BalanceVersion = "v1"): Balance {
  return parseBalance(balances[version]);
}

/** Monde (villes, graphe, distances) construit à partir de l'équilibrage. */
export function getWorld(balance: Balance = getBalance()): World {
  return buildWorld(cities, balance.graph);
}

/** Questions brutes (à valider avec `parseQuestions` du runtime). */
export const questionsFr: unknown = questionsFrRaw;
