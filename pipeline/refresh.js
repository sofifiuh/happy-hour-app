// Daily refresh: keep the published data honest without a human in the loop.
//
//   check-sources -> pick venues whose page changed or no longer shows our
//   times -> re-crawl + re-extract just those (when a Claude engine is
//   available) -> writeback -> stamp trust -> sanity gate
//
// Hand-verified schedules still never auto-change (writeback.js). Without a
// Claude engine the run is check-only: it still refreshes every venue's
// trust badge, and the venues it would have re-extracted are listed in
// pipeline/results/refresh-queue.json.
//
// With --discover it also grows the map: once a month it re-syncs Google
// Places identity for every venue (business status, rating; Google's caching
// terms want ~30-day refreshes, and this is how closures are noticed), and
// every day it runs the discovery pass (daily.js) for new venues. Both need
// GOOGLE_PLACES_API_KEY; discovery also needs the Claude engine.
//
// Usage: node pipeline/refresh.js [--max-extract 40] [--model <id>]
//        [--no-extract] [--render auto|off]
//        [--discover] [--discover-target 10] [--discover-budget 5]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parseArgs, readJson, loadSeed, RESULTS_DIR, REPO_ROOT } from "./lib/venues.js";
import { FRESHNESS_STORE, VENUES_FILE, computeTrust } from "./lib/trust.js";

const args = parseArgs(process.argv.slice(2));
const MAX_EXTRACT = Number(args["max-extract"]) || 40;
const MODEL = args.model || process.env.EXTRACT_MODEL || "claude-sonnet-5-5";
const RENDER = args.render || "auto";
const TODAY = new Date().toISOString().slice(0, 10);

const run = (script, extra = []) =>
  execFileSync("node", [path.join(REPO_ROOT, "pipeline", script), ...extra], { cwd: REPO_ROOT, stdio: "inherit" });

const before = readJson(VENUES_FILE).venues;

// --- 1. Check every source page.
run("check-sources.js", ["--render", RENDER]);
const freshness = readJson(FRESHNESS_STORE, {});

// --- 2. Choose what to re-extract: pages that changed first, then pages that
// --- no longer show our times, oldest data first. Unreachable pages are not
// --- re-crawled (nothing to read); their badge already says so.
const rank = { changed: 0, unconfirmed: 1 };
const queue = before
  .map((v) => ({ v, t: computeTrust(v, freshness[v.id], TODAY) }))
  .filter(({ t }) => t.status in rank)
  .sort((a, b) => rank[a.t.status] - rank[b.t.status] || String(a.t.data_as_of).localeCompare(String(b.t.data_as_of)))
  .slice(0, MAX_EXTRACT)
  .map(({ v, t }) => ({ id: v.id, status: t.status, data_as_of: t.data_as_of }));
fs.mkdirSync(RESULTS_DIR, { recursive: true });
fs.writeFileSync(path.join(RESULTS_DIR, "refresh-queue.json"), JSON.stringify(queue, null, 2));

const hasClaude = (() => { try { execFileSync("claude", ["--version"], { stdio: "ignore" }); return true; } catch { return false; } })();
const extract = !args["no-extract"] && hasClaude && queue.length > 0;
console.log(`\n[refresh] ${queue.length} venues queued for re-extraction` +
  (extract ? ` — extracting with ${MODEL}` : hasClaude ? "" : " — no Claude engine on this machine, check-only run"));

if (extract) {
  const seedIds = new Set(loadSeed().map((v) => v.id));
  const seedQ = queue.filter((q) => seedIds.has(q.id)).map((q) => q.id);
  const discQ = queue.filter((q) => !seedIds.has(q.id)).map((q) => q.id);
  const common = ["--render", RENDER, "--depth", "2"];
  if (seedQ.length) {
    run("crawl.js", ["--only", seedQ.join(","), ...common]);
    run("extract.js", ["--only", seedQ.join(","), "--model", MODEL, "--out", "extracted-opus.json", "--force"]);
  }
  if (discQ.length) {
    const stubs = path.join(REPO_ROOT, "pipeline", "discovered.json");
    run("crawl.js", ["--venues", stubs, "--only", discQ.join(","), ...common]);
    run("extract.js", ["--venues", stubs, "--only", discQ.join(","), "--model", MODEL, "--out", "extracted-discovered.json", "--force"]);
  }
  // writeback rebuilds from the stores and re-stamps trust; re-check the
  // re-extracted venues first so their badge reflects the new schedule.
  run("writeback.js");
  run("check-sources.js", ["--only", queue.map((q) => q.id).join(","), "--render", RENDER]);
  run("build-pages.js");
}
// --- 3. Grow and prune the map.
if (args.discover) {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.log("\n[discover] no GOOGLE_PLACES_API_KEY — skipping new-venue discovery and closure sync");
  } else {
    if (args["places-sync"] || new Date().getUTCDate() === 1) {
      console.log("\n[places] monthly identity + business-status sync");
      run("places-sync.js");
      run("writeback.js");
    }
    if (!hasClaude) {
      console.log("\n[discover] no Claude engine (ANTHROPIC_API_KEY) — skipping new-venue discovery");
    } else {
      // A failed discovery must not cost the day's checks: log it and go on
      // to the sanity gate with whatever writeback last published.
      try {
        run("daily.js", ["--target", String(Number(args["discover-target"]) || 10), "--budget", String(Number(args["discover-budget"]) || 5)]);
      } catch (e) {
        console.log(`[discover] failed: ${String(e.message).slice(0, 200)}`);
      }
    }
  }
}
run("stamp-trust.js");

// --- 4. Sanity gate: a refresh may update venues, never lose them, except
// --- venues Google reports as permanently closed (dropped in writeback). A
// --- non-zero exit stops the workflow before anything is committed.
const after = readJson(VENUES_FILE).venues;
const afterIds = new Set(after.map((v) => v.id));
const places = readJson(path.join(REPO_ROOT, "pipeline", "places.json"), {});
const lost = before.filter((v) => !afterIds.has(v.id) && places[v.id]?.business_status !== "CLOSED_PERMANENTLY").map((v) => v.id);
const added = after.length - before.length;
const badSchedule = after.filter((v) => !(v.happy_hour?.days?.length && v.happy_hour.start && v.happy_hour.end)).map((v) => v.id);
if (lost.length || badSchedule.length) {
  console.error(`[refresh] SANITY GATE FAILED — lost ${lost.length} venue(s) [${lost.slice(0, 10)}], ${badSchedule.length} without a schedule [${badSchedule.slice(0, 10)}]`);
  process.exit(1);
}
const tally = (k) => after.reduce((m, v) => ((m[v.trust[k]] = (m[v.trust[k]] || 0) + 1), m), {});
console.log(`[refresh] OK — ${after.length} venues (${added >= 0 ? "+" : ""}${added}). confidence ${JSON.stringify(tally("confidence"))}, status ${JSON.stringify(tally("status"))}`);
