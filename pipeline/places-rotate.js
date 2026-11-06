// Daily discovery that fits inside Google's free tier, every day.
//
// Why this exists: places-discover.js sweeps the whole region in one go
// (~1,300 calls). Since 2026-10-29 the Places API daily quotas are set to
// the free allowance spread over a month (SearchText 160/day, SearchNearby
// 160/day, GetPlace 32/day), so every night the first ~160 calls landed on
// the same downtown circles and queries, Google rejected the other ~1,100
// with RESOURCE_EXHAUSTED, nothing new was found, and the map stopped growing
// on 2026-10-26.
//
// This script instead takes a small slice each day and remembers where it
// got to (pipeline/sweep-state.json, committed), so the whole region gets
// covered over a few weeks and newly added cities are reached first.
//
// It buys websites in the search itself (Text/Nearby Search *Enterprise*
// field masks: 20 places with websiteUri per call) instead of one Place
// Details call per place. Those two SKUs each carry their own free 1,000
// calls a month and nothing else in the app uses them.
//
// Budget (strict free tier, verified on Google's pricing page 2026-11-03):
//   Text Search Enterprise    free 1,000/month -> cap 900, at most 29/day
//   Nearby Search Enterprise  free 1,000/month -> cap 900, at most 29/day
// Both stay inside the 160/day project quotas with room for guest
// submissions' lookups. Only calls Google accepted are counted: a rejected
// call is not billed, and counting it (as the old ledger did) burns the
// month's budget on nothing.
//
// Output: pipeline/results/discovered-candidates.json (what daily.js reads),
// and pipeline/candidate-pool.json, the places found but not yet judged, so a
// day's finds survive until extraction gets to them.
//
// Usage: node pipeline/places-rotate.js [--text 29] [--nearby 29] [--burst] [--dry-run]
//   --burst spends up to --text/--nearby today from what is left of the month,
//   instead of spreading it evenly over the remaining days (a one-off catch-up).
//   The monthly free-tier caps (900 per SKU) still hold.
import fs from "node:fs";
import path from "node:path";
import { loadSeed, readJson, normName, parseArgs, RESULTS_DIR, REPO_ROOT } from "./lib/venues.js";
import { curlJson, mapConcurrent } from "./lib/curl.js";
import { inRegion } from "./lib/region.js";
import { toCandidate, isWantedType } from "./lib/places-candidate.js";

const args = parseArgs(process.argv.slice(2));
const DRY = !!args["dry-run"];
const KEY = process.env.GOOGLE_PLACES_API_KEY || readJson(path.join(REPO_ROOT, "pipeline", "secrets.json"), {}).GOOGLE_PLACES_API_KEY;
if (!KEY && !DRY) { console.error("No GOOGLE_PLACES_API_KEY — cannot discover."); process.exit(1); }

const TODAY = new Date().toISOString().slice(0, 10);
const MONTH = TODAY.slice(0, 7);
// A query or circle is not re-run within this many days. New venues open
// slowly; re-asking Google sooner only re-finds what the pool already has.
const COOLDOWN_DAYS = Number(args["cooldown-days"]) || 30;
const RECHECK_DAYS = Number(args["recheck-days"]) || 90;

