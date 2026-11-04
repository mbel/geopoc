import { geoCircle, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import land from "world-atlas/land-110m.json";

/** Espace de dessin de la carte (unités SVG). */
export const MAP_W = 1000;
export const MAP_H = 520;

const projection = geoNaturalEarth1().fitExtent(
  [
    [8, 8],
    [MAP_W - 8, MAP_H - 8],
  ],
  { type: "Sphere" },
);
const path = geoPath(projection);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const landPath: string = path(feature(land as any, (land as any).objects.land) as any) ?? "";
export const spherePath: string = path({ type: "Sphere" }) ?? "";

export function project(lat: number, lng: number): [number, number] {
  const p = projection([lng, lat]);
  return p ? [p[0], p[1]] : [MAP_W / 2, MAP_H / 2];
}

const KM_PER_DEG = 111.195;

/** Calotte sphérique (zone) projetée en chemin SVG. */
export function capPath(lat: number, lng: number, radiusKm: number): string {
  if (radiusKm <= 0) return "";
  const poly = geoCircle().center([lng, lat]).radius(radiusKm / KM_PER_DEG).precision(2)();
  return path(poly) ?? "";
}

/** Convertit un point écran (px) en coordonnées de carte, pour une transformation donnée. */
export function screenToMap(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number },
  t: { scale: number; tx: number; ty: number },
): [number, number] {
  const k = MAP_W / rect.width; // px écran → unités de vue (même facteur sur les deux axes)
  const ux = (clientX - rect.left) * k;
  const uy = (clientY - rect.top) * k;
  return [(ux - t.tx) / t.scale, (uy - t.ty) / t.scale];
}

/**
 * Ville candidate la plus proche d'un point de carte, dans un rayon (px écran).
 * Tolérant au doigt : on prend la plus proche parmi les villes autorisées.
 */
export function nearestCity(
  mapX: number,
  mapY: number,
  candidates: number[],
  points: [number, number][],
  radiusPx: number,
  rectWidth: number,
  scale: number,
): number | null {
  const radius = (radiusPx * (MAP_W / rectWidth)) / scale;
  let best: number | null = null;
  let bd = radius;
  for (const c of candidates) {
    const d = Math.hypot(points[c][0] - mapX, points[c][1] - mapY);
    if (d <= bd) {
      bd = d;
      best = c;
    }
  }
  return best;
}
