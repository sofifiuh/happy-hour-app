// Phase 8: read happy hour menus out of Google Business Profile photos.
//
// Some venues never publish their happy hour items online — but customers
// photograph the chalkboard, the table tent, the printed menu. This pulls a
// venue's GBP photos and has Claude look at them, extracting deals ONLY
// when an image legibly shows a happy hour menu.
//
// These deals are customer-photo sourced, not the venue's own publication:
// a photo carries no date in the Places API, so prices may be stale. Every
// deal produced here is stored with that provenance and the app labels it.
//
// RESULT SO FAR (2026-08-30): 0 menus recovered from 270 photos across 27
// venues, and it is an API ceiling, not a bug. Place Details returns at most
// 10 photos — Google's curated set (storefront, plated food, interiors), not
// the customer album. 21 of the 27 runs DID spot a menu or happy-hour sign in
// frame, always background or blurred; Google Maps' own "Menu" photo tab is
// not exposed through the Places API. Kept because it works and is cheap to
// re-run (~$0.06/venue) if a better image source appears; not wired into the
// default pipeline.
//
// Usage: node pipeline/photo-menus.js [--only id1,id2] [--max-photos 10]
//        [--concurrency 3] [--force]
//   Key from $GOOGLE_PLACES_API_KEY or pipeline/secrets.json (gitignored).
import fs from "node:fs";
import path from "node:path";
import { parseArgs, readJson, CACHE_DIR, RESULTS_DIR, REPO_ROOT } from "./lib/venues.js";
import { curlJson, curlGet, mapConcurrent } from "./lib/curl.js";
import { callClaude, parseJsonReply, DEFAULT_MODEL } from "./lib/claude.js";

const args = parseArgs(process.argv.slice(2));
const KEY = process.env.GOOGLE_PLACES_API_KEY || readJson(path.join(REPO_ROOT, "pipeline", "secrets.json"), {}).GOOGLE_PLACES_API_KEY;
if (!KEY) { console.log("No GOOGLE_PLACES_API_KEY — skipping photo-menu pass."); process.exit(0); }

const MODEL = args.model || DEFAULT_MODEL;
const MAX_PHOTOS = Number(args["max-photos"]) || 10;
const STORE = path.join(REPO_ROOT, "pipeline", "photo-deals.json");
const OUT_FILE = path.join(RESULTS_DIR, "photo-menus.json");
const TODAY = new Date().toISOString().slice(0, 10);

const { venues } = readJson(path.join(REPO_ROOT, "venues.json"), { venues: [] });
const places = readJson(path.join(REPO_ROOT, "pipeline", "places.json"), {});
const store = readJson(STORE, {});
const previous = readJson(OUT_FILE, {});

const only = args.only ? new Set(String(args.only).split(",")) : null;
// Default target: venues that advertise a happy hour but publish no items.
const targets = venues.filter((v) => {
  // A Places match is required either way — inspectVenue dereferences it.
  if (!(v.place_id || places[v.id]?.place_id)) return false;
  if (only) return only.has(v.id);
  return !((v.happy_hour?.deals || []).length);
});
console.log(`${targets.length} venues to inspect (up to ${MAX_PHOTOS} photos each), model ${MODEL}`);
fs.mkdirSync(RESULTS_DIR, { recursive: true });

const SCHEMA = `{
  "found": boolean,          // true only if a photo legibly shows THIS venue's happy hour menu
  "confidence": number,      // 0.0-1.0
  "photo_files": string[],   // the image filenames the deals were read from
  "deals": [ { "name": string, "price": string, "category": "food"|"drink", "description": string } ],
  "notes": string            // what the images showed; why found=false if it is
}`;