// ── Where to look ──────────────────────────────────────────────────────────
// New areas come first in every query round, so a city added here is
// reached within a day or two instead of after the whole metro.
const NEW_AREAS = [
  // Metro Vancouver gaps: venues already turn up here, never searched by name.
  "Maple Ridge BC", "Pitt Meadows BC", "Tsawwassen BC", "Walnut Grove Langley BC",
  "Willoughby Langley BC", "Langley City BC", "Fleetwood Surrey BC", "Cloverdale Surrey BC",
  "Queensborough New Westminster BC", "Sapperton New Westminster BC", "Edgemont North Vancouver",
  // Fraser Valley.
  "Abbotsford BC", "Downtown Abbotsford BC", "Mission BC", "Chilliwack BC",
  "Downtown Chilliwack BC", "Sardis Chilliwack BC", "Harrison Hot Springs BC",
  // Sea-to-Sky.
  "Squamish BC", "Whistler BC", "Whistler Village BC",
  // Calgary (2026-11). Shares the same free budget as everything above.
  "Downtown Calgary AB", "Beltline Calgary AB", "17th Avenue SW Calgary AB",
  "Kensington Calgary AB", "Mission 4th Street Calgary AB", "Inglewood Calgary AB",
  "East Village Calgary AB", "Bridgeland Calgary AB", "Marda Loop Calgary AB",
  "Calgary AB", "Northwest Calgary AB", "South Calgary AB", "Northeast Calgary AB",
  "Airdrie AB", "Cochrane AB", "Okotoks AB",
];
// Swept before (places-discover.js); revisited after the new areas.
const METRO_AREAS = [
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
  "Port Coquitlam BC", "Port Moody BC", "Surrey BC",
  "Guildford Surrey", "Newton Surrey", "South Surrey BC", "White Rock BC",
  "New Westminster BC", "Langley BC", "Fort Langley BC", "Delta BC", "Ladner Delta BC",
];
// Highest yield first: "happy hour <area>" published a happy hour for 19.6%
// of its candidates, against 4.8% for the proximity grid.
const QUERIES = [
  "happy hour", "pub", "cocktail bar", "wine bar", "brewery taproom", "sports bar",
  "gastropub", "izakaya", "lounge", "tapas bar", "drink specials", "hotel bar",
  "italian restaurant", "seafood restaurant", "steakhouse", "sushi restaurant",
  "mexican restaurant", "rooftop patio",
];
// Nearby Search circles over the new areas' main strips (lat, lng, radius m).
// Metro Vancouver's grid lives in places-discover.js and was swept already.
// Calgary's core strips are at the end.
const NEW_CIRCLES = [
  [49.2193, -122.6018, 600], // Maple Ridge downtown
  [49.2210, -122.6890, 500], // Pitt Meadows
  [49.0170, -123.0830, 600], // Tsawwassen
  [49.0377, -123.0886, 500], // Tsawwassen Mills
  [49.1640, -122.6400, 600], // Walnut Grove
  [49.1440, -122.6800, 500], // Willoughby / Langley Events Centre
  [49.0505, -122.3045, 600], // Abbotsford downtown
  [49.0420, -122.2710, 600], // Abbotsford Highstreet / Sumas Way
  [49.0510, -122.3290, 600], // Abbotsford South Fraser Way
  [49.1330, -122.3090, 700], // Mission
  [49.1579, -121.9515, 600], // Chilliwack downtown
  [49.1050, -121.9600, 700], // Sardis / Vedder
  [49.3010, -121.7850, 600], // Harrison Hot Springs
  [49.7016, -123.1558, 600], // Squamish downtown
  [49.7380, -123.1180, 600], // Squamish Garibaldi Estates
  [50.1163, -122.9574, 500], // Whistler Village
  [50.1170, -122.9480, 400], // Whistler Upper Village
  [50.0950, -122.9900, 500], // Whistler Creekside
  [51.0450, -114.0650, 600], // Calgary downtown / Stephen Ave
  [51.0380, -114.0750, 600], // Calgary 17th Ave SW / Beltline
  [51.0530, -114.0880, 500], // Kensington
  [51.0330, -114.0710, 500], // Mission / 4th St SW
  [51.0380, -114.0230, 500], // Inglewood
  [51.0450, -114.0450, 500], // East Village
];
const TYPE_GROUPS = [["bar", "pub", "wine_bar", "night_club", "brewery", "winery"], ["restaurant"]];

const textJobs = QUERIES.flatMap((q) => [...NEW_AREAS, ...METRO_AREAS].map((a) => ({ key: `text:${q} ${a}`, sku: "text_enterprise", q: `${q} ${a}` })));
const nearbyJobs = NEW_CIRCLES.flatMap(([lat, lng, radius]) =>
  TYPE_GROUPS.map((types) => ({ key: `nearby:${lat},${lng},${radius}:${types[0]}`, sku: "nearby_enterprise", lat, lng, radius, types })));

