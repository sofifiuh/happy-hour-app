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

// Keep any previously generated discovered venues when regenerating.
let discovered = [];
if (fs.existsSync(OUT)) {
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

console.log(`Enriched deals for ${Object.keys(enrich).length} venues -> venues-extracted.js`);
for (const [id, e] of Object.entries(enrich)) console.log(`  ${id.padEnd(30)} ${e.deals.length} deals  (${e.source_url})`);
console.log(`\nReview queue (schedule disagreements — NOT applied):`);
for (const r of review) console.log(`  ${r.id.padEnd(30)} seed days[${r.seed.days}] ${r.seed.start}-${r.seed.end}  vs extracted days[${r.extracted.days}] ${r.extracted.start}-${r.extracted.end}\n    ${r.source || ""} ${r.note ? "— " + r.note : ""}`);
console.log(`\nSkipped:`);
for (const [id, why] of skipped) console.log(`  ${id.padEnd(30)} ${why}`);
fs.writeFileSync(path.join(RESULTS_DIR, "review-queue.json"), JSON.stringify(review, null, 2));
