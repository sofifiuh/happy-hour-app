// Trust layer: how sure we are that a venue's happy hour is still what the
// app shows. Deterministic, no model calls — it reads the venue's own source
// page (pipeline/check-sources.js) and asks two questions: is the page still
// there, and do the times we publish still appear on it?
//
// The result is stamped onto every venue in venues.json as `trust`, which is
// what the UI's badges read. See pipeline/README.md ("Freshness & trust").
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { REPO_ROOT } from "./venues.js";

export const VENUES_FILE = path.join(REPO_ROOT, "venues.json");
export const FRESHNESS_STORE = path.join(REPO_ROOT, "pipeline", "freshness.json");

// A check older than this no longer counts as a confirmation.
export const CONFIRM_TTL_DAYS = 14;
// Consecutive failed fetches before a source counts as unreachable (sites
// blip; one bad night should not downgrade a venue).
export const UNREACHABLE_AFTER = 2;

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/** Every candidate source URL for a venue, best first. */
export function sourceUrls(v) {
  const hh = v.happy_hour || {};
  return [...new Set([hh.source_url, hh.verified_source, hh.deals_source?.url].filter((u) => /^https?:\/\//.test(u || "")))];
}

/** Text around happy hour mentions — the part of a page whose change means
 *  the offer may have changed. Hashing the whole page would flag every
 *  rotating banner and cache-buster as a change. */
const HH_SRC = "happy\\s*hour|happy\\s*hr|social\\s*hour|aperitivo|\\bhh\\b";
const HH_RE = new RegExp(HH_SRC, "gi");
const HH_TEST = new RegExp(HH_SRC, "i");
export function happyHourSnippets(text) {
  const spans = [];
  for (const m of text.matchAll(HH_RE)) {
    const s = Math.max(0, m.index - 600), e = Math.min(text.length, m.index + 900);
    const last = spans[spans.length - 1];
    if (last && s <= last[1]) last[1] = e;
    else spans.push([s, e]);
  }
  return spans.map(([s, e]) => text.slice(s, e));
}

export const hashText = (s) =>
  crypto.createHash("sha1").update(s.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex").slice(0, 16);

// "3-6pm", "3pm – 6pm", "3:00 PM to 6:00 PM", "15:00-18:00", "9pm-close", "10pm - midnight".
// The lookbehind keeps prices ("$5-8") and phone numbers out.
const AMPM = "(a\\.?m\\.?|p\\.?m\\.?)";
const RANGE_RE = new RegExp(
  `(?<![$\\d.:])\\b(\\d{1,2})(?:[:.](\\d{2}))?\\s*${AMPM}?\\s*(?:-|–|—|to|until|till|'til|’til)\\s*(?:(\\d{1,2})(?:[:.](\\d{2}))?\\s*${AMPM}?(?![\\d%])|(close|closing|late|midnight))`,
  "gi"
);

function to24(h, m, suffix, fallbackSuffix) {
  if (h > 23 || m > 59) return null;
  const s = (suffix || fallbackSuffix || "").toLowerCase().replace(/\./g, "");
  if (s === "am") return (h === 12 ? 0 : h) * 60 + m;
  if (s === "pm") return (h === 12 ? 12 : h + 12) * 60 + m;
  if (h >= 13 || h === 0) return h * 60 + m; // already 24h
  // No suffix anywhere: a bare "3-6" on a happy hour page is the afternoon.
  // 11 and 12 are ambiguous enough that both readings are kept by the caller.
  return (h === 12 ? 12 : h + 12) * 60 + m;
}

/** All time ranges written on a page, as [startMin, endMin|null] (null =
 *  "until close"). Bare 24h and am/pm forms both parse. */
export function parseRanges(text) {
  const out = [];
  for (const m of text.matchAll(RANGE_RE)) {
    const [, sh, sm, sa, eh, em, ea, close] = m;
    const start = to24(Number(sh), Number(sm || 0), sa, ea);
    if (start === null) continue;
    if (close) { out.push([start, /midnight/i.test(close) ? 0 : null]); continue; }
    const end = to24(Number(eh), Number(em || 0), ea, sa);
    if (end === null) continue;
    out.push([start, end]);
    // "11-2" style late-night: also keep the am reading of the end.
    if (!ea && Number(eh) <= 3) out.push([start, Number(eh) * 60 + Number(em || 0)]);
  }
  return out;
}

const sameEnd = (a, b) => a === b || (a % 1440) === (b % 1440);

/** Does the page text state this window? end null on our side matches a
 *  page's "close" or any end, since "until close" is how we store it. */
export function windowOnPage(ranges, start, end) {
  const s = toMin(start), e = end ? toMin(end) : null;
  return ranges.some(([ps, pe]) => ps === s && (e === null || (pe !== null && sameEnd(pe, e))));
}

/** Summarize one fetched page against a venue's published schedule. */
export function assessPage(text, hh) {
  const ranges = parseRanges(text);
  const extras = (hh.extra_windows || []).filter((w) => w.start);
  return {
    hh_mentioned: HH_TEST.test(text),
    times_seen: windowOnPage(ranges, hh.start, hh.end),
    extra_windows_seen: extras.length ? extras.filter((w) => windowOnPage(ranges, w.start, w.end)).length : null,
    extra_windows_total: extras.length || null,
  };
}

/** The `trust` object for one venue, from its record and its latest check. */
export function computeTrust(v, f, today) {
  const hh = v.happy_hour || {};
  const source_url = sourceUrls(v)[0] || null;
  // The crawler only reaches pages linked from the venue's own website (menu
  // PDFs and images often sit on a CDN), so any cited source is the venue's.
  const level = hh.verified ? "verified" : source_url ? "venue_site" : "unconfirmed";
  const data_as_of = v.last_synced_at || hh.deals_source?.extracted_at || null;

  let status = "unchecked";
  if (f) {
    const freshConfirm = f.last_confirmed_at && daysBetween(f.last_confirmed_at, today) <= CONFIRM_TTL_DAYS;
    if ((f.fail_count || 0) >= UNREACHABLE_AFTER) status = "unreachable";
    else if (f.times_seen && freshConfirm) status = "confirmed";
    else if (f.changed_at && (!data_as_of || f.changed_at > data_as_of)) status = "changed";
    else status = "unconfirmed";
  }

  let confidence;
  if (status === "confirmed") confidence = "high";
  else if (level === "verified") confidence = status === "changed" || status === "unreachable" ? "medium" : "high";
  else if (level === "venue_site" && (status === "unconfirmed" || status === "unchecked")) confidence = "medium";
  else confidence = "low";

  return {
    level,               // verified | venue_site | unconfirmed — who the fact came from
    status,              // confirmed | unconfirmed | changed | unreachable | unchecked — what the latest check saw
    confidence,          // high | medium | low — the one field a badge needs
    source_url,
    data_as_of,          // when the stored schedule was last extracted (null for hand-verified seed)
    last_checked_at: f?.checked_at || null,
    last_confirmed_at: f?.last_confirmed_at || null,
  };
}

/** Stamp `trust` on every venue (pure: returns new objects). */
export function applyTrust(venues, freshness, today = new Date().toISOString().slice(0, 10)) {
  return venues.map((v) => ({ ...v, trust: computeTrust(v, freshness[v.id], today) }));
}

/** The one writer for venues.json. Content-derived stamp: any change to the
 *  merged data reseeds cached clients, even a second write on the same day. */
export function writeVenuesJson(venues, today = new Date().toISOString().slice(0, 10)) {
  const payload = JSON.stringify(venues);
  const stamp = `${today}-${crypto.createHash("sha1").update(payload).digest("hex").slice(0, 8)}`;
  fs.writeFileSync(VENUES_FILE, JSON.stringify({ data_version: stamp, venues }, null, 1));
  return stamp;
}