// ── Budget ────────────────────────────────────────────────────────────────
const USAGE = path.join(REPO_ROOT, "pipeline", "api-usage.json");
// Free tier only (Jason, 2026-11-06: "I want to sit inside the free plan").
// Google gives 1,000 free calls per SKU a month; 900 leaves room for guest
// submissions. Do not add a way to raise this.
const MONTH_CAP = { text_enterprise: 900, nearby_enterprise: 900 };
const DAY_CAP = { text_enterprise: Number(args.text ?? 29), nearby_enterprise: Number(args.nearby ?? 29) };
const usage = readJson(USAGE, {});
usage[MONTH] = { text_enterprise: 0, nearby_enterprise: 0, ...usage[MONTH] };
usage.daily = usage.daily || {};
// Keep a fortnight of daily rows; the monthly totals are the ledger.
for (const d of Object.keys(usage.daily)) if (d < new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)) delete usage.daily[d];
usage.daily[TODAY] = { text_enterprise: 0, nearby_enterprise: 0, ...usage.daily[TODAY] };
const daysLeft = (() => {
  const d = new Date(TODAY + "T00:00:00Z");
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  return last - d.getUTCDate() + 1;
})();
// Spread what is left of the month evenly, so a late start can't overspend
// and an early burst can't starve the end of the month.
const allowance = (sku) => {
  const monthLeft = Math.max(0, MONTH_CAP[sku] - usage[MONTH][sku]);
  const spread = args.burst ? monthLeft : Math.floor(monthLeft / daysLeft) || (monthLeft > 0 ? 1 : 0);
  const today = Math.min(DAY_CAP[sku], spread);
  return Math.max(0, today - usage.daily[TODAY][sku]);
};
const saveUsage = () => { if (!DRY) fs.writeFileSync(USAGE, JSON.stringify(usage, null, 2) + "\n"); };

// ── State: which jobs ran when ────────────────────────────────────────────
const STATE = path.join(REPO_ROOT, "pipeline", "sweep-state.json");
const state = readJson(STATE, { last_run: {} });
const cooledBefore = new Date(Date.now() - COOLDOWN_DAYS * 86400000).toISOString().slice(0, 10);
const due = (jobs) => jobs.filter((j) => !state.last_run[j.key] || state.last_run[j.key] <= cooledBefore);

// ── What we already know ──────────────────────────────────────────────────
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return null; } };
const seed = loadSeed();
const discovered = readJson(path.join(REPO_ROOT, "pipeline", "discovered.json"), []);
const placesStore = readJson(path.join(REPO_ROOT, "pipeline", "places.json"), {});
const venues = readJson(path.join(REPO_ROOT, "venues.json"), { venues: [] }).venues;
const knownPlaceIds = new Set([
  ...Object.values(placesStore).map((p) => p.place_id),
  ...venues.map((v) => v.place_id),
].filter(Boolean));
const knownHosts = new Set([...seed, ...discovered].map((v) => host(v.website)).filter(Boolean));
const knownNames = new Set([...seed, ...discovered].map((v) => normName(v.name)));
const screened = readJson(path.join(REPO_ROOT, "pipeline", "screened.json"), {});
const staleBefore = new Date(Date.now() - RECHECK_DAYS * 86400000).toISOString().slice(0, 10);
const NEGATIVE = new Set(["no_happy_hour", "hours_only", "error"]);
const judged = (placeId) => {
  const r = screened[placeId];
  return r && NEGATIVE.has(r.verdict) && (r.checked_at || "0000-00-00") > staleBefore;
};
const isKnown = (c) => knownPlaceIds.has(c.place_id) || knownNames.has(normName(c.name)) || knownHosts.has(host(c.website));

const POOL = path.join(REPO_ROOT, "pipeline", "candidate-pool.json");
const pool = new Map(Object.entries(readJson(POOL, {})));
// Drop what was judged or published since the pool was written.
for (const [id, c] of pool) if (judged(id) || isKnown(c)) pool.delete(id);
const poolBefore = pool.size;

// ── Search ────────────────────────────────────────────────────────────────
const FIELDS = [
  "places.id", "places.displayName", "places.location", "places.formattedAddress",
  "places.types", "places.primaryType", "places.businessStatus",
  "places.websiteUri", "places.rating", "places.userRatingCount",
  "places.priceLevel", "places.nationalPhoneNumber",
].join(",");
const stats = { found: 0, added: 0, rejected: 0, errors: 0 };
const exhausted = new Set();

