// Load the hand-verified seed (ground truth for the scoring harness) by
// evaluating venues-data.js — the same file the app ships — in a bare VM
// context, so the pipeline never needs a second copy of the data.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, "..", "..");
export const CACHE_DIR = path.join(REPO_ROOT, "pipeline", "cache");
export const RESULTS_DIR = path.join(REPO_ROOT, "pipeline", "results");

export function loadSeed() {
  const code = fs.readFileSync(path.join(REPO_ROOT, "venues-data.js"), "utf8");
  return vm.runInNewContext(code + ";\nVENUES_SEED;", {});
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
