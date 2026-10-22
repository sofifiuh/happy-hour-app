// Freshness check: re-read every venue's own happy hour source page and
// record whether it is still there and still states the times we publish.
// No model calls, so it is cheap enough to run every day over every venue.
//
// Writes pipeline/freshness.json (committed): per venue the latest check,
// a hash of the page's happy hour text, and when that text last changed.
// lib/trust.js turns this into each venue's `trust` field.
//
// Usage: node pipeline/check-sources.js [--only id1,id2] [--concurrency 8]
//        [--render auto|off]   (auto = Chromium for JS-rendered pages)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parseArgs, readJson } from "./lib/venues.js";
import { curlGet, mapConcurrent } from "./lib/curl.js";
import { htmlToText } from "./lib/html.js";
import { FRESHNESS_STORE, VENUES_FILE, sourceUrls, happyHourSnippets, hashText, assessPage } from "./lib/trust.js";

const args = parseArgs(process.argv.slice(2));
const only = args.only ? new Set(String(args.only).split(",")) : null;
const RENDER_MODE = args.render || "auto";
const RENDER_THRESHOLD = 500;
const TODAY = new Date().toISOString().slice(0, 10);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "hh-check-"));

let renderPage = null, closeBrowser = null;
if (RENDER_MODE !== "off") {
  try { ({ renderPage, closeBrowser } = await import("./lib/render.js")); } catch { renderPage = null; }
}

const hasPdftotext = (() => { try { execFileSync("pdftotext", ["-v"], { stdio: "ignore" }); return true; } catch { return false; } })();

const { venues } = readJson(VENUES_FILE);
const store = readJson(FRESHNESS_STORE, {});

/** Fetch one URL and return its visible text ("" when unreadable). */
async function readPage(url, i) {
  const tmp = path.join(TMP, `p${i}`);
  const res = await curlGet(url, tmp, { timeout: 25 });
  const ok = res.status >= 200 && res.status < 400;
  let text = "", kind = "html";
  if (ok && fs.existsSync(tmp)) {
    if (res.contentType.includes("pdf") || /\.pdf(\?|#|$)/i.test(res.finalUrl || url)) {
      kind = "pdf";
      if (hasPdftotext) { try { text = execFileSync("pdftotext", ["-layout", tmp, "-"], { encoding: "utf8", maxBuffer: 16 << 20 }); } catch {} }
    } else if (res.contentType.startsWith("image/")) {
      kind = "image"; // menu photo: reachable, but nothing to read
    } else {
      text = htmlToText(fs.readFileSync(tmp, "utf8"));
    }
  }
  fs.rmSync(tmp, { force: true });
  if (renderPage && kind === "html" && (!ok || text.length < RENDER_THRESHOLD)) {
    const r = await renderPage(url);
    if (r.html) {
      const rt = htmlToText(r.html);
      if (rt.length > text.length) return { ok: true, status: ok ? res.status : 200, kind, text: rt, rendered: true };
    }
  }
  return { ok, status: res.status, kind, text, error: res.error };
}

let n = 0;
const targets = venues.filter((v) => !only || only.has(v.id));
await mapConcurrent(targets, Number(args.concurrency) || 8, async (v) => {
  const urls = sourceUrls(v);
  const prev = store[v.id] || {};
  if (!urls.length) {
    store[v.id] = { ...prev, url: null, checked_at: TODAY, ok: false, note: "no source url" };
    return;
  }
  // Check every source the record cites; the schedule counts as seen if any
  // of them states it (seed venues cite a contact page and a menu page).
  const pages = [];
  for (const u of urls.slice(0, 2)) pages.push({ url: u, ...(await readPage(u, n++)) });
  const okPages = pages.filter((p) => p.ok);
  const text = okPages.map((p) => p.text).join("\n");
  const entry = { ...prev, url: urls[0], checked_at: TODAY, http_status: pages[0].status, kind: pages[0].kind };

  if (!okPages.length) {
    entry.ok = false;
    entry.fail_count = (prev.fail_count || 0) + 1;
    entry.error = pages[0].error || `HTTP ${pages[0].status}`;
  } else {
    const a = assessPage(text, v.happy_hour);
    const snippets = happyHourSnippets(text);
    const hh_hash = snippets.length ? hashText(snippets.join("\n")) : null;
    Object.assign(entry, a, { ok: true, fail_count: 0, error: undefined, rendered: okPages.some((p) => p.rendered) || undefined });
    if (hh_hash && prev.hh_hash && hh_hash !== prev.hh_hash) entry.changed_at = TODAY;
    if (hh_hash) entry.hh_hash = hh_hash;
    entry.last_ok_at = TODAY;
    if (a.times_seen) entry.last_confirmed_at = TODAY;
  }
  store[v.id] = entry;
  const tag = !entry.ok ? `FAIL ${entry.error}` : entry.times_seen ? "confirmed" : entry.hh_mentioned ? "hh on page, times not matched" : "no happy hour text";
  console.log(`${v.id.padEnd(32)} ${tag}${entry.changed_at === TODAY ? "  [CHANGED]" : ""}`);
});
if (closeBrowser) await closeBrowser();
fs.rmSync(TMP, { recursive: true, force: true });

// Drop entries for venues that no longer exist so the store tracks the dataset.
const ids = new Set(venues.map((v) => v.id));
for (const id of Object.keys(store)) if (!ids.has(id)) delete store[id];
const sorted = Object.fromEntries(Object.keys(store).sort().map((k) => [k, store[k]]));
fs.writeFileSync(FRESHNESS_STORE, JSON.stringify(sorted, null, 1));

const all = targets.map((v) => store[v.id]);
const count = (fn) => all.filter(fn).length;
console.log(`\nChecked ${all.length}: ${count((e) => e.ok && e.times_seen)} confirmed, ${count((e) => e.ok && !e.times_seen)} reachable but times not matched, ${count((e) => !e.ok)} failed, ${count((e) => e.changed_at === TODAY)} changed today.`);
