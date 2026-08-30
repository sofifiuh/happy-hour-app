// Phase 7: Google Places photo backfill. Venues whose own websites never
// yielded a hero image (no og:image in the crawl cache) get one Places
// photo: fetched once at pipeline time, saved under photos/ in the repo,
// and overlaid by writeback.js — the client never touches the API. Author
// attribution is stored alongside and renders wherever cover credits
// already do. The API key never appears in any committed file: photos.json
// stores only the photo resource name and attribution.
//
// Usage: node pipeline/places-photos.js
//   Key from $GOOGLE_PLACES_API_KEY or pipeline/secrets.json (gitignored).
import fs from "node:fs";
import path from "node:path";
import { readJson, REPO_ROOT } from "./lib/venues.js";
import { curlJson, curlGet, mapConcurrent } from "./lib/curl.js";

const SECRETS = path.join(REPO_ROOT, "pipeline", "secrets.json");
const KEY = process.env.GOOGLE_PLACES_API_KEY || readJson(SECRETS, {}).GOOGLE_PLACES_API_KEY;
if (!KEY) {
  console.log("No GOOGLE_PLACES_API_KEY (env or pipeline/secrets.json) — skipping photo backfill.");
  process.exit(0);
}

const STORE = path.join(REPO_ROOT, "pipeline", "photos.json");
const PHOTOS_DIR = path.join(REPO_ROOT, "photos");
const TODAY = new Date().toISOString().slice(0, 10);

const { venues } = readJson(path.join(REPO_ROOT, "venues.json"), { venues: [] });
const places = readJson(path.join(REPO_ROOT, "pipeline", "places.json"), {});
const store = readJson(STORE, {});

const targets = venues.filter((v) => {
  if (v.cover_image?.url || store[v.id]) return false;
  return !!(v.place_id || places[v.id]?.place_id);
});
console.log(`${targets.length} venues without a cover image and with a Places match`);
if (!targets.length) process.exit(0);
fs.mkdirSync(PHOTOS_DIR, { recursive: true });

let ok = 0;
const misses = [];
await mapConcurrent(targets, 4, async (v) => {
  const placeId = v.place_id || places[v.id].place_id;
  try {
    const details = await curlJson(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: [`X-Goog-Api-Key: ${KEY}`, "X-Goog-FieldMask: photos"],
    });
    const photo = details.photos?.[0];
    if (!photo?.name) { misses.push([v.id, "no photos on the place"]); return; }

    const file = path.join(PHOTOS_DIR, `${v.id}.jpg`);
    const media = `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=960&key=${KEY}`;
    const res = await curlGet(media, file, { timeout: 40 });
    if (res.status !== 200 || !res.contentType.startsWith("image/")) {
      misses.push([v.id, `media fetch ${res.status} ${res.contentType}`]);
      try { fs.rmSync(file, { force: true }); } catch {}
      return;
    }

    const author = photo.authorAttributions?.[0];
    // authorAttributions URIs come protocol-relative (//maps.google.com/…)
    const authorUri = author?.uri ? (author.uri.startsWith("//") ? `https:${author.uri}` : author.uri) : null;
    store[v.id] = {
      url: `photos/${v.id}.jpg`,
      credit_name: author?.displayName || "Google Maps contributor",
      credit_url: authorUri || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
      photo_name: photo.name,
      fetched_at: TODAY,
    };
    ok++;
    console.log(`  + ${v.id.padEnd(34)} ${(fs.statSync(file).size / 1024).toFixed(0)}KB  (${store[v.id].credit_name})`);
  } catch (e) {
    misses.push([v.id, e.message.slice(0, 120)]);
  }
});

fs.writeFileSync(STORE, JSON.stringify(store, null, 2));
console.log(`\n${ok} photos saved, ${misses.length} misses — store now covers ${Object.keys(store).length} venues`);
for (const [id, why] of misses) console.log(`  - ${id.padEnd(34)} ${why}`);
console.log("Next: node pipeline/writeback.js && node pipeline/build-pages.js");
