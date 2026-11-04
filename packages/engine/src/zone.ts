import { destination } from "./geo";
import type { Balance } from "./config";
import type { MatchState, World, ZoneState } from "./types";

type Event = Balance["zone"]["events"][number];

/**
 * Calcule la zone d'un événement (SPEC §4) :
 * calotte sphérique contenant les k villes les plus proches de son centre c_t.
 * Le centre converge vers la Ville Finale F, mais son décalage est plafonné à
 * `offsetRatio × rayon` : la taille de la zone reste pilotée par la fraction de villes sûres,
 * et F est TOUJOURS strictement à l'intérieur (jamais « sur le bord »).
 */
export function computeZone(
  world: World,
  finaleCityId: number,
  plan: MatchState["plan"],
  events: Event[],
  eventIndex: number,
  applyRound: number,
  offsetRatio = 0.6,
): ZoneState {
  const ev = events[eventIndex];
  const n = world.n;
  const safe = new Uint8Array(n);
  const f = world.cities[finaleCityId];

  if (ev.final) {
    safe[finaleCityId] = 1;
    return { eventIndex, centerLat: f.lat, centerLng: f.lng, radiusKm: 0, safe, safeCount: 1, final: true, applyRound };
  }

  const k = Math.max(1, Math.min(n, ev.safeCount ?? Math.round((ev.safeFraction ?? 1) * n)));

  // Rayon de référence : distance de F à sa k-ième ville la plus proche
  const fromF: number[] = [];
  for (let i = 0; i < n; i++) fromF.push(world.dist[finaleCityId * n + i]);
  fromF.sort((a, b) => a - b);
  const refRadius = fromF[k - 1];

  // Centre : converge vers F, décalage plafonné
  const t = events.length <= 1 ? 1 : eventIndex / (events.length - 1);
  const planned = plan.offsetKm * (1 - t);
  const offset = Math.min(planned, offsetRatio * refRadius);
  const c = offset <= 1e-6 ? { lat: f.lat, lng: f.lng } : destination(f.lat, f.lng, plan.bearingRad, offset);

  const d: { id: number; km: number }[] = [];
  for (let i = 0; i < n; i++) {
    const ci = world.cities[i];
    d.push({ id: i, km: haversineFast(c.lat, c.lng, ci.lat, ci.lng) });
  }
  d.sort((a, b) => a.km - b.km || a.id - b.id);
  let radius = d[k - 1].km;
  const fKm = d.find((x) => x.id === finaleCityId)!.km;
  if (fKm > radius) radius = fKm; // invariant : F toujours dans la zone
  let count = 0;
  for (const x of d)
    if (x.km <= radius + 1e-6) {
      safe[x.id] = 1;
      count++;
    }
  return { eventIndex, centerLat: c.lat, centerLng: c.lng, radiusKm: radius, safe, safeCount: count, final: false, applyRound };
}

function haversineFast(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}
