// Phase 2b: hunt down happy-hour pages the homepage never linked to.
//
// crawl.js follows links it can see. Plenty of venues never link their happy
// hour menu from the homepage — chains bury it at
// /locations/<x>/menu/happy-hour/, others ship it as a PDF or a page only
// listed in the sitemap. This discovers those URLs three ways (sitemap,
// common path guesses, and the venue's own linked menu pages), fetches the
// hits, and APPENDS them to the venue's crawl manifest so extract.js picks
// them up like any other cached page.
//
// Usage: node pipeline/deep-pages.js [--venues <stubs.json>] [--only id1,id2]
//        [--concurrency 4]
import fs from "node:fs";
import path from "node:path";
import { parseArgs, selectVenues, readJson, CACHE_DIR } from "./lib/venues.js";
import { curlGet, mapConcurrent } from "./lib/curl.js";
import { extractLinks, htmlToText } from "./lib/html.js";

// Menu pages are frequently JS-rendered: the URL answers 200 with a full
// shell and zero prices. Chromium is the fallback for exactly those.
const { renderPage, closeBrowser } = await import("./lib/render.js");

const args = parseArgs(process.argv.slice(2));
const venues = selectVenues(args);

const WORTH = /happy.?hour|happyhour|social.?hour|aperitivo|late.?night|specials?|deals?/i;
const MENUISH = /menu|drink|food|bar|eat/i;
// Paths worth trying blind — cheap, and they hit constantly on small sites.
const GUESSES = [
  "happy-hour", "happyhour", "happy-hour-menu", "menu/happy-hour", "menus/happy-hour",
  "specials", "deals", "happy-hour/", "drinks", "menus", "menu", "food-menu", "drink-menu",
];

async function sitemapUrls(origin, depth = 0) {
  if (depth > 1) return [];
  const out = [];
  for (const name of depth === 0 ? ["sitemap.xml", "sitemap_index.xml", "wp-sitemap.xml"] : [origin]) {
    const url = depth === 0 ? new URL("/" + name, origin).toString() : origin;
    const tmp = path.join("/tmp", `sm-${Math.random().toString(36).slice(2)}.xml`);
    const res = await curlGet(url, tmp, { timeout: 20 });
    if (res.status !== 200) { try { fs.rmSync(tmp, { force: true }); } catch {} continue; }
    let xml = "";
    try { xml = fs.readFileSync(tmp, "utf8"); } catch {}
    try { fs.rmSync(tmp, { force: true }); } catch {}
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
    // A sitemap index points at more sitemaps — follow the promising ones.
    for (const loc of locs) {
      if (/\.xml(\?|$)/i.test(loc) && depth === 0) {
        if (MENUISH.test(loc) || /page|post/i.test(loc) || locs.length <= 6) out.push(...await sitemapUrls(loc, 1));
      } else out.push(loc);
    }
    if (out.length) break;
  }
  return out;
}

