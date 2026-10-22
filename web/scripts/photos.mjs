// Turns each venue's cover photo into a local 640px WebP in public/photos,
// so the app never hotlinks venue websites (slow, fragile, and 110 of them
// are http:// mixed content). Local originals live in ../photos.
//
//   node scripts/photos.mjs           convert local originals only (build)
//   node scripts/photos.mjs --remote  also download remote covers into
//                                     ../photos first (daily refresh job)
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { photoProblem } from "./photo-quality.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const originals = resolve(root, "photos");
const out = resolve(here, "../public/photos");
mkdirSync(out, { recursive: true });

const remote = process.argv.includes("--remote");
// Downloads run 12 at a time and stop starting new ones after the deadline,
// so a few slow venue sites can't stall a deploy. Covers that miss this run
// keep their remote URL in the app and are retried on the next one.
const CONCURRENCY = 12;
const deadline = Date.now() + Number(process.env.PHOTOS_DEADLINE_MS || 180_000);
const { venues } = JSON.parse(readFileSync(resolve(root, "venues.json"), "utf8"));

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

async function download(v) {
  const url = v.cover_image.url.replace(/^http:/, "https:");
  for (const u of [url, v.cover_image.url]) {
    try {
      const res = await fetch(u, { signal: AbortSignal.timeout(Math.max(1000, Math.min(10_000, deadline - Date.now()))), headers: { "user-agent": "alittlehang-photos/1.0" } });
      if (!res.ok || !/^image\//.test(res.headers.get("content-type") || "")) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const ext = extname(new URL(u).pathname).toLowerCase();
      const file = resolve(originals, v.id + ([".png", ".webp", ".jpeg"].includes(ext) ? ext : ".jpg"));
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

if (remote) {
  const queue = live.filter((v) => !originalFor(v));
  const worker = async () => {
    for (let v = queue.shift(); v; v = queue.shift()) {
      if (Date.now() > deadline) {
        skipped++;
        continue;
      }
      if (await download(v)) fetched++;
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`photos: ${fetched} downloaded${skipped ? `, ${skipped} left for the next run (deadline)` : ""}`);
}

for (const v of live) {
  const src = originalFor(v);
  if (!src || !existsSync(src)) continue;
  const dest = resolve(out, `${v.id}.webp`);
  if (existsSync(dest) && statSync(dest).mtimeMs >= statSync(src).mtimeMs) continue;
  try {
    await sharp(src).rotate().resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true }).webp({ quality: 72 }).toFile(dest);
    made++;
  } catch {
    failed++;
  }
}
console.log(`photos: ${made} converted, ${failed} failed, ${live.length} venues with a cover`);

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
writeFileSync(qualityFile, JSON.stringify(scored));
const rejected = Object.entries(scored).filter(([, q]) => q.problem);
console.log(`photos: ${rejected.length} covers rejected${rejected.length ? ` (${rejected.map(([id, q]) => `${id}: ${q.problem}`).join(", ")})` : ""}`);