async function inspectVenue(v) {
  if (previous[v.id] && !args.force) return previous[v.id];
  const placeId = v.place_id || places[v.id].place_id;
  const dir = path.join(CACHE_DIR, v.id, "gbp");
  fs.mkdirSync(dir, { recursive: true });

  let details;
  try {
    details = await curlJson(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: [`X-Goog-Api-Key: ${KEY}`, "X-Goog-FieldMask: photos"],
    });
  } catch (e) { return { id: v.id, error: `details: ${e.message.slice(0, 120)}` }; }

  const photos = (details.photos || []).slice(0, MAX_PHOTOS);
  if (!photos.length) return { id: v.id, error: "no photos on the place" };

  // Ask for each photo at its NATIVE width (Places caps at 4800). Menu text
  // is often a chalkboard across the room: downscaling a 4000px photo to
  // 1600 is exactly what makes it unreadable.
  const files = [];
  await mapConcurrent(photos, 4, async (ph, i) => {
    const file = `gbp${i + 1}.jpg`;
    const width = Math.min(Math.max(Number(ph.widthPx) || 1600, 1600), 4800);
    const res = await curlGet(`https://places.googleapis.com/v1/${ph.name}/media?maxWidthPx=${width}&key=${KEY}`, path.join(dir, file), { timeout: 60 });
    if (res.status === 200 && res.contentType.startsWith("image/")) {
      files.push({ file, author: ph.authorAttributions?.[0]?.displayName || null });
    }
  });
  if (!files.length) return { id: v.id, error: "no photos fetched" };

  const prompt = `You are a strict data-extraction engine for a happy hour app. Output ONLY one JSON object matching the schema — no markdown fences, no commentary.

TARGET VENUE (these photos are from its Google Business Profile):
  Name: ${v.name}
  Address: ${v.formatted_address}
  Known happy hour window: ${v.happy_hour?.start}-${v.happy_hour?.end}

Schema:
${SCHEMA}

Read every one of these images with your Read tool before answering:
${files.map((f) => `- ${f.file}`).join("\n")}

Rules:
1. These are customer snapshots: food plates, interiors, storefronts, and sometimes a photographed MENU. You are looking only for a legible happy hour / aperitivo / social hour menu — a chalkboard, table tent, printed sheet, or menu page.
2. Extract a deal ONLY if you can actually READ its item name and price in the image. Never infer a price from a photo of food. Never guess at blurred or cropped-off text. If you can read only part of a menu, return just the lines you can read.
3. A regular dinner/lunch/brunch menu is NOT a happy hour menu. Only extract from a menu the image itself labels as happy hour (or the venue's known window above printed on it). If a menu is legible but is not the happy hour menu, found=false and say so in notes.
4. The menu must belong to THIS venue. Ignore photos that show another business's signage.
5. Prices exactly as printed: "$8", "$3 off", "1/2 price". category is "food" or "drink". Keep names short; put detail in description.
6. If no image shows a legible happy hour menu, found=false, deals=[]. That is a normal, expected answer — say what you saw in notes.
7. List in photo_files every image you actually read deals from.`;

  const reply = await callClaude(prompt, { model: MODEL, allowRead: true, cwd: dir });
  if (!reply.ok) return { id: v.id, error: reply.error, costUsd: reply.costUsd };
  let extraction;
  try { extraction = parseJsonReply(reply.text); }
  catch (e) { return { id: v.id, error: `parse: ${e.message.slice(0, 120)}`, costUsd: reply.costUsd }; }

  return { id: v.id, costUsd: reply.costUsd, photos_fetched: files.length, authors: files.map((f) => f.author), extraction };
}

const results = await mapConcurrent(targets, Number(args.concurrency) || 3, async (v) => {
  const r = await inspectVenue(v);
  const x = r.extraction;
  const n = (x?.deals || []).length;
  console.log(`${v.id.padEnd(34)} ${r.error ? "ERR " + r.error : x?.found ? `MENU FOUND — ${n} deals (conf ${x.confidence})` : "no menu in photos"}` + (r.costUsd ? `  $${r.costUsd.toFixed(4)}` : ""));
  return r;
});

const out = { ...previous };
for (const r of results) out[r.id] = r;
fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));

// Store only clean, legible finds — with provenance the app can display.
let stored = 0;
for (const r of results) {
  const x = r.extraction;
  if (!x?.found || !(x.deals || []).length || (x.confidence ?? 0) < 0.8) continue;
  const bad = x.deals.some((d) => !d?.name || !d?.price || (d.category !== "food" && d.category !== "drink"));
  if (bad) { console.log(`  ! ${r.id}: malformed deal rows, not stored`); continue; }
  const authors = [...new Set((r.authors || []).filter(Boolean))];
  store[r.id] = {
    deals: x.deals.map((d) => ({ name: d.name, price: d.price, category: d.category, description: d.description || "" })),
    source: "gbp_photo",
    photo_files: x.photo_files || [],
    credit_names: authors,
    confidence: x.confidence,
    read_at: TODAY,
  };
  stored++;
}
fs.writeFileSync(STORE, JSON.stringify(store, null, 2));

const cost = results.reduce((s, r) => s + (r.costUsd || 0), 0);
console.log(`\n${stored} venues gained deals from photos; store covers ${Object.keys(store).length}. Cost: $${cost.toFixed(3)}`);
console.log("Next: node pipeline/writeback.js && node pipeline/build-pages.js");
