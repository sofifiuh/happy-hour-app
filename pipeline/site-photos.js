// Phase 9: venue photos from the venue's own website.
//
// Most venues reached the app with one cover: the og:image off their
// homepage, which is often a logo or a dark share card, so the app drops it
// and shows the branded placeholder. Their sites usually have real photos
// of the room, the bar and the food further in (Nova Kitchen & Bar's /about
// page, for one). This renders the homepage plus a few "about / gallery /
// our space" pages in Chromium, collects every large image on them, scores
// each one with the same check the site build uses (web/scripts/
// photo-quality.mjs: no logos, graphics, near-black or tiny images), drops
// duplicates and keeps a bright cover and up to 8 gallery photos.
//
// Only URLs are stored (pipeline/site-photos.json), each with the page it
// came from: the site build downloads and resizes them, and the app credits
// the venue and links back to that page. Nothing here re-hosts Places
// photos; writeback.js prefers these over the Places backfill.
//
// Usage: node pipeline/site-photos.js [--only id1,id2] [--max 150] [--venues file]
//          [--days 30] [--concurrency 4]
//   --max   venues per run, worst covers first (default 150)
//   --days  re-check a venue after this many days (default 30)
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { parseArgs, readJson, CACHE_DIR, REPO_ROOT } from "./lib/venues.js";
import { curlGet, mapConcurrent, UA } from "./lib/curl.js";
import { photoHash, photoProblem, photoStats } from "../web/scripts/photo-quality.mjs";

const args = parseArgs(process.argv.slice(2));
const STORE = path.join(REPO_ROOT, "pipeline", "site-photos.json");
const WORK = path.join(CACHE_DIR, "site-photos");
const TODAY = new Date().toISOString().slice(0, 10);
const MAX = Number(args.max) || 150;
const DAYS = Number(args.days ?? 30);
const CONCURRENCY = Number(args.concurrency) || 4;
const GALLERY = 8;
const deadline = Date.now() + Number(process.env.SITE_PHOTOS_DEADLINE_MS || 50 * 60_000);
// A venue whose site hangs the browser (a script that never yields, a
// download that never ends) is given up on after this long.
const VENUE_TIMEOUT = 3 * 60_000;

// Same tells as web/scripts/sync-data.mjs, plus icons, sprites and
// placeholders that only ever show up deeper in a site.
const LOGO_URL = /logo|lockup|wordmark|favicon|badge|site-identity|transparent|og-image|social[+_ -]?share|facebook[+_ -]?share|[-_+](black|white|blk|wht)\.(png|svg)|\.svg(\?|$)|\.gif(\?|$)|icon|sprite|placeholder|spinner|loader|avatar|emoji|award|certificate|map[-_]?(pin|marker)|qr[-_]?code/i;
// Images served by someone else (maps, review sites, social embeds, ad
// pixels): not the venue's to offer, so not ours to show.
const ELSEWHERE = /(^|\.)(google|googleapis|gstatic|googleusercontent|facebook|fbcdn|instagram|cdninstagram|tripadvisor|yelp|opentable|resy|tock|toasttab|ubereats|doordash|skipthedishes|gravatar|doubleclick|tiktok|twitter|x|pinterest|youtube|ytimg|vimeocdn)\./i;
// Links worth opening after the homepage.
const PAGE_HINT = /about|story|gallery|galler|photo|space|room|interior|visit|private|event|venue|atmosphere|ambiance|experience|location|our-|who-we-are|patio/i;

const { venues } = readJson(args.venues ? path.resolve(args.venues) : path.join(REPO_ROOT, "venues.json"), { venues: [] });
const store = readJson(STORE, {});

// Worst first: no cover, then a logo-looking one, then a Places stand-in,
// then everyone else short of a gallery.
const rank = (v) => {
  const url = v.cover_image?.url;
  if (!url) return 0;
  if (LOGO_URL.test(decodeURIComponent(url))) return 1;
  if (v.cover_image.source === "google_places") return 2;
  return 3;
};
const only = args.only ? new Set(String(args.only).split(",")) : null;
const due = (v) => {
  const s = store[v.id];
  if (!s?.checked_at) return true;
  return (Date.parse(TODAY) - Date.parse(s.checked_at)) / 86_400_000 >= DAYS;
};
const targets = venues
  .filter((v) => v.business_status !== "CLOSED_PERMANENTLY" && v.website && /^https?:/.test(v.website))
  .filter((v) => (only ? only.has(v.id) : due(v) && (v.photos || []).length < 3))
  .sort((a, b) => rank(a) - rank(b))
  .slice(0, only ? undefined : MAX);
console.log(`${targets.length} venues to look for photos on (max ${MAX}, re-check after ${DAYS} days)`);
if (!targets.length) process.exit(0);
fs.mkdirSync(WORK, { recursive: true });

