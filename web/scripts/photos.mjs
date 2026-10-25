// Turns each venue's cover photo into a local 640px WebP in public/photos,
// and its gallery photos into 1080px WebPs in public/photos/g,
// so the app never hotlinks venue websites (slow, fragile, and 110 of them
// are http:// mixed content). Local originals live in ../photos.
//
//   node scripts/photos.mjs           convert local originals only (build)
//   node scripts/photos.mjs --remote  also download remote covers into
//                                     ../photos first (daily refresh job)
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { galleryStem, photoProblem } from "./photo-quality.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const originals = resolve(root, "photos");
const out = resolve(here, "../public/photos");
mkdirSync(resolve(out, "g"), { recursive: true });
mkdirSync(resolve(originals, "g"), { recursive: true });

const remote = process.argv.includes("--remote");
// Downloads run 12 at a time and stop starting new ones after the deadline,
// so a few slow venue sites can't stall a deploy. Covers that miss this run
// keep their remote URL in the app and are retried on the next one.
const CONCURRENCY = 12;
const deadline = Date.now() + Number(process.env.PHOTOS_DEADLINE_MS || 180_000);
const { venues } = JSON.parse(readFileSync(resolve(root, "venues.json"), "utf8"));

// Which URL each downloaded cover came from. When a venue's cover changes
// (pipeline/site-photos.js swapping a logo for a real photo), the old
// download and its WebP go, so the cached copy can't outlive it. The first
// run without this file adopts what's there.
const sourcesFile = resolve(originals, "sources.json");
const firstRun = !existsSync(sourcesFile);
const sources = firstRun ? {} : JSON.parse(readFileSync(sourcesFile, "utf8"));
for (const v of venues) {
  const url = v.cover_image?.url;
  if (!url || !/^https?:/.test(url) || sources[v.id] === url) continue;
  if (!firstRun) {
    for (const ext of [".jpg", ".jpeg", ".png", ".webp"]) rmSync(resolve(originals, v.id + ext), { force: true });
    rmSync(resolve(out, `${v.id}.webp`), { force: true });
    rmSync(resolve(out, "email", `${v.id}.jpg`), { force: true });
  }
  sources[v.id] = url;
}
writeFileSync(sourcesFile, JSON.stringify(sources));

// The original for a venue: its committed local file, or a previously
// downloaded remote cover saved as ../photos/<id>.<ext>.
export function originalFor(v) {
  const url = v.cover_image?.url;
  if (!url) return null;
  if (!/^https?:/.test(url)) return resolve(root, url);
  for (const ext of [".jpg", ".jpeg", ".png", ".webp"]) {
    const p = resolve(originals, v.id + ext);
    if (existsSync(p)) return p;
  }
  return null;
}

// A gallery photo's original: ../photos/g/<stem>.<ext> once downloaded.
function galleryOriginal(v, url) {
  const stem = galleryStem(v.id, url);
  for (const ext of [".jpg", ".jpeg", ".png", ".webp"]) {
    const p = resolve(originals, "g", stem + ext);
    if (existsSync(p)) return p;
  }
  return null;
}

async function download(rawUrl, stem) {
  const url = rawUrl.replace(/^http:/, "https:");
  for (const u of [url, rawUrl]) {
    try {
      const res = await fetch(u, { signal: AbortSignal.timeout(Math.max(1000, Math.min(10_000, deadline - Date.now()))), headers: { "user-agent": "alittlehang-photos/1.0" } });
      if (!res.ok || !/^image\//.test(res.headers.get("content-type") || "")) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const ext = extname(new URL(u).pathname).toLowerCase();
      const file = resolve(originals, stem + ([".png", ".webp", ".jpeg"].includes(ext) ? ext : ".jpg"));
      writeFileSync(file, buf);
      return file;
    } catch {
      // try the next form of the URL
    }
  }
  return null;
}

let made = 0;
let failed = 0;
let fetched = 0;
let skipped = 0;
const live = venues.filter((v) => v.business_status !== "CLOSED_PERMANENTLY" && v.cover_image?.url);

// Gallery photos: every https photo after the cover (scripts/sync-data.mjs
// shows the first 8 that pass the quality check).
const galleryOf = (v) => [...new Set((v.photos || []).map((p) => p?.url).filter((u) => u && /^https?:/.test(u) && u !== v.cover_image?.url))].slice(0, 12);
const gallery = venues.filter((v) => v.business_status !== "CLOSED_PERMANENTLY").flatMap((v) => galleryOf(v).map((url) => ({ v, url, stem: galleryStem(v.id, url) })));

if (remote) {
  const queue = [
    ...live.filter((v) => !originalFor(v)).map((v) => () => download(v.cover_image.url, v.id)),
    ...gallery.filter((g) => !galleryOriginal(g.v, g.url)).map((g) => () => download(g.url, `g/${g.stem}`)),
  ];
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      if (Date.now() > deadline) {
        skipped++;
        continue;
      }
      if (await job()) fetched++;
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`photos: ${fetched} downloaded${skipped ? `, ${skipped} left for the next run (deadline)` : ""}`);
}

