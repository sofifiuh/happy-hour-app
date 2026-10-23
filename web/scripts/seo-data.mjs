// Where each venue sits (city, neighbourhood) and which hub pages it belongs
// to. Shared by sync-data.mjs (writes the result into public/venues.json so
// the app can link to hubs) and prerender.mjs (writes the hub pages).
//
// Neighbourhoods are drawn on the downtown street grid rather than from the
// City of Vancouver boundary files: the districts people search for
// (Gastown, Yaletown, Coal Harbour) aren't official local areas anyway.

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// ---------- city ----------
// Google's address city, folded into the municipality people search for.
const CITY_ALIASES = {
  "Langley Twp": "Langley",
  Ladner: "Delta",
  Tsawwassen: "Delta",
  Cloverdale: "Surrey",
  Kitsilano: "Vancouver",
};

export function cityOf(v) {
  const parts = (v.address || "").split(",").map((s) => s.trim());
  let city = parts.length > 2 ? parts[parts.length - 2] : v.city || null;
  city = CITY_ALIASES[city] || city;
  // A few North Shore venues (Lonsdale Quay) carry a "Vancouver" address.
  if (city === "Vancouver" && v.lat > 49.296) city = v.lng > -123.14 ? "North Vancouver" : "West Vancouver";
  return city;
}

// ---------- neighbourhood (City of Vancouver only) ----------
// Downtown is a rotated grid. u grows south-east along Davie (Burrard ≈ -470,
// Granville ≈ -120, Homer ≈ 180, Cambie ≈ 400, Main ≈ 1100); v grows
// south-west along Burrard (Water St ≈ -900, Pender ≈ -620, Georgia ≈ -300,
// Robson ≈ -100, Nelson ≈ 250, Davie ≈ 530). Metres from Robson & Burrard-ish.
function grid(lat, lng) {
  const x = (lng + 123.12) * 72660;
  const y = (lat - 49.28) * 111200;
  return { u: 0.755 * x - 0.656 * y, v: -0.703 * x - 0.712 * y };
}

const inBox = (lat, lng, [s, w, n, e]) => lat >= s && lat <= n && lng >= w && lng <= e;

export const AREAS = {
  "coal-harbour": "Coal Harbour",
  "west-end": "West End",
  yaletown: "Yaletown",
  gastown: "Gastown",
  chinatown: "Chinatown",
  downtown: "Downtown Vancouver",
  strathcona: "Strathcona",
  "granville-island": "Granville Island",
  kitsilano: "Kitsilano",
  "south-granville": "South Granville & Fairview",
  "olympic-village": "Olympic Village",
  "mount-pleasant": "Mount Pleasant",
  "riley-park": "Riley Park",
  "commercial-drive": "Commercial Drive",
  "hastings-sunrise": "Hastings-Sunrise",
};

export function areaOf(v, city) {
  if (city !== "Vancouver" || v.lat == null || v.lng == null) return null;
  const { lat, lng } = v;
  const { u, v: w } = grid(lat, lng);
  const peninsula = lat > 49.2725 && u > -2500 && u < 1500 && w > -1300 && w < 1250;
  if (peninsula) {
    if (u < -360 && w < -280) return "coal-harbour";
    if (u < -460) return "west-end";
    if (u > 150 && u < 700 && w > 0 && w < 800) return "yaletown";
    if (u > 150 && u < 900 && w < -760) return "gastown";
    if (u >= 880 && w < -600) return "chinatown";
    if (u >= 880) return "strathcona";
    return "downtown";
  }
  if (inBox(lat, lng, [49.2695, -123.1395, 49.273, -123.13])) return "granville-island";
  if (inBox(lat, lng, [49.255, -123.195, 49.276, -123.145])) return "kitsilano";
  if (inBox(lat, lng, [49.2685, -123.122, 49.2725, -123.102])) return "olympic-village";
  if (inBox(lat, lng, [49.255, -123.145, 49.2725, -123.1065])) return "south-granville";
  if (inBox(lat, lng, [49.255, -123.1065, 49.2725, -123.088])) return "mount-pleasant";
  if (inBox(lat, lng, [49.24, -123.116, 49.255, -123.084])) return "riley-park";
  if (inBox(lat, lng, [49.255, -123.076, 49.2785, -123.055])) return "commercial-drive";
  if (inBox(lat, lng, [49.274, -123.1, 49.29, -123.076])) return "strathcona";
  if (inBox(lat, lng, [49.274, -123.076, 49.295, -123.02])) return "hastings-sunrise";
  return null;
}

// ---------- topics ----------
const DAY_SLUGS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const windows = (v) => [{ days: v.hh.days, start: v.hh.start, end: v.hh.end }, ...v.hh.extra].filter((w) => w.start && w.days?.length);
const dealText = (v, cat) =>
  v.hh.deals
    .filter((d) => !cat || d.category === cat)
    .map((d) => `${d.name} ${d.description}`)
    .join(" | ");
const deal = (re, cat) => (v) => re.test(dealText(v, cat));

