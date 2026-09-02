// Daily growth run: find new happy-hour venues across Metro Vancouver and
// publish only the ones that arrive fully armed.
//
//   discover -> crawl -> extract -> gate -> enrich -> build
//
// Two guards bound every run: a target (stop once N venues are published)
// and a budget (stop once $X of extraction is spent). Whichever hits first
// ends the run, and the report says which one did.
//
// Every candidate judged is written to pipeline/screened.json so tomorrow's
// run spends its budget on genuinely new places instead of re-confirming
// today's negatives. Negatives become eligible again after --recheck-days.
//
// Usage: node pipeline/daily.js [--target 100] [--budget 35]
//        [--batch 60] [--recheck-days 90] [--dry-run]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parseArgs, readJson, RESULTS_DIR, REPO_ROOT } from "./lib/venues.js";

const args = parseArgs(process.argv.slice(2));
const TARGET = Number(args.target) || 100;
const BUDGET = Number(args.budget) || 35;
const BATCH = Number(args.batch) || 60;
const RECHECK_DAYS = Number(args["recheck-days"]) || 90;
const DRY = !!args["dry-run"];

const SCREENED_STORE = path.join(REPO_ROOT, "pipeline", "screened.json");
const CANDIDATES = path.join(RESULTS_DIR, "discovered-candidates.json");
const EXTRACTED = path.join(RESULTS_DIR, "extracted-discovered.json");
const TODAY = new Date().toISOString().slice(0, 10);

const run = (script, extra = []) =>
  execFileSync("node", [path.join(REPO_ROOT, "pipeline", script), ...extra], {
    cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], maxBuffer: 64 * 1024 * 1024,
  });

const published = () => {
  const { venues } = readJson(path.join(REPO_ROOT, "venues.json"), { venues: [] });
  return venues.length;
};

const startCount = published();
console.log(`Daily run ${TODAY} — target ${TARGET} new venues, budget $${BUDGET}. Starting from ${startCount}.`);

// --- 1. Discover. Ask for more candidates than the target needs: only a
// --- fraction of places turn out to run a happy hour they publish.
// --use-pool reuses the candidate file already on disk. A discovery sweep is
// hundreds of billable Places calls; re-running the day's extraction after an
// interruption, or after a sweep run by hand, should not pay for them twice.
if (args["use-pool"]) {
  console.log(`\n[discover] reusing ${CANDIDATES.replace(REPO_ROOT + "/", "")} — no Places calls`);
} else {
  const poolWanted = Math.min(900, Math.ceil((TARGET / 0.13) * 1.2));
  console.log(`\n[discover] asking for up to ${poolWanted} candidates`);
  console.log(run("places-discover.js", ["--max", String(poolWanted), "--recheck-days", String(RECHECK_DAYS)]).trim());
}

// The candidate file is a snapshot, and a previous round may already have
// judged most of it. Extraction is by far the expensive step, so drop
// anything the ledger has already answered rather than paying twice.
// Mirrors places-discover.js: only NEGATIVE verdicts suppress a retry — a
// "published" verdict whose writeback never landed must stay eligible, so
// those are filtered against what is actually in venues.json instead.
const screened = readJson(SCREENED_STORE, {});
const NEGATIVE = new Set(["no_happy_hour", "hours_only", "error"]);
const storedPlaceIds = new Set(
  readJson(path.join(REPO_ROOT, "venues.json"), { venues: [] })
    .venues.map((v) => v.place_id).filter(Boolean)
);
const rawCandidates = readJson(CANDIDATES, []);
let candidates = rawCandidates.filter((c) => {
  const r = screened[c.place_id];
  if (r && NEGATIVE.has(r.verdict)) return false;
  return !storedPlaceIds.has(c.place_id);
});
if (rawCandidates.length !== candidates.length) {
  console.log(`[pool] ${rawCandidates.length} in file, ${rawCandidates.length - candidates.length} already judged -> ${candidates.length} left to process`);
}
if (!candidates.length) {
  console.log("\nNo new candidates — Metro Vancouver is swept for now. Nothing to do.");
  process.exit(0);
}
if (DRY) { console.log(`\n[dry-run] would process ${candidates.length} candidates. Stopping.`); process.exit(0); }

