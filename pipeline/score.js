// Phase 3: score extractions against the hand-verified seed (ground truth).
// Usage: node pipeline/score.js [--write]   (--write saves pipeline/REPORT.md)
import fs from "node:fs";
import path from "node:path";
import { loadSeed, parseArgs, RESULTS_DIR, REPO_ROOT } from "./lib/venues.js";

const args = parseArgs(process.argv.slice(2));
const extracted = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, args.in || "extracted.json"), "utf8"));
const venues = loadSeed();

const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const setEq = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

function normName(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function nameTokens(s) {
  return new Set(normName(s).split(" ").filter((w) => w.length > 2 && !["the", "and", "with", "select", "all", "our", "house"].includes(w)));
}
function namesMatch(a, b) {
  const na = normName(a), nb = normName(b);
  if (!na || !nb) return false;
  if (na.includes(nb) || nb.includes(na)) return true;
  const ta = nameTokens(a), tb = nameTokens(b);
  if (ta.size === 0 || tb.size === 0) return false;
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap++;
  return overlap / Math.min(ta.size, tb.size) >= 0.5;
}
function normPrice(s) {
  return (s || "").toLowerCase().replace(/\s+/g, "").replace(/[–—]/g, "-").replace(/\.00\b/g, "").replace(/each|ea\.?/g, "ea");
}

function scoreVenue(gt, rec) {
  const row = { id: gt.id, name: gt.name, verified: gt.happy_hour.verified === true };
  if (!rec || rec.error) { row.verdict = "NO-DATA"; row.detail = rec?.error || "no extraction record"; return row; }
  const x = rec.extraction;
  row.confidence = x.confidence;
  row.costUsd = rec.costUsd || 0;
  if (!x.found || !x.happy_hour) { row.verdict = "NOT-FOUND"; row.detail = x.notes?.slice(0, 160) || ""; return row; }

  const g = gt.happy_hour, h = x.happy_hour;
  row.daysOk = setEq(g.days, h.days);
  row.startDiff = Math.abs(toMin(g.start) - toMin(h.start));
  row.endDiff = Math.abs(toMin(g.end) - toMin(h.end));
  row.timesExact = row.startDiff === 0 && row.endDiff === 0;
  row.timesClose = row.startDiff <= 30 && row.endDiff <= 30;

  // Deal matching: greedy match each ground-truth deal to one extracted deal.
  // Seed deals are hand-written summaries; extracted deals itemize real menu
  // lines — match against name+description on both sides.
  const hay = (d) => `${d.name} ${d.description || ""}`;
  const pool = [...(h.deals || [])];
  let matched = 0, priceOk = 0;
  for (const gd of g.deals) {
    const i = pool.findIndex((xd) => namesMatch(gd.name, hay(xd)) || namesMatch(hay(gd), xd.name));
    if (i === -1) continue;
    matched++;
    if (normPrice(pool[i].price) === normPrice(gd.price)) priceOk++;
    pool.splice(i, 1);
  }
  row.gtDeals = g.deals.length;
  row.exDeals = (h.deals || []).length;
  row.dealRecall = g.deals.length ? matched / g.deals.length : 1;
  row.dealPrecision = (h.deals || []).length ? matched / h.deals.length : 1;
  row.priceAcc = matched ? priceOk / matched : null;
  row.invalid = (rec.validation_problems || []).length > 0;

  if (row.daysOk && row.timesExact && row.dealRecall === 1 && row.priceAcc === 1 && !row.invalid) row.verdict = "PERFECT";
  else if (row.daysOk && row.timesClose && row.dealRecall >= 0.6) row.verdict = "GOOD";
  else if (row.daysOk || row.timesClose) row.verdict = "PARTIAL";
  else row.verdict = "WRONG";
  return row;
}

const rows = venues.map((v) => scoreVenue(v, extracted[v.id]));
const by = (v) => rows.filter((r) => r.verdict === v).length;
const found = rows.filter((r) => !["NO-DATA", "NOT-FOUND"].includes(r.verdict));
const pct = (n, d) => (d ? `${Math.round((100 * n) / d)}%` : "n/a");
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const fmtPct = (x) => (x == null ? "—" : `${Math.round(x * 100)}%`);

const totalCost = rows.reduce((s, r) => s + (r.costUsd || 0), 0);
const model = Object.values(extracted).find((r) => r.model)?.model || "?";

const lines = [];
lines.push(`# Extraction harness report`);
lines.push(``);
lines.push(`Model: \`${model}\` · Venues: ${rows.length} · Run cost: $${totalCost.toFixed(2)} · Generated: ${new Date().toISOString().slice(0, 10)}`);
lines.push(``);
lines.push(`| Verdict | Count | Meaning |`);
lines.push(`|---|---|---|`);
lines.push(`| PERFECT | ${by("PERFECT")} | days+times exact, every seed deal recovered w/ right price |`);
lines.push(`| GOOD | ${by("GOOD")} | days exact, times ≤30min off, ≥60% of seed deals recovered |`);
lines.push(`| PARTIAL | ${by("PARTIAL")} | days or times right, the other wrong |`);
lines.push(`| WRONG | ${by("WRONG")} | found a happy hour but days and times both wrong |`);
lines.push(`| NOT-FOUND | ${by("NOT-FOUND")} | model reported no happy hour on fetched pages |`);
lines.push(`| NO-DATA | ${by("NO-DATA")} | crawl/extraction failed (blocked, JS-rendered, error) |`);
lines.push(``);
lines.push(`**Usable (PERFECT+GOOD): ${pct(by("PERFECT") + by("GOOD"), rows.length)}** · ` +
  `days accuracy ${pct(found.filter((r) => r.daysOk).length, found.length)} · ` +
  `times exact ${pct(found.filter((r) => r.timesExact).length, found.length)} · ` +
  `avg deal recall ${fmtPct(avg(found.map((r) => r.dealRecall)))} · ` +
  `avg precision ${fmtPct(avg(found.map((r) => r.dealPrecision)))}`);
lines.push(``);
lines.push(`| Venue | Verdict | Days | Start Δ | End Δ | Deals (found/seed) | Recall | Price acc | Conf |`);
lines.push(`|---|---|---|---|---|---|---|---|---|`);
for (const r of rows) {
  if (["NO-DATA", "NOT-FOUND"].includes(r.verdict)) {
    lines.push(`| ${r.name} | ${r.verdict} | — | — | — | — | — | — | ${r.confidence ?? "—"} |`);
  } else {
    lines.push(`| ${r.name} | ${r.verdict} | ${r.daysOk ? "✓" : "✗"} | ${r.startDiff}m | ${r.endDiff}m | ${r.exDeals}/${r.gtDeals} | ${fmtPct(r.dealRecall)} | ${fmtPct(r.priceAcc)} | ${r.confidence} |`);
  }
}
const failures = rows.filter((r) => ["NO-DATA", "NOT-FOUND", "WRONG"].includes(r.verdict));
if (failures.length) {
  lines.push(``);
  lines.push(`## Failure detail`);
  for (const r of failures) lines.push(`- **${r.name}** (${r.verdict}): ${r.detail || "see extracted.json"}`);
}

if (args.json) {
  console.log(JSON.stringify(rows, null, 1));
  process.exit(0);
}

const report = lines.join("\n") + "\n";
console.log(report);
if (args.write) {
  fs.writeFileSync(path.join(REPO_ROOT, "pipeline", "REPORT.md"), report);
  console.log(`Wrote pipeline/REPORT.md`);
}
