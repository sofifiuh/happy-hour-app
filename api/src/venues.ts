import type { Env } from "./env";
import { HttpError } from "./http";

export interface VenueInfo {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
}

// The site's own venues.json is the directory: the Worker never keeps a
// second copy of the listings, only the venue's edits on top.
let cache: { at: number; byId: Map<string, VenueInfo> } | null = null;

export async function venueDirectory(env: Env) {
  if (cache && Date.now() - cache.at < 10 * 60_000) return cache.byId;
  const res = await fetch(env.VENUES_URL || `${env.SITE_URL}/venues.json`, { cf: { cacheTtl: 600 } });
  if (!res.ok) {
    if (cache) return cache.byId;
    throw new HttpError(502, "Couldn't load the venue list");
  }
  const data = (await res.json()) as { venues: VenueInfo[] };
  cache = { at: Date.now(), byId: new Map(data.venues.map((v) => [v.id, v])) };
  return cache.byId;
}

export async function venue(env: Env, id: string) {
  const v = (await venueDirectory(env)).get(id);
  if (!v) throw new HttpError(404, "No venue with that id");
  return v;
}

// Sites that host many businesses, so an email there proves nothing.
const SHARED_HOSTS = new Set([
  "instagram.com", "facebook.com", "linktr.ee", "google.com", "gmail.com", "yelp.ca", "yelp.com",
  "opentable.com", "opentable.ca", "toasttab.com", "square.site", "squarespace.com", "wixsite.com",
  "business.site", "tock.com", "resy.com", "ubereats.com", "doordash.com", "skipthedishes.com",
]);

const bare = (host: string) => host.toLowerCase().replace(/^www\./, "");

// True when the signed-in email is at the venue's own website domain
// (manager@thebar.ca for thebar.ca, or a subdomain of it).
export function emailMatchesWebsite(email: string, website: string | null) {
  if (!website) return false;
  let host: string;
  try {
    host = bare(new URL(website).hostname);
  } catch {
    return false;
  }
  const domain = bare(email.split("@")[1] ?? "");
  if (!domain || SHARED_HOSTS.has(host) || [...SHARED_HOSTS].some((h) => host.endsWith(`.${h}`))) return false;
  return domain === host || host.endsWith(`.${domain}`) || domain.endsWith(`.${host}`);
}

// ---------- The venue's edits ----------

export interface Deal {
  name: string;
  price: string;
  category: "food" | "drink";
  description: string;
}
export interface Window {
  days: number[];
  start: string;
  end: string | null;
  label?: string | null;
}
export interface EditData {
  hh?: { days: number[]; start: string; end: string; extra: Window[]; deals: Deal[] };
  description?: string | null;
  phone?: string | null;
  website?: string | null;
  amenities?: { patio?: boolean; liveMusic?: boolean; groups?: boolean };
  photo?: string | null;
  gallery?: string[];
  closed?: boolean;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function days(v: unknown, field: string) {
  if (!Array.isArray(v) || v.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) throw new HttpError(400, `${field}: days are 0 (Sun) to 6 (Sat)`);
  return [...new Set(v as number[])].sort();
}
function time(v: unknown, field: string, nullable = false) {
  if (nullable && v == null) return null;
  if (typeof v !== "string" || !TIME.test(v)) throw new HttpError(400, `${field}: use 24-hour HH:MM`);
  return v;
}
function text(v: unknown, field: string, max: number) {
  if (v == null) return "";
  if (typeof v !== "string") throw new HttpError(400, `${field} must be text`);
  if (v.length > max) throw new HttpError(400, `${field} is too long (max ${max})`);
  return v.trim();
}

// Validates and normalises a venue's edit; returns it plus any reason to
// flag it for an admin look (it still goes live).
export function cleanEdit(input: unknown, photoBase: string): { data: EditData; flags: string[] } {
  if (!input || typeof input !== "object") throw new HttpError(400, "Expected the venue's details");
  const i = input as Record<string, unknown>;
  const data: EditData = {};
  const flags: string[] = [];

  if (i.hh != null) {
    const h = i.hh as Record<string, unknown>;
    const deals = Array.isArray(h.deals) ? h.deals : [];
    const extra = Array.isArray(h.extra) ? h.extra : [];
    if (deals.length > 40) throw new HttpError(400, "Up to 40 deals");
    if (extra.length > 6) throw new HttpError(400, "Up to 6 extra time windows");
    data.hh = {
      days: days(h.days, "Happy hour"),
      start: time(h.start, "Start")!,
      end: time(h.end, "End")!,
      extra: extra.map((w: Record<string, unknown>, n) => ({
        days: days(w.days, `Window ${n + 1}`),
        start: time(w.start, `Window ${n + 1} start`)!,
        end: time(w.end, `Window ${n + 1} end`, true),
        label: text(w.label, "Label", 40) || null,
      })),
      deals: deals.map((d: Record<string, unknown>) => {
        const deal: Deal = {
          name: text(d.name, "Deal name", 80),
          price: text(d.price, "Price", 30),
          category: d.category === "food" ? "food" : "drink",
          description: text(d.description, "Deal description", 200),
        };
        if (!deal.name) throw new HttpError(400, "Every deal needs a name");
        return deal;
      }),
    };
    // BC sets a minimum price for drinks; a very low drink price is
    // probably a typo or a rule problem, so a person takes a look.
    for (const d of data.hh.deals) {
      const n = parseFloat(d.price.replace(/[^0-9.]/g, ""));
      if (d.category === "drink" && n > 0 && n < 3 && !/off|%/i.test(d.price)) flags.push(`Drink under $3: ${d.name} ${d.price}`);
    }
  }
  if ("description" in i) data.description = text(i.description, "Description", 400) || null;
  if ("phone" in i) data.phone = text(i.phone, "Phone", 30) || null;
  if ("website" in i) {
    const w = text(i.website, "Website", 300);
    if (w && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(w)) throw new HttpError(400, "Website must start with https:// or http://");
    data.website = w || null;
  }
  if (i.amenities != null) {
    const a = i.amenities as Record<string, unknown>;
    data.amenities = { patio: a.patio === true, liveMusic: a.liveMusic === true, groups: a.groups === true };
  }
  // Photos must be ones uploaded here, so a venue can't hotlink anything.
  const ours = (u: unknown) => typeof u === "string" && u.startsWith(photoBase);
  if ("photo" in i) {
    if (i.photo != null && !ours(i.photo)) throw new HttpError(400, "Upload the cover photo first");
    data.photo = (i.photo as string | null) ?? null;
  }
  if (i.gallery != null) {
    if (!Array.isArray(i.gallery) || i.gallery.length > 12 || !i.gallery.every(ours)) throw new HttpError(400, "Up to 12 uploaded photos");
    data.gallery = i.gallery as string[];
  }
  if ("closed" in i) data.closed = i.closed === true;
  return { data, flags };
}
