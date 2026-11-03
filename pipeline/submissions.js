// "Add a happy hour": happy hours guests photographed and an admin read and
// published in the review queue (/venue/admin). This pulls them from the
// venue API into pipeline/submissions.json, which writeback.js lays over
// the data, so they reach venues.json, the venue pages and the sitemap.
//
// A spot we already list just takes the checked happy hour. A new spot needs
// a map pin: Places Text Search finds it from its name and address (place
// id, coordinates, phone, website); without a key, or when Google can't
// find it, it waits and is retried on the next run.
//
// Usage: node pipeline/submissions.js [--check]
//   --check  only report how many published submissions aren't in the store
//            yet ("new=<n>" on stdout), for the hourly workflow.
// Needs SUBMISSIONS_URL (the API's /public/submissions) or API_URL.
import fs from "node:fs";
import path from "node:path";
import { parseArgs, readJson, REPO_ROOT } from "./lib/venues.js";
import { VENUES_FILE } from "./lib/trust.js";
import { inRegion } from "./lib/region.js";
import { curlJson } from "./lib/curl.js";

const args = parseArgs(process.argv.slice(2));
const USAGE = path.join(REPO_ROOT, "pipeline", "api-usage.json");
const SUBMISSIONS_STORE = path.join(REPO_ROOT, "pipeline", "submissions.json");
const API = (process.env.API_URL || "").replace(/\/+$/, "");
const FEED = process.env.SUBMISSIONS_URL || (API ? `${API}/public/submissions` : null);
const KEY = process.env.GOOGLE_PLACES_API_KEY || readJson(path.join(REPO_ROOT, "pipeline", "secrets.json"), {}).GOOGLE_PLACES_API_KEY;

// Same box as discovery (lib/region.js): the Lower Mainland, not across the border.
const inMetro = inRegion;

// "2245 Commercial Dr, Vancouver, BC V5N 4B6, Canada" -> street + city, the
// way places-discover.js writes formatted_address.
function addressParts(formatted) {
  const parts = (formatted || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (parts.length && /^canada$/i.test(parts[parts.length - 1])) parts.pop();
  const provIdx = parts.findIndex((x) => /^(BC|British Columbia)\b/i.test(x));
  const cityIdx = provIdx > 0 ? provIdx - 1 : parts.length - 1;
  const picked = parts[cityIdx] || "";
  const city = !picked || /^(BC|British Columbia)\b/i.test(picked) ? "Vancouver" : picked;
  const street = parts.slice(0, cityIdx).join(", ");
  return { city, formatted_address: `${street ? street + ", " : ""}${city}, BC` };
}

async function findPlace(s) {
  const data = await curlJson("https://places.googleapis.com/v1/places:searchText", {
    headers: [
      `X-Goog-Api-Key: ${KEY}`,
      "X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.businessStatus",
    ],
    body: {
      textQuery: `${s.name}, ${s.address}`,
      pageSize: 3,
      locationBias: { circle: { center: { latitude: 49.2827, longitude: -123.1207 }, radius: 40000 } },
    },
  });
  if (data.error) throw new Error(`Places: ${data.error.status}`);
  // websiteUri/phone make this a Text Search *Enterprise* call, the SKU
  // places-rotate.js budgets to 900/month: count it on the same ledger.
  const usage = readJson(USAGE, {});
  const month = new Date().toISOString().slice(0, 7);
  usage[month] = { ...usage[month], text_enterprise: (usage[month]?.text_enterprise || 0) + 1 };
  fs.writeFileSync(USAGE, JSON.stringify(usage, null, 2) + "\n");
  return (data.places || []).find(inMetro) || null;
}

const store = readJson(SUBMISSIONS_STORE, {});
if (!FEED) {
  console.log("[submissions] no SUBMISSIONS_URL / API_URL — skipping");
  if (args.check) console.log("new=0");
  process.exit(0);
}
let feed;
try {
  feed = (await curlJson(FEED)).submissions || [];
} catch (e) {
  console.log(`[submissions] couldn't load ${FEED}: ${e.message}`);
  if (args.check) console.log("new=0");
  process.exit(0);
}
// New, or one that couldn't be placed last time (no pin yet).
const todo = feed.filter((s) => !store[s.id] || store[s.id].unresolved);
if (args.check) {
  console.log(`new=${todo.length}`);
  process.exit(0);
}

const listed = new Map(readJson(VENUES_FILE).venues.map((v) => [v.id, v]));
const byPlaceId = new Map([...listed.values()].filter((v) => v.place_id).map((v) => [v.place_id, v.id]));
let added = 0;
for (const s of todo) {
  const rec = { venue_id: s.venue_id, new: !!s.new, hh: s.hh, approved_at: s.published_at, ...(s.new && { name: s.name, address: s.address, website: s.website ?? null }) };
  if (s.new) {
    if (!KEY) {
      console.log(`[submissions] ${s.venue_id}: no GOOGLE_PLACES_API_KEY to place it on the map, will retry`);
      store[s.id] = { ...rec, unresolved: "no Places key" };
      continue;
    }
    let p = null;
    try {
      p = await findPlace(s);
    } catch (e) {
      console.log(`[submissions] ${s.venue_id}: ${e.message}, will retry`);
    }
    if (!p) {
      console.log(`[submissions] ${s.venue_id}: Google couldn't find "${s.name}, ${s.address}" in Metro Vancouver, will retry`);
      store[s.id] = { ...rec, unresolved: "not found on Google" };
      continue;
    }
    // Already on the map under another name: the happy hour goes there.
    const known = byPlaceId.get(p.id);
    if (known) {
      console.log(`[submissions] ${s.venue_id}: same Google place as ${known}, updating that venue`);
      store[s.id] = { venue_id: known, new: false, hh: s.hh, approved_at: s.published_at, matched_from: s.venue_id };
      added++;
      continue;
    }
    store[s.id] = {
      ...rec,
      place: {
        place_id: p.id,
        ...addressParts(p.formattedAddress),
        lat: p.location.latitude,
        lng: p.location.longitude,
        phone: p.nationalPhoneNumber ?? null,
        website: s.website || p.websiteUri || null,
        business_status: p.businessStatus ?? null,
      },
    };
  } else {
    if (!listed.has(s.venue_id)) {
      console.log(`[submissions] ${s.venue_id}: not in venues.json any more, skipping`);
      store[s.id] = { ...rec, unresolved: "venue not listed" };
      continue;
    }
    store[s.id] = rec;
  }
  added++;
}
fs.writeFileSync(SUBMISSIONS_STORE, JSON.stringify(store, null, 2) + "\n");
console.log(`[submissions] ${feed.length} published, ${added} added to pipeline/submissions.json`);
