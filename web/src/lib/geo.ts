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

export interface Area extends LatLng {
  name: string;
}

// Neighbourhood picker for people who skip location, and a rough
// "which neighbourhood" label for search. Centres are approximate.
export const AREAS: Area[] = [
  { name: "Downtown", lat: 49.2827, lng: -123.1207 },
  { name: "Gastown", lat: 49.2839, lng: -123.1066 },
  { name: "Yaletown", lat: 49.2757, lng: -123.1219 },
  { name: "West End", lat: 49.286, lng: -123.134 },
  { name: "Kitsilano", lat: 49.2684, lng: -123.1683 },
  { name: "Mount Pleasant", lat: 49.2635, lng: -123.1004 },
  { name: "Main Street", lat: 49.247, lng: -123.101 },
  { name: "Commercial Drive", lat: 49.273, lng: -123.0695 },
  { name: "North Vancouver", lat: 49.32, lng: -123.0724 },
  { name: "Burnaby", lat: 49.2276, lng: -123.0076 },
  { name: "New Westminster", lat: 49.2057, lng: -122.911 },
  { name: "Richmond", lat: 49.1666, lng: -123.1336 },
  { name: "Port Moody", lat: 49.2838, lng: -122.8317 },
  { name: "Surrey", lat: 49.1913, lng: -122.849 },
  // Calgary: offered once it has spots (location-drawer.tsx).
  { name: "Downtown Calgary", lat: 51.0465, lng: -114.0645 },
  { name: "17th Ave SW", lat: 51.0379, lng: -114.0802 },
];

// Picker areas with at least one spot within `km`, so a city we have only
// just started covering doesn't offer a neighbourhood full of far-off spots.
export function areasWithSpots(venues: { lat: number | null; lng: number | null }[], km = 5) {
  return AREAS.filter((a) => venues.some((v) => v.lat != null && v.lng != null && distanceKm(a, { lat: v.lat, lng: v.lng }) <= km));
}

// The city a point is in, for the home heading: the nearest spot's city,
// when one is within `km`. Null outside the cities we cover.
export function cityNear<V extends { lat: number | null; lng: number | null; city: string | null }>(p: LatLng, venues: V[], km = 25): string | null {
  let city: string | null = null;
  let bestKm = km;
  for (const v of venues) {
    if (v.lat == null || v.lng == null || !v.city) continue;
    const d = distanceKm(p, { lat: v.lat, lng: v.lng });
    if (d < bestKm) [city, bestKm] = [v.city, d];
  }
  return city;
}

// Within 15 km, else null (a Calgary spot is not "near Surrey").
export function nearestArea(p: LatLng): Area | null {
  let best: Area | null = null;
  let bestKm = 15;
  for (const a of AREAS) {
    const km = distanceKm(p, a);
    if (km < bestKm) [best, bestKm] = [a, km];
  }
  return best;
}
