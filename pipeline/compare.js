// Side-by-side model comparison: same crawl cache, two extraction runs.
// Usage: node pipeline/compare.js <a.json> <b.json>
import fs from "node:fs";
import path from "node:path";
import { loadSeed, RESULTS_DIR } from "./lib/venues.js";

const [fileA, fileB] = process.argv.slice(2);
const A = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, fileA), "utf8"));
const B = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, fileB), "utf8"));
const modelA = Object.values(A).find((r) => r.model)?.model || fileA;
const modelB = Object.values(B).find((r) => r.model)?.model || fileB;

const summ = (r) => {
  if (!r || r.error) return "ERROR";
  const x = r.extraction;
  if (!x.found || !x.happy_hour) return "not-found";
  const h = x.happy_hour;
  return `days[${h.days.join(",")}] ${h.start}-${h.end} ${h.deals.length} deals`;
};

console.log(`## ${modelA} vs ${modelB} — venue-level disagreements\n`);
console.log(`| Venue | seed | ${modelA} | ${modelB} |`);
console.log(`|---|---|---|---|`);
let same = 0;
for (const v of loadSeed()) {
  const a = summ(A[v.id]), b = summ(B[v.id]);
  const g = v.happy_hour;
  if (a === b) { same++; continue; }
  console.log(`| ${v.name} | days[${g.days.join(",")}] ${g.start}-${g.end} ${g.deals.length} deals | ${a} | ${b} |`);
}
console.log(`\n${same}/31 venues: both models extracted identical schedules.`);