async function deepen(venue) {
  if (!venue.website) return { id: venue.id, added: 0 };
  const dir = path.join(CACHE_DIR, venue.id);
  const manifestPath = path.join(dir, "manifest.json");
  const manifest = readJson(manifestPath, null);
  if (!manifest) return { id: venue.id, added: 0, note: "no crawl manifest" };
  fs.mkdirSync(dir, { recursive: true });

  const have = new Set(manifest.pages.map((p) => (p.finalUrl || p.url || "").replace(/#.*$/, "")));
  const origin = new URL(venue.website).origin;
  // On a chain site every page links every other location's menu. Anything
  // under /locations/<other> is a different restaurant with different prices.
  const locSlug = /\/locations?\/([^/]+)/i.exec(venue.website)?.[1] || null;
  const wanted = new Map();
  const want = (u, why) => {
    try {
      const url = new URL(u, venue.website);
      url.hash = "";
      if (url.origin !== origin) return;             // first-party only
      const s = url.toString();
      if (locSlug && /\/locations?\//i.test(s) && !s.includes(locSlug)) return;
      if (have.has(s) || wanted.has(s)) return;
      wanted.set(s, why);
    } catch {}
  };

  // 1) sitemap entries that look like a happy hour or menu page
  let sm = [];
  try { sm = await sitemapUrls(origin); } catch {}
  for (const u of sm) {
    if (!WORTH.test(u) && !MENUISH.test(u)) continue;
    want(u, "sitemap");
  }

  // 2) blind path guesses, including under a chain's location path
  const bases = [origin + "/"];
  const locPath = /\/locations?\/[^/]+/i.exec(venue.website)?.[0];
  if (locPath) bases.push(origin + locPath + "/");
  for (const b of bases) for (const g of GUESSES) want(b + g, "guess");

  // 3) links on pages we already cached that we skipped the first time
  for (const p of manifest.pages) {
    if (!p.file || !/\.html?$/i.test(p.file)) continue;
    let html = "";
    try { html = fs.readFileSync(path.join(dir, p.file), "utf8"); } catch { continue; }
    for (const { href, text } of extractLinks(html)) {
      if (WORTH.test(href) || WORTH.test(text || "")) want(href, "link");
    }
  }

  // Cap the work per venue, best first. A URL the site itself publishes in
  // its sitemap beats a blind guess: many sites answer 200 for any path, so
  // guesses produce soft-404s that would otherwise crowd out the real page.
  const rank = ([url, why]) => (WORTH.test(url) ? 0 : 10) + (why === "sitemap" ? 0 : why === "link" ? 1 : 2);
  const picks = [...wanted.entries()].sort((a, b) => rank(a) - rank(b)).slice(0, 14);

  const n = manifest.pages.length;
  let added = 0;
  // Index-based filenames: a shared counter races under mapConcurrent and
  // two workers silently overwrite each other's page.
  await mapConcurrent(picks, 3, async ([url, why], i) => {
    const base = `deep${n + i}`;
    const tmp = path.join(dir, base + ".tmp");
    const res = await curlGet(url, tmp, { timeout: 30 });
    const ok = res.status >= 200 && res.status < 400;
    const isPdf = (res.contentType || "").includes("pdf") || /\.pdf(\?|$)/i.test(res.finalUrl || url);
    const imgM = /image\/(jpeg|jpg|png|webp|gif)/.exec(res.contentType || "") || /\.(jpe?g|png|webp|gif)(\?|$)/i.exec(res.finalUrl || url);
    if (!ok) { try { fs.rmSync(tmp, { force: true }); } catch {} return; }
    const ext = isPdf ? "pdf" : imgM ? ((imgM[1] || "jpeg").toLowerCase() === "jpg" ? "jpeg" : (imgM[1] || "jpeg").toLowerCase()) : "html";
    const file = `${base}.${ext}`;
    try { fs.renameSync(tmp, path.join(dir, file)); } catch { return; }
    // Skip pages with no usable body (soft-404s answer 200 with a shell).
    if (!isPdf && !imgM) {
      const size = fs.statSync(path.join(dir, file)).size;
      if (size < 800) { fs.rmSync(path.join(dir, file), { force: true }); return; }
    }
    const entry = { role: `deep-${why}`, score: WORTH.test(url) ? 200 : 60, url, file, ...res };
    added++;
    manifest.pages.push(entry);

    // Menu pages are usually JS-rendered: the static fetch returns a big
    // navigation shell and the items arrive later. Render happy-hour URLs and
    // keep the result as an ADDITIONAL page rather than replacing the static
    // one — prices are often bare numbers ("TRUFFLE FRIES ... 9"), so no
    // cheap text test reliably says which copy is better. Let the extractor
    // read both.
    if (!isPdf && !imgM && WORTH.test(url)) {
      try {
        const { html } = await renderPage(url);   // returns { html, finalUrl, error }
        if (html && htmlToText(html).length > 200) {
          const rfile = `${base}-r.html`;
          fs.writeFileSync(path.join(dir, rfile), html);
          added++;
          manifest.pages.push({ role: `deep-${why}-rendered`, score: 250, url, file: rfile, status: 200, contentType: "text/html", finalUrl: url, rendered: true });
        }
      } catch {}
    }
  });

  if (added) fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`${venue.id.padEnd(36)} +${added} pages` + (picks.length ? `  (tried ${picks.length})` : ""));
  return { id: venue.id, added };
}

const res = await mapConcurrent(venues, Number(args.concurrency) || 4, deepen);
await closeBrowser();
console.log(`\n${res.reduce((s, r) => s + r.added, 0)} pages added across ${res.filter((r) => r.added).length} venues.`);