function take(places, area) {
  for (const p of places || []) {
    stats.found++;
    if (!inRegion(p)) continue;
    if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;
    if (!p.websiteUri || !isWantedType(p)) continue;
    if (judged(p.id) || pool.has(p.id)) continue;
    const c = toCandidate(p);
    if (isKnown(c)) continue;
    c.found_via = area;
    c.found_at = TODAY;
    pool.set(p.id, c);
    stats.added++;
  }
}

async function call(job, url, body) {
  if (exhausted.has(job.sku) || allowance(job.sku) <= 0) return;
  // Reserve before the request so concurrent workers can't overshoot.
  usage.daily[TODAY][job.sku]++; usage[MONTH][job.sku]++;
  let data;
  try {
    data = await curlJson(url, { headers: [`X-Goog-Api-Key: ${KEY}`, `X-Goog-FieldMask: ${FIELDS}`], body });
  } catch (e) {
    // The request may have reached Google: keep it counted, to be safe.
    stats.errors++; console.error(`${job.key}: ${e.message.slice(0, 80)}`); return;
  }
  if (data.error) {
    // Rejected calls are not billed: give the budget back.
    usage.daily[TODAY][job.sku]--; usage[MONTH][job.sku]--;
    stats.rejected++;
    if (data.error.status === "RESOURCE_EXHAUSTED") exhausted.add(job.sku);
    console.error(`${job.key}: ${data.error.status}`);
    return;
  }
  state.last_run[job.key] = TODAY;
  take(data.places, job.q || job.key);
}

const todays = {
  text: due(textJobs).slice(0, allowance("text_enterprise")),
  nearby: due(nearbyJobs).slice(0, allowance("nearby_enterprise")),
};
console.log(`[rotate] ${TODAY}: ${due(textJobs).length}/${textJobs.length} text and ${due(nearbyJobs).length}/${nearbyJobs.length} nearby jobs due; ` +
  `running ${todays.text.length} + ${todays.nearby.length}. Pool carried over: ${poolBefore}.`);
if (DRY) {
  console.log("[dry-run] first text jobs:", todays.text.slice(0, 5).map((j) => j.q).join(" · "));
  process.exit(0);
}

await mapConcurrent(todays.text, 3, (job) =>
  call(job, "https://places.googleapis.com/v1/places:searchText", { textQuery: job.q, pageSize: 20 }));
await mapConcurrent(todays.nearby, 3, (job) =>
  call(job, "https://places.googleapis.com/v1/places:searchNearby", {
    includedTypes: job.types, maxResultCount: 20,
    locationRestriction: { circle: { center: { latitude: job.lat, longitude: job.lng }, radius: job.radius } },
  }));

saveUsage();
fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n");
fs.writeFileSync(POOL, JSON.stringify(Object.fromEntries(pool), null, 2) + "\n");

// Bars first (most likely to run a happy hour), then by review volume.
const candidates = [...pool.values()].sort((a, b) =>
  (b.is_bar - a.is_bar) || ((b.places.user_ratings_total || 0) - (a.places.user_ratings_total || 0)));
const seenIds = new Set([...seed, ...discovered].map((v) => v.id));
const out = candidates.map((c) => {
  let id = c.id, n = 2;
  while (seenIds.has(id)) id = `${c.id}-${n++}`;
  seenIds.add(id);
  return { ...c, id };
});
fs.mkdirSync(RESULTS_DIR, { recursive: true });
fs.writeFileSync(path.join(RESULTS_DIR, "discovered-candidates.json"), JSON.stringify(out, null, 2));

const u = usage[MONTH];
console.log(`[rotate] ${stats.found} places returned, ${stats.added} new candidates; pool now ${pool.size}.` +
  (stats.rejected ? ` ${stats.rejected} calls rejected by Google (not billed).` : "") +
  (exhausted.size ? ` Quota hit: ${[...exhausted].join(", ")}.` : ""));
console.log(`[rotate] ${MONTH} free-tier use: Text Search Enterprise ${u.text_enterprise}/${MONTH_CAP.text_enterprise}, Nearby Search Enterprise ${u.nearby_enterprise}/${MONTH_CAP.nearby_enterprise} (free 1,000 each).`);
const byArea = {};
for (const c of pool.values()) { const k = c.city || "?"; byArea[k] = (byArea[k] || 0) + 1; }
console.log(`[rotate] pool by city: ${Object.entries(byArea).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(", ")}`);
