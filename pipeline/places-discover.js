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

// Circles that fill holes in the grid above. Derived from the raw sweep:
// 869 of 2,690 places found (32%) sat outside every circle — Text Search is
// not circle-bound, so it had been quietly covering for the grid. These
// cover the clusters of 3+ that it exposed.
const GAP_CIRCLES = [
  [49.0906, -123.0846, 350], // 12 places · Delta
  [49.2813, -123.0567, 350], // 11 places · Vancouver
  [49.1693, -122.5785, 350], // 11 places · Langley Twp
  [49.2085, -123.1402, 350], // 10 places · Vancouver
  [49.2117, -123.1405, 350], // 10 places · Vancouver
  [49.2306, -123.0065, 350], // 10 places · Burnaby
  [49.2628, -123.1387, 350], // 8 places · Vancouver
  [49.3094, -123.0741, 350], // 8 places · North Vancouver
  [49.2701, -123.147, 350], // 8 places · Vancouver
  [49.2637, -123.2096, 350], // 8 places · Vancouver
  [49.276, -123.0998, 350], // 7 places · Vancouver
  [49.2098, -123.1165, 350], // 7 places · Vancouver
  [49.2777, -122.8545, 350], // 7 places · Port Moody
  [49.3276, -123.1541, 350], // 7 places · West Vancouver
  [49.2775, -122.8492, 350], // 7 places · Port Moody
  [49.0901, -123.0796, 350], // 7 places · Ladner
  [49.2884, -123.1163, 350], // 6 places · Vancouver
  [49.2739, -123.0694, 350], // 6 places · Vancouver
  [49.2662, -123.0064, 350], // 6 places · Burnaby
  [49.1338, -122.844, 350], // 6 places · Surrey
  [49.0175, -122.7926, 350], // 6 places · White Rock
  [49.2118, -122.9196, 350], // 6 places · New Westminster
  [49.2696, -123.1068, 350], // 5 places · Vancouver
  [49.28, -123.1071, 350], // 5 places · Vancouver
  [49.2815, -123.0737, 350], // 5 places · Vancouver
  [49.2771, -123.0728, 350], // 5 places · Vancouver
  [49.2524, -122.7365, 350], // 5 places · Port Coquitlam
  [49.2794, -123.1122, 350], // 4 places · Vancouver
  [49.2869, -123.1418, 350], // 4 places · Vancouver
  [49.292, -123.1285, 350], // 4 places · Vancouver
  [49.2687, -123.1852, 350], // 4 places · Vancouver
  [49.1788, -123.1335, 350], // 4 places · Richmond
  [49.2318, -123.1187, 350], // 4 places · Vancouver
  [49.281, -123.0247, 350], // 4 places · Vancouver
  [49.2812, -123.0616, 350], // 4 places · Vancouver
  [49.3221, -123.1063, 350], // 4 places · North Vancouver
  [49.2566, -123.0067, 350], // 4 places · Burnaby
  [49.2811, -122.9979, 350], // 4 places · Burnaby
  [49.2296, -122.8928, 350], // 4 places · New Westminster
  [49.2781, -122.9101, 350], // 4 places · 9055 University High S
  [49.2717, -122.7559, 350], // 4 places · Port Coquitlam
  [49.2829, -122.8262, 350], // 4 places · Port Moody
  [49.1156, -122.6763, 350], // 4 places · Langley
  [49.104, -122.7995, 350], // 4 places · Surrey
  [49.1144, -122.6679, 350], // 4 places · Langley
  [49.1552, -122.9131, 350], // 4 places · Delta
  [49.2803, -123.1307, 350], // 3 places · Vancouver
  [49.2662, -123.1394, 350], // 3 places · Vancouver
  [49.2512, -123.1013, 350], // 3 places · Vancouver
  [49.234, -123.1401, 350], // 3 places · Vancouver
  [49.2041, -123.1349, 350], // 3 places · Vancouver
  [49.3059, -123.035, 350], // 3 places · North Vancouver
  [49.3129, -123.027, 350], // 3 places · North Vancouver
  [49.278, -122.8097, 350], // 3 places · Coquitlam
  [49.3338, -123.1818, 350], // 3 places · West Vancouver
  [49.2668, -123.0115, 350], // 3 places · Burnaby
  [49.2148, -122.9881, 350], // 3 places · Burnaby
  [49.1781, -123.1288, 350], // 3 places · Richmond
  [49.2527, -122.7672, 350], // 3 places · 1979 Brown St
  [49.2662, -122.7771, 350], // 3 places · Port Coquitlam
  [49.2739, -122.7966, 350], // 3 places · Coquitlam
  [49.2813, -122.7999, 350], // 3 places · Coquitlam
  [49.2766, -122.844, 350], // 3 places · Port Moody
  [49.1372, -122.8442, 350], // 3 places · Surrey
  [49.0604, -122.8028, 350], // 3 places · Surrey
  [49.0463, -122.7776, 350], // 3 places · Surrey
  [49.1046, -122.6515, 350], // 3 places · Langley
  [49.0164, -122.7853, 350], // 3 places · White Rock
  [49.0228, -122.8098, 350], // 3 places · White Rock
  [49.2053, -122.9039, 350], // 3 places · New Westminster
  [49.1863, -122.9562, 350], // 3 places · New Westminster
  [49.1177, -122.6703, 350], // 3 places · Langley
  [49.0789, -122.6517, 350], // 3 places · Langley
  [49.0245, -123.0692, 350], // 3 places · BC V4L 1X2
  // Dense pockets the clustering above cannot see: gap-filling only reveals
  // holes where Text Search happened to find something, so an area the grid
  // misses AND text ranks poorly stays invisible to both. Vancouver House /
  // Beach District was exactly that — 421m outside the nearest circle, one
  // place found within 250m, and Autostrada Osteria never discovered at all.
  [49.2744, -123.1311, 350], // Beach District / Vancouver House
  [49.2765, -123.1105, 350], // NE False Creek / Plaza of Nations
  [49.2680, -123.0930, 350], // Great Northern Way / Emily Carr
  [49.2330, -123.1180, 400], // Oakridge
  [49.2065, -123.0355, 400], // River District
  [49.2490, -123.1155, 350], // Cambie / King Edward
  [49.2385, -123.1855, 400], // Dunbar
  [49.2440, -123.1010, 350], // Main / 33rd
];