// --- 2. Crawl + extract in batches, watching the two guards.
let spent = 0, judged = 0, withDeals = 0, hoursOnly = 0, stopReason = "pool exhausted";

for (let i = 0; i < candidates.length; i += BATCH) {
  const batch = candidates.slice(i, i + BATCH);
  const ids = batch.map((c) => c.id).join(",");
  console.log(`\n[batch ${Math.floor(i / BATCH) + 1}] ${batch.length} candidates  (spent $${spent.toFixed(2)} of $${BUDGET})`);

  try {
    run("crawl.js", ["--venues", CANDIDATES, "--only", ids, "--depth", "2", "--concurrency", "5"]);
    run("deep-pages.js", ["--venues", CANDIDATES, "--only", ids, "--concurrency", "3"]);
    run("extract.js", ["--venues", CANDIDATES, "--only", ids, "--out", "extracted-discovered.json", "--force", "--concurrency", "3"]);
  } catch (e) {
    console.log(`  batch failed: ${String(e.message).slice(0, 200)}`);
    continue;
  }

  // Record a verdict for every candidate in this batch and tally the spend.
  const ex = readJson(EXTRACTED, {});
  for (const c of batch) {
    const rec = ex[c.id];
    spent += rec?.costUsd || 0;
    judged++;
    const x = rec?.extraction;
    const deals = (x?.happy_hour?.deals || []).length;
    const verdict = !x ? "error" : !x.found ? "no_happy_hour" : deals ? "published" : "hours_only";
    if (verdict === "published") withDeals++;
    if (verdict === "hours_only") hoursOnly++;
    if (c.place_id) {
      screened[c.place_id] = { id: c.id, name: c.name, verdict, checked_at: TODAY };
    }
  }
  fs.writeFileSync(SCREENED_STORE, JSON.stringify(screened, null, 2));

  // Publish after every batch, not once at the end of the run. A batch costs
  // minutes and a full pool costs hours; if the process dies in between, the
  // extraction is done and paid for but venues.json never learns about it,
  // and the ledger says "published" for venues that are nowhere. Writeback is
  // cheap and idempotent, so run it now and keep each batch's work.
  try {
    run("writeback.js", ["--discovery-require-deals"]);
  } catch (e) {
    console.log(`  writeback failed: ${String(e.message).slice(0, 160)}`);
  }

  if (withDeals >= TARGET) { stopReason = `target reached (${withDeals})`; break; }
  if (spent >= BUDGET) { stopReason = `budget reached ($${spent.toFixed(2)})`; break; }
}

// --- 3. Publish. The gate lives in writeback: a discovered venue needs a
// --- confirmed schedule AND at least one priced deal to go live.
console.log(`\n[writeback] applying the publish gate`);
console.log(run("writeback.js", ["--discovery-require-deals"]).split("\n").slice(0, 2).join("\n"));
console.log(run("places-photos.js").trim().split("\n").slice(-2).join("\n"));
console.log(run("writeback.js", ["--discovery-require-deals"]).split("\n")[0]);
console.log(run("build-pages.js").trim());

const endCount = published();
console.log(`
──────────── ${TODAY} ────────────
 candidates judged   ${judged}
 had deals extracted ${withDeals}
 hours only, held    ${hoursOnly}
 PUBLISHED           ${endCount - startCount}   (extraction finds minus anything the trust gate rejected)
 venues              ${startCount} -> ${endCount}
 extraction spend    $${spent.toFixed(2)} of $${BUDGET}
 stopped because     ${stopReason}
 screened ledger     ${Object.keys(screened).length} places remembered
────────────────────────────────`);
