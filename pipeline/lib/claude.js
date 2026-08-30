// Extraction engine. Two backends behind one seam:
//  - "cli": headless `claude -p` (uses this machine's existing Claude Code
//    auth; what the harness runs on today, no API key needed)
//  - swap point for a real @anthropic-ai/sdk backend once the pipeline moves
//    to CI with an ANTHROPIC_API_KEY secret — only this file changes.
import { spawn } from "node:child_process";

export const DEFAULT_MODEL = "claude-haiku-4-5";

/**
 * Run one extraction prompt. `allowRead` = true lets the model use its Read
 * tool (needed for PDF menus in the cache dir); otherwise all tools are off.
 * Resolves { ok, text, costUsd, error }.
 */
export function callClaude(prompt, { model = DEFAULT_MODEL, allowRead = false, cwd, timeoutMs = 600000 } = {}) {
  return new Promise((resolve) => {
    const args = ["-p", "--model", model, "--output-format", "json"];
    if (allowRead) args.push("--allowedTools", "Read");
    else args.push("--disallowedTools", "*");

    const child = spawn("claude", args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
    let out = "", errOut = "", done = false;
    const timer = setTimeout(() => {
      if (!done) { done = true; child.kill("SIGKILL"); resolve({ ok: false, text: "", costUsd: 0, error: "timeout" }); }
    }, timeoutMs);

    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (errOut += d));
    child.on("error", (e) => {
      if (!done) { done = true; clearTimeout(timer); resolve({ ok: false, text: "", costUsd: 0, error: e.message }); }
    });
    child.on("close", (code) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        const parsed = JSON.parse(out);
        if (parsed.is_error) return resolve({ ok: false, text: "", costUsd: parsed.total_cost_usd || 0, error: String(parsed.result).slice(0, 300) });
        resolve({ ok: true, text: parsed.result ?? "", costUsd: parsed.total_cost_usd || 0, error: null });
      } catch {
        resolve({ ok: false, text: out.slice(0, 500), costUsd: 0, error: `exit ${code}: ${errOut.trim().slice(0, 300)}` });
      }
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

/** Pull the first JSON object out of a model reply (tolerates code fences/prose). */
export function parseJsonReply(text) {
  const cleaned = text.replace(/```(?:json)?/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object in reply");
  return JSON.parse(cleaned.slice(start, end + 1));
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Validate the extraction shape. Returns a list of problems (empty = valid). */
export function validateExtraction(x) {
  const problems = [];
  if (typeof x !== "object" || x === null) return ["not an object"];
  if (typeof x.found !== "boolean") problems.push("found must be boolean");
  if (x.found) {
    const hh = x.happy_hour;
    if (!hh || typeof hh !== "object") return [...problems, "found=true but happy_hour missing"];
    if (!Array.isArray(hh.days) || hh.days.length === 0 || !hh.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
      problems.push("days must be non-empty ints 0-6");
    }
    if (!TIME_RE.test(hh.start ?? "")) problems.push(`bad start "${hh.start}"`);
    if (!TIME_RE.test(hh.end ?? "")) problems.push(`bad end "${hh.end}"`);
    if (TIME_RE.test(hh.start ?? "") && TIME_RE.test(hh.end ?? "") && hh.end <= hh.start) {
      problems.push(`end ${hh.end} <= start ${hh.start} (overnight window?)`);
    }
    if (hh.extra_windows !== undefined && !Array.isArray(hh.extra_windows)) problems.push("extra_windows must be an array");
    for (const w of Array.isArray(hh.extra_windows) ? hh.extra_windows : []) {
      if (!w || !Array.isArray(w.days) || !w.days.length || !w.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) { problems.push("extra window bad days"); break; }
      if (!TIME_RE.test(w.start ?? "")) { problems.push(`extra window bad start "${w.start}"`); break; }
      if (w.end !== null && w.end !== undefined && !TIME_RE.test(w.end)) { problems.push(`extra window bad end "${w.end}"`); break; }
    }
    if (!Array.isArray(hh.deals)) problems.push("deals must be an array");
    else {
      for (const d of hh.deals) {
        if (!d || typeof d.name !== "string" || !d.name) { problems.push("deal missing name"); break; }
        if (d.category !== "food" && d.category !== "drink") { problems.push(`deal "${d.name}" bad category "${d.category}"`); break; }
      }
    }
  }
  return problems;
}