// Nearby Search caps at 20 results per CALL, not per circle — so asking for
// bars and restaurants together means the two compete for the same 20 slots,
// and "restaurant" is common enough that in 72 of 110 circles last run the
// bars never made the cut. Querying each family separately gives each its
// own 20 over the same ground, for one extra call per circle.
const TYPE_GROUPS = [
  ["bar", "pub", "wine_bar", "night_club"],
  ["restaurant"],
];

// Text Search ranks by relevance to the query rather than by proximity, so
// "happy hour <area>" surfaces places the type grid buries — and it bills to
// a different SKU than Nearby Search, so it draws on a quota the grid sweep
// never touches. Each area is a named place Google resolves itself.
const TEXT_AREAS = [
  "Downtown Vancouver", "Gastown Vancouver", "Yaletown Vancouver", "West End Vancouver",
  "Kitsilano Vancouver", "Mount Pleasant Vancouver", "Main Street Vancouver",
  "Commercial Drive Vancouver", "Olympic Village Vancouver", "Cambie Village Vancouver",
  "South Granville Vancouver", "Kerrisdale Vancouver", "Point Grey Vancouver",
  "Chinatown Vancouver", "Coal Harbour Vancouver", "Granville Island Vancouver",
  "Hastings-Sunrise Vancouver", "Marpole Vancouver", "UBC Vancouver",
  "North Vancouver BC", "Lynn Valley North Vancouver", "Deep Cove North Vancouver",
  "West Vancouver BC", "Ambleside West Vancouver",
  "Burnaby BC", "Metrotown Burnaby", "Brentwood Burnaby", "Burnaby Heights",
  "SFU Burnaby", "Richmond BC", "Steveston Richmond", "Coquitlam BC",
  "Port Coquitlam BC", "Port Moody BC", "Anmore BC", "Surrey BC",
  "Guildford Surrey", "Newton Surrey", "South Surrey BC", "White Rock BC",
  "New Westminster BC", "Langley BC", "Fort Langley BC", "Delta BC", "Ladner Delta BC",
];
// "happy hour <area>" massively outperformed the proximity grid (19.6% of
// its candidates published a happy hour, against 4.8% for the grid), so the
// rest of these are the same idea aimed at the venue categories that most
// often run one.
// The bar-shaped terms were blind to a whole category: Autostrada Osteria is
// typed italian_restaurant, matched none of them, and never cracked the top
// 20 for "happy hour <area>". Restaurants run happy hours too.
const DEFAULT_TEXT_QUERIES = [
  "happy hour", "pub", "cocktail bar", "sports bar", "izakaya",
  "tapas bar", "brewery taproom", "gastropub", "wine bar", "drink specials",
  "italian restaurant", "seafood restaurant", "steakhouse",
];
// --text-queries "a,b" runs only those, so adding a term to the list above
// does not mean re-billing every term already swept.
const TEXT_QUERIES = args["text-queries"]
  ? String(args["text-queries"]).split(",").map((q) => q.trim()).filter(Boolean)
  : DEFAULT_TEXT_QUERIES;
