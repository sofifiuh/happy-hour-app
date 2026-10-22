// Copies the pipeline's venue dataset into the web app, trimmed to the
// fields the UI reads, so the first load ships ~1/4 of the bytes.
// Source of truth stays ../venues.json (written by pipeline/writeback.js).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

const { data_version, venues } = JSON.parse(readFileSync(resolve(root, "venues.json"), "utf8"));

const slim = venues
  .filter((v) => v.business_status !== "CLOSED_PERMANENTLY")
  .map((v) => ({
    id: v.id,
    name: v.name,
    address: cleanAddress(v.formatted_address || ""),
    city: v.address_components?.locality || null,
    // trust.last_confirmed_at is the last day our times matched the venue's
    // own page (pipeline freshness check); fall back to the last sync.
    checked: v.trust?.last_confirmed_at || (v.last_synced_at ? String(v.last_synced_at).slice(0, 10) : null),
    confidence: v.trust?.confidence || null,
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

writeFileSync(resolve(out, "venues.json"), JSON.stringify({ data_version, venues: slim }));
console.log(`sync-data: ${slim.length} venues (${data_version})`);
