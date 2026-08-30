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
//
// Usage: node pipeline/writeback.js [--in extracted-opus.json] [--min-confidence 0.8]
import fs from "node:fs";
import path from "node:path";
import { loadSeed, parseArgs, RESULTS_DIR, REPO_ROOT } from "./lib/venues.js";

const args = parseArgs(process.argv.slice(2));
const MIN_CONF = Number(args["min-confidence"]) || 0.8;
const extracted = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, args.in || "extracted-opus.json"), "utf8"));
const OUT = path.join(REPO_ROOT, "venues-extracted.js");

const setEq = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

const enrich = {};
const review = [];
const skipped = [];

for (const v of loadSeed()) {
  const rec = extracted[v.id];
  if (!rec || rec.error) { skipped.push([v.id, rec?.error || "no extraction"]); continue; }
  const x = rec.extraction;
  if (!x.found || !x.happy_hour) { skipped.push([v.id, "extraction found no happy hour"]); continue; }
  if ((rec.validation_problems || []).length) { skipped.push([v.id, `invalid: ${rec.validation_problems.join("; ")}`]); continue; }
  if ((x.confidence ?? 0) < MIN_CONF) { skipped.push([v.id, `low confidence ${x.confidence}`]); continue; }

  const g = v.happy_hour, h = x.happy_hour;
  const scheduleMatch = setEq(g.days, h.days) && g.start === h.start && g.end === h.end;
  if (!scheduleMatch) {
    review.push({ id: v.id, name: v.name, seed: { days: g.days, start: g.start, end: g.end }, extracted: { days: h.days, start: h.start, end: h.end }, source: x.source_url, note: (x.notes || "").slice(0, 200) });
    continue;
  }
  if (!Array.isArray(h.deals) || h.deals.length === 0) { skipped.push([v.id, "no deals extracted"]); continue; }
  if (h.deals.length < g.deals.length) { skipped.push([v.id, `extracted fewer deals (${h.deals.length}) than seed (${g.deals.length})`]); continue; }

  enrich[v.id] = {
    deals: h.deals.map((d) => ({ name: d.name, price: d.price, category: d.category, description: d.description || "" })),
    source_url: x.source_url,
    extracted_at: new Date().toISOString().slice(0, 10),
  };
}

// Discovered venues: rebuild from discovery results when present, else
// preserve whatever the last generation produced.
const DISC_MIN_CONF = 0.7;
let discovered = [];
const candFile = path.join(RESULTS_DIR, "discovered-candidates.json");
const discExtFile = path.join(RESULTS_DIR, "extracted-discovered.json");
if (fs.existsSync(candFile) && fs.existsSync(discExtFile)) {
  const cands = JSON.parse(fs.readFileSync(candFile, "utf8"));
  const discExt = JSON.parse(fs.readFileSync(discExtFile, "utf8"));
  for (const c of cands) {
    const rec = discExt[c.id];
    if (!rec || rec.error) { skipped.push([c.id, `discovery: ${rec?.error || "no extraction"}`]); continue; }
    const x = rec.extraction;
    if (!x.found || !x.happy_hour) { skipped.push([c.id, "discovery: no happy hour found on official site"]); continue; }
    if ((rec.validation_problems || []).length) { skipped.push([c.id, `discovery invalid: ${rec.validation_problems.join("; ")}`]); continue; }
    if ((x.confidence ?? 0) < DISC_MIN_CONF) { skipped.push([c.id, `discovery low confidence ${x.confidence}`]); continue; }
    discovered.push({
      id: c.id,
      place_id: null,
      name: c.name,
      formatted_address: c.formatted_address,
      address_components: c.address_components,
      geometry: c.geometry,
      formatted_phone_number: c.formatted_phone_number,
      international_phone_number: null,
      website: c.website,
      types: ["restaurant", "bar", "food", "point_of_interest", "establishment"],
      business_status: "OPERATIONAL",
      price_level: null,
      rating: null,
      user_ratings_total: null,
      opening_hours: { weekday_text: [] },
      photos: [],
      happy_hour: {
        days: x.happy_hour.days,
        start: x.happy_hour.start,
        end: x.happy_hour.end,
        verified: false, // automated extraction — a human has not checked this yet
        verified_source: null,
        source_url: x.source_url,
        deals: x.happy_hour.deals.map((d) => ({ name: d.name, price: d.price, category: d.category, description: d.description || "" })),
      },
      amenities: { outdoor_seating: null, gluten_free_options: null, wheelchair_accessible_entrance: null, parking: null, transit: null },
      // Identity (name/coords/address/phone/website) from OpenStreetMap via
      // Nominatim — © OpenStreetMap contributors, ODbL (osm.org/copyright).
      osm: c.osm,
      data_source: "discovery",
      last_synced_at: new Date().toISOString().slice(0, 10),
    });
  }
} else if (fs.existsSync(OUT)) {
  try {
    const vm = await import("node:vm");
    const prev = vm.runInNewContext(fs.readFileSync(OUT, "utf8") + ";({e: VENUES_EXTRACTED, d: VENUES_DISCOVERED});", {});
    discovered = prev.d || [];
  } catch { /* regenerate from scratch */ }
}

const banner = `// GENERATED FILE — do not edit by hand. Regenerate with: node pipeline/writeback.js
//
// Machine-written data layer merged over the hand-verified seed at app seed
// time (see sampleVenues() in app.js):
// - VENUES_EXTRACTED: per-venue deal lists read from each venue's own
//   official menu, applied ONLY where the automated read reproduced the
//   hand-verified schedule exactly (corroboration). Source page credited
//   per venue. The verified happy_hour schedule itself is never changed here.
// - VENUES_DISCOVERED: venues found by pipeline/discover.js, verified: false
//   until a human checks them.
`;
fs.writeFileSync(OUT, banner + `const VENUES_EXTRACTED = ${JSON.stringify(enrich, null, 2)};\n\nconst VENUES_DISCOVERED = ${JSON.stringify(discovered, null, 2)};\n`);

console.log(`Enriched deals for ${Object.keys(enrich).length} venues, ${discovered.length} discovered venues -> venues-extracted.js`);
for (const d of discovered) console.log(`  + ${d.id.padEnd(30)} days[${d.happy_hour.days}] ${d.happy_hour.start}-${d.happy_hour.end}  ${d.happy_hour.deals.length} deals`);
for (const [id, e] of Object.entries(enrich)) console.log(`  ${id.padEnd(30)} ${e.deals.length} deals  (${e.source_url})`);
console.log(`\nReview queue (schedule disagreements — NOT applied):`);
for (const r of review) console.log(`  ${r.id.padEnd(30)} seed days[${r.seed.days}] ${r.seed.start}-${r.seed.end}  vs extracted days[${r.extracted.days}] ${r.extracted.start}-${r.extracted.end}\n    ${r.source || ""} ${r.note ? "— " + r.note : ""}`);
console.log(`\nSkipped:`);
for (const [id, why] of skipped) console.log(`  ${id.padEnd(30)} ${why}`);
fs.writeFileSync(path.join(RESULTS_DIR, "review-queue.json"), JSON.stringify(review, null, 2));
