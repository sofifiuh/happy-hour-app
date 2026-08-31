// Phase 1: for each venue, fetch its homepage, discover candidate
// happy-hour/menu pages, and cache everything under pipeline/cache/<id>/.
// JS-rendered pages fall back to headless Chromium (lib/render.js).
// Usage: node pipeline/crawl.js [--only id1,id2] [--venues <stubs.json>]
//        [--concurrency 6] [--render auto|always|off] [--depth 1|2]
//        (depth 2 follows happy-hour links found ON the candidate pages —
//        many venues put the item list one click past a "Menus" page)
//        (auto = render when static text is thin; always = used for
//        targeted re-crawls of venues known to be JS-rendered)
import fs from "node:fs";
import path from "node:path";
import { parseArgs, selectVenues, CACHE_DIR } from "./lib/venues.js";
import { curlGet, mapConcurrent } from "./lib/curl.js";
import { extractLinks, pickCandidates, htmlToText } from "./lib/html.js";

const args = parseArgs(process.argv.slice(2));
const venues = selectVenues(args);
const RENDER_MODE = args.render || "auto"; // auto | always | off
const DEPTH = Number(args.depth) || 1;
const RENDER_THRESHOLD = 500; // chars of visible text below which a page counts as a JS shell

let renderPage = null, closeBrowser = null;
if (RENDER_MODE !== "off") {
  ({ renderPage, closeBrowser } = await import("./lib/render.js"));
}

function extFor(contentType, url) {
  if (contentType.includes("pdf") || /\.pdf(\?|#|$)/i.test(url)) return "pdf";
  // Plenty of small venues publish the happy hour menu as a photo. Saving it
  // as .html made it unreadable — extract.js hands images to Claude's Read
  // tool like it does PDFs.
  const m = /image\/(jpeg|jpg|png|webp|gif)/.exec(contentType) || /\.(jpe?g|png|webp|gif)(\?|#|$)/i.exec(url);
  if (m) { const e = (m[1] || "").toLowerCase(); return e === "jpg" ? "jpeg" : e || "jpeg"; }
  return "html";
}

/**
 * Fetch one URL into `dir` as `<base>.<ext>` — the extension is decided once,
 * after the real content type is known. JS-shell HTML (or a failed static
 * fetch) is re-rendered in Chromium when render mode allows.
 * Returns the manifest entry, plus `html` (the usable page text source) so
 * callers never re-read the file.
 */
async function fetchPage(url, dir, base) {
  const tmp = path.join(dir, `${base}.tmp`);
  const res = await curlGet(url, tmp);
  const fetchedOk = res.status >= 200 && res.status < 400;
  let ext = extFor(res.contentType, res.finalUrl || url);
  let html = null;
  let rendered = false;

  if (ext === "html" && fs.existsSync(tmp)) html = fs.readFileSync(tmp, "utf8");

  const isThin = html !== null && htmlToText(html).length < RENDER_THRESHOLD;
  const shouldRender = renderPage && ext !== "pdf" &&
    (RENDER_MODE === "always" || !fetchedOk || isThin);
  if (shouldRender) {
    const r = await renderPage(url);
    if (r.html && htmlToText(r.html).length > (html ? htmlToText(html).length : 0)) {
      html = r.html;
      ext = "html";
      rendered = true;
      fs.writeFileSync(tmp, html);
      res.finalUrl = r.finalUrl;
      if (!fetchedOk) { res.status = 200; res.contentType = "text/html"; res.error = null; }
    } else if (r.error && !fetchedOk) {
      res.error = `${res.error || `HTTP ${res.status}`}; render: ${r.error}`;
    }
  }

  const file = `${base}.${ext}`;
  try { fs.renameSync(tmp, path.join(dir, file)); } catch {}
  return { entry: { url, file, ...res, rendered }, html };
}

async function crawlVenue(venue) {
  const dir = path.join(CACHE_DIR, venue.id);
  fs.mkdirSync(dir, { recursive: true });
  const manifest = { id: venue.id, name: venue.name, website: venue.website, crawled_at: new Date().toISOString(), render_mode: RENDER_MODE, pages: [] };

  if (!venue.website) {
    manifest.error = "no website in seed";
  } else {
    const home = await fetchPage(venue.website, dir, "page0");
    manifest.pages.push({ role: "homepage", ...home.entry });

    if (home.entry.status >= 200 && home.entry.status < 400 && home.html) {
      const candidates = pickCandidates(extractLinks(home.html), home.entry.finalUrl || venue.website);
      const fetched = await mapConcurrent(candidates, 3, (cand, i) => fetchPage(cand.url, dir, `page${i + 1}`));
      fetched.forEach((f, i) => manifest.pages.push({ role: "candidate", linkText: candidates[i].text, score: candidates[i].score, ...f.entry }));

      // Depth 2: venues often park the happy hour item list one click past a
      // "Menus" page (or behind a PDF link there). Re-score links found on the
      // pages we just fetched and pull the best few we haven't already got.
      if (DEPTH >= 2) {
        const have = new Set([home.entry.finalUrl || venue.website, ...fetched.map((f) => f.entry.finalUrl || f.entry.url)]);
        const deeper = [];
        for (const f of fetched) {
          if (!f.html || !(f.entry.status >= 200 && f.entry.status < 400)) continue;
          for (const cand of pickCandidates(extractLinks(f.html), f.entry.finalUrl || f.entry.url, { max: 4 })) {
            if (have.has(cand.url) || deeper.some((d) => d.url === cand.url)) continue;
            deeper.push(cand);
          }
        }
        deeper.sort((a, b) => b.score - a.score);
        const picks = deeper.slice(0, 4);
        const n = manifest.pages.length;
        const got = await mapConcurrent(picks, 3, (cand, i) => fetchPage(cand.url, dir, `page${n + i}`));
        got.forEach((f, i) => manifest.pages.push({ role: "candidate-d2", linkText: picks[i].text, score: picks[i].score, ...f.entry }));
      }
    }
  }

  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  const okPages = manifest.pages.filter((p) => p.status >= 200 && p.status < 400).length;
  const renderedCount = manifest.pages.filter((p) => p.rendered).length;
  console.log(`${venue.id.padEnd(28)} ${okPages}/${manifest.pages.length} pages ok` +
    (renderedCount ? `  (${renderedCount} rendered)` : "") +
    (manifest.pages[0] && manifest.pages[0].status >= 400 ? `  [homepage HTTP ${manifest.pages[0].status}]` : "") +
    (manifest.pages[0] && manifest.pages[0].error ? `  [${manifest.pages[0].error}]` : ""));
  return manifest;
}

const manifests = await mapConcurrent(venues, Number(args.concurrency) || 6, crawlVenue);
if (closeBrowser) await closeBrowser();
const totalOk = manifests.filter((m) => m.pages.some((p) => p.status >= 200 && p.status < 400)).length;
const totalRendered = manifests.reduce((s, m) => s + m.pages.filter((p) => p.rendered).length, 0);
console.log(`\n${totalOk}/${venues.length} venues have at least one fetched page; ${totalRendered} pages Chromium-rendered.`);
