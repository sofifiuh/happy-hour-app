// Phase 4: write-back. Generates venues-extracted.js — a machine-written
// data layer the app merges over the hand-verified seed at seed time.
//
// Trust rules (see pipeline/README.md):
// - The hand-verified happy_hour schedule in venues-data.js is NEVER
//   auto-changed. A venue's extracted deals are applied ONLY when the
//   extraction corroborates the verified schedule exactly (same day set,
//   same start/end) and validated cleanly — i.e. we read the same menu a
//   human verified, just more completely.
// - Schedule disagreements are printed as a review queue, not applied.
// - Discovered venues live in pipeline/discovered.json (committed, the
//   canonical store); venues-extracted.js is a pure render of the inputs.
//
// Usage: node pipeline/writeback.js [--in extracted-opus.json]
//        [--min-confidence 0.8] [--discovery-min-confidence 0.7]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadSeed, parseArgs, readJson, setEq, CACHE_DIR, RESULTS_DIR, REPO_ROOT } from "./lib/venues.js";
import { heroImage } from "./lib/html.js";

const args = parseArgs(process.argv.slice(2));
const MIN_CONF = Number(args["min-confidence"]) || 0.8;
const DISC_MIN_CONF = Number(args["discovery-min-confidence"]) || 0.7;
const extracted = readJson(path.join(RESULTS_DIR, args.in || "extracted-opus.json"));

const DISCOVERED_STORE = path.join(REPO_ROOT, "pipeline", "discovered.json");
const PLACES_STORE = path.join(REPO_ROOT, "pipeline", "places.json");
const PHOTOS_STORE = path.join(REPO_ROOT, "pipeline", "photos.json");
const TODAY = new Date().toISOString().slice(0, 10);

const skipped = [];
const review = [];

/** The one trust gate for accepting an automated extraction. Pushes the
 *  skip reason itself; returns the extraction or null. */
function acceptExtraction(id, rec, minConf, label = "") {
  const skip = (why) => { skipped.push([id, label + why]); return null; };
  if (!rec || rec.error) return skip(rec?.error || "no extraction");
  const x = rec.extraction;
  if (!x.found || !x.happy_hour) return skip("extraction found no happy hour");
  if ((rec.validation_problems || []).length) return skip(`invalid: ${rec.validation_problems.join("; ")}`);
  if ((x.confidence ?? 0) < minConf) return skip(`low confidence ${x.confidence}`);
  return x;
}

const normalizeDeals = (deals) =>
  deals.map((d) => ({ name: d.name, price: d.price, category: d.category, description: d.description || "" }));

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
/** Sanitize extractor-reported extra windows: valid days + HH:MM start; end
 *  becomes null ("until close") unless a clean HH:MM. */
const normalizeWindows = (wins) =>
  (Array.isArray(wins) ? wins : [])
    .filter((w) => w && Array.isArray(w.days) && w.days.length && w.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) && TIME_RE.test(w.start ?? ""))
    .map((w) => ({ days: w.days, start: w.start, end: TIME_RE.test(w.end ?? "") ? w.end : null, label: String(w.label || "").slice(0, 40) }));

/** A venue's own representative image (og:image) from its cached homepage. */
function coverFromCache(id, name, website) {
  try {
    const manifest = readJson(path.join(CACHE_DIR, id, "manifest.json"), null);
    const home = manifest?.pages?.[0];
    if (!home) return null;
    const html = fs.readFileSync(path.join(CACHE_DIR, id, home.file), "utf8");
    const url = heroImage(html, home.finalUrl || website);
    return url ? { url, credit_name: name, credit_url: website, source: "official_website" } : null;
  } catch { return null; }
}

// --- Seed enrichment: extracted deals for venues whose verified schedule
// --- the extraction reproduced exactly.
const enrich = {};
for (const v of loadSeed()) {
  const x = acceptExtraction(v.id, extracted[v.id], MIN_CONF);
  if (!x) continue;

  const g = v.happy_hour, h = x.happy_hour;
  if (!(setEq(g.days, h.days) && g.start === h.start && g.end === h.end)) {
    review.push({ id: v.id, name: v.name, seed: { days: g.days, start: g.start, end: g.end }, extracted: { days: h.days, start: h.start, end: h.end }, source: x.source_url, note: (x.notes || "").slice(0, 200) });
    continue;
  }
  if (!Array.isArray(h.deals) || h.deals.length === 0) { skipped.push([v.id, "no deals extracted"]); continue; }
  if (h.deals.length < g.deals.length) { skipped.push([v.id, `extracted fewer deals (${h.deals.length}) than seed (${g.deals.length})`]); continue; }

  enrich[v.id] = { deals: normalizeDeals(h.deals), extra_windows: normalizeWindows(h.extra_windows), source_url: x.source_url, extracted_at: TODAY };
}