const TEXT_PAGES = Number(args["text-pages"]) || 2;
// Text Search is not bounded by a circle the way Nearby Search is, and
// "happy hour Delta BC" will happily return a bar in Delta, Ohio. Keep
// results inside Metro Vancouver.
// The 49th parallel IS the border here, and a box that dipped below it let
// a wine bar in Blaine, Washington into a Vancouver app. Latitude alone is
// not enough either — Point Roberts is Canadian-adjacent but American — so
// the address has to say Canada too.
const METRO = { minLat: 49.0, maxLat: 49.42, minLng: -123.35, maxLng: -122.35 };
const inMetro = (p) => {
  const l = p.location;
  if (!l || l.latitude < METRO.minLat || l.latitude > METRO.maxLat) return false;
  if (l.longitude < METRO.minLng || l.longitude > METRO.maxLng) return false;
  return !/\b(USA|United States|WA \d{5})\b/i.test(p.formattedAddress || "");
};
const EXCLUDE_TYPES = new Set(["fast_food_restaurant", "cafe", "coffee_shop", "bakery", "meal_takeaway", "meal_delivery", "ice_cream_shop", "sandwich_shop"]);
const BAR_TYPES = new Set(["bar", "pub", "wine_bar", "night_club"]);
const PRICE_LEVELS = { PRICE_LEVEL_FREE: 0, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 };
const FIELDS = "places.id,places.displayName,places.location,places.formattedAddress,places.websiteUri,places.rating,places.userRatingCount,places.priceLevel,places.businessStatus,places.types,places.primaryType,places.nationalPhoneNumber,places.outdoorSeating,places.servesCocktails,places.servesBeer,places.servesWine,places.liveMusic,places.goodForGroups";

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

// Google's free allowance is per SKU per calendar month, and a sweep that
// silently runs long is how that turns into a bill. Usage is tracked across
// runs so any caller — including an unattended driver loop — stops at the
// ceiling instead of trusting whoever wrote the command line.
const USAGE = path.join(REPO_ROOT, "pipeline", "api-usage.json");
const MONTH = new Date().toISOString().slice(0, 7);
const MONTHLY_CAP = Number(args["monthly-cap"]) || 950; // free tier is 1000/SKU; leave headroom
const usage = readJson(USAGE, {});
usage[MONTH] = usage[MONTH] || { nearby: 0, text: 0 };
const spentBefore = { ...usage[MONTH] };
const overBudget = (sku) => usage[MONTH][sku] >= MONTHLY_CAP;
let skipped = { nearby: 0, text: 0 };
// Persist as we go, not at the end. A sweep that is killed or crashes has
// still SPENT its calls, and a ledger that only records on clean exit would
// hand the next run a budget that has already been used.
const saveUsage = () => { try { fs.writeFileSync(USAGE, JSON.stringify(usage, null, 2)); } catch {} };
const spend = (sku) => { usage[MONTH][sku]++; if (usage[MONTH][sku] % 10 === 0) saveUsage(); };
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { saveUsage(); process.exit(130); });
process.on("exit", saveUsage);

