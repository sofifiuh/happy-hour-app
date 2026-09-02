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

  // --- Metro Vancouver. Vancouver proper is close to swept, so daily
  // discovery needs the rest of the metro. Radii here match the DOWNTOWN
  // density (300-500m), not the wide 700-900m circles used at first:
  // Nearby Search caps at 20 results, so a wide circle over a busy suburban
  // strip returns 20 places and hides everything else behind them.

  // UBC / University Endowment Lands
  [49.2680, -123.2550, 400], [49.2665, -123.2470, 400], // campus, University Village
  [49.2495, -123.2340, 400],                            // Wesbrook Village
  // SFU Burnaby Mountain
  [49.2790, -122.9170, 400], [49.2805, -122.9200, 350], // UniverCity, campus core
  // Burnaby
  [49.2270, -122.9990, 400], [49.2280, -122.9950, 350], // Metrotown, Crystal Mall
  [49.2665, -122.9990, 400], [49.2810, -123.0150, 400], // Brentwood, Burnaby Heights
  [49.2490, -122.8960, 400], [49.2130, -122.9560, 400], // Lougheed, Edmonds
  [49.2200, -122.9640, 350], [49.2320, -123.0170, 400], // Highgate, Kingsway/Boundary
  [49.2450, -122.9970, 400], [49.2000, -122.9500, 450], // Willingdon, Big Bend
  // Richmond
  [49.1670, -123.1370, 400], [49.1720, -123.1360, 350], // Richmond Centre, Lansdowne
  [49.1840, -123.1360, 400], [49.1720, -123.1310, 350], // Aberdeen, Alexandra Rd
  [49.1940, -123.1350, 400], [49.1690, -123.1400, 350], // Bridgeport, Ackroyd
  [49.1250, -123.1810, 400], [49.1380, -123.1200, 450], // Steveston, Ironwood
  // North & West Vancouver
  [49.3100, -123.0830, 400], [49.3230, -123.0720, 400], // Lonsdale Quay, Central Lonsdale
  [49.3350, -123.0720, 400], [49.3390, -123.0630, 400], // Upper Lonsdale, Edgemont
  [49.3290, -122.9490, 400], [49.3330, -123.0400, 400], // Deep Cove, Lynn Valley
  [49.3260, -123.1400, 400], [49.3270, -123.1600, 400], // Park Royal, Ambleside
  [49.3280, -123.1780, 350],                            // Dundarave
  // Coquitlam / Port Coquitlam
  [49.2790, -122.7930, 450], [49.2620, -122.8760, 400], // Coquitlam Centre, Austin Heights
  [49.2600, -122.8900, 400], [49.2620, -122.7810, 400], // Burquitlam, PoCo downtown
  [49.2450, -122.8600, 400],                            // Maillardville
  // Port Moody
  [49.2830, -122.8480, 400], [49.2790, -122.8330, 400], // Brewers Row, Newport Village
  [49.2830, -122.8560, 350],                            // Moody Centre
  // Anmore
  [49.3160, -122.8560, 600],                            // village (small - wide radius)
  // Surrey
  [49.1890, -122.8480, 450], [49.1830, -122.8450, 400], // Surrey Central, Whalley
  [49.1880, -122.8020, 450], [49.1040, -122.8250, 450], // Guildford, Newton
  [49.1740, -122.7900, 450], [49.1060, -122.7250, 450], // Fleetwood, Cloverdale
  [49.0450, -122.7950, 450], [49.0400, -122.7800, 450], // Morgan Crossing, Grandview
  // White Rock
  [49.0230, -122.8030, 400], [49.0230, -122.7860, 400], // West Beach, East Beach
  [49.0290, -122.8020, 350],                            // Johnston Rd uptown
  // New Westminster / Langley / Delta (kept from the first metro pass)
  [49.2010, -122.9120, 450], [49.2260, -122.8880, 400],
  [49.1040, -122.6600, 500], [49.0840, -123.0580, 600], [49.0110, -123.0810, 600],
];