// --- Discovered venues: rebuild the committed store when a discovery run's
// --- results are present; otherwise render from the store as-is.
const DISCOVERED_DEFAULTS = {
  place_id: null,
  international_phone_number: null,
  types: ["restaurant", "bar", "food", "point_of_interest", "establishment"],
  business_status: "OPERATIONAL",
  price_level: null,
  rating: null,
  user_ratings_total: null,
  opening_hours: { weekday_text: [] },
  photos: [],
  amenities: { outdoor_seating: null, gluten_free_options: null, wheelchair_accessible_entrance: null, parking: null, transit: null },
  data_source: "discovery",
};

// Google Places identity store — loaded early so discovery acceptance can
// merge the identity captured by places-discover.js (no second API pass).
const places = readJson(PLACES_STORE, {});
const placePhotos = readJson(PHOTOS_STORE, {});

let discovered = readJson(DISCOVERED_STORE, []);
const cands = readJson(path.join(RESULTS_DIR, "discovered-candidates.json"), null);
const discExt = readJson(path.join(RESULTS_DIR, "extracted-discovered.json"), null);
if (cands && discExt) {
  const rebuilt = [];
  for (const c of cands) {
    const x = acceptExtraction(c.id, discExt[c.id], DISC_MIN_CONF, "discovery: ");
    if (!x) continue;
    if (c.places?.place_id) places[c.id] = c.places;
    rebuilt.push({
      ...DISCOVERED_DEFAULTS,
      id: c.id,
      name: c.name,
      formatted_address: c.formatted_address,
      address_components: c.address_components,
      geometry: c.geometry,
      formatted_phone_number: c.formatted_phone_number,
      website: c.website,
      happy_hour: {
        days: x.happy_hour.days,
        start: x.happy_hour.start,
        end: x.happy_hour.end,
        extra_windows: normalizeWindows(x.happy_hour.extra_windows),
        verified: false, // automated extraction — a human has not checked this yet
        verified_source: null,
        source_url: x.source_url,
        deals: normalizeDeals(x.happy_hour.deals),
      },
      cover_image: coverFromCache(c.id, c.name, c.website),
      // Identity (name/coords/address/phone/website) from OpenStreetMap via
      // Nominatim — © OpenStreetMap contributors, ODbL (osm.org/copyright).
      osm: c.osm,
      last_synced_at: TODAY,
    });
  }
  // Keep previously stored venues that this discovery run didn't cover.
  const rebuiltIds = new Set(rebuilt.map((d) => d.id));
  const runIds = new Set(cands.map((c) => c.id));
  discovered = [...rebuilt, ...discovered.filter((d) => !rebuiltIds.has(d.id) && !runIds.has(d.id))];
  fs.writeFileSync(DISCOVERED_STORE, JSON.stringify(discovered, null, 2));
} else if (discExt) {
  // Re-sync of already-stored discovered venues (crawl/extract run with
  // --venues pipeline/discovered.json). These records are unverified, so a
  // clean re-extraction updates their whole happy_hour — venues change
  // their offers and this is where we adapt.
  for (const d of discovered) {
    const x = acceptExtraction(d.id, discExt[d.id], DISC_MIN_CONF, "discovery resync: ");
    if (!x) continue;
    d.happy_hour = { ...d.happy_hour, days: x.happy_hour.days, start: x.happy_hour.start, end: x.happy_hour.end, extra_windows: normalizeWindows(x.happy_hour.extra_windows), source_url: x.source_url, deals: normalizeDeals(x.happy_hour.deals) };
    d.last_synced_at = TODAY;
  }
  fs.writeFileSync(DISCOVERED_STORE, JSON.stringify(discovered, null, 2));
}

