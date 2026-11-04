const R = 6371; // km
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Distance orthodromique en km. */
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Point d'arrivée en partant de (lat,lng) avec un cap (radians) et une distance (km). */
export function destination(
  lat: number,
  lng: number,
  bearingRad: number,
  distKm: number,
): { lat: number; lng: number } {
  const d = distKm / R;
  const φ1 = rad(lat);
  const λ1 = rad(lng);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(bearingRad));
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(d) * Math.cos(φ1),
      Math.cos(d) - Math.sin(φ1) * Math.sin(φ2),
    );
  return { lat: deg(φ2), lng: ((deg(λ2) + 540) % 360) - 180 };
}

/** Centroïde sphérique (moyenne des vecteurs unitaires). */
export function sphericalCentroid(points: { lat: number; lng: number }[]): { lat: number; lng: number } {
  let x = 0,
    y = 0,
    z = 0;
  for (const p of points) {
    const φ = rad(p.lat);
    const λ = rad(p.lng);
    x += Math.cos(φ) * Math.cos(λ);
    y += Math.cos(φ) * Math.sin(λ);
    z += Math.sin(φ);
  }
  const n = points.length || 1;
  x /= n;
  y /= n;
  z /= n;
  return { lat: deg(Math.atan2(z, Math.hypot(x, y))), lng: deg(Math.atan2(y, x)) };
}
