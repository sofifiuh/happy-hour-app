export interface LatLng {
  lat: number;
  lng: number;
}

// Downtown Vancouver, used before (or without) the user's location.
export const DEFAULT_CENTER: LatLng = { lat: 49.2827, lng: -123.1207 };

export function distanceKm(a: LatLng, b: LatLng) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// Straight line x street-grid detour, at walking pace. An estimate, so "~".
export function walkLabel(km: number) {
  const mins = Math.max(1, Math.round(((km * 1.3) / 4.8) * 60));
  if (mins <= 45) return `${mins} min walk`;
  if (km < 100) return `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`;
  return "";
}
