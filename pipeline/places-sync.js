// Phase 6: Google Places identity sync. Fills the Places-shaped fields the
// schema has carried as null since day one: place_id, rating,
// user_ratings_total, price_level, business_status.
//
// Uses Places API (New) v1 Text Search — one request per venue with a
// field mask covering everything we store; no Details call needed. Every
// match is verified against our own coordinates and name before anything
// is stored; mismatches are logged, never written.
//
// Google's caching terms: place_id may be stored indefinitely; the other
// fields must be refreshed regularly (~30 days) — the weekly re-sync loop
// covers that, and each entry carries synced_at.
//
// Usage: node pipeline/places-sync.js
//   Key from $GOOGLE_PLACES_API_KEY or pipeline/secrets.json (gitignored).
import fs from "node:fs";
import path from "node:path";
import { loadSeed, readJson, normName, REPO_ROOT } from "./lib/venues.js";
import { curlJson, mapConcurrent } from "./lib/curl.js";

const SECRETS = path.join(REPO_ROOT, "pipeline", "secrets.json");
const KEY = process.env.GOOGLE_PLACES_API_KEY || readJson(SECRETS, {}).GOOGLE_PLACES_API_KEY;
if (!KEY) {
  console.log("No GOOGLE_PLACES_API_KEY (env or pipeline/secrets.json) — skipping Places sync.");
  process.exit(0);
}

const STORE = path.join(REPO_ROOT, "pipeline", "places.json");
const TODAY = new Date().toISOString().slice(0, 10);
const venues = [...loadSeed(), ...readJson(path.join(REPO_ROOT, "pipeline", "discovered.json"), [])];

const distM = (a, b) => {
  const R = 6371000, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
const tokens = (s) => new Set(normName(s).split(" ").filter((w) => w.length > 2));
function nameOverlap(a, b) {
  const ta = tokens(a), tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let n = 0;
  for (const t of ta) if (tb.has(t)) n++;
  return n / Math.min(ta.size, tb.size);
}

// v1 returns price level as an enum; the app schema stores the classic 0-4.
const PRICE_LEVELS = { PRICE_LEVEL_FREE: 0, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 };

const store = readJson(STORE, {});
const misses = [];

await mapConcurrent(venues, 5, async (v) => {
  const loc = v.geometry?.location;
  const body = { textQuery: `${v.name} ${v.formatted_address}` };
  if (loc) body.locationBias = { circle: { center: { latitude: loc.lat, longitude: loc.lng }, radius: 2000 } };
  let data;
  try {
    data = await curlJson("https://places.googleapis.com/v1/places:searchText", {
      headers: [
        `X-Goog-Api-Key: ${KEY}`,
        "X-Goog-FieldMask: places.id,places.displayName,places.location,places.rating,places.userRatingCount,places.priceLevel,places.businessStatus",
      ],
      body,
    });
  } catch (e) {
    misses.push([v.id, `request failed: ${e.message.slice(0, 80)}`]);
    return;
  }
  if (data.error) { misses.push([v.id, `${data.error.status}: ${String(data.error.message).slice(0, 80)}`]); return; }
  const r = data.places?.[0];
  if (!r) { misses.push([v.id, "no results"]); return; }
  // Verify the top result really is our venue: close to our coords AND
  // (name overlaps or essentially on top of us).
  const rName = r.displayName?.text || "";
  const d = loc && r.location ? distM(loc, { lat: r.location.latitude, lng: r.location.longitude }) : Infinity;
  const overlap = nameOverlap(v.name, rName);
  if (!(d < 200 && (overlap >= 0.5 || d < 60))) {
    misses.push([v.id, `no confident match (top: "${rName}", ${Math.round(d)}m, overlap ${overlap.toFixed(2)})`]);
    return;
  }
  store[v.id] = {
    place_id: r.id,
    rating: r.rating ?? null,
    user_ratings_total: r.userRatingCount ?? null,
    price_level: PRICE_LEVELS[r.priceLevel] ?? null,
    business_status: r.businessStatus ?? null,
    matched_name: rName,
    synced_at: TODAY,
  };
  console.log(`${v.id.padEnd(32)} ★${r.rating ?? "—"} (${r.userRatingCount ?? 0})  ${r.id.slice(0, 20)}…  ${Math.round(d)}m`);
});

fs.writeFileSync(STORE, JSON.stringify(store, null, 2));
console.log(`\n${Object.keys(store).length}/${venues.length} venues matched -> pipeline/places.json`);
for (const [id, why] of misses) console.log(`  MISS ${id.padEnd(30)} ${why}`);
