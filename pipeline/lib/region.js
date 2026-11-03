// Where the app covers. One box, shared by discovery and guest submissions,
// so a venue the pipeline can find is one a guest can add, and vice versa.
//
// Metro Vancouver first (2026-10), widened 2026-11 to the rest of the Lower
// Mainland people drive to from Vancouver for a night out: the Fraser Valley
// (Abbotsford, Mission, Chilliwack, Harrison) and the Sea-to-Sky (Squamish,
// Whistler). Still all "Vancouver happy hours" to a visitor.
//
// The 49th parallel IS the border here, and a box that dipped below it let a
// wine bar in Blaine, Washington into a Vancouver app. Latitude alone is not
// enough either (Point Roberts sits above it, Sumas/Lynden just below), so
// the address has to be Canadian too.
export const REGION = { minLat: 49.0, maxLat: 50.2, minLng: -123.35, maxLng: -121.4 };

export function inRegion(p) {
  const l = p.location;
  if (!l || l.latitude < REGION.minLat || l.latitude > REGION.maxLat) return false;
  if (l.longitude < REGION.minLng || l.longitude > REGION.maxLng) return false;
  return !/\b(USA|United States|WA \d{5})\b/i.test(p.formattedAddress || "");
}
