// Phase 1: for each venue, fetch its homepage, discover candidate
// happy-hour/menu pages, and cache everything under pipeline/cache/<id>/.
// JS-rendered pages fall back to headless Chromium (lib/render.js).
// Usage: node pipeline/crawl.js [--only id1,id2] [--concurrency 6]
//        [--render auto|always|off]   (auto = render when static text is thin)
import fs from "node:fs";
import path from "node:path";
import { loadSeed, parseArgs, CACHE_DIR } from "./lib/venues.js";
import { curlGet, mapConcurrent } from "./lib/curl.js";
import { extractLinks, pickCandidates, htmlToText } from "./lib/html.js";

const args = parseArgs(process.argv.slice(2));
const only = args.only ? String(args.only).split(",") : null;
// --venues <path.json>: run over candidate stubs (discovery) instead of the seed
const allVenues = args.venues ? JSON.parse(fs.readFileSync(args.venues, "utf8")) : loadSeed();
const venues = allVenues.filter((v) => !only || only.includes(v.id));
const RENDER_MODE = args.render || "auto"; // auto | always | off
const RENDER_THRESHOLD = 500; // chars of visible text below which a page counts as a JS shell

let renderPage = null, closeBrowser = null;
if (RENDER_MODE !== "off") {
  ({ renderPage, closeBrowser } = await import("./lib/render.js"));
}

function extFor(contentType, url) {
  if (contentType.includes("pdf") || /\.pdf(\?|#|$)/i.test(url)) return "pdf";
  return "html";
}

/**
 * Fetch one HTML-or-PDF URL to `file`; when the static HTML looks like a JS
 * shell (or render mode is "always"), re-render it in Chromium and overwrite.
 * Returns the manifest entry fields.
 */
async function fetchPage(url, file) {
  const res = await curlGet(url, file);
  const entry = { ...res, rendered: false };
  const isHtml = fs.existsSync(file) && extFor(res.contentType, res.finalUrl || url) === "html";
  const fetchedOk = res.status >= 200 && res.status < 400;

  if (renderPage && (isHtml || !fetchedOk)) {
    const textLen = isHtml && fetchedOk ? htmlToText(fs.readFileSync(file, "utf8")).length : 0;
    const shouldRender = RENDER_MODE === "always" || !fetchedOk || textLen < RENDER_THRESHOLD;
    if (shouldRender) {
      const r = await renderPage(url);
      if (r.html && htmlToText(r.html).length > textLen) {
        fs.writeFileSync(file, r.html);
        entry.rendered = true;
        entry.finalUrl = r.finalUrl;
        if (!fetchedOk) { entry.status = 200; entry.contentType = "text/html"; entry.error = null; }
      } else if (r.error && !fetchedOk) {
        entry.error = `${entry.error || `HTTP ${res.status}`}; render: ${r.error}`;
      }
    }
  }
  return entry;
}

async function crawlVenue(venue) {
  const dir = path.join(CACHE_DIR, venue.id);
  fs.mkdirSync(dir, { recursive: true });
  const manifest = { id: venue.id, name: venue.name, website: venue.website, crawled_at: new Date().toISOString(), render_mode: RENDER_MODE, pages: [] };

  if (!venue.website) {
    manifest.error = "no website in seed";
  } else {
    const homeFile = path.join(dir, "page0.html");
    const home = await fetchPage(venue.website, homeFile);
    manifest.pages.push({ url: venue.website, role: "homepage", file: "page0.html", ...home });

    if (home.status >= 200 && home.status < 400 && !home.contentType.includes("pdf")) {
      const html = fs.readFileSync(homeFile, "utf8");
      const candidates = pickCandidates(extractLinks(html), home.finalUrl || venue.website);
      let i = 1;
      for (const cand of candidates) {
        const probeExt = /\.pdf(\?|#|$)/i.test(cand.url) ? "pdf" : "html";
        let file = `page${i}.${probeExt}`;
        const res = await fetchPage(cand.url, path.join(dir, file));
        const realExt = extFor(res.contentType, res.finalUrl || cand.url);
        if (realExt !== probeExt && !res.rendered) {
          const renamed = `page${i}.${realExt}`;
          try { fs.renameSync(path.join(dir, file), path.join(dir, renamed)); file = renamed; } catch {}
        }
        manifest.pages.push({ url: cand.url, role: "candidate", linkText: cand.text, score: cand.score, file, ...res });
        i++;
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
