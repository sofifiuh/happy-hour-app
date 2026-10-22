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

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const originals = resolve(root, "photos");
const out = resolve(here, "../public/photos");
mkdirSync(out, { recursive: true });

const remote = process.argv.includes("--remote");
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
      const res = await fetch(u, { signal: AbortSignal.timeout(15000), headers: { "user-agent": "alittlehang-photos/1.0" } });
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
const live = venues.filter((v) => v.business_status !== "CLOSED_PERMANENTLY" && v.cover_image?.url);
for (const v of live) {
  let src = originalFor(v);
  if (!src && remote) src = await download(v);
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
