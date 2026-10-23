// Copies the pipeline's venue dataset into the web app, trimmed to the
// fields the UI reads, so the first load ships ~1/4 of the bytes.
// Source of truth stays ../venues.json (written by pipeline/writeback.js).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AREAS, buildBest, buildHubs, hubPath } from "./seo-data.mjs";
import { addHangScores } from "./hang-score.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const out = resolve(here, "../public");
mkdirSync(out, { recursive: true });

// Prefer the local WebP from scripts/photos.mjs; otherwise the remote cover
// over https until the next photo refresh downloads it.
// Covers scripts/photos.mjs judged a bad hero (logo, near-black graphic)
// fall back to the branded placeholder.
let quality = {};
try {
  quality = JSON.parse(readFileSync(resolve(out, "photos", "quality.json"), "utf8"));
} catch {
  // no scores yet
}

// File names that give away a logo or share card rather than a photo, for
// covers the photo job hasn't downloaded and scored yet.
const LOGO_URL = /logo|lockup|wordmark|favicon|badge|site-identity|transparent|og-image|social[+_ -]?share|facebook[+_ -]?share|[-_+](black|white|blk|wht)\.(png|svg)|\.svg(\?|$)/i;
const looksLikeLogo = (url) => LOGO_URL.test(decodeURIComponent(url));

// Real photos the scoring misreads as graphics (black-and-white or dark,
// low-colour shots); checked by eye on the live site, 2026-10-22.
const PHOTO_ALLOW = new Set(["diva-at-the-met", "tableau-bar-bistro", "elwoods", "water-st-caf"]);

function photoFor(v) {
  if (quality[v.id]?.problem && !PHOTO_ALLOW.has(v.id)) return null;
  if (v.cover_image?.url && looksLikeLogo(v.cover_image.url)) return null;
  if (existsSync(resolve(out, "photos", `${v.id}.webp`))) return `photos/${v.id}.webp`;
  const url = v.cover_image?.url;
  return url && /^https?:/.test(url) ? url.replace(/^http:/, "https:") : null;
}

// Google sometimes repeats the city inside the street part
// ("1323 Robson St #201 Vancouver, Vancouver, BC"); drop the echo.
function cleanAddress(a) {
  const parts = a.split(",").map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < parts.length - 1; i++) {
    const next = parts[i + 1];
    if (parts[i].toLowerCase() === next.toLowerCase()) parts.splice(i--, 1);
    else if (parts[i].toLowerCase().endsWith(` ${next.toLowerCase()}`)) parts[i] = parts[i].slice(0, -next.length - 1).trim();
  }
  return parts.join(", ");
}

// Every photo after the cover, for the venue page's gallery (https only,
// cover removed, at most 8).
function galleryFor(v) {
  const cover = v.cover_image?.url;
  const urls = (v.photos || [])
    .map((p) => p?.url)
    .filter((u) => u && /^https?:/.test(u) && u !== cover && !looksLikeLogo(u))
    .map((u) => u.replace(/^http:/, "https:"));
  return [...new Set(urls)].slice(0, 8);
}

