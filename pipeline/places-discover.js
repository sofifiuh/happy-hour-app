// Phase 7: large-scale discovery via Places API (New) Nearby Search.
// A grid of circles over Vancouver's bar/restaurant neighbourhoods; each
// request returns up to 20 places with identity + website + rating in one
// shot. place_id gives exact dedupe against venues already in the app.
//
// Output: pipeline/results/discovered-candidates.json — same stub shape the
// crawl/extract --venues path consumes. Candidates carry a `places` object
// so writeback can fill pipeline/places.json on acceptance without a second
// API pass. Happy-hour facts still come ONLY from each venue's own site.
//
// Usage: node pipeline/places-discover.js [--max 260]
import fs from "node:fs";
import path from "node:path";
import { loadSeed, readJson, normName, RESULTS_DIR, REPO_ROOT } from "./lib/venues.js";
import { curlJson, mapConcurrent } from "./lib/curl.js";
import { parseArgs } from "./lib/venues.js";

const args = parseArgs(process.argv.slice(2));
const MAX = Number(args.max) || 260;
const KEY = process.env.GOOGLE_PLACES_API_KEY || readJson(path.join(REPO_ROOT, "pipeline", "secrets.json"), {}).GOOGLE_PLACES_API_KEY;
if (!KEY) { console.error("No GOOGLE_PLACES_API_KEY — cannot discover."); process.exit(1); }

// Neighbourhood circles (lat, lng, radius m). Dense areas get small radii
// because Nearby Search caps at 20 results per request.
const CIRCLES = [
  // Downtown core / Robson / Granville strip
  [49.2827, -123.1207, 320], [49.2852, -123.1152, 300], [49.2872, -123.1252, 300],
  [49.2800, -123.1262, 280], [49.2782, -123.1266, 250], [49.2868, -123.1312, 280],
  // Gastown / Chinatown / Railtown
  [49.2840, -123.1065, 300], [49.2843, -123.0990, 300], [49.2795, -123.1005, 300],
  // Yaletown
  [49.2745, -123.1215, 280], [49.2770, -123.1170, 250],
  // Coal Harbour
  [49.2900, -123.1230, 350], [49.2892, -123.1320, 350],
  // West End / Davie / Denman
  [49.2832, -123.1342, 320], [49.2802, -123.1402, 320], [49.2902, -123.1402, 350],
  // Granville Island / Olympic Village
  [49.2712, -123.1342, 300], [49.2665, -123.1140, 350],
  // Mount Pleasant / Main / Cambie
  [49.2650, -123.1010, 400], [49.2580, -123.1010, 400], [49.2632, -123.1155, 350],
  // Kitsilano / West Broadway
  [49.2682, -123.1552, 450], [49.2638, -123.1672, 450], [49.2632, -123.1452, 400],
  // Commercial Drive
  [49.2692, -123.0700, 450], [49.2622, -123.0695, 450],
  // Offset ring: the dense circles saturate at Nearby Search's 20-result
  // cap, so a second staggered pass surfaces what the first grid hid.
  [49.2815, -123.1180, 250], [49.2840, -123.1220, 250], [49.2860, -123.1190, 250],
  [49.2790, -123.1230, 250], [49.2830, -123.1100, 250], [49.2855, -123.1040, 250],
  [49.2820, -123.1030, 250], [49.2760, -123.1195, 250], [49.2755, -123.1240, 250],
  [49.2845, -123.1290, 250], [49.2885, -123.1275, 280], [49.2815, -123.1370, 280],
  [49.2782, -123.1330, 280], [49.2650, -123.1060, 300], [49.2605, -123.1010, 300],
  [49.2660, -123.1500, 350], [49.2635, -123.1560, 350],
  // Round 3: adjacent neighbourhoods beyond the core grid.
  [49.3095, -123.0815, 400], [49.3230, -123.0720, 450], // Lower + Central Lonsdale (North Van)
  [49.2810, -123.0440, 450], [49.2570, -123.0660, 450], // Hastings-Sunrise, Victoria Dr
  [49.2490, -123.0905, 450], [49.2440, -123.1010, 450], // Fraser St, South Main
  [49.2570, -123.1150, 400], [49.2580, -123.1390, 400], // Cambie Village, South Granville
  [49.2640, -123.1860, 450], [49.2340, -123.1550, 450], // Point Grey W10th, Kerrisdale
];