const byId = new Map();
// The raw sweep is the expensive part: hundreds of billable Places calls.
// Persisting it means a change to the filters below — which drop three
// quarters of what the sweep returns — can be re-applied for free instead
// of re-billing the whole metro. --from-raw reuses the last sweep.
const RAW = path.join(RESULTS_DIR, "places-raw.json");
if (args["from-raw"]) {
  const raw = readJson(RAW, []);
  if (!raw.length) { console.error(`No cached sweep at ${RAW} — run without --from-raw first.`); process.exit(1); }
  for (const p of raw) byId.set(p.id, p);
  console.log(`${byId.size} places from the cached sweep (no API calls).`);
} else {
  // Google's free monthly allowance is per SKU, so the two sweeps draw on
  // separate quotas — but both are worth counting out loud, because a run that
  // silently doubled its call count is how a free tier turns into a bill.
  const calls = { nearby: 0, text: 0 };
  let saturated = 0;

  // ── Sweep 1: Nearby Search over the circle grid, one call per type family ──
    // --only-gaps sweeps just the new circles. The originals were swept into
  // places-raw.json already, and re-running them would spend the month's
  // Nearby quota re-finding what the cache already holds.
  const sweepCircles = args["only-gaps"] ? GAP_CIRCLES : [...CIRCLES, ...GAP_CIRCLES];
  const NEARBY_JOBS = sweepCircles.flatMap(([lat, lng, radius]) =>
    TYPE_GROUPS.map((types) => ({ lat, lng, radius, types }))
  );
  await mapConcurrent(NEARBY_JOBS, 4, async ({ lat, lng, radius, types }) => {
    let data;
    if (overBudget("nearby")) { skipped.nearby++; return; }
    try {
      calls.nearby++; spend("nearby");
      data = await curlJson("https://places.googleapis.com/v1/places:searchNearby", {
        headers: [`X-Goog-Api-Key: ${KEY}`, `X-Goog-FieldMask: ${FIELDS}`],
        body: {
          includedTypes: types,
          maxResultCount: 20,
          locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } },
        },
      });
    } catch (e) {
      console.error(`circle ${lat},${lng} [${types[0]}]: ${e.message.slice(0, 80)}`);
      return;
    }
    if (data.error) { console.error(`circle ${lat},${lng} [${types[0]}]: ${data.error.status}`); return; }
    const places = data.places || [];
    if (places.length === 20) saturated++;
    for (const p of places) byId.set(p.id, p);
  });
  const afterNearby = byId.size;
  console.log(`${afterNearby} places from ${NEARBY_JOBS.length} nearby calls over ${sweepCircles.length} circles (${saturated} still saturated at 20).`);

  // ── Sweep 2: Text Search, ranked by happy-hour relevance ──────────────────
  const TEXT_JOBS = TEXT_AREAS.flatMap((area) => TEXT_QUERIES.map((q) => `${q} ${area}`));
  await mapConcurrent(TEXT_JOBS, 4, async (textQuery) => {
    let pageToken = null;
    for (let page = 0; page < TEXT_PAGES; page++) {
      let data;
      try {
        if (overBudget("text")) { skipped.text++; return; }
      calls.text++; spend("text");
        data = await curlJson("https://places.googleapis.com/v1/places:searchText", {
          headers: [`X-Goog-Api-Key: ${KEY}`, `X-Goog-FieldMask: ${FIELDS},nextPageToken`],
          body: { textQuery, pageSize: 20, ...(pageToken ? { pageToken } : {}) },
        });
      } catch (e) {
        console.error(`text "${textQuery}": ${e.message.slice(0, 80)}`);
        return;
      }
      if (data.error) { console.error(`text "${textQuery}": ${data.error.status}`); return; }
      for (const p of data.places || []) if (inMetro(p)) byId.set(p.id, p);
      pageToken = data.nextPageToken;
      if (!pageToken) return;
    }
  });
  console.log(`+${byId.size - afterNearby} more from ${calls.text} text-search calls over ${TEXT_AREAS.length} areas.`);
  console.log(`${byId.size} unique places total (${calls.nearby} nearby + ${calls.text} text calls).`);
  fs.writeFileSync(USAGE, JSON.stringify(usage, null, 2));
  console.log(`${MONTH} Places usage: nearby ${spentBefore.nearby}->${usage[MONTH].nearby}, text ${spentBefore.text}->${usage[MONTH].text} (cap ${MONTHLY_CAP}/SKU).`);
  if (skipped.nearby || skipped.text) {
    console.log(`!! MONTHLY CAP HIT — skipped ${skipped.nearby} nearby and ${skipped.text} text calls. This sweep is incomplete.`);
  }
  // Merge rather than replace: a later sweep may use a narrower query set
  // (to stay inside the month's quota) and must not shrink the cache that
  // --from-raw re-filters against.
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const merged = new Map(readJson(RAW, []).map((x) => [x.id, x]));
  for (const [id, place] of byId) merged.set(id, place);
  fs.writeFileSync(RAW, JSON.stringify([...merged.values()]));
  console.log(`raw sweep cache: ${merged.size} places (${merged.size - byId.size} carried over from earlier sweeps).`);
  for (const [id, place] of merged) byId.set(id, place);
}