// label: plural noun phrase ("Oyster happy hours"); short: link text.
export const TOPICS = [
  ...DAY_SLUGS.map((slug, d) => ({
    slug,
    kind: "day",
    label: `${DAY_NAMES[d]} happy hours`,
    short: DAY_NAMES[d],
    test: (v) => windows(v).some((w) => w.days.includes(d)),
  })),
  { slug: "weekend", kind: "day", label: "Weekend happy hours", short: "Weekends", test: (v) => windows(v).some((w) => w.days.includes(0) || w.days.includes(6)) },
  { slug: "late-night", kind: "vibe", label: "Late-night happy hours", short: "Late night", test: (v) => windows(v).some((w) => w.start >= "20:00") },
  { slug: "patio", kind: "vibe", label: "Patio happy hours", short: "Patios", test: (v) => v.amenities.patio },
  { slug: "live-music", kind: "vibe", label: "Happy hours with live music", short: "Live music", test: (v) => v.amenities.liveMusic },
  { slug: "oysters", kind: "deal", label: "Oyster happy hours", short: "Oysters", test: deal(/\boysters?\b/i, "food") },
  { slug: "wings", kind: "deal", label: "Wing happy hours", short: "Wings", test: deal(/\bwings?\b/i, "food") },
  { slug: "burgers", kind: "deal", label: "Burger happy hours", short: "Burgers", test: deal(/\bburgers?\b|\bsliders?\b/i, "food") },
  { slug: "tacos", kind: "deal", label: "Taco happy hours", short: "Tacos", test: deal(/\btacos?\b/i, "food") },
  { slug: "pizza", kind: "deal", label: "Pizza happy hours", short: "Pizza", test: deal(/\bpizzas?\b|\bflatbreads?\b/i, "food") },
  { slug: "sushi", kind: "deal", label: "Sushi happy hours", short: "Sushi", test: deal(/\bsushi\b|\bsashimi\b|\bnigiri\b|\bmaki\b|\bcalifornia rolls?\b|\baburi\b/i, "food") },
  { slug: "nachos", kind: "deal", label: "Nacho happy hours", short: "Nachos", test: deal(/\bnachos?\b/i, "food") },
  { slug: "cocktails", kind: "deal", label: "Cocktail happy hours", short: "Cocktails", test: deal(/cocktail|margarita|martini|spritz|negroni|caesar|\bmule\b|old fashioned|daiquiri|mojito|highball|paloma|sangria/i, "drink") },
  { slug: "wine", kind: "deal", label: "Wine happy hours", short: "Wine", test: deal(/\bwines?\b|prosecco|sparkling|bubbles|\bros[eé]\b|\bcava\b|house (red|white)|\b(red|white) (glass|wine)/i, "drink") },
  { slug: "beer", kind: "deal", label: "Beer happy hours", short: "Beer", test: deal(/\bbeers?\b|lager|\bpints?\b|\bipa\b|draught|draft beer|\bsleeves?\b|pilsner|\bales?\b|pitcher|\bjugs?\b|\btall cans?\b/i, "drink") },
];

// ---------- hubs ----------
export const MIN_PLACE = 5; // a city or neighbourhood hub needs this many venues
export const MIN_COMBO = 8; // a place + topic page needs this many

// Annotates every venue with { city, area } and returns the hub pages that
// clear the thresholds. Hub order: places by size, then topics.
export function buildHubs(venues) {
  for (const v of venues) {
    v.city = cityOf(v);
    v.area = areaOf(v, v.city);
  }
  const groups = new Map();
  const add = (slug, hub, v) => {
    if (!groups.has(slug)) groups.set(slug, { ...hub, slug, venues: [] });
    groups.get(slug).venues.push(v);
  };
  for (const v of venues) {
    if (v.city) add(slugify(v.city), { kind: "city", name: v.city }, v);
    if (v.area) add(v.area, { kind: "area", name: AREAS[v.area], city: "Vancouver" }, v);
  }
  const places = [...groups.values()].filter((h) => h.venues.length >= MIN_PLACE).sort((a, b) => b.venues.length - a.venues.length);
  const topics = TOPICS.map((t) => ({ ...t, venues: venues.filter(t.test) })).filter((t) => t.venues.length >= MIN_COMBO);
  const combos = [];
  for (const p of places) {
    for (const t of topics) {
      const list = p.venues.filter(t.test);
      // Skip near-copies of the place or topic page, and per-day splits
      // (the place page already shows each venue's days).
      const distinct = list.length <= 0.8 * p.venues.length && list.length <= 0.8 * t.venues.length;
      if (list.length >= MIN_COMBO && distinct && (t.kind !== "day" || t.slug === "weekend")) combos.push({ kind: "combo", place: p, topic: t, slug: `${p.slug}/${t.slug}`, venues: list });
    }
  }
  return { places, topics, combos };
}

export const hubPath = (slug) => `/happy-hour/${slug}/`;

// ---------- best-of lists ----------
// "Best happy hours in <place>": the place's Hangout Scores, highest first
// (scripts/hang-score.mjs). A list ships only when the place has enough
// scored spots for a ranking to mean something.
export const MIN_BEST = 8; // scored venues a place needs for a best-of list
export const BEST_SIZE = 10; // spots ranked on each list
// A "best" list only names spots rated Decent or better (4.5+, scoreWord in
// components/hang-score.tsx), and ships only with at least BEST_MIN_LISTED.
export const BEST_FLOOR = 4.5;
export const BEST_MIN_LISTED = 6;

export const byScore = (a, b) => b.score.total - a.score.total || b.score.value - a.score.value || b.score.selection - a.score.selection || a.name.localeCompare(b.name);

// Metro Vancouver first, then each city and neighbourhood hub that clears
// MIN_BEST, by size. `slug` is the place's hub slug ("metro" for all).
export function buildBest(venues, places) {
  const lists = [];
  const add = (slug, name, kind, pool) => {
    const scored = pool.filter((v) => v.score);
    const top = scored.filter((v) => v.score.total >= BEST_FLOOR).sort(byScore).slice(0, BEST_SIZE);
    if (scored.length >= MIN_BEST && top.length >= BEST_MIN_LISTED) lists.push({ slug, name, kind, scored: scored.length, venues: top });
  };
  add("metro", "Metro Vancouver", "metro", venues);
  for (const p of places) add(p.slug, p.name, p.kind, p.venues);
  return lists;
}

export const bestPath = (slug) => (slug === "metro" ? "/happy-hour/best/" : `/happy-hour/${slug}/best/`);