// --- Browser: unlike lib/render.js this one lets images load, so lazy
// --- loaders swap in the real sources and the DOM reports their sizes.
const { chromium } = await import("playwright-core");
const launch = { headless: true, args: ["--no-sandbox"] };
if (fs.existsSync("/opt/pw-browsers/chromium")) launch.executablePath = "/opt/pw-browsers/chromium";
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
if (proxy) launch.proxy = { server: proxy, bypass: "localhost,127.0.0.1" };
const browser = await chromium.launch(launch);
const context = await browser.newContext({ userAgent: UA, viewport: { width: 1440, height: 1000 } });
await context.route("**/*", (route) => (["media", "font"].includes(route.request().resourceType()) ? route.abort() : route.continue()));

/** Every image on the page at least 400px wide, with the largest source
 *  the page offers, plus og:image and same-site links worth a visit. */
async function scan(url) {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40_000 });
    await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
    // Scroll through so lazy images load, then back to the top.
    await page.evaluate(async () => {
      for (let y = 0; y < Math.min(document.body.scrollHeight, 20_000); y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(800);
    return await page.evaluate(() => {
      const abs = (u) => {
        try {
          return new URL(u, location.href).toString();
        } catch {
          return null;
        }
      };
      // The widest candidate in a srcset ("a.jpg 640w, b.jpg 1280w").
      const widest = (set) => {
        let best = null;
        let bestW = 0;
        for (const part of (set || "").split(/,\s+(?=\S)/)) {
          const [u, d = ""] = part.trim().split(/\s+/);
          const w = d.endsWith("w") ? parseInt(d) : d.endsWith("x") ? parseFloat(d) * 1000 : 1;
          if (u && w >= bestW) [best, bestW] = [u, w];
        }
        return best;
      };
      const found = [];
      const og = document.querySelector('meta[property="og:image"], meta[property="og:image:secure_url"], meta[name="twitter:image"]');
      if (og?.content) found.push({ url: abs(og.content), w: 0, og: true });
      for (const img of document.images) {
        const r = img.getBoundingClientRect();
        if (Math.max(img.naturalWidth, r.width) < 400) continue;
        // The largest source on offer: Squarespace's data-image is the
        // original, then the widest srcset entry (a <picture>'s own first).
        const pic = [...(img.closest("picture")?.querySelectorAll("source") ?? [])].map((s) => widest(s.srcset)).find(Boolean);
        const url = abs(img.dataset.image || pic || widest(img.getAttribute("srcset") || img.dataset.srcset) || img.currentSrc || img.src || img.dataset.src);
        if (url && !url.startsWith("data:")) found.push({ url, w: img.naturalWidth || Math.round(r.width), alt: img.alt || "" });
      }
      for (const el of document.querySelectorAll("section, div, figure, a, header, li")) {
        const r = el.getBoundingClientRect();
        if (r.width < 400 || r.height < 250) continue;
        const bg = getComputedStyle(el).backgroundImage;
        const m = bg && bg.match(/url\(["']?([^"')]+)["']?\)/);
        if (m && !m[1].startsWith("data:")) found.push({ url: abs(m[1]), w: Math.round(r.width) });
      }
      const links = [...document.querySelectorAll("a[href]")].map((a) => ({ href: abs(a.getAttribute("href")), text: (a.textContent || "").trim().slice(0, 60) }));
      return { found, links, finalUrl: location.href };
    });
  } finally {
    await page.close().catch(() => {});
  }
}

const sameSite = (a, b) => {
  try {
    const h = (u) => new URL(u).hostname.replace(/^www\./, "");
    return h(a) === h(b);
  } catch {
    return false;
  }
};

const hamming = (a, b) => {
  let x = a ^ b;
  let n = 0;
  while (x) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
};

/** Download and judge one image. Returns null when it can't be a photo. */
async function judge(c, dir) {
  const file = path.join(dir, createHash("sha1").update(c.url).digest("hex").slice(0, 12));
  const res = await curlGet(c.url, file, { timeout: 20 });
  if (res.status !== 200 || !res.contentType.startsWith("image/") || /svg|gif|icon/.test(res.contentType)) return null;
  try {
    // Real photos at this size are rarely under 12 KB; flat graphics are.
    if (fs.statSync(file).size < 12_000) return { ...c, problem: "tiny file" };
    const problem = await photoProblem(file);
    if (problem) return { ...c, problem };
    const s = await photoStats(file);
    const aspect = s.width / s.height;
    if (Math.min(s.width, s.height) < 400 || aspect < 0.7 || aspect > 2.6) return { ...c, problem: "shape" };
    // A cover wants a bright, colourful, landscape photo; gallery photos
    // just need to be decent.
    const light = s.mean >= 60 && s.mean <= 215 ? 1 : 0.4;
    const shape = aspect >= 1.2 && aspect <= 2 ? 1 : 0.7;
    const size = Math.min(1, (s.width * s.height) / (1600 * 1000));
    return { ...c, w: s.width, h: s.height, mean: Math.round(s.mean), hash: await photoHash(file), score: +(light * shape * (0.5 + 0.5 * size) * (0.6 + Math.min(0.4, s.sd / 150))).toFixed(3) };
  } catch {
    return null;
  } finally {
    fs.rmSync(file, { force: true });
  }
}

async function photosFor(v) {
  const dir = path.join(WORK, v.id);
  fs.mkdirSync(dir, { recursive: true });
  const pages = [];
  const candidates = new Map();
  const add = (list, page) => {
    for (const c of list) {
      if (!c.url || !/^https?:/.test(c.url) || LOGO_URL.test(decodeURIComponent(c.url)) || ELSEWHERE.test(new URL(c.url).hostname)) continue;
      if (/logo/i.test(c.alt || "")) continue;
      if (!candidates.has(c.url)) candidates.set(c.url, { url: c.url, page, og: !!c.og });
    }
  };
  const home = await scan(v.website);
  pages.push(home.finalUrl);
  add(home.found, home.finalUrl);
  const next = [...new Map(home.links.filter((l) => l.href && sameSite(l.href, home.finalUrl) && PAGE_HINT.test(`${new URL(l.href).pathname} ${l.text}`) && !/\.(pdf|jpe?g|png)$/i.test(l.href)).map((l) => [l.href.split("#")[0], l])).keys()]
    .filter((u) => u !== home.finalUrl.split("#")[0])
    .slice(0, 3);
  for (const u of next) {
    if (Date.now() > deadline) break;
    const r = await scan(u).catch(() => null);
    if (!r) continue;
    pages.push(r.finalUrl);
    add(r.found, r.finalUrl);
  }

  // The current cover gets judged too, so writeback knows whether to swap it.
  const cover = v.cover_image?.url && /^https?:/.test(v.cover_image.url) ? await judge({ url: v.cover_image.url }, dir) : null;
  const coverProblem = !v.cover_image?.url ? "missing" : cover === null && /^https?:/.test(v.cover_image.url) ? "unreadable" : cover?.problem || (cover && cover.mean < 60 ? "dark" : null);

  const judged = [];
  for (const c of [...candidates.values()].slice(0, 40)) {
    if (Date.now() > deadline) break;
    const j = await judge(c, dir);
    if (j && !j.problem) judged.push(j);
  }
  // Keep the biggest copy of each photo.
  judged.sort((a, b) => b.w * b.h - a.w * a.h);
  const unique = [];
  for (const j of judged) if (!unique.some((u) => hamming(u.hash, j.hash) <= 6)) unique.push(j);
  unique.sort((a, b) => b.score - a.score);
  const best = unique.find((u) => u.mean >= 60) || null;
  const strip = ({ url, page, w, h }) => ({ url, page, w, h });
  fs.rmSync(dir, { recursive: true, force: true });
  return {
    checked_at: TODAY,
    pages,
    cover_problem: coverProblem,
    cover: best ? strip(best) : null,
    gallery: unique.filter((u) => u !== best).slice(0, GALLERY).map(strip),
  };
}

// Saved after every venue, so a run cut short keeps what it found.
// Sorted keys keep the daily diff readable.
const save = () => fs.writeFileSync(STORE, JSON.stringify(Object.fromEntries(Object.entries(store).sort(([a], [b]) => a.localeCompare(b))), null, 2) + "\n");

let found = 0;
let failed = 0;
await mapConcurrent(targets, CONCURRENCY, async (v) => {
  if (Date.now() > deadline) return;
  let timer;
  try {
    const r = await Promise.race([photosFor(v), new Promise((_, reject) => (timer = setTimeout(() => reject(new Error("timed out")), VENUE_TIMEOUT)))]);
    store[v.id] = r;
    const n = (r.cover ? 1 : 0) + r.gallery.length;
    if (n) found++;
    console.log(`  ${n ? "+" : "-"} ${v.id.padEnd(34)} ${n} photos${r.cover_problem ? `  (cover: ${r.cover_problem})` : ""}  ${r.pages.length} pages`);
  } catch (e) {
    failed++;
    // Remember the attempt so a dead site isn't retried every night.
    store[v.id] = { checked_at: TODAY, error: String(e.message || e).slice(0, 160), pages: [], cover: null, gallery: [] };
    console.log(`  ! ${v.id.padEnd(34)} ${store[v.id].error}`);
  } finally {
    clearTimeout(timer);
  }
  save();
});
save();
console.log(`\nsite photos: ${found} venues with photos, ${failed} failed; store covers ${Object.keys(store).length} venues`);
// A venue that timed out can leave a page that blocks browser.close().
await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 15_000))]);
process.exit(0);
