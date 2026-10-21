// Copies the pipeline's venue dataset into the web app, trimmed to the
// fields the UI reads, so the first load ships ~1/4 of the bytes.
// Source of truth stays ../venues.json (written by pipeline/writeback.js).
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const out = resolve(here, "../public");
mkdirSync(out, { recursive: true });

const { data_version, venues } = JSON.parse(readFileSync(resolve(root, "venues.json"), "utf8"));

const slim = venues
  .filter((v) => v.business_status !== "CLOSED_PERMANENTLY")
  .map((v) => ({
    id: v.id,
    name: v.name,
    address: v.formatted_address || "",
    city: v.address_components?.locality || null,
    checked: v.last_synced_at ? String(v.last_synced_at).slice(0, 10) : null,
    lat: v.geometry?.location?.lat ?? null,
    lng: v.geometry?.location?.lng ?? null,
    phone: v.formatted_phone_number || null,
    website: v.website || null,
    rating: v.rating ?? null,
    ratings: v.user_ratings_total ?? null,
    photo: v.cover_image?.url || null,
    photoCredit: v.cover_image?.credit_name || null,
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
if (existsSync(resolve(root, "photos"))) cpSync(resolve(root, "photos"), resolve(out, "photos"), { recursive: true });
console.log(`sync-data: ${slim.length} venues (${data_version})`);