// Backfill hero images for discovered venues that lack one, from cached
// homepages (their own sites' og:image; credited to the venue).
let coversAdded = 0;
for (const d of discovered) {
  if (!d.cover_image) {
    d.cover_image = coverFromCache(d.id, d.name, d.website);
    if (d.cover_image) coversAdded++;
  }
}
if (coversAdded) fs.writeFileSync(DISCOVERED_STORE, JSON.stringify(discovered, null, 2));

fs.writeFileSync(PLACES_STORE, JSON.stringify(places, null, 2));

// --- Render the final merged dataset the app fetches: seed + deal/window
// --- enrichment + discovered venues + Places identity overlay, all resolved
// --- here so the client does zero merging.
const merged = loadSeed().map((v) => {
  const x = enrich[v.id];
  if (!x?.deals?.length) return v;
  return {
    ...v,
    happy_hour: {
      ...v.happy_hour,
      deals: x.deals,
      ...(x.extra_windows?.length ? { extra_windows: x.extra_windows } : {}),
      deals_source: { url: x.source_url, extracted_at: x.extracted_at },
    },
  };
}).concat(discovered).map((v) => {
  const g = places[v.id];
  if (!g) return v;
  const va = v.amenities || {};
  const ga = g.amenities || {};
  return {
    ...v,
    place_id: g.place_id ?? v.place_id,
    rating: g.rating ?? v.rating,
    user_ratings_total: g.user_ratings_total ?? v.user_ratings_total,
    price_level: g.price_level ?? v.price_level,
    business_status: g.business_status ?? v.business_status,
    // Places amenity attributes fill gaps only — hand-verified values win.
    amenities: {
      ...va,
      outdoor_seating: va.outdoor_seating ?? ga.outdoor_seating ?? null,
      serves_cocktails: va.serves_cocktails ?? ga.serves_cocktails ?? null,
      serves_beer: va.serves_beer ?? ga.serves_beer ?? null,
      serves_wine: va.serves_wine ?? ga.serves_wine ?? null,
      live_music: va.live_music ?? ga.live_music ?? null,
      good_for_groups: va.good_for_groups ?? ga.good_for_groups ?? null,
    },
  };
}).map((v) => {
  // Places photo backfill (pipeline/places-photos.js): only for venues whose
  // own site never yielded a cover — an official image always wins.
  if (v.cover_image?.url) return v;
  const ph = placePhotos[v.id];
  if (!ph) return v;
  return {
    ...v,
    cover_image: { url: ph.url, credit_name: ph.credit_name, credit_url: ph.credit_url, source: "google_places" },
  };
});

// Content-derived stamp: any change to the merged data reseeds cached
// clients, even a second regeneration on the same day.
const payload = JSON.stringify(merged);
const stamp = `${TODAY}-${crypto.createHash("sha1").update(payload).digest("hex").slice(0, 8)}`;
fs.writeFileSync(path.join(REPO_ROOT, "venues.json"), JSON.stringify({ data_version: stamp, venues: merged }, null, 1));

console.log(`venues.json: ${merged.length} venues (${Object.keys(enrich).length} enriched, ${discovered.length} discovered, ${coversAdded} covers backfilled, Places identity for ${Object.keys(places).length}) — ${stamp}`);
for (const d of discovered) console.log(`  + ${d.id.padEnd(30)} days[${d.happy_hour.days}] ${d.happy_hour.start}-${d.happy_hour.end}  ${d.happy_hour.deals.length} deals`);
for (const [id, e] of Object.entries(enrich)) console.log(`  ${id.padEnd(30)} ${e.deals.length} deals  (${e.source_url})`);
console.log(`\nReview queue (schedule disagreements — NOT applied):`);
for (const r of review) console.log(`  ${r.id.padEnd(30)} seed days[${r.seed.days}] ${r.seed.start}-${r.seed.end}  vs extracted days[${r.extracted.days}] ${r.extracted.start}-${r.extracted.end}\n    ${r.source || ""} ${r.note ? "— " + r.note : ""}`);
console.log(`\nSkipped:`);
for (const [id, why] of skipped) console.log(`  ${id.padEnd(30)} ${why}`);
fs.writeFileSync(path.join(RESULTS_DIR, "review-queue.json"), JSON.stringify(review, null, 2));
