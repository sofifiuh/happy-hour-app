// Shared pipeline primitives: paths, data loading, CLI args, and the small
// normalization/comparison helpers every stage must agree on.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, "..", "..");
export const CACHE_DIR = path.join(REPO_ROOT, "pipeline", "cache");
export const RESULTS_DIR = path.join(REPO_ROOT, "pipeline", "results");

/** Evaluate a repo data file (plain <script>-style consts) in a bare VM
 *  context and return the named globals. The one non-obvious loading trick
 *  in the pipeline — keep it here only. */
function evalGlobals(file, expr) {
  return vm.runInNewContext(fs.readFileSync(file, "utf8") + `;\n(${expr});`, {});
}

/** The hand-verified seed from venues-data.js (ground truth for scoring). */
export function loadSeed() {
  return evalGlobals(path.join(REPO_ROOT, "venues-data.js"), "VENUES_SEED");
}

export function readJson(file, fallback) {
  if (!fs.existsSync(file)) {
    if (arguments.length > 1) return fallback;
    throw new Error(`missing ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

/** The venue set a stage runs over: the seed by default, a candidate-stub
 *  file with --venues <path.json> (discovery), narrowed by --only id1,id2.
 *  One definition so crawl and extract can never disagree about it. */
export function selectVenues(args) {
  const only = args.only ? String(args.only).split(",") : null;
  const all = args.venues ? readJson(args.venues) : loadSeed();
  return all.filter((v) => !only || only.includes(v.id));
}

/** Day-set equality — used by both the scoring verdict and the write-back
 *  trust gate; they must stay the same comparison. */
export const setEq = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

/** Venue/deal name normalization — id generation, seed dedupe, and deal
 *  matching all build on this one definition. */
export function normName(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

/** Which model produced a results file (records carry `model`). */
export function modelOf(results) {
  return Object.values(results).find((r) => r && r.model)?.model || null;
}