const INCLUDED_TYPES = ["bar", "pub", "wine_bar", "night_club", "restaurant"];
const EXCLUDE_TYPES = new Set(["fast_food_restaurant", "cafe", "coffee_shop", "bakery", "meal_takeaway", "meal_delivery", "ice_cream_shop", "sandwich_shop"]);
const BAR_TYPES = new Set(["bar", "pub", "wine_bar", "night_club"]);
const PRICE_LEVELS = { PRICE_LEVEL_FREE: 0, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 };
const FIELDS = "places.id,places.displayName,places.location,places.formattedAddress,places.websiteUri,places.rating,places.userRatingCount,places.priceLevel,places.businessStatus,places.types,places.nationalPhoneNumber,places.outdoorSeating,places.servesCocktails,places.servesBeer,places.servesWine,places.liveMusic,places.goodForGroups";

// Known venues: exact place_id dedupe plus name/website fallback.
const seed = loadSeed();
const discovered = readJson(path.join(REPO_ROOT, "pipeline", "discovered.json"), []);
const placesStore = readJson(path.join(REPO_ROOT, "pipeline", "places.json"), {});
const knownPlaceIds = new Set(Object.values(placesStore).map((p) => p.place_id));
// Every place_id we have already crawled and judged, so a daily run spends
// its budget on genuinely new places instead of re-confirming yesterday's
// negatives. Entries carry a verdict + date; negatives are eligible again
// after RECHECK_DAYS because a venue can start a happy hour later.
const SCREENED_STORE = path.join(REPO_ROOT, "pipeline", "screened.json");
const RECHECK_DAYS = Number(args["recheck-days"]) || 90;
const screened = readJson(SCREENED_STORE, {});
const staleBefore = new Date(Date.now() - RECHECK_DAYS * 86400000).toISOString().slice(0, 10);
// Only NEGATIVE verdicts suppress a re-crawl. A venue we judged
// "published" is deduped by knownPlaceIds once it is actually in the store —
// and if a run was interrupted before writeback, it will not be, so it must
// stay discoverable rather than be silently skipped forever.
const NEGATIVE = new Set(["no_happy_hour", "hours_only", "error"]);
const screenedRecently = new Set(
  Object.entries(screened)
    .filter(([, r]) => NEGATIVE.has(r.verdict) && (r.checked_at || "0000-00-00") > staleBefore)
    .map(([placeId]) => placeId)
);
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
const dropped = { known: 0, screened: 0, no_website: 0, closed: 0, wrong_type: 0 };
for (const p of byId.values()) {
  const name = p.displayName?.text || "";
  const types = p.types || [];
  if (knownPlaceIds.has(p.id) || knownNames.has(normName(name)) || knownHosts.has(host(p.websiteUri))) { dropped.known++; continue; }
  if (screenedRecently.has(p.id)) { dropped.screened++; continue; }
  if (p.businessStatus && p.businessStatus !== "OPERATIONAL") { dropped.closed++; continue; }
  if (!p.websiteUri) { dropped.no_website++; continue; }
  if (types.some((t) => EXCLUDE_TYPES.has(t)) && !types.some((t) => BAR_TYPES.has(t))) { dropped.wrong_type++; continue; }

  // Metro means the city varies — take it from the Places address instead of
  // stamping every venue "Vancouver, BC".
  const parts = (p.formattedAddress || "").split(",").map((x) => x.trim());
  const street = parts[0] || "";
  const city = parts[1] || "Vancouver";
  candidates.push({
    id: normName(name).replace(/ /g, "-"),
    name,
    website: p.websiteUri,
    formatted_address: `${street ? street + ", " : ""}${city}, BC`,
    address_components: null,
    geometry: { location: { lat: p.location.latitude, lng: p.location.longitude } },
    formatted_phone_number: p.nationalPhoneNumber || null,
    places: {
      place_id: p.id,
      rating: p.rating ?? null,
      user_ratings_total: p.userRatingCount ?? null,
      price_level: PRICE_LEVELS[p.priceLevel] ?? null,
      business_status: p.businessStatus ?? null,
      amenities: {
        outdoor_seating: p.outdoorSeating ?? null,
        serves_cocktails: p.servesCocktails ?? null,
        serves_beer: p.servesBeer ?? null,
        serves_wine: p.servesWine ?? null,
        live_music: p.liveMusic ?? null,
        good_for_groups: p.goodForGroups ?? null,
      },
      matched_name: name,
      synced_at: new Date().toISOString().slice(0, 10),
    },
    place_id: p.id,
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