// Some names arrive in all caps ("ARC RESTAURANT"); show them in title case.
// Very short all-caps names stay (acronyms).
function displayName(name) {
  const letters = name.replace(/[^A-Za-z]/g, "");
  if (letters.length < 4 || letters !== letters.toUpperCase()) return name;
  return name.toLowerCase().replace(/(^|[\s\-/(&])([a-z])/g, (m, p, c) => p + c.toUpperCase());
}

const { data_version, venues } = JSON.parse(readFileSync(resolve(root, "venues.json"), "utf8"));

// Where the times were read from, for the "Source" line on venue pages.
const host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};
// Sites that are clearly not the venue's own; anything else (a second
// domain, a .com vs .ca) is still their website.
const ELSEWHERE = /(^|\.)(facebook|instagram|opentable|yelp|tripadvisor|google|ubereats|doordash|toasttab|resy|tock|linktr)\./;
function sourceOf(v) {
  let url = v.trust?.source_url;
  if (!url || !host(url)) return null;
  const u = new URL(url);
  for (const k of [...u.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/.test(k)) u.searchParams.delete(k);
  url = u.toString();
  const kind = /\.pdf$/i.test(u.pathname) ? "pdf" : /\.(jpe?g|png|webp)$/i.test(u.pathname) ? "image" : "page";
  return { url, kind, host: ELSEWHERE.test(host(url)) ? host(url) : null };
}

const slim = venues
  .filter((v) => v.business_status !== "CLOSED_PERMANENTLY")
  .map((v) => ({
    id: v.id,
    name: displayName(v.name),
    address: cleanAddress(v.formatted_address || ""),
    city: v.address_components?.locality || null,
    // trust.last_confirmed_at is the last day our times matched the venue's
    // own page (pipeline freshness check); fall back to the last sync.
    checked: v.trust?.last_confirmed_at || (v.last_synced_at ? String(v.last_synced_at).slice(0, 10) : null),
    confidence: v.trust?.confidence || null,
    source: sourceOf(v),
    lat: v.geometry?.location?.lat ?? null,
    lng: v.geometry?.location?.lng ?? null,
    phone: v.formatted_phone_number || null,
    website: v.website || null,
    rating: v.rating ?? null,
    ratings: v.user_ratings_total ?? null,
    photo: photoFor(v),
    photoCredit: v.cover_image?.credit_name || null,
    gallery: galleryFor(v),
    hh: {
      days: v.happy_hour.days,
      start: v.happy_hour.start,
      end: v.happy_hour.end,
      extra: (v.happy_hour.extra_windows || [])
        .filter((w) => w?.days?.length && w.start)
        .map((w) => ({ days: w.days, start: w.start, end: w.end, label: w.label || null })),
      deals: (v.happy_hour.deals || []).map((d) => ({
        name: d.name,
        price: d.price || "",
        category: d.category || "food",
        description: d.description || "",
      })),
      verified: v.happy_hour.verified === true,
      source: v.happy_hour.deals_source?.url || v.happy_hour.verified_source || v.happy_hour.source_url || null,
    },
    amenities: {
      patio: v.amenities?.outdoor_seating === true,
      accessible: v.amenities?.wheelchair_accessible_entrance === true,
      transit: v.amenities?.transit?.walkable === true,
      transitStation: v.amenities?.transit?.nearest_station || null,
      liveMusic: v.amenities?.live_music === true,
      groups: v.amenities?.good_for_groups === true,
    },
  }));

// Hangout Scores (scripts/hang-score.mjs) need every venue to rank against.
const { scored } = addHangScores(slim);

// City, neighbourhood and hub pages (scripts/seo-data.mjs). Each venue keeps
// links to its area and city hubs and up to three topic hubs; the index
// lists every hub for the home page's "Explore" links.
const { places, topics, combos } = buildHubs(slim);
const placeSet = new Set(places.map((h) => h.slug));
// Chains listed more than once ("Cactus Club Cafe" x2) get their area or
// city in the name, so each has its own page title.
const nameCount = {};
for (const v of slim) nameCount[v.name] = (nameCount[v.name] ?? 0) + 1;
for (const v of slim) {
  const where = v.area ? AREAS[v.area] : v.city;
  if (nameCount[v.name] > 1 && where) v.name = `${v.name} (${where})`;
}
const PREFER = { deal: 0, vibe: 1, day: 2 };
const hubs = {};
for (const h of places) hubs[h.slug] = { label: h.kind === "area" ? `${h.name}` : h.name, kind: h.kind, count: h.venues.length };
for (const t of topics) hubs[t.slug] = { label: t.label, short: t.short, kind: t.kind, count: t.venues.length };
for (const v of slim) {
  const areaSlug = v.area;
  const citySlug = Object.keys(hubs).find((k) => hubs[k].kind === "city" && hubs[k].label === v.city);
  v.area = areaSlug ? { slug: areaSlug, name: AREAS[areaSlug] } : null;
  const own = [areaSlug, citySlug].filter((s) => s && placeSet.has(s));
  const mine = topics
    .filter((t) => t.slug !== "weekend" && t.test(v))
    .sort((a, b) => PREFER[a.kind] - PREFER[b.kind] || a.venues.length - b.venues.length)
    .slice(0, 3)
    .map((t) => t.slug);
  v.hubs = [...own, ...mine].map((slug) => hubPath(slug));
}

// Best-of lists (ranked by Hangout Score) for the app's "Best of" screen and
// the prerendered /happy-hour/<place>/best/ pages, which both read this copy.
const best = buildBest(slim, places).map((b) => ({ slug: b.slug, name: b.name, kind: b.kind, scored: b.scored, ids: b.venues.map((v) => v.id) }));

writeFileSync(resolve(out, "venues.json"), JSON.stringify({ data_version, hubs, best, venues: slim }));
console.log(`sync-data: ${places.length} place hubs, ${topics.length} topic hubs, ${combos.length} combinations`);
console.log(`sync-data: ${best.length} best-of lists`);
console.log(`sync-data: ${slim.length} venues (${data_version}), ${scored} with a Hangout Score`);