const convert = async (src, dest, width) => {
  if (existsSync(dest) && statSync(dest).mtimeMs >= statSync(src).mtimeMs) return;
  try {
    await sharp(src).rotate().resize({ width, height: width, fit: "inside", withoutEnlargement: true }).webp({ quality: 72 }).toFile(dest);
    made++;
  } catch {
    failed++;
  }
};
// Emails get a JPEG banner too (Outlook for Windows can't show WebP), with
// the claim page's dark fade baked in so white text sits on it in any client.
const SHADE = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="640"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.15"/><stop offset="0.45" stop-color="#000" stop-opacity="0.3"/><stop offset="1" stop-color="#000" stop-opacity="0.86"/></linearGradient></defs><rect width="1120" height="640" fill="url(#g)"/></svg>`,
);
const banner = async (src, dest) => {
  if (existsSync(dest) && statSync(dest).mtimeMs >= statSync(src).mtimeMs) return;
  try {
    await sharp(src)
      .rotate()
      .resize({ width: 1120, height: 640, fit: "cover", position: "attention" })
      .composite([{ input: SHADE }])
      .jpeg({ quality: 70, mozjpeg: true })
      .toFile(dest);
    made++;
  } catch {
    failed++;
  }
};
mkdirSync(resolve(out, "email"), { recursive: true });
for (const v of live) {
  const src = originalFor(v);
  if (src && existsSync(src)) {
    await convert(src, resolve(out, `${v.id}.webp`), 640);
    await banner(src, resolve(out, "email", `${v.id}.jpg`));
  }
}
for (const g of gallery) {
  const src = galleryOriginal(g.v, g.url);
  if (src) await convert(src, resolve(out, "g", `${g.stem}.webp`), 1080);
}
console.log(`photos: ${made} converted, ${failed} failed, ${live.length} venues with a cover, ${gallery.length} gallery photos`);

// Score every original so sync-data can drop covers that would make a bad
// hero (logos, near-black graphics). Cached by file mtime next to the WebPs.
const qualityFile = resolve(out, "quality.json");
let quality = {};
try {
  quality = JSON.parse(readFileSync(qualityFile, "utf8"));
} catch {
  // first run
}
const scored = {};
for (const v of live) {
  const src = originalFor(v);
  if (!src || !existsSync(src)) continue;
  const mtime = Math.round(statSync(src).mtimeMs);
  const prev = quality[v.id];
  scored[v.id] = prev && prev.mtime === mtime ? prev : { mtime, problem: await photoProblem(src).catch(() => "unreadable") };
}
for (const g of gallery) {
  const src = galleryOriginal(g.v, g.url);
  if (!src) continue;
  const key = `g/${g.stem}`;
  const mtime = Math.round(statSync(src).mtimeMs);
  const prev = quality[key];
  scored[key] = prev && prev.mtime === mtime ? prev : { mtime, problem: await photoProblem(src).catch(() => "unreadable") };
}
writeFileSync(qualityFile, JSON.stringify(scored));
const rejected = Object.entries(scored).filter(([, q]) => q.problem);
console.log(`photos: ${rejected.length} covers rejected${rejected.length ? ` (${rejected.map(([id, q]) => `${id}: ${q.problem}`).join(", ")})` : ""}`);