const INCLUDED_TYPES = ["bar", "pub", "wine_bar", "night_club", "restaurant"];
const EXCLUDE_TYPES = new Set(["fast_food_restaurant", "cafe", "coffee_shop", "bakery", "meal_takeaway", "meal_delivery", "ice_cream_shop", "sandwich_shop"]);
const BAR_TYPES = new Set(["bar", "pub", "wine_bar", "night_club"]);
const PRICE_LEVELS = { PRICE_LEVEL_FREE: 0, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 };
const FIELDS = "places.id,places.displayName,places.location,places.formattedAddress,places.websiteUri,places.rating,places.userRatingCount,places.priceLevel,places.businessStatus,places.types,places.nationalPhoneNumber";

// Known venues: exact place_id dedupe plus name/website fallback.
const seed = loadSeed();
const discovered = readJson(path.join(REPO_ROOT, "pipeline", "discovered.json"), []);
const placesStore = readJson(path.join(REPO_ROOT, "pipeline", "places.json"), {});
const knownPlaceIds = new Set(Object.values(placesStore).map((p) => p.place_id));
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return null; } };
const knownHosts = new Set([...seed, ...discovered].map((v) => host(v.website)).filter(Boolean));
const knownNames = new Set([...seed, ...discovered].map((v) => normName(v.name)));

const byId = new Map();
let saturated = 0;
await mapConcurrent(CIRCLES, 4, async ([lat, lng, radius]) => {
  let data;
  try {
    data = await curlJson("https://places.googleapis.com/v1/places:searchNearby", {
      headers: [`X-Goog-Api-Key: ${KEY}`, `X-Goog-FieldMask: ${FIELDS}`],
      body: {
        includedTypes: INCLUDED_TYPES,
        maxResultCount: 20,
        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } },
      },
    });
  } catch (e) {
    console.error(`circle ${lat},${lng}: ${e.message.slice(0, 80)}`);
    return;
  }
  if (data.error) { console.error(`circle ${lat},${lng}: ${data.error.status}`); return; }
  const places = data.places || [];
  if (places.length === 20) saturated++;
  for (const p of places) byId.set(p.id, p);
});

console.log(`${byId.size} unique places from ${CIRCLES.length} circles (${saturated} saturated at 20 — dense spots may hide a few).`);

const candidates = [];
const dropped = { known: 0, no_website: 0, closed: 0, wrong_type: 0 };
for (const p of byId.values()) {
  const name = p.displayName?.text || "";
  const types = p.types || [];
  if (knownPlaceIds.has(p.id) || knownNames.has(normName(name)) || knownHosts.has(host(p.websiteUri))) { dropped.known++; continue; }
  if (p.businessStatus && p.businessStatus !== "OPERATIONAL") { dropped.closed++; continue; }
  if (!p.websiteUri) { dropped.no_website++; continue; }
  if (types.some((t) => EXCLUDE_TYPES.has(t)) && !types.some((t) => BAR_TYPES.has(t))) { dropped.wrong_type++; continue; }

  const street = (p.formattedAddress || "").split(",")[0];
  candidates.push({
    id: normName(name).replace(/ /g, "-"),
    name,
    website: p.websiteUri,
    formatted_address: `${street ? street + ", " : ""}Vancouver, BC`,
    address_components: null,
    geometry: { location: { lat: p.location.latitude, lng: p.location.longitude } },
    formatted_phone_number: p.nationalPhoneNumber || null,
    places: {
      place_id: p.id,
      rating: p.rating ?? null,
      user_ratings_total: p.userRatingCount ?? null,
      price_level: PRICE_LEVELS[p.priceLevel] ?? null,
      business_status: p.businessStatus ?? null,
      matched_name: name,
      synced_at: new Date().toISOString().slice(0, 10),
    },
    isBar: types.some((t) => BAR_TYPES.has(t)),
  });
}

// Bars/pubs first (highest happy-hour likelihood), then by review volume.
candidates.sort((a, b) => (b.isBar - a.isBar) || ((b.places.user_ratings_total || 0) - (a.places.user_ratings_total || 0)));
// De-dupe slug collisions (chains) by suffixing.
const seenIds = new Set();
for (const c of candidates) {
  let id = c.id, n = 2;
  while (seenIds.has(id)) id = `${c.id}-${n++}`;
  seenIds.add(id);
  c.id = id;
  delete c.isBar;
}
const batch = candidates.slice(0, MAX);

fs.mkdirSync(RESULTS_DIR, { recursive: true });
fs.writeFileSync(path.join(RESULTS_DIR, "discovered-candidates.json"), JSON.stringify(batch, null, 2));
console.log(`${candidates.length} new candidates (dropped: ${JSON.stringify(dropped)}); batch of ${batch.length} -> results/discovered-candidates.json`);
console.log("Top 10:", batch.slice(0, 10).map((c) => c.name).join(" · "));
