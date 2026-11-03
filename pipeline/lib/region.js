// Where the app covers. One list of boxes, shared by discovery and guest
// submissions, so a venue the pipeline can find is one a guest can add, and
// vice versa.
//
// Lower Mainland first (2026-10): Metro Vancouver, the Fraser Valley
// (Abbotsford, Mission, Chilliwack, Harrison) and the Sea-to-Sky (Squamish,
// Whistler). Calgary added 2026-11 (Jason): the city plus Airdrie, Cochrane
// and Okotoks. Each region gets its own city pages on the site; the
// region-wide pages (topic hubs, the overall best list) stay Lower Mainland.
//
// The 49th parallel IS the border near Vancouver, and a box that dipped below
// it let a wine bar in Blaine, Washington into the app. Latitude alone is not
// enough either (Point Roberts sits above it, Sumas/Lynden just below), so
// the address has to be Canadian too.
export const REGIONS = [
  { key: "lower-mainland", prov: "BC", defaultCity: "Vancouver", minLat: 49.0, maxLat: 50.2, minLng: -123.35, maxLng: -121.4 },
  { key: "calgary", prov: "AB", defaultCity: "Calgary", minLat: 50.68, maxLat: 51.4, minLng: -114.65, maxLng: -113.75 },
];
// Kept for older callers: the Lower Mainland box.
export const REGION = REGIONS[0];

export function regionAt(lat, lng) {
  return REGIONS.find((r) => lat >= r.minLat && lat <= r.maxLat && lng >= r.minLng && lng <= r.maxLng) || null;
}

export function inRegion(p) {
  const l = p.location;
  if (!l || !regionAt(l.latitude, l.longitude)) return false;
  return !/\b(USA|United States|WA \d{5})\b/i.test(p.formattedAddress || "");
}

// "Alberta T2R 0B9" / "BC V6B 1A1" -> "AB" / "BC".
export const PROV_RE = /^(BC|British Columbia|AB|Alberta)\b/i;
export const provCode = (s) => (/^(AB|Alberta)\b/i.test(s || "") ? "AB" : "BC");

// Google's formatted address -> { city, prov, street }. Anchor on the
// province rather than a fixed comma slot: Google writes food courts,
// building names and unit numbers as their own parts.
export function splitAddress(formatted) {
  const parts = (formatted || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (parts.length && /^canada$/i.test(parts[parts.length - 1])) parts.pop();
  const provIdx = parts.findIndex((x) => PROV_RE.test(x));
  const prov = provIdx >= 0 ? provCode(parts[provIdx]) : "BC";
  const cityIdx = provIdx > 0 ? provIdx - 1 : parts.length - 1;
  const picked = parts[cityIdx] || "";
  const fallback = REGIONS.find((r) => r.prov === prov).defaultCity;
  const city = !picked || PROV_RE.test(picked) ? fallback : picked;
  return { city, prov, street: parts.slice(0, cityIdx).join(", ") };
}
