// Phase 5: discovery. Resolves venue LEADS (names from public search
// results — pipeline/leads.json) into identity records via Nominatim/OSM:
// coordinates, address, website, phone. Facts about happy hour are NEVER
// taken from search results — the extraction pipeline reads each venue's
// own website afterwards (crawl/extract --venues).
//
// OSM data is ODbL — "© OpenStreetMap contributors" attribution ships in
// the app for these records (see osm field per record + map attribution).
//
// Usage: node pipeline/discover.js   -> pipeline/results/discovered-candidates.json
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadSeed, RESULTS_DIR, REPO_ROOT } from "./lib/venues.js";

const UA = "happy-hour-app-pipeline/0.1 (github.com/sofifiuh/happy-hour-app)";
const BBOX = { south: 49.264, north: 49.3, west: -123.15, east: -123.09 }; // downtown core + Gastown/Chinatown/West End edge
const OK_TYPES = new Set(["bar", "pub", "restaurant", "cafe", "nightclub", "biergarten"]);

const leads = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "pipeline", "leads.json"), "utf8")).leads;
const seed = loadSeed();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return null; } };
const seedHosts = new Set(seed.map((v) => host(v.website)).filter(Boolean));
const seedNames = seed.map((v) => norm(v.name));
const distM = (a, b) => {
  const R = 6371000, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

function nominatim(q) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ", Vancouver, BC")}&format=jsonv2&limit=3&extratags=1&addressdetails=1`;
  const out = execFileSync("curl", ["-sS", "--max-time", "25", "-H", `User-Agent: ${UA}`, url], { encoding: "utf8" });
  return JSON.parse(out);
}

const candidates = [];
const misses = [];
for (const lead of leads) {
  await sleep(1200); // Nominatim usage policy: max 1 req/s
  let results;
  try { results = nominatim(lead); } catch (e) { misses.push([lead, `nominatim error: ${String(e.message).slice(0, 80)}`]); continue; }
  const hit = results.find((r) => OK_TYPES.has(r.type) && r.address?.city === "Vancouver");
  if (!hit) { misses.push([lead, `no amenity match (${results.map((r) => r.type).join(",") || "no results"})`]); continue; }
  const lat = Number(hit.lat), lng = Number(hit.lon);
  if (lat < BBOX.south || lat > BBOX.north || lng < BBOX.west || lng > BBOX.east) { misses.push([lead, `outside bbox (${lat.toFixed(3)},${lng.toFixed(3)})`]); continue; }
  const website = hit.extratags?.website || hit.extratags?.["contact:website"] || null;
  if (!website) { misses.push([lead, "no website tag in OSM"]); continue; }

  const name = hit.name || lead;
  if (seedHosts.has(host(website)) || seedNames.includes(norm(name)) ||
      seed.some((v) => v.geometry?.location && distM(v.geometry.location, { lat, lng }) < 60)) {
    misses.push([lead, "duplicate of existing venue"]); continue;
  }
  const a = hit.address || {};
  const street = [a.house_number, a.road].filter(Boolean).join(" ");
  candidates.push({
    id: norm(name).replace(/ /g, "-"),
    name,
    website,
    formatted_address: `${street ? street + ", " : ""}Vancouver, BC`,
    address_components: { street_number: a.house_number || null, route: a.road || null, locality: "Vancouver", administrative_area_level_1: "BC", postal_code: a.postcode || null, country: "CA" },
    geometry: { location: { lat, lng } },
    formatted_phone_number: hit.extratags?.phone || null,
    osm: { type: hit.osm_type, id: hit.osm_id, amenity: hit.type },
    lead,
  });
  console.log(`${name.padEnd(30)} ${hit.type.padEnd(11)} ${street.padEnd(24)} ${website}`);
}

// De-dupe candidates against each other (same site resolved from two leads)
const seen = new Set();
const unique = candidates.filter((c) => { const k = host(c.website) || c.id; if (seen.has(k)) return false; seen.add(k); return true; });

fs.mkdirSync(RESULTS_DIR, { recursive: true });
fs.writeFileSync(path.join(RESULTS_DIR, "discovered-candidates.json"), JSON.stringify(unique, null, 2));
console.log(`\n${unique.length} candidates -> results/discovered-candidates.json`);
for (const [lead, why] of misses) console.log(`  MISS ${lead.padEnd(28)} ${why}`);