const candidates = [];
const dropped = { known: 0, screened: 0, no_website: 0, closed: 0, wrong_type: 0 };
for (const p of byId.values()) {
  const name = p.displayName?.text || "";
  const types = p.types || [];
  if (knownPlaceIds.has(p.id) || knownNames.has(normName(name)) || knownHosts.has(host(p.websiteUri))) { dropped.known++; continue; }
  if (screenedRecently.has(p.id)) { dropped.screened++; continue; }
  if (p.businessStatus && p.businessStatus !== "OPERATIONAL") { dropped.closed++; continue; }
  if (!p.websiteUri) { dropped.no_website++; continue; }
  // Google attaches every loosely-applicable type, so a full-service
  // restaurant that also sells coffee carries "cafe" and was being dropped
  // outright — 505 places in the last sweep. Judge non-bars on primaryType,
  // which is what Google considers the place actually is.
  const isBar = types.some((t) => BAR_TYPES.has(t));
  if (!isBar && (EXCLUDE_TYPES.has(p.primaryType || "") || !types.includes("restaurant"))) { dropped.wrong_type++; continue; }

  // Metro means the city varies — take it from the Places address instead of
  // stamping every venue "Vancouver, BC". Anchor on the province rather than
  // a fixed slot: Google writes food courts, building names, floors and unit
  // numbers as their own comma parts ("food court, 4567 Lougheed Hwy 2nd
  // floor, Burnaby, BC V5C 3Z6, Canada"), so parts[1] is the city only for
  // the simplest addresses and is the street for everything else.
  const parts = (p.formattedAddress || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (parts.length && /^canada$/i.test(parts[parts.length - 1])) parts.pop();
  const provIdx = parts.findIndex((x) => /^(BC|British Columbia)\b/i.test(x));
  const cityIdx = provIdx > 0 ? provIdx - 1 : parts.length - 1;
  const picked = parts[cityIdx] || "";
  // A province-only address ("British Columbia, Canada") has no city slot.
  const city = !picked || /^(BC|British Columbia)\b/i.test(picked) ? "Vancouver" : picked;
  const street = parts.slice(0, cityIdx).join(", ");
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
