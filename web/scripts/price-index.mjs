// The Vancouver Happy Hour Index: what a happy hour pint, glass of wine,
// cocktail, highball and oyster typically cost, from the fixed prices on
// every venue's own menu. prerender.mjs turns it into /happy-hour-index/
// (the page the press and Reddit link to) and its CSV.
//
// One price per venue per kind: its cheapest qualifying deal. Medians are
// across venues, so a bar listing ten cheap beers counts once. "$2 off",
// "$1/oz", bottles, pitchers, combos and alcohol-free drinks never count
// (dealPrice and skip in hang-score.mjs), and nor do small pours.

import { dealPrice, skip } from "./hang-score.mjs";

const text = (d) => `${d.name} ${d.description || ""}`;

const BEER = /\bbeers?\b|lager|\bales?\b|\bipa\b|pilsner|\bpils\b|stout|porter|guinness|draught|draft|\bpints?\b|\bsleeves?\b/i;
// A pint or sleeve: 14 to 20oz. Halfers, 12oz glasses and cans are smaller.
const PINT_SIZE = /\bpints?\b|\bsleeves?\b|\b(1[4-9]|20) ?oz\b|\b0\.5 ?l\b|\b473 ?ml\b/i;
const SMALL_BEER = /\b(5|6|8|10|12) ?oz\b|halfer|half[- ]pint|\b(341|355) ?ml\b|\btasters?\b|\bcans?\b|\bbottles?\b/i;
const WINE = /\bwines?\b|prosecco|\bcava\b|sparkling|bubbles|\bros[eé]\b|house (red|white)|\b(red|white) (glass|wine)/i;
// Tasting pours (3oz) aren't a glass.
const SMALL_POUR = /\b[1-4] ?oz\b/i;
const HIGHBALL = /highball|hi-?ball|\bwell\b|\brail\b/i;
const COCKTAIL = /cocktail|margarita|martini|spritz|negroni|caesar|\bmule\b|old fashioned|daiquiri|mojito|paloma|\bsours?\b|sangria|mimosa/i;

export const KINDS = [
  { key: "pint", label: "Pint of beer", short: "pint", note: "14–20oz draught", test: (d) => d.category === "drink" && BEER.test(text(d)) && PINT_SIZE.test(text(d)) && !SMALL_BEER.test(text(d)) },
  { key: "wine", label: "Glass of wine", short: "glass of wine", note: "5oz pour or more", test: (d) => d.category === "drink" && WINE.test(text(d)) && !BEER.test(text(d)) && !COCKTAIL.test(text(d)) && !SMALL_POUR.test(text(d)) },
  { key: "cocktail", label: "Cocktail", short: "cocktail", note: "signature or classic", test: (d) => d.category === "drink" && COCKTAIL.test(text(d)) && !HIGHBALL.test(text(d)) && !BEER.test(text(d)) && !/vermouth/i.test(text(d)) },
  { key: "highball", label: "Highball", short: "highball", note: "well spirit and mixer", test: (d) => d.category === "drink" && HIGHBALL.test(text(d)) },
  // Over $6 it's a plate or a half dozen, not one oyster.
  { key: "oyster", label: "Oyster", short: "oyster", note: "price each", max: 6, test: (d) => d.category === "food" && /\boysters?\b/i.test(text(d)) && !/\bdozen\b|\bhalf\b/i.test(`${d.name} ${d.price}`) },
];

// Smallest place sample a median is shown for.
export const MIN_SAMPLE = 5;

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// The venue's cheapest deal of a kind: { d, p } or null.
export function cheapestOf(v, kind) {
  let best = null;
  for (const d of v.hh.deals) {
    if (skip(d) || !kind.test(d)) continue;
    const p = dealPrice(d);
    if (p != null && p <= (kind.max ?? Infinity) && (!best || p < best.p)) best = { d, p };
  }
  return best;
}

function stats(pool) {
  const out = {};
  for (const k of KINDS) {
    const rows = pool.map((v) => ({ v, ...cheapestOf(v, k) })).filter((r) => r.p != null);
    out[k.key] = rows.length ? { n: rows.length, median: median(rows.map((r) => r.p)), rows: rows.sort((a, b) => a.p - b.p || a.v.name.localeCompare(b.v.name)) } : { n: 0, median: null, rows: [] };
  }
  return out;
}

const windows = (v) => [{ days: v.hh.days, start: v.hh.start, end: v.hh.end }, ...v.hh.extra].filter((w) => w.start && w.days?.length);

// venues: the slim venues with city/area set (buildHubs); places: buildHubs' places.
// Low-confidence times stay out, as they stay out of search (prerender.mjs).
export function buildIndex(allVenues, places) {
  const sure = (v) => v.confidence !== "low";
  const venues = allVenues.filter(sure);
  const all = stats(venues);
  const byPlace = places.map((p) => ({ slug: p.slug, name: p.name, kind: p.kind, count: p.venues.length, stats: stats(p.venues.filter(sure)) }));
  const starts = {};
  for (const v of venues) if (v.hh.start) starts[v.hh.start] = (starts[v.hh.start] ?? 0) + 1;
  const [topStart, topStartCount] = Object.entries(starts).sort((a, b) => b[1] - a[1])[0] ?? [];
  return {
    venues: venues.length,
    deals: venues.reduce((s, v) => s + v.hh.deals.length, 0),
    all,
    cities: byPlace.filter((p) => p.kind === "city"),
    areas: byPlace.filter((p) => p.kind === "area"),
    facts: {
      everyDay: venues.filter((v) => new Set(windows(v).flatMap((w) => w.days)).size === 7).length,
      weekend: venues.filter((v) => windows(v).some((w) => w.days.includes(0) || w.days.includes(6))).length,
      // Same rule as the late-night hub (scripts/seo-data.mjs): a window starting at 8pm or later.
      lateNight: venues.filter((v) => windows(v).some((w) => w.start >= "20:00")).length,
      topStart,
      topStartCount,
    },
  };
}
