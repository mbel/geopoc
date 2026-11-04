import { cities } from "@geoclash/data";

export const cityName = (id: number): string => cities[id]?.name ?? `#${id}`;
export const cityRarity = (id: number) => cities[id]?.rarity ?? "c";
export const CITY_COUNT = cities.length;
